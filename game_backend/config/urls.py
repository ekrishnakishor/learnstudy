from django.contrib import admin
from django.urls import path, include
# Import the built-in JWT views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')), 
    path('api/games/', include('games.urls')),
    
    # --- JWT Authentication Endpoints ---
    # React will send POST requests here to log in
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Tokens expire for security. React uses this to get a fresh one.
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]