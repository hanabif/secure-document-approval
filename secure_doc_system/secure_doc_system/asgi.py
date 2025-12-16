"""
ASGI config for secure_doc_system project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import atexit
import hashlib

from django.core.asgi import get_asgi_application
from audit.utils import log_system_event
from audit.models import AuditSeverity
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'secure_doc_system.settings')

application = get_asgi_application()

def log_shutdown():
    log_system_event('System Shutdown', severity=AuditSeverity.INFO)

atexit.register(log_shutdown)

log_system_event('System Startup', severity=AuditSeverity.INFO)

# Log a hash of the settings file to detect configuration changes
try:
    settings_path = os.path.join(settings.BASE_DIR, 'secure_doc_system', 'settings.py')
    with open(settings_path, 'rb') as f:
        settings_content = f.read()
        settings_hash = hashlib.sha256(settings_content).hexdigest()
        log_system_event(f'Settings Hash: {settings_hash}', severity=AuditSeverity.INFO)
except FileNotFoundError:
    log_system_event('Could not find settings file to hash.', severity=AuditSeverity.WARNING)
