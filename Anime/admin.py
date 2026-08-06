from django.contrib import admin
from .models import (
    AnimeEntry, 
    EpisodeNote, 
    WatchLog, 
    TicketReply, 
    SupportTicket, 
    CommunityComment
)

admin.site.register(AnimeEntry)
admin.site.register(EpisodeNote)
admin.site.register(WatchLog)
admin.site.register(CommunityComment)


class TicketReplyInline(admin.TabularInline):
    model = TicketReply
    extra = 1  # Provides 1 blank row for the admin to type a new reply
    fields = ('message', 'user', 'created_at')
    readonly_fields = ('created_at',)
    can_delete = False


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject', 'user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'message', 'user__username')
    fields = ('user', 'subject', 'message', 'status', 'admin_response')
    readonly_fields = ('user', 'subject', 'message')
    
    inlines = [TicketReplyInline]

    # Auto-assign the logged-in admin user to any newly created inline replies
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, TicketReply) and not instance.pk:
                if not instance.user_id:
                    instance.user = request.user
            instance.save()
        formset.save_m2m()