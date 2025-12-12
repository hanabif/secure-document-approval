from django.urls import path
from .views import (
    DocumentListCreateView,
    DocumentDetailView,
    DocumentApprovalView,
    UserDocumentsView,
    DocumentsForApprovalView,
    ApproverDashboardView,
    ManagerDashboardView,
    SeniorManagerDashboardView,
    DocumentAuditTrailView,
)

urlpatterns = [
    path('', DocumentListCreateView.as_view(), name='document-list-create'),
    path('<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<int:pk>/approve/', DocumentApprovalView.as_view(), name='document-approve'),
    path('<int:pk>/audit/', DocumentAuditTrailView.as_view(), name='document-audit-trail'),
    path('my-documents/', UserDocumentsView.as_view(), name='user-documents'),
    path('for-approval/', DocumentsForApprovalView.as_view(), name='documents-for-approval'),
    path('approver-dashboard/', ApproverDashboardView.as_view(), name='approver-dashboard'),
    path('manager-dashboard/', ManagerDashboardView.as_view(), name='manager-dashboard'),
    path('senior-manager-dashboard/', SeniorManagerDashboardView.as_view(), name='senior-manager-dashboard'),
]