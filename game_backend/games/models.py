from django.db import models
from django.conf import settings # Best practice for referencing our CustomUser

class Game(models.Model):
    GAME_TYPES = (
        ('single', 'Single Player'),
        ('multi', 'Multiplayer'),
    )
    title = models.CharField(max_length=100) # e.g., "Sudoku", "Tug of War"
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    
    is_active = models.BooleanField(default=True)
    is_coming_soon = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class GameSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True) 
    score = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} playing {self.game.title}"
        
    @property
    def time_taken_seconds(self):
        if self.end_time and self.start_time:
            return (self.end_time - self.start_time).total_seconds()
        return None
    
class Leaderboard(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    weekly_xp = models.IntegerField(default=0)
    week_number = models.IntegerField() 
    year = models.IntegerField()

    class Meta:
        unique_together = ('user', 'week_number', 'year')

    def __str__(self):
        return f"{self.user.username} - Week {self.week_number} ({self.year}): {self.weekly_xp} XP"


class HallOfFame(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    month_name = models.CharField(max_length=20) 
    year = models.IntegerField()
    achievement_title = models.CharField(max_length=100, default="Monthly Champion")
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.achievement_title} ({self.month_name} {self.year})"