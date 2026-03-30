from django.urls import path
from .views import StartGameView, SubmitGameView, LeaderboardView, UserProfileView, SubmitTriviaView

urlpatterns = [
    path('start/', StartGameView.as_view(), name='start-game'),
    path('submit/<int:session_id>/', SubmitGameView.as_view(), name='submit-game'),
    
    # NEW: Trivia Submission Endpoint
    path('submit/trivia/', SubmitTriviaView.as_view(), name='submit-trivia'),
    
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]