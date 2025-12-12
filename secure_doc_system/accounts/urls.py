from django.urls import path
from .views import UserList, UserDetail, CurrentUserView, ManageUserRoleView, RegisterView
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('users/', UserList.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetail.as_view(), name='user-detail'),
    path('users/<int:pk>/role/', ManageUserRoleView.as_view(), name='manage-user-role'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('auth/login/', obtain_auth_token, name='api_token_auth'),
    path('auth/register/', RegisterView.as_view(), name='api_register'),
]