from django.urls import path
from .views import StartGameView, SubmitGameView, LeaderboardView, UserProfileView

urlpatterns = [
    path('start/', StartGameView.as_view(), name='start-game'),
    path('submit/<int:session_id>/', SubmitGameView.as_view(), name='submit-game'),
    
    # UPDATED: Now uses the flexible LeaderboardView
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    
    # NEW: The Profile Endpoint
    path('profile/', UserProfileView.as_view(), name='user-profile'),
     
]