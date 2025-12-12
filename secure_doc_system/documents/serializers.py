from rest_framework import serializers
from .models import Document, Approval

from .permissions import can_user_approve_document

class ApprovalSerializer(serializers.ModelSerializer):
    approver = serializers.ReadOnlyField(source='approver.username')

    class Meta:
        model = Approval
        fields = '__all__'
        read_only_fields = ('timestamp',)

class DocumentSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    approvals = ApprovalSerializer(many=True, read_only=True)
    can_approve = serializers.SerializerMethodField()

    class FileURLField(serializers.FileField):
        def to_representation(self, value):
            if not value:
                return None
            request = self.context.get('request')
            if request is None:
                return value.url
            return request.build_absolute_uri(value.url)

    # Allow uploading `file` in requests and expose a `file_url` in responses
    file = serializers.FileField(required=False, allow_null=True)
    file_url = FileURLField(read_only=True, source='file')

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('created_at', 'status', 'owner')
    
    def get_can_approve(self, obj):
        user = self.context['request'].user
        return can_user_approve_document(user, obj)
