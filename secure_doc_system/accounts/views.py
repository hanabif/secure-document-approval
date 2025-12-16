from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth import authenticate
from .serializers import UserSerializer, ChangePasswordSerializer, ProfileSerializer
from .models import User
from .utils import verify_captcha
from audit.utils import log_user_action, log_security_event
from audit.models import AuditSeverity


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    An endpoint for retrieving and updating user profile.
    """
    serializer_class = ProfileSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        obj = self.request.user
        return obj

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ChangePasswordView(generics.GenericAPIView):
    """
    An endpoint for changing password.
    """
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        obj = self.request.user
        return obj

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"detail": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)
            # set_password also hashes the password that the user will get
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            log_user_action(request, 'Password changed', f'User {request.user.username} changed their password successfully.')
            return Response({"detail": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


class LoginView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            log_user_action(request, 'User logged in', f'User {username} logged in successfully.', user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'role': user.role.upper() if user.role else 'EMPLOYEE'
            })
        log_security_event(request, 'Failed login attempt', f'Failed login attempt for username: {username}.', severity=AuditSeverity.WARNING)
        return Response({'error': 'Invalid Credentials'}, status=400)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            token = Token.objects.get(user=request.user)
            token.delete()
            log_user_action(request, 'User logged out', f'User {request.user.username} logged out successfully.')
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Token.DoesNotExist:
            return Response({'error': 'No token found for the user.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """Return current authenticated user info."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'role': user.role.upper() if user.role else 'EMPLOYEE'
        })


class VerifyCaptchaView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        ok = verify_captcha(token, request.META.get('REMOTE_ADDR'))
        return Response({'success': bool(ok)}, status=status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST)
