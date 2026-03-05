from django.urls import path
from .views import (
    CreateAccessRequestView, CurrentUserView, RegisterUserView, 
    StudentChatView, UnreadBadgeView, 
    AdminChatListView, AdminUserChatView, AdminAccessRequestView # <-- Add these two!
)

urlpatterns = [
    path('request-access/', CreateAccessRequestView.as_view(), name='request-access'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('register/', RegisterUserView.as_view(), name='register'),
    
    # Student Chat Endpoints
    path('chat/', StudentChatView.as_view(), name='student-chat'),
    path('chat/unread/', UnreadBadgeView.as_view(), name='chat-unread-badge'),

    # NEW: Admin Chat Endpoints
    path('admin/chats/', AdminChatListView.as_view(), name='admin-chat-list'),
    path('admin/chats/<int:user_id>/', AdminUserChatView.as_view(), name='admin-user-chat'),

    path('admin/access-requests/', AdminAccessRequestView.as_view(), name='admin-requests-list'),
    path('admin/access-requests/<int:req_id>/', AdminAccessRequestView.as_view(), name='admin-requests-update'),
]