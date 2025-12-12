from django.contrib import admin
from .models import Document, Approval

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'owner__username')

@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ('document', 'approver', 'approved', 'timestamp')
    list_filter = ('approved',)
    search_fields = ('document__title', 'approver__username')
