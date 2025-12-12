import os
import sys
import django
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
# Ensure project root is on sys.path so Django can import settings
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'secure_doc_system.settings')
django.setup()

from accounts.models import User
from rest_framework.authtoken.models import Token

username = 'uploader1'
email = 'uploader1@example.com'
password = 'StrongPass123!'

if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    token, created = Token.objects.get_or_create(user=user)
    print('EXISTS', user.username, token.key)
else:
    user = User.objects.create_user(username, email, password)
    user.role = 'employee'
    user.save()
    token = Token.objects.create(user=user)
    print('CREATED', user.username, token.key)
