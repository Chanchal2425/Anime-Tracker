from rest_framework_simplejwt.tokens import RefreshToken
from collections import defaultdict
from django.shortcuts import get_object_or_404
from .models import AnimeEntry, EpisodeNote, WatchLog
from .serializers import AnimeEntrySerializer, EpisodeNoteSerializer, watchLogSerializer
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import api_view, permission_classes
from django.db.models.functions import Coalesce
from django.db.models import Value
from datetime import timedelta, date
from django.contrib.auth.models import User
import requests
from datetime import datetime
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.contrib.auth import authenticate, login


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
            }
        })

    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:

        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
        })

    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:

        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
        })

    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
    })

@api_view(['POST'])
def logout_view(request):
    from django.contrib.auth import logout
    logout(request)
    return Response({'message': 'Logged out'})

# ======================================================
#  VIEWSETS & STATS (fixed)
# ======================================================

class AnimeEntryView(viewsets.ModelViewSet):
    serializer_class = AnimeEntrySerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'genres']
    ordering_fields = ['rating', 'current_episodes', 'created_at', 'total_eps']

    def get_queryset(self):
        user = self.request.user
        return AnimeEntry.objects.filter(user=user).annotate(
            total_eps=Coalesce('total_episodes', Value(0))
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            password=password
        )
        return Response({
            'message': 'User created successfully'
        })

    def get(self, request):
        # Optional: explain how to use this endpoint
        return Response({
            'detail': 'This endpoint only accepts POST requests.',
            'example_post': {
                'username': 'your_username',
                'password': 'your_password'
            }
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)   # still 405 but with body
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            password=password
        )
        return Response({
            'message': 'User created successfully'
        })


class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        entries = AnimeEntry.objects.filter(user=user)

        total_anime = entries.count()
        completed = entries.filter(status='completed').count()
        watching = entries.filter(status='watching').count()
        dropped = entries.filter(status='dropped').count()
        plan_to_watch = entries.filter(status='plan_to_watch').count()

        total_episodes_watched = sum(entry.current_episode for entry in entries)
        total_possible_episodes = sum(entry.total_episodes or 0 for entry in entries)

        completion_percentage = 0
        if total_possible_episodes > 0:
            completion_percentage = (total_episodes_watched / total_possible_episodes) * 100

        total_watch_time_hours = (total_episodes_watched * 24) / 60

        rated_entries = entries.exclude(rating__isnull=True)
        average_rating = 0
        if rated_entries.exists():
            average_rating = sum(e.rating for e in rated_entries) / rated_entries.count()

        logs = WatchLog.objects.filter(user=user)
        daily_minutes = defaultdict(int)
        for log in logs:
            daily_minutes[log.date] += log.minutes_watched

        streak = 0
        today = date.today()
        while daily_minutes.get(today, 0) >= 15:
            streak += 1
            today -= timedelta(days=1)

        return Response({
            'total_anime': total_anime,
            'completed': completed,
            'watching': watching,
            'dropped': dropped,
            'plan_to_watch': plan_to_watch,
            'total_episodes_watched': total_episodes_watched,
            'completion_percentage': completion_percentage,
            'total_watch_time_hours': total_watch_time_hours,
            'average_rating': average_rating,
            'streak_days': streak,
        })


class EpisodeNoteView(viewsets.ModelViewSet):
    serializer_class = EpisodeNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = EpisodeNote.objects.filter(user=self.request.user)
        anime_id = self.request.query_params.get('anime')
        if anime_id:
            queryset = queryset.filter(anime_id=anime_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WatchLogView(viewsets.ModelViewSet):
    serializer_class = watchLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ======================================================
#  JIKAN SEARCH & RECOMMENDATIONS (fixed)
# ======================================================

@api_view(['GET'])
@permission_classes([AllowAny])  # or IsAuthenticated if you prefer
def search_anime(request):
    query = request.GET.get('q')
    if not query:
        return Response({"error": "Query Parameter 'q' is required."}, status=400)

    url = f"https://api.jikan.moe/v4/anime?q={query}&limit=10"
    response = requests.get(url)
    data = response.json()

    results = []
    for anime in data.get('data', []):
        results.append({
            'title': anime.get('title'),
            'episodes': anime.get('episodes'),
            'rating': anime.get('score'),
            'image': anime.get('images', {}).get('webp', {}).get('large_image_url'),
            'mal_id': anime.get('mal_id'),
            'genres': [g['name'] for g in anime.get('genres', [])],
        })
    return Response(results)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommended_anime(request):
    user = request.user  # fixed: removed self.
    entries = AnimeEntry.objects.filter(user=user)

    grouped = {
        "genre_based": [],
        "similar": [],
        "time_based": [],
        "top": []
    }
    seen_titles = set()

    # 1. GENRE BASED
    genre_count = {}
    for entry in entries:
        genres = entry.genres if isinstance(entry.genres, list) else []
        for genre in genres:
            name = genre.get('name') if isinstance(genre, dict) else genre
            if name:
                genre_count[name] = genre_count.get(name, 0) + 1

    top_genres = sorted(genre_count, key=genre_count.get, reverse=True)[:3]
    for genre in top_genres:
        try:
            res = requests.get(f"https://api.jikan.moe/v4/anime?q={genre}&limit=5", timeout=5).json()
            for anime in res.get('data', []):
                title = anime.get('title')
                if title and title not in seen_titles:
                    grouped['genre_based'].append({
                        "title": title,
                        "image": anime.get('images', {}).get('jpg', {}).get('image_url') or "",
                        "mal_id": anime.get('mal_id'),
                        "source": f"Because you like {genre}"
                    })
                    seen_titles.add(title)
        except Exception as e:
            print(f"Genre {genre} error: {e}")

    # 2. SIMILAR ANIME
    for entry in entries[:5]:
        if not entry.mal_id:
            continue
        try:
            res = requests.get(f"https://api.jikan.moe/v4/anime/{entry.mal_id}/recommendations", timeout=5).json()
            for item in res.get('data', [])[:5]:
                anime = item.get('entry')
                if not anime:
                    continue
                title = anime.get('title')
                if title and title not in seen_titles:
                    grouped['similar'].append({
                        "title": title,
                        "image": anime.get('images', {}).get('jpg', {}).get('image_url') or "",
                        "mal_id": anime.get('mal_id'),
                        "source": f"Similar to {entry.title}"
                    })
                    seen_titles.add(title)
        except Exception as e:
            print(f"Similar error: {e}")

    # 3. TIME BASED
    hour = datetime.now().hour
    if hour < 12:
        queries = ["short anime", "slice of life", "comedy"]
    elif hour < 18:
        queries = ["action", "adventure", "shounen"]
    else:
        queries = ["romance", "drama", "psychological", "seinen"]

    time_data = []
    for q in queries:
        if len(time_data) >= 4:
            break
        try:
            res = requests.get(f"https://api.jikan.moe/v4/anime?q={q}&limit=6", timeout=5).json()
            for anime in res.get('data', []):
                if len(time_data) >= 4:
                    break
                title = anime.get('title')
                if title:
                    time_data.append(anime)
        except Exception as e:
            print(f"Time query '{q}' failed: {e}")

    if not time_data:
        try:
            res = requests.get("https://api.jikan.moe/v4/top/anime?filter=airing&limit=6", timeout=5).json()
            time_data = res.get('data', [])[:4]
        except Exception as e:
            print(f"Time fallback airing failed: {e}")

    if not time_data:
        fallback_ids = [1, 5, 6, 7, 8, 9]
        for mid in fallback_ids:
            try:
                r = requests.get(f"https://api.jikan.moe/v4/anime/{mid}", timeout=5).json()
                anime = r.get('data')
                if anime:
                    time_data.append(anime)
                if len(time_data) >= 4:
                    break
            except:
                pass

    for anime in time_data:
        title = anime.get('title')
        if not title:
            continue
        grouped['time_based'].append({
            "title": title,
            "image": anime.get('images', {}).get('jpg', {}).get('image_url') or "",
            "mal_id": anime.get('mal_id'),
            "source": "Perfect for this time",
        })

    # 4. TOP PICKS
    try:
        res = requests.get("https://api.jikan.moe/v4/top/anime", timeout=5).json()
        for anime in res.get('data', [])[:10]:
            grouped['top'].append({
                "title": anime.get('title'),
                "image": anime.get('images', {}).get('jpg', {}).get('image_url') or "",
                "mal_id": anime.get('mal_id'),
                "source": "Top Anime"
            })
    except Exception as e:
        print(f"Top error: {e}")

    return Response(grouped)


# ======================================================
#  AUTO ADD (fixed)
# ======================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_add_anime(request):
    user = request.user  # fixed: use logged-in user
    data = request.data

    poster = data.get('poster_url') or "https://via.placeholder.com/300x450/222/aaa?text=No+Image"

    anime, created = AnimeEntry.objects.get_or_create(
        user=user,
        title=data.get('title'),
        defaults={
            'poster_url': poster,
            'total_episodes': data.get('episodes') or 0,
            'genres': data.get('genres', []),
            'mal_id': data.get('mal_id'),
            'status': 'plan_to_watch',
        }
    )

    if not created:
        anime.poster_url = poster or anime.poster_url
        anime.total_episodes = data.get('episodes') or anime.total_episodes
        anime.genres = data.get('genres') or anime.genres
        if not anime.mal_id:
            anime.mal_id = data.get('mal_id')
        anime.save()

    return Response({
        "message": "Added to watchlist." if created else "Already in watchlist.",
        "created": created
    })


# ======================================================
#  MISC ENDPOINTS (share, similar, time-based)
# ======================================================

@api_view(['GET'])
@permission_classes([AllowAny])  # share links are public
def share_anime(request, share_id):
    anime = get_object_or_404(AnimeEntry, share_id=share_id)
    return Response({
        'title': anime.title,
        'status': anime.status,
        'episodes': anime.current_episode,
        'rating': anime.rating,
        'notes': [{'episode': n.episode_number, 'note': n.note} for n in anime.episode_notes.all()]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def similar_anime(request, mal_id):
    url = f'https://api.jikan.moe/v4/anime/{mal_id}/recommendations'
    try:
        response = requests.get(url, timeout=5).json()
    except:
        return Response({"error": "API failed"}, status=500)

    results = []
    for item in response.get('data', []):
        entry = item.get('entry')
        if entry:
            results.append({
                'title': entry.get('title'),
                'image': entry.get('images', {}).get('jpg', {}).get('image_url'),
            })
    return Response(results)


@api_view(['GET'])
@permission_classes([AllowAny])
def time_based_recommendation(request):
    hour = datetime.now().hour
    query = "short anime" if hour < 12 else "action" if hour < 18 else "romance"
    try:
        res = requests.get(f"https://api.jikan.moe/v4/anime?q={query}&limit=5", timeout=5).json()
    except:
        return Response({'error': 'API failed'}, status=500)

    results = []
    for anime in res.get('data', []):
        results.append({
            "title": anime.get('title'),
            "image": anime.get('images', {}).get('jpg', {}).get('image_url'),
            "reason": f"Recommended for this time: {query}"
        })
    return Response(results)