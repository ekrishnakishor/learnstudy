from django.db import models
from django.conf import settings

class Notification(models.Model):
    # Who receives the bell notification?
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # e.g., "You won the week!", "New Sudoku level added!"
    message = models.CharField(max_length=255)
    
    # The red dot on the bell icon disappears when this is True
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"To {self.user.username}: {self.message}"


class ChatMessage(models.Model):
    # The specific user having the conversation with the admin
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    message = models.TextField()
    
    # If False, the user sent it. If True, the Admin sent it.
    is_from_admin = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        sender = "Admin" if self.is_from_admin else self.user.username
        return f"{sender} ({self.created_at.strftime('%Y-%m-%d %H:%M')}): {self.message[:20]}"