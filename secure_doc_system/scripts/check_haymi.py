import os, sys
from pathlib import Path
BASE = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','secure_doc_system.settings')
import django
django.setup()
from accounts.models import User
u = User.objects.get(username='haymi')
print('user', u.username, 'role', u.role)
print('pw StrongPass1!', u.check_password('StrongPass1!'))
print('pw StronPass1!', u.check_password('StronPass1!'))
