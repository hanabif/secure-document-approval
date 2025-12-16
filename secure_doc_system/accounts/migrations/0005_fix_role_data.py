# Migration to fix role field data from string to integer values
from django.db import migrations


def fix_role_values(apps, schema_editor):
    """Convert legacy string role values to integer values"""
    User = apps.get_model('accounts', 'User')
    
    # Mapping from old string values to new integer values
    role_mapping = {
        'employee': 0,  # ROLE_EMPLOYEE
        'manager': 1,   # ROLE_MANAGER
        'senior_manager': 2,  # ROLE_SENIOR_MANAGER
        'director': 3,  # ROLE_DIRECTOR
        'admin': 99,    # ROLE_ADMIN
    }
    
    # Use raw SQL to handle the conversion
    from django.db import connection
    with connection.cursor() as cursor:
        # Check if any roles are strings
        cursor.execute("SELECT id, username, role FROM accounts_user")
        users = cursor.fetchall()
        
        for user_id, username, role in users:
            # If role is a string, convert it
            if isinstance(role, str):
                new_role = role_mapping.get(role.lower(), 0)  # Default to EMPLOYEE
                cursor.execute(
                    "UPDATE accounts_user SET role = %s WHERE id = %s",
                    [new_role, user_id]
                )
                print(f"Fixed role for user {username}: '{role}' -> {new_role}")


def reverse_fix(apps, schema_editor):
    """Reverse migration - convert integer values back to strings"""
    pass  # Not reversible


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_department_user_is_after_hours_preapproved_and_more'),
    ]

    operations = [
        migrations.RunPython(fix_role_values, reverse_fix),
    ]
