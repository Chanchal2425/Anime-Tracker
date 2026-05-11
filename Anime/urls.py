from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView
from .views import (
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
)


router = DefaultRouter()

router.register(r'anime', AnimeEntryView, basename='anime')
router.register(r'notes', EpisodeNoteView, basename='notes')
router.register(r'watchlogs', WatchLogView, basename='watchlogs')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view()),
    path('me/', current_user),

    # Core
    path('stats/', StatsView.as_view()),
    path('login/', login_view),
    path('logout/', logout_view),


    # Search & Add
    path('search/', search_anime),
    path('auto-add/', auto_add_anime),

    # Recommendations
    path('recommendations/', recommended_anime),   # ✅ renamed
    path('time-recommendations/', time_based_recommendation),  # ✅ consistent

    # Similar
    path('similar/<int:mal_id>/', similar_anime),

    # Sharing (enable this)
    path('share/<uuid:share_id>/', share_anime),
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