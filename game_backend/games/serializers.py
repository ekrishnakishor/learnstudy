from rest_framework import serializers
from .models import Game, GameSession, Leaderboard

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'title', 'game_type', 'is_active', 'is_coming_soon']

class GameSessionSerializer(serializers.ModelSerializer):
    time_taken_seconds = serializers.ReadOnlyField()

    class Meta:
        model = GameSession
        fields = ['id', 'game', 'start_time', 'end_time', 'score', 'is_completed', 'time_taken_seconds']

class LeaderboardSerializer(serializers.ModelSerializer):
    # This reaches into the related CustomUser table and grabs the username
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Leaderboard
        fields = ['username', 'weekly_xp', 'week_number', 'year']