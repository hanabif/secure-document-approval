from rest_framework import serializers
from django.conf import settings
from .models import User
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'password', 'email', 'first_name', 'last_name',
            'role', 'department', 'email_verified', 'phone_number', 'phone_verified'
        )
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Validate password complexity/policies
        validate_password(validated_data['password'])
        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password']
        )
        user.first_name = validated_data.get('first_name', '')
        user.last_name = validated_data.get('last_name', '')
        # Allow clients to pass role as either the integer code or a string name.
        role_val = validated_data.get('role', None)
        if role_val is None:
            user.role = User.ROLE_EMPLOYEE
        elif isinstance(role_val, int):
            user.role = role_val
        else:
            # map common string names (case-insensitive) to integer choices
            role_map = {
                'EMPLOYEE': User.ROLE_EMPLOYEE,
                'employee': User.ROLE_EMPLOYEE,
                'MANAGER': User.ROLE_MANAGER,
                'manager': User.ROLE_MANAGER,
                'SENIOR_MANAGER': User.ROLE_SENIOR_MANAGER,
                'senior_manager': User.ROLE_SENIOR_MANAGER,
                'SENIOR-MANAGER': User.ROLE_SENIOR_MANAGER,
                'DIRECTOR': User.ROLE_DIRECTOR,
                'director': User.ROLE_DIRECTOR,
                'ADMIN': User.ROLE_ADMIN,
                'admin': User.ROLE_ADMIN,
            }
            user.role = role_map.get(role_val, User.ROLE_EMPLOYEE)
        user.save()
        return user

class RegisterSerializer(serializers.ModelSerializer):
    # Optional admin registration code — write-only, not stored on the model
    admin_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    captcha_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        # Do not allow clients to set `role` directly during registration
        fields = (
            'username', 'email', 'password', 'first_name', 'last_name', 'admin_code', 'captcha_token'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'admin_code': {'write_only': True},
            'captcha_token': {'write_only': True},
        }

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        # Pop admin_code so it doesn't interfere with model creation
        admin_code = validated_data.pop('admin_code', None)

        validate_password(validated_data['password'])
        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password']
        )
        user.first_name = validated_data.get('first_name', '')
        user.last_name = validated_data.get('last_name', '')

        # Default role is EMPLOYEE. If a valid admin_code is provided and matches
        # the configured ADMIN_REGISTRATION_CODE, create an ADMIN user.
        admin_registration_code = getattr(settings, 'ADMIN_REGISTRATION_CODE', '')
        if admin_code and admin_registration_code and admin_code == admin_registration_code:
            user.role = User.ROLE_ADMIN
            # Grant admin flags so DRF's `IsAdminUser` and Django admin work
            user.is_staff = True
            user.is_superuser = True
        else:
            user.role = User.ROLE_EMPLOYEE

        user.save()
        return user


class ProfileSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'first_name', 'last_name', 'department', 'phone_number',
            'email_verified', 'phone_verified', 'current_password', 'new_password', 'confirm_password'
        )
        read_only_fields = ('username', 'email_verified', 'phone_verified')

    def update(self, instance, validated_data):
        request = self.context.get('request')
        new_email = validated_data.get('email', instance.email)
        changing_email = new_email and new_email != instance.email

        new_password = validated_data.get('new_password')
        changing_password = new_password

        if changing_email or changing_password:
            current_password = validated_data.get('current_password')
            if not current_password or not instance.check_password(current_password):
                raise serializers.ValidationError({'detail': 'Current password required to change email or password.'})

        if changing_email:
            instance.email = new_email
            instance.email_verified = False

        if changing_password:
            confirm_password = validated_data.get('confirm_password')
            if new_password != confirm_password:
                raise serializers.ValidationError({'detail': 'New passwords do not match.'})
            validate_password(new_password)
            instance.set_password(new_password)
            log_user_action(request, 'Password changed', f'User {instance.username} changed their password successfully.')

        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.department = validated_data.get('department', instance.department)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError({"old_password": "Old password is not correct"})
        return data
