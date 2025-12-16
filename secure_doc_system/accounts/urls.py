from django.urls import path
from .views import LoginView, MeView, RegisterView, VerifyCaptchaView, LogoutView, ChangePasswordView, ProfileView, MfaSetupView, MfaVerifyView
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api_token_auth'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/me/', MeView.as_view(), name='current-user'),
    path('auth/register/', RegisterView.as_view(), name='api_register'),
    path('auth/mfa/setup/', MfaSetupView.as_view(), name='mfa-setup'),
    path('auth/mfa/verify/', MfaVerifyView.as_view(), name='mfa-verify'),
    path('verify-recaptcha/', VerifyCaptchaView.as_view(), name='verify-recaptcha'),
]