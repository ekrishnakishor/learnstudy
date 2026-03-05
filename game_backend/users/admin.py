from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, AccessRequest, Profile

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    
    # This controls what columns show up in the list view of users
    list_display = ['username', 'email', 'is_approved', 'total_xp', 'is_staff']
    
    # This allows you to actually edit these specific fields when you click on a user
    fieldsets = UserAdmin.fieldsets + (
        ('Platform Info', {'fields': ('is_approved', 'total_xp')}),
    )

@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    # What columns show up in the table view
    list_display = ('name', 'email', 'status', 'created_at')
    
    # Creates a sidebar filter to quickly find 'pending' requests
    list_filter = ('status', 'created_at')
    
    # Adds a search bar to search by name or email
    search_fields = ('name', 'email')

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    # Makes the Profile section easy to read in the admin panel
    list_display = ('user', 'current_streak_days', 'highest_streak_days')
    search_fields = ('user__username',)

# Register the CustomUser model with its specific Admin class
admin.site.register(CustomUser, CustomUserAdmin)