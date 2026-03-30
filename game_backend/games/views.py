import datetime
from django.db.models import Sum
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
        game_title = request.data.get('game_title')
        
        try:
            game = Game.objects.get(title=game_title, is_active=True)
        except Game.DoesNotExist:
            return Response({"error": "Game not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        session = GameSession.objects.create(user=request.user, game=game)
        return Response({"session_id": session.id}, status=status.HTTP_201_CREATED)


class SubmitGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = GameSession.objects.get(id=session_id, user=request.user, is_completed=False)
        except GameSession.DoesNotExist:
            return Response({"error": "Active session not found."}, status=status.HTTP_404_NOT_FOUND)

        session.end_time = timezone.now()
        session.is_completed = True
        time_taken = (session.end_time - session.start_time).total_seconds()
        
        xp_earned = 10 

        previous_sessions = GameSession.objects.filter(
            user=request.user, 
            game=session.game, 
            is_completed=True
        ).exclude(id=session.id)

        if previous_sessions.exists():
            previous_times = [
                (s.end_time - s.start_time).total_seconds() for s in previous_sessions
            ]
            best_previous_time = min(previous_times)

            if time_taken < best_previous_time:
                xp_earned = 20 
        
        session.score = xp_earned 
        session.save()

        today = timezone.now().date()
        year, week, _ = today.isocalendar()

        leaderboard_entry, created = Leaderboard.objects.get_or_create(
            user=request.user,
            year=year,
            week_number=week,
            defaults={'weekly_xp': 0}
        )
        
        leaderboard_entry.weekly_xp += xp_earned
        leaderboard_entry.save()

        return Response({
            "message": "Game submitted successfully!",
            "time_taken_seconds": time_taken,
            "xp_earned": xp_earned,
            "is_personal_best": xp_earned == 20 
        }, status=status.HTTP_200_OK)


class SubmitTriviaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        time_taken = request.data.get('time_taken_seconds', 0)
        correct_answers = request.data.get('correct_answers', 0)
        
        game, created = Game.objects.get_or_create(
            title="Knowledge Rush", 
            defaults={'game_type': 'single', 'is_active': True}
        )

        xp_earned = correct_answers * 2 
        
        if correct_answers >= 7 and time_taken < 150:
            xp_earned += 10

        session = GameSession.objects.create(
            user=request.user,
            game=game,
            score=xp_earned,
            is_completed=True
        )
        
        session.start_time = timezone.now() - datetime.timedelta(seconds=time_taken)
        session.end_time = timezone.now()
        session.save()

        today = timezone.now().date()
        year, week, _ = today.isocalendar()

        leaderboard_entry, created = Leaderboard.objects.get_or_create(
            user=request.user,
            year=year,
            week_number=week,
            defaults={'weekly_xp': 0}
        )
        
        leaderboard_entry.weekly_xp += xp_earned
        leaderboard_entry.save()

        return Response({
            "message": "Trivia score submitted!",
            "xp_earned": xp_earned
        }, status=status.HTTP_200_OK)


class LeaderboardView(APIView):
    permission_classes = [] 

    def get(self, request):
        timeframe = request.query_params.get('timeframe', 'all')
        
        today = datetime.date.today()
        current_year = today.year
        current_week = today.isocalendar()[1]

        if timeframe == 'week':
            queryset = Leaderboard.objects.filter(
                year=current_year, 
                week_number=current_week
            ).values('user__username').annotate(
                total_xp=Sum('weekly_xp')
            ).order_by('-total_xp')[:10] 

        elif timeframe == 'month':
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
            queryset = Leaderboard.objects.values('user__username').annotate(
                total_xp=Sum('weekly_xp')
            ).order_by('-total_xp')[:10]

        results = [
            {'username': item['user__username'], 'xp': item['total_xp']} 
            for item in queryset
        ]

        return Response({'leaderboard': results}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        sessions = GameSession.objects.filter(user=user, is_completed=True).order_by('-end_time')
        
        total_xp = sum(session.score for session in sessions if session.score)
        games_played = sessions.count()
        
        recent_games = []
        for session in sessions[:5]:
            time_taken = (session.end_time - session.start_time).total_seconds()
            recent_games.append({
                "game_title": session.game.title,
                "score": session.score,
                "time_taken_seconds": time_taken,
                "date": session.end_time.strftime("%b %d, %Y")
            })

        return Response({
            "username": user.username,
            "email": user.email,
            "total_xp": total_xp,
            "games_played": games_played,
            "recent_games": recent_games
        }, status=status.HTTP_200_OK)