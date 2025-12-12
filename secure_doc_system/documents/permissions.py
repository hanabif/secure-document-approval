from rest_framework import permissions
from .models import Document
from accounts.models import User

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