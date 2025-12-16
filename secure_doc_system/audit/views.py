from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.core.management import call_command
from .models import AuditLog
from .serializers import AuditLogSerializer
from .utils import log_system_event

class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]


class RunBackupView(generics.GenericAPIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        try:
            call_command('backup_data')
            try:
                log_system_event('Backup triggered via API', 'Admin ran manual backup')
            except Exception:
                pass
            return Response({"detail": "Backup started and completed successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Backup failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)