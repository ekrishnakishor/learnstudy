from rest_framework import generics, status
from .models import AccessRequest, CustomUser, ChatMessage
from .serializers import AccessRequestSerializer, UserSerializer, RegisterUserSerializer, ChatMessageSerializer, AdminAccessRequestSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.db.models import Max, Q, Count

class CreateAccessRequestView(generics.CreateAPIView):
    queryset = AccessRequest.objects.all()
    serializer_class = AccessRequestSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class RegisterUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterUserSerializer
    permission_classes = [AllowAny]

class StudentChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = ChatMessage.objects.filter(user=request.user)
        messages.filter(is_from_admin=True, is_read=False).update(is_read=True)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, is_from_admin=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UnreadBadgeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = ChatMessage.objects.filter(
            user=request.user, 
            is_from_admin=True, 
            is_read=False
        ).count()
        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)

class AdminChatListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = CustomUser.objects.filter(chat_messages__isnull=False).annotate(
            last_message_time=Max('chat_messages__created_at'),
            unread_count=Count(
                'chat_messages', 
                filter=Q(chat_messages__is_read=False, chat_messages__is_from_admin=False)
            )
        ).distinct().order_by('-last_message_time')

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
        messages = ChatMessage.objects.filter(user_id=user_id)
        messages.filter(is_from_admin=False, is_read=False).update(is_read=True)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, user_id):
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user_id=user_id, is_from_admin=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


# --- THE UPDATED ADMIN APPROVAL VIEW ---
class AdminAccessRequestView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Fetch pending requests
        requests = AccessRequest.objects.filter(status='pending').order_by('-created_at')
        serializer = AdminAccessRequestSerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, req_id):
        try:
            access_req = AccessRequest.objects.get(id=req_id)
            new_status = request.data.get('status')
            
            if new_status in ['approved', 'rejected']:
                # 1. Update the request status
                access_req.status = new_status
                access_req.save()
                
                # 2. If approved, activate the user's account!
                if new_status == 'approved':
                    try:
                        # Find the user by the email they submitted in the request
                        user = CustomUser.objects.get(email=access_req.email)
                        user.is_approved = True
                        user.save()
                    except CustomUser.DoesNotExist:
                        # Handles the edge case where they requested access but haven't actually signed up yet
                        pass

                return Response({"message": f"Request marked as {new_status}"}, status=status.HTTP_200_OK)
            
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        except AccessRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)