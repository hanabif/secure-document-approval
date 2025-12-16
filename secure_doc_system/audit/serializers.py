from rest_framework import serializers
from .models import AuditLog
from .utils import decrypt_text

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        enc = data.get('details_encrypted') or ''
        if enc:
            try:
                data['details'] = decrypt_text(enc)
            except Exception:
                # If decryption fails, keep encrypted text hidden
                data['details'] = '[encrypted]'
        return data