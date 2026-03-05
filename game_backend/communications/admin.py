from django.contrib import admin
from .models import Notification, ChatMessage

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_from_admin', 'message', 'created_at')
    list_filter = ('is_from_admin', 'created_at', 'user')