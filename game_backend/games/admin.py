from django.contrib import admin
from .models import Game, GameSession, Leaderboard, HallOfFame


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('title', 'game_type', 'is_active', 'is_coming_soon')
    list_filter = ('game_type', 'is_active', 'is_coming_soon')

@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'start_time', 'is_completed', 'score')
    list_filter = ('is_completed', 'game')

@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ('user', 'weekly_xp', 'week_number', 'year')
    list_filter = ('year', 'week_number')
    ordering = ('-weekly_xp',) # Sorts by highest XP automatically

@admin.register(HallOfFame)
class HallOfFameAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement_title', 'month_name', 'year')
    list_filter = ('year', 'month_name')