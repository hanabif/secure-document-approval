from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'details')
    list_filter = ('action', 'timestamp', 'user')
    search_fields = ('action', 'details', 'user__username')
    readonly_fields = ('timestamp',) # Logs should not be editable after creation