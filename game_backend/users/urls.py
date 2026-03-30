from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CreateAccessRequestView, CurrentUserView, RegisterUserView, 
    StudentChatView, UnreadBadgeView, 
    AdminChatListView, AdminUserChatView, AdminAccessRequestView
)

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('request-access/', CreateAccessRequestView.as_view(), name='request_access'),

    # Chat endpoints
    path('chat/', StudentChatView.as_view(), name='student_chat'),
    path('chat/unread/', UnreadBadgeView.as_view(), name='unread_badge'),
    
    # Admin endpoints
    path('admin/chats/', AdminChatListView.as_view(), name='admin_chat_list'),
    path('admin/chats/<int:user_id>/', AdminUserChatView.as_view(), name='admin_user_chat'),
    path('admin/requests/', AdminAccessRequestView.as_view(), name='admin_requests'),
]