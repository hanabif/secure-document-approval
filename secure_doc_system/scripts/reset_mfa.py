"""
Quick script to reset MFA for a user and generate a new secret.
This ensures the user can start fresh with MFA setup.
"""

from accounts.models import User
import pyotp

# Get the user (change username as needed)
username = input("Enter username to reset MFA for: ")

try:
    user = User.objects.get(username=username)
    
    # Reset MFA
    user.mfa_enabled = False
    user.mfa_secret = ''  # Clear the old secret
    user.save()
    
    print(f"\n✅ MFA reset for user: {username}")
    print("The user can now go to /mfa and scan a fresh QR code.")
    
except User.DoesNotExist:
    print(f"\n❌ User '{username}' not found.")
