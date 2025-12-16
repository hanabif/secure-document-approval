import base64
import os
from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken
from .models import AuditLog, AuditCategories, AuditSeverity
from django.core.mail import mail_admins


def _get_fernet() -> Fernet | None:
    key = getattr(settings, 'LOG_ENCRYPTION_KEY', None)
    if not key:
        return None
    # Accept raw key or base64 key
    try:
        return Fernet(key.encode('utf-8'))
    except Exception:
        try:
            return Fernet(key)
        except Exception:
            return None


def encrypt_text(plain: str) -> str:
    f = _get_fernet()
    if not f:
        return ''
    token = f.encrypt(plain.encode('utf-8'))
    return token.decode('utf-8')


def decrypt_text(token: str) -> str:
    f = _get_fernet()
    if not f:
        return ''
    try:
        plain = f.decrypt(token.encode('utf-8'))
        return plain.decode('utf-8')
    except (InvalidToken, Exception):
        return ''


def client_ip_from_request(request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_user_action(request, action: str, details: str = '', severity: str = AuditSeverity.INFO, user=None):
    ip = client_ip_from_request(request)
    enc = encrypt_text(details) if details else ''
    
    log_user = user
    if log_user is None and request and hasattr(request, 'user') and request.user.is_authenticated:
        log_user = request.user

    return AuditLog.objects.create(
        user=log_user,
        action=action,
        details='' if enc else details,
        details_encrypted=enc,
        ip_address=ip,
        category=AuditCategories.USER,
        severity=severity,
    )


def log_system_event(action: str, details: str = '', severity: str = AuditSeverity.INFO):
    enc = encrypt_text(details) if details else ''
    log = AuditLog.objects.create(
        user=None,
        action=action,
        details='' if enc else details,
        details_encrypted=enc,
        ip_address=None,
        category=AuditCategories.SYSTEM,
        severity=severity,
    )
    # Alerting for critical events
    if severity == AuditSeverity.CRITICAL:
        try:
            mail_admins(subject=f"CRITICAL: {action}", message=details or action, fail_silently=True)
        except Exception:
            pass
    return log


def log_security_event(request, action: str, details: str = '', severity: str = AuditSeverity.WARNING):
    ip = client_ip_from_request(request)
    enc = encrypt_text(details) if details else ''
    log = AuditLog.objects.create(
        user=None,
        action=action,
        details='' if enc else details,
        details_encrypted=enc,
        ip_address=ip,
        category=AuditCategories.SECURITY,
        severity=severity,
    )
    # Alerting for critical events
    if severity == AuditSeverity.CRITICAL:
        try:
            mail_admins(subject=f"CRITICAL: {action}", message=details or action, fail_silently=True)
        except Exception:
            pass
    return log
