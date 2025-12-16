from django.urls import path
from .views import AuditLogListView, RunBackupView

urlpatterns = [
    path('', AuditLogListView.as_view(), name='audit-log-list'),
    path('run-backup/', RunBackupView.as_view(), name='run-backup'),
]