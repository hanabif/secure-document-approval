from rest_framework import serializers
from django.conf import settings
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
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

    class Meta:
        model = User
        # Do not allow clients to set `role` directly during registration
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'admin_code')
        extra_kwargs = {'password': {'write_only': True}, 'admin_code': {'write_only': True}}

    def create(self, validated_data):
        # Pop admin_code so it doesn't interfere with model creation
        admin_code = validated_data.pop('admin_code', None)

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
