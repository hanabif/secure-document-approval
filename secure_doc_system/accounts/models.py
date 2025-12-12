from django.contrib.auth.models import AbstractUser
from django.db import models

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

    def __str__(self):
        return self.username