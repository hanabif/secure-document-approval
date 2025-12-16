from rest_framework import permissions
from .models import Document
from accounts.models import User
from django.conf import settings
from django.utils import timezone
import ipaddress

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user

class CanApproveConfidential(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.ROLE_MANAGER, User.ROLE_SENIOR_MANAGER, User.ROLE_DIRECTOR, User.ROLE_ADMIN]


class CanApproveSecret(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.ROLE_SENIOR_MANAGER, User.ROLE_DIRECTOR, User.ROLE_ADMIN]


class CanApproveTopSecret(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.ROLE_DIRECTOR, User.ROLE_ADMIN]


def get_user_approval_level(user):
    # Map roles to approval level: Manager=1, Senior Manager=2, Director/Admin=3
    if user.role == User.ROLE_ADMIN:
        return 3
    if user.role == User.ROLE_DIRECTOR:
        return 3
    if user.role == User.ROLE_SENIOR_MANAGER:
        return 2
    if user.role == User.ROLE_MANAGER:
        return 1
    return 0


def can_user_approve_document(user, document):
    user_level = get_user_approval_level(user)
    
    classification = document.classification
    if classification == Document.CLASSIFICATION_TOP_SECRET:
        return user_level >= 3
    if classification == Document.CLASSIFICATION_SECRET:
        return user_level >= 2
    if classification in [Document.CLASSIFICATION_CONFIDENTIAL, Document.CLASSIFICATION_UNCLASSIFIED]:
        return user_level >= 1
    
    return False

class CanViewDocument(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or can_user_approve_document(request.user, obj)


class WithinBusinessHoursOrPreapproved(permissions.BasePermission):
    """Deny access outside working hours unless user is preapproved."""
    def has_permission(self, request, view):
        start = getattr(settings, 'BUSINESS_HOURS_START', 8)
        end = getattr(settings, 'BUSINESS_HOURS_END', 18)
        now = timezone.localtime()
        hour = now.hour
        within = start <= hour < end
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if within:
            return True
        return getattr(user, 'is_after_hours_preapproved', False)


def _client_ip_in_allowed_ranges(request) -> bool:
    ranges = getattr(settings, 'ALLOWED_OFFICE_IP_RANGES', '')
    if not ranges:
        return True  # No ranges configured => allow
    raw_ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR') or ''
    client_ip = raw_ip.split(',')[0].strip()
    try:
        ip_obj = ipaddress.ip_address(client_ip)
    except ValueError:
        return False
    for block in [r.strip() for r in ranges.split(',') if r.strip()]:
        try:
            if ip_obj in ipaddress.ip_network(block, strict=False):
                return True
        except ValueError:
            continue
    return False


class OfficeIPRequiredForApproval(permissions.BasePermission):
    """Require client IP to be within allowed ranges for sensitive approval actions."""
    def has_permission(self, request, view):
        return _client_ip_in_allowed_ranges(request)


class HRLeaveApprovalRule(permissions.BasePermission):
    """
    Only HR Managers (or above) can approve leave requests exceeding 10 days.
    Enforced when Document.category == 'LEAVE' and metadata.leave_days > 10.
    """
    def has_permission(self, request, view):
        # Only enforce on POST approval endpoints; allow for others
        return True

    def has_object_permission(self, request, view, obj: Document):
        if getattr(obj, 'category', None) != getattr(Document, 'CATEGORY_LEAVE', 'LEAVE'):
            return True
        meta = getattr(obj, 'metadata', {}) or {}
        try:
            leave_days = int(meta.get('leave_days', 0))
        except (TypeError, ValueError):
            leave_days = 0
        if leave_days <= 10:
            return True
        # For >10 days, require HR and Manager level or above
        user = request.user
        is_manager_level = get_user_approval_level(user) >= 1
        is_hr = getattr(user, 'department', '').upper() == 'HR'
        return is_manager_level and is_hr