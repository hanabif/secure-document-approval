import os, sys
from pathlib import Path
BASE = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','secure_doc_system.settings')
import django
django.setup()
from rest_framework.test import APIClient

client = APIClient()

cases = [
    {'username':'haymi','password':'StrongPass1!'},
    {'username':'haymanotaweke9@gmail.com','password':'StrongPass1!'},
]

for payload in cases:
    resp = client.post('/api/accounts/auth/login/', payload, format='json')
    print(payload['username'], resp.status_code, getattr(resp, 'data', resp.content))
