from rest_framework import generics, status # <-- Added status here
from .models import AccessRequest, CustomUser, ChatMessage # <-- Added ChatMessage here
from .serializers import AccessRequestSerializer, UserSerializer, RegisterUserSerializer, ChatMessageSerializer, AdminAccessRequestSerializer # <-- Added ChatMessageSerializer here
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.db.models import Max, Q, Count

# CreateAPIView is a built-in DRF tool that automatically handles incoming POST requests
class CreateAccessRequestView(generics.CreateAPIView):
    queryset = AccessRequest.objects.all()
    serializer_class = AccessRequestSerializer

class CurrentUserView(APIView):
    # THIS IS THE BOUNCER. It rejects any request that doesn't have a valid JWT token.
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user is automatically figured out by DRF using the token!
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class RegisterUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterUserSerializer
    # AllowAny means they don't need a token to access this specific endpoint (since they are signing up!)
    permission_classes = [AllowAny]


# --- THE NEW CHAT VIEWS ---

class StudentChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch the entire chat history for this specific student
        messages = ChatMessage.objects.filter(user=request.user)
        
        # Mark unread messages from the admin as "read"!
        messages.filter(is_from_admin=True, is_read=False).update(is_read=True)
        
        # Send the formatted history back to React
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # The student is typing a new message to the admin
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            # Force the user to be the logged-in student
            serializer.save(user=request.user, is_from_admin=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnreadBadgeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Count unread messages from the admin
        unread_count = ChatMessage.objects.filter(
            user=request.user, 
            is_from_admin=True, 
            is_read=False
        ).count()
        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)
    
# --- THE ADMIN CHAT VIEWS ---

class AdminChatListView(APIView):
    # Only admins can see this!
    permission_classes = [IsAdminUser]

    def get(self, request):
        # 1. Grab all users who have at least one chat message
        # 2. Figure out when their last message was so we can sort by recent
        # 3. Count how many unread messages they sent to the admin
        users = CustomUser.objects.filter(chat_messages__isnull=False).annotate(
            last_message_time=Max('chat_messages__created_at'),
            unread_count=Count(
                'chat_messages', 
                filter=Q(chat_messages__is_read=False, chat_messages__is_from_admin=False)
            )
        ).distinct().order_by('-last_message_time')

        # Format the list for the React sidebar
        data = [
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "unread_count": user.unread_count,
                "last_message_time": user.last_message_time
            }
            for user in users
        ]
        return Response(data, status=status.HTTP_200_OK)


class AdminUserChatView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        # Fetch the chat thread for a SPECIFIC student
        messages = ChatMessage.objects.filter(user_id=user_id)
        
        # Since the admin is opening the chat, mark the student's messages as read!
        messages.filter(is_from_admin=False, is_read=False).update(is_read=True)
        
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, user_id):
        # The admin is sending a reply to the student
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            # Save it to the student's thread (user_id) and flag it as from the admin
            serializer.save(user_id=user_id, is_from_admin=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

# --- ADMIN ACCESS REQUEST VIEWS ---

class AdminAccessRequestView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Fetch only the pending requests, newest first
        requests = AccessRequest.objects.filter(status='pending').order_by('-created_at')
        serializer = AdminAccessRequestSerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, req_id):
        # Update a specific request's status (Approve or Reject)
        try:
            access_req = AccessRequest.objects.get(id=req_id)
            new_status = request.data.get('status')
            
            if new_status in ['approved', 'rejected']:
                access_req.status = new_status
                access_req.save()
                return Response({"message": f"Request marked as {new_status}"}, status=status.HTTP_200_OK)
            
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        except AccessRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)