from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    AnimeEntryView,
    StatsView,
    EpisodeNoteView,
    WatchLogView,
    share_anime,
    search_anime,
    recommended_anime,
    similar_anime,
    time_based_recommendation,
    auto_add_anime,
    login_view,
    current_user,
    logout_view,
    public_note_detail,
    community_comments,
    community_public_notes,
    delete_community_comment,
    upload_avatar,
    # submit_ticket,
    handle_tickets,
    update_profile,
    ticket_detail_reply,
    ticket_replies,
    GoogleLoginView
)

router = DefaultRouter()
router.register(r'anime', AnimeEntryView, basename='anime')
router.register(r'notes', EpisodeNoteView, basename='notes')
router.register(r'watchlogs', WatchLogView, basename='watchlogs')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),

    # Authentication & Profile
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('me/', current_user, name='current_user'),

    # Core Features & Stats
    path('stats/', StatsView.as_view(), name='stats'),
    path('search/', search_anime, name='search_anime'),
    path('auto-add/', auto_add_anime, name='auto_add_anime'),

    # Recommendations & Discovery
    path('recommendations/', recommended_anime, name='recommended_anime'),
    path('time-recommendations/', time_based_recommendation, name='time_recommendations'),
    path('similar/<int:mal_id>/', similar_anime, name='similar_anime'),

    # Social / Sharing
    path('share/<uuid:share_id>/', share_anime, name='share_anime'),
    path('public-notes/<uuid:share_id>/', public_note_detail, name='public-note-detail'),

    path('community/comments/', community_comments, name='community_comments'),
    path('community/comments/<int:comment_id>/', delete_community_comment, name='delete_community_comment'),
    path('community/public-notes/', community_public_notes, name='community_public_notes'),
    path('me/avatar/', upload_avatar, name='upload_avatar'),
    # path('support/tickets/', submit_ticket, name='submit_ticket'),
    path('support/tickets/', handle_tickets, name='handle_tickets'),
    path('me/update/', update_profile, name='update_profile'),
    path('support/tickets/<int:ticket_id>/', ticket_detail_reply, name='ticket_detail_reply'),
    path('support/tickets/<int:ticket_id>/replies/', ticket_replies, name='ticket_replies'),
    path("auth/google/", GoogleLoginView.as_view(), name="google_login"),
]






# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import AnimeEntryView , StatsView ,EpisodeNoteView ,share_anime ,WatchLogView , search_anime , recommended_anime, similar_anime , time_based_recommendation , auto_add_anime


# router = DefaultRouter()

# #anime/1 for get update and delete ,  /anime/ for list and create
# router.register(r'anime', AnimeEntryView ,basename='anime')
# router.register(r'notes',EpisodeNoteView, basename='notes')
# router.register(r'watchlogs',WatchLogView, basename='watchlogs')

# urlpatterns = [
#     path('', include(router.urls)),
#     path('stats/', StatsView.as_view()),
#     # path('share/<uuid:share_id>/',share_anime),
#     path('search/' , search_anime),
#     path('recommend/', recommended_anime),
#     path('time-recommend/', time_based_recommendation),
#     path('auto-add/', auto_add_anime),
#     path('similar/<int:mal_id>/',similar_anime)

# ]