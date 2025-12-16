from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Document, Approval
from .serializers import DocumentSerializer, ApprovalSerializer
from accounts.models import User
from .permissions import (
    can_user_approve_document,
    get_user_approval_level,
    CanViewDocument,
    WithinBusinessHoursOrPreapproved,
    OfficeIPRequiredForApproval,
    HRLeaveApprovalRule,
)
from audit.utils import log_user_action

class DocumentListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        doc = serializer.save(owner=self.request.user)
        try:
            log_user_action(self.request, 'Document uploaded', f'Document "{doc.title}" (id={doc.id}) uploaded with classification {doc.classification}.')
        except Exception:
            pass

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved, CanViewDocument]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            log_user_action(request, 'Document viewed', f'Document "{instance.title}" (id={instance.id}) viewed.')
        except Exception:
            pass
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            log_user_action(request, 'Document updated', f'Document "{instance.title}" (id={instance.id}) updated.')
        except Exception:
            pass
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            log_user_action(request, 'Document deleted', f'Document "{instance.title}" (id={instance.id}) deleted.')
        except Exception:
            pass
        return super().destroy(request, *args, **kwargs)

class DocumentApprovalView(APIView):
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved, OfficeIPRequiredForApproval, HRLeaveApprovalRule]

    def post(self, request, pk):
        try:
            document = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        if not can_user_approve_document(request.user, document):
            return Response({"detail": "You do not have permission to approve this document."}, status=status.HTTP_403_FORBIDDEN)

        approved = request.data.get('approved')
        comments = request.data.get('comments', '')

        if approved is None:
            return Response({"detail": "The 'approved' field is required."}, status=status.HTTP_400_BAD_REQUEST)

        approval, created = Approval.objects.update_or_create(
            document=document,
            approver=request.user,
            defaults={'approved': approved, 'comments': comments}
        )

        self.update_document_status(document)
        try:
            action_txt = 'Document approved' if approved else 'Document rejected'
            log_user_action(request, action_txt, f'Document "{document.title}" (id={document.id}). Comments: {comments}')
        except Exception:
            pass
        
        return Response(ApprovalSerializer(approval).data, status=status.HTTP_200_OK)

    def update_document_status(self, document):
        required_approvals = 1 # Simple case: one approval needed
        approvals = document.approvals.filter(approved=True).count()
        rejections = document.approvals.filter(approved=False).count()

        if rejections > 0:
            document.status = 'rejected'
        elif approvals >= required_approvals:
            document.status = 'approved'
        else:
            document.status = 'pending'
        document.save()

class UserDocumentsView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved]

    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)

class DocumentsForApprovalView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.ROLE_ADMIN:
            return Document.objects.none()

        user_approval_level = get_user_approval_level(user)
        
        queryset = Document.objects.filter(status='pending').exclude(approvals__approver=user)

        if user_approval_level == 1: # Manager
            return queryset.filter(classification__in=[Document.CLASSIFICATION_UNCLASSIFIED, Document.CLASSIFICATION_CONFIDENTIAL])
        elif user_approval_level == 2: # Senior Manager
            return queryset.filter(classification__in=[Document.CLASSIFICATION_CONFIDENTIAL, Document.CLASSIFICATION_SECRET])
        elif user_approval_level >= 3: # Director
            return queryset.filter(classification__in=[Document.CLASSIFICATION_CONFIDENTIAL, Document.CLASSIFICATION_SECRET, Document.CLASSIFICATION_TOP_SECRET])
        
        return Document.objects.none()

import logging

class ApproverDashboardView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved]

    def get_queryset(self):
        user = self.request.user
        user_approval_level = get_user_approval_level(user)

        # Base queryset for pending documents not already acted upon by the user
        queryset = Document.objects.filter(status='pending').exclude(approvals__approver=user)

        # Determine which classifications to show based on the approval matrix
        visible_classifications = []
        if user_approval_level >= 1:  # Manager and above
            visible_classifications.append(Document.CLASSIFICATION_CONFIDENTIAL)
        if user_approval_level >= 2:  # Senior Manager and above
            visible_classifications.append(Document.CLASSIFICATION_SECRET)
        if user_approval_level >= 3:  # Director/Admin
            visible_classifications.append(Document.CLASSIFICATION_TOP_SECRET)

        if not visible_classifications:
            return Document.objects.none()

        # Filter by the collected list of classifications
        return queryset.filter(classification__in=visible_classifications)

class ManagerDashboardView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved]

    def get_queryset(self):
        user = self.request.user
        if user.role != User.ROLE_MANAGER:
            return Document.objects.none()
        
        return Document.objects.filter(status='pending', classification__in=[Document.CLASSIFICATION_UNCLASSIFIED, Document.CLASSIFICATION_CONFIDENTIAL]).exclude(approvals__approver=user)

class SeniorManagerDashboardView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved]

    def get_queryset(self):
        user = self.request.user
        if user.role != User.ROLE_SENIOR_MANAGER:
            return Document.objects.none()
        
        return Document.objects.filter(status='pending', classification__in=[Document.CLASSIFICATION_CONFIDENTIAL, Document.CLASSIFICATION_SECRET]).exclude(approvals__approver=user)

class DocumentAuditTrailView(generics.ListAPIView):
    serializer_class = ApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, WithinBusinessHoursOrPreapproved]

    def get_queryset(self):
        document_id = self.kwargs['pk']
        return Approval.objects.filter(document_id=document_id).order_by('-timestamp')
