from rest_framework import serializers
from .models import AccessRequest, CustomUser, ChatMessage # <-- Added ChatMessage here

class AccessRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessRequest
        # We only expose these fields to the outside world.
        # Notice we exclude 'status' so a clever user can't send "status: approved" in their request!
        fields = ['name', 'email', 'reason']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # We NEVER send the password here. Just the safe profile data.
        fields = ['id', 'username', 'email', 'total_xp', 'is_approved', 'is_staff']

class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    # We will use the built-in 'first_name' field to store their Full Name from the form
    first_name = serializers.CharField(required=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'first_name']

    def create(self, validated_data):
        # create_user automatically hashes the password for security!
        # is_approved defaults to False automatically based on our model.
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name']
        )
        return user


# --- THE NEW CHAT SERIALIZER ---

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'is_from_admin', 'message', 'created_at', 'is_read']
        # We make these read-only so a student can't hack the request 
        # to make it look like the admin sent a message, or fake the timestamp!
        read_only_fields = ['user', 'is_from_admin', 'created_at']

class AdminAccessRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessRequest
        fields = '__all__' # The admin needs to see id, name, email, reason, status, and created_at