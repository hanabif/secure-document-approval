from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid

class User(AbstractUser):
    ROLE_EMPLOYEE = 0
    ROLE_MANAGER = 1
    ROLE_SENIOR_MANAGER = 2
    ROLE_DIRECTOR = 3
    ROLE_ADMIN = 99

    ROLE_CHOICES = (
        (ROLE_EMPLOYEE, 'Employee'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_SENIOR_MANAGER, 'Senior Manager'),
        (ROLE_DIRECTOR, 'Director'),
        (ROLE_ADMIN, 'Admin'),
    )
    
    role = models.IntegerField(choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)

    DEPT_HR = 'HR'
    DEPT_IT = 'IT'
    DEPT_FINANCE = 'FINANCE'
    DEPT_OPERATIONS = 'OPERATIONS'
    DEPT_SALES = 'SALES'
    DEPT_OTHER = 'OTHER'

    DEPARTMENT_CHOICES = (
        (DEPT_HR, 'HR'),
        (DEPT_IT, 'IT'),
        (DEPT_FINANCE, 'Finance'),
        (DEPT_OPERATIONS, 'Operations'),
        (DEPT_SALES, 'Sales'),
        (DEPT_OTHER, 'Other'),
    )

    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default=DEPT_OTHER)
    is_after_hours_preapproved = models.BooleanField(default=False)
    failed_login_attempts = models.IntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=32, blank=True, default='')
    phone_verified = models.BooleanField(default=False)

    def is_locked_out(self) -> bool:
        return bool(self.lockout_until and self.lockout_until > timezone.now())

    def __str__(self):
        return self.username


class EmailVerificationToken(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='email_verification_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    @classmethod
    def create_for_user(cls, user, validity_hours: int = 24):
        token = uuid.uuid4().hex + uuid.uuid4().hex[:32]
        exp = timezone.now() + timezone.timedelta(hours=validity_hours)
        return cls.objects.create(user=user, token=token, expires_at=exp)

    def is_valid(self) -> bool:
        return (not self.used) and self.expires_at > timezone.now()

    def __str__(self):
        return f"EmailVerificationToken(user={self.user.username}, used={self.used})"