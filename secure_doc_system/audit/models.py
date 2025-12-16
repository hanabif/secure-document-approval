from django.db import models
from django.conf import settings

class AuditCategories(models.TextChoices):
    USER = 'USER', 'User Activity'
    SYSTEM = 'SYSTEM', 'System Event'
    SECURITY = 'SECURITY', 'Security'
    OTHER = 'OTHER', 'Other'

class AuditSeverity(models.TextChoices):
    INFO = 'INFO', 'Info'
    WARNING = 'WARNING', 'Warning'
    ERROR = 'ERROR', 'Error'
    CRITICAL = 'CRITICAL', 'Critical'

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    details_encrypted = models.TextField(blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=AuditCategories.choices, default=AuditCategories.USER)
    severity = models.CharField(max_length=10, choices=AuditSeverity.choices, default=AuditSeverity.INFO)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_part = self.user.username if self.user is not None else 'System'
        return f'[{self.severity}] {user_part} - {self.action} at {self.timestamp}'