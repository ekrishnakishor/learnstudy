import datetime
from django.db.models import Sum # Add this import!
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics
from django.utils import timezone
from .models import Game, GameSession, Leaderboard
from .serializers import GameSessionSerializer, LeaderboardSerializer

class StartGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # The frontend will send {"game_title": "Sudoku"}
        game_title = request.data.get('game_title')
        
        try:
            game = Game.objects.get(title=game_title, is_active=True)
        except Game.DoesNotExist:
            return Response({"error": "Game not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        # Create the session. start_time is automatically set by auto_now_add in the model!
        session = GameSession.objects.create(user=request.user, game=game)
        
        # React is looking specifically for "session_id" to save it
        return Response({"session_id": session.id}, status=status.HTTP_201_CREATED)


class SubmitGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = GameSession.objects.get(id=session_id, user=request.user, is_completed=False)
        except GameSession.DoesNotExist:
            return Response({"error": "Active session not found."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Stop the clock
        session.end_time = timezone.now()
        session.is_completed = True
        time_taken = (session.end_time - session.start_time).total_seconds()
        
        # 2. --- NEW XP LOGIC ---
        xp_earned = 10 # Base XP for finishing/winning

        # Fetch previous completed sessions for this specific game to check for a personal best
        previous_sessions = GameSession.objects.filter(
            user=request.user, 
            game=session.game, 
            is_completed=True
        ).exclude(id=session.id)

        if previous_sessions.exists():
            # Calculate the time taken for all previous sessions to find the best (lowest) time
            previous_times = [
                (s.end_time - s.start_time).total_seconds() for s in previous_sessions
            ]
            best_previous_time = min(previous_times)

            # If they beat their previous best time, double the XP!
            if time_taken < best_previous_time:
                xp_earned = 20 
        
        # Save the XP as the score
        session.score = xp_earned 
        session.save()

        # 3. --- UPDATE THE WEEKLY LEADERBOARD ---
        today = timezone.now().date()
        year, week, _ = today.isocalendar()

        # Get this week's leaderboard entry for the user, or create it if it doesn't exist
        leaderboard_entry, created = Leaderboard.objects.get_or_create(
            user=request.user,
            year=year,
            week_number=week,
            defaults={'weekly_xp': 0}
        )
        
        # Add the newly earned XP to their weekly total
        leaderboard_entry.weekly_xp += xp_earned
        leaderboard_entry.save()

        return Response({
            "message": "Game submitted successfully!",
            "time_taken_seconds": time_taken,
            "xp_earned": xp_earned,
            "is_personal_best": xp_earned == 20 # Let React know if they got a bonus!
        }, status=status.HTTP_200_OK)


# Replaced WeeklyLeaderboardView with this flexible one
class LeaderboardView(APIView):
    # Anyone can see the leaderboard
    permission_classes = [] 

    def get(self, request):
        # Look for the timeframe in the URL: /api/leaderboard/?timeframe=week
        timeframe = request.query_params.get('timeframe', 'all')
        
        today = datetime.date.today()
        current_year = today.year
        current_week = today.isocalendar()[1]

        if timeframe == 'week':
            # Sum up XP for the current week only
            queryset = Leaderboard.objects.filter(
                year=current_year, 
                week_number=current_week
            ).values('user__username').annotate(
                total_xp=Sum('weekly_xp')
            ).order_by('-total_xp')[:10] # Top 10

        elif timeframe == 'month':
            # Calculate first week of the current month
            first_day_of_month = today.replace(day=1)
            first_week_of_month = first_day_of_month.isocalendar()[1]
            
            queryset = Leaderboard.objects.filter(
                year=current_year,
                week_number__gte=first_week_of_month,
                week_number__lte=current_week
            ).values('user__username').annotate(
                total_xp=Sum('weekly_xp')
            ).order_by('-total_xp')[:10]

        else:
            # All-time: Sum up ALL rows for each user
            queryset = Leaderboard.objects.values('user__username').annotate(
                total_xp=Sum('weekly_xp')
            ).order_by('-total_xp')[:10]

        # Format the response specifically for your React frontend
        results = [
            {'username': item['user__username'], 'xp': item['total_xp']} 
            for item in queryset
        ]

        return Response({'leaderboard': results}, status=status.HTTP_200_OK)

class WeeklyLeaderboardView(generics.ListAPIView):
    # This allows anyone (even non-logged-in users on the landing page) to see the leaderboard
    permission_classes = [] 
    serializer_class = LeaderboardSerializer

    def get_queryset(self):
        # 1. Figure out today's date
        today = datetime.date.today()
        
        # 2. Get the current year and ISO week number
        year, week, weekday = today.isocalendar()

        # 3. Query the database for this week, and order it from highest XP to lowest
        # The minus sign before 'weekly_xp' means descending order!
        return Leaderboard.objects.filter(year=year, week_number=week).order_by('-weekly_xp')[:10]

# Add this at the bottom of game_backend/games/views.py

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Grab all completed games for this specific user
        sessions = GameSession.objects.filter(user=user, is_completed=True).order_by('-end_time')
        
        # 2. Calculate lifetime stats
        total_xp = sum(session.score for session in sessions if session.score)
        games_played = sessions.count()
        
        # 3. Format the 5 most recent games for the UI
        recent_games = []
        for session in sessions[:5]:
            time_taken = (session.end_time - session.start_time).total_seconds()
            recent_games.append({
                "game_title": session.game.title,
                "score": session.score,
                "time_taken_seconds": time_taken,
                "date": session.end_time.strftime("%b %d, %Y")
            })

        # 4. Ship it to React!
        return Response({
            "username": user.username,
            "email": user.email,
            "total_xp": total_xp,
            "games_played": games_played,
            "recent_games": recent_games
        }, status=status.HTTP_200_OK)