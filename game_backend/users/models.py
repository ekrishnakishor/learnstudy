from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    # Django already provides username, email, password, etc.
    # We are adding custom fields specific to your game platform.
    
    # This handles your "Request Access" flow. 
    # New users default to False until an admin approves them.
    is_approved = models.BooleanField(default=False)
    
    # We'll need this later for the Hall of Fame
    total_xp = models.IntegerField(default=0)

    def __str__(self):
        return self.username
    

class AccessRequest(models.Model):
    # We define the choices for the status dropdown
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    
    # They can tell you why they want to join, or maybe add a LinkedIn profile
    reason = models.TextField(blank=True, null=True) 
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # auto_now_add automatically saves the exact time the row is created
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.email}) - {self.status}"
    

class Profile(models.Model):
    # OneToOne ensures one user can only have exactly one profile
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Store an image URL (like from AWS S3 or Cloudinary later)
    avatar_url = models.URLField(blank=True, null=True)
    
    # A short bio for their public page
    bio = models.TextField(max_length=500, blank=True, null=True)
    
    # Fun stats to show on their profile
    current_streak_days = models.IntegerField(default=0)
    highest_streak_days = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class ChatMessage(models.Model):
    # This securely links the messages to your CustomUser model
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='chat_messages'
    )
    
    # Is this from the admin or the student? 
    is_from_admin = models.BooleanField(default=False)
    
    # The actual chat text
    message = models.TextField()
    
    # Automatically timestamps the message when it's sent
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Crucial for the nav icon notification badge!
    is_read = models.BooleanField(default=False)

    class Meta:
        # Ensures messages always load in chronological order (oldest to newest)
        ordering = ['created_at']

    def __str__(self):
        sender = "Admin" if self.is_from_admin else self.user.username
        return f"[{sender} to {self.user.username}] {self.message[:20]}..."