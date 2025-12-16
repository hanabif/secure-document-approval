import json
from typing import Optional
from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone
from .models import EmailVerificationToken, User
import requests


def build_site_url(path: str) -> str:
    base = getattr(settings, 'SITE_URL', '').rstrip('/')
    if not base:
        # Fallback to localhost dev server
        base = 'http://127.0.0.1:8000'
    return f"{base}{path}"


def send_verification_email(user: User) -> EmailVerificationToken:
    token = EmailVerificationToken.create_for_user(user)
    verify_path = reverse('verify-email') + f"?token={token.token}"
    link = build_site_url(verify_path)
    subject = 'Verify your email address'
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        f"Please verify your email by clicking the link below:\n{link}\n\n"
        f"This link expires at {token.expires_at.astimezone(timezone.get_current_timezone())}.\n"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')
    recipient_list = [user.email]
    send_mail(subject, message, from_email, recipient_list, fail_silently=True)
    return token


def verify_captcha(token: Optional[str], remote_ip: Optional[str] = None) -> bool:
    enabled = getattr(settings, 'CAPTCHA_ENABLED', True)
    if not enabled:
        return True

    provider = getattr(settings, 'CAPTCHA_PROVIDER', 'hcaptcha').lower()
    secret_key = getattr(settings, 'CAPTCHA_SECRET_KEY', '')
    if not secret_key or not token:
        return False

    try:
        if provider == 'hcaptcha':
            url = 'https://hcaptcha.com/siteverify'
            data = {'secret': secret_key, 'response': token}
            if remote_ip:
                data['remoteip'] = remote_ip
            r = requests.post(url, data=data, timeout=5)
            res = r.json()
            return bool(res.get('success'))
        elif provider in ('recaptcha', 'google'):
            url = 'https://www.google.com/recaptcha/api/siteverify'
            data = {'secret': secret_key, 'response': token}
            if remote_ip:
                data['remoteip'] = remote_ip
            r = requests.post(url, data=data, timeout=5)
            res = r.json()
            return bool(res.get('success'))
        else:
            return False
    except Exception:
        return False
