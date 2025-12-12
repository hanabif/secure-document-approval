from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Document, Approval
from .serializers import DocumentSerializer, ApprovalSerializer
from accounts.models import User
from .permissions import can_user_approve_document, get_user_approval_level, CanViewDocument

class DocumentListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewDocument]

class DocumentApprovalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)

class DocumentsForApprovalView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != User.ROLE_MANAGER:
            return Document.objects.none()
        
        return Document.objects.filter(status='pending', classification__in=[Document.CLASSIFICATION_UNCLASSIFIED, Document.CLASSIFICATION_CONFIDENTIAL]).exclude(approvals__approver=user)

class SeniorManagerDashboardView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != User.ROLE_SENIOR_MANAGER:
            return Document.objects.none()
        
        return Document.objects.filter(status='pending', classification__in=[Document.CLASSIFICATION_CONFIDENTIAL, Document.CLASSIFICATION_SECRET]).exclude(approvals__approver=user)

class DocumentAuditTrailView(generics.ListAPIView):
    serializer_class = ApprovalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        document_id = self.kwargs['pk']
        return Approval.objects.filter(document_id=document_id).order_by('-timestamp')
