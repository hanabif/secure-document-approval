from django.db import models
from django.conf import settings
from django.db.models import JSONField

class Document(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='owned_documents', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    # file storage for uploaded documents
    file = models.FileField(upload_to='documents/', null=True, blank=True)
    
    # New simplified classification levels
    CLASSIFICATION_UNCLASSIFIED = 'UNCLASSIFIED'
    CLASSIFICATION_CONFIDENTIAL = 'CONFIDENTIAL'
    CLASSIFICATION_SECRET = 'SECRET'
    CLASSIFICATION_TOP_SECRET = 'TOP_SECRET'

    CLASSIFICATION_CHOICES = (
        (CLASSIFICATION_UNCLASSIFIED, 'Unclassified'),
        (CLASSIFICATION_CONFIDENTIAL, 'Confidential'),
        (CLASSIFICATION_SECRET, 'Secret'),
        (CLASSIFICATION_TOP_SECRET, 'Top Secret'),
    )
    classification = models.CharField(max_length=20, choices=CLASSIFICATION_CHOICES, default=CLASSIFICATION_UNCLASSIFIED)
    CATEGORY_GENERAL = 'GENERAL'
    CATEGORY_LEAVE = 'LEAVE'
    CATEGORY_CHOICES = (
        (CATEGORY_GENERAL, 'General'),
        (CATEGORY_LEAVE, 'Leave Request'),
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default=CATEGORY_GENERAL)
    metadata = JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return self.title

class Approval(models.Model):
    document = models.ForeignKey(Document, related_name='approvals', on_delete=models.CASCADE)
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='approvals', on_delete=models.CASCADE)
    approved = models.BooleanField(default=False)
    comments = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('document', 'approver')

    def __str__(self):
        return f'{self.approver.username} approval for {self.document.title}'