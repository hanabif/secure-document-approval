from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer
from .models import User

class RegisterView(generics.CreateAPIView):
    queryset = get_user_model().objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserList(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer

class UserDetail(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAdminUser]
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ManageUserRoleView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        new_role = request.data.get('role')
        if new_role is None:
            return Response({"detail": "Role not provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Admin cannot change their own role
        if user == request.user:
            return Response({"detail": "Admin cannot change their own role."}, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent demoting from admin
        if user.role == User.ROLE_ADMIN:
            return Response({"detail": "Cannot change the role of an admin."}, status=status.HTTP_403_FORBIDDEN)


        try:
            new_role = int(new_role)
            if new_role not in [User.ROLE_EMPLOYEE, User.ROLE_MANAGER, User.ROLE_SENIOR_MANAGER, User.ROLE_DIRECTOR]:
                 raise ValueError()
        except (ValueError, TypeError):
            return Response({"detail": "Invalid role specified."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = new_role
        user.save()
        
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)