from datetime import date, datetime, timedelta
from collections import defaultdict
import requests
from django.core.mail import send_mail
from django.core.cache import cache  # Or us

from django.core.cache import cache
from django.contrib.auth import authenticate, logout
from django.contrib.auth.models import User
from django.db.models import Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404

from rest_framework.permissions import IsAuthenticatedOrReadOnly # or AllowAny
from rest_framework.generics import RetrieveAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes, parser_classes

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend

from .models import AnimeEntry, EpisodeNote, WatchLog ,CommunityComment, EpisodeNote,SupportTicket, TicketReply
from .serializers import AnimeEntrySerializer, EpisodeNoteSerializer, watchLogSerializer ,CommunityCommentSerializer, PublicEpisodeNoteSerializer

# ======================================================
#  AUTH VIEWS
# ======================================================

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



from rest_framework_simplejwt.authentication import JWTAuthentication

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
    })


@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out'})


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

        User.objects.create_user(username=username, password=password)
        return Response({'message': 'User created successfully'})

# ======================================================
#  VIEWSETS & STATS
# ======================================================

class AnimeEntryView(viewsets.ModelViewSet):
    serializer_class = AnimeEntrySerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'genres']
    ordering_fields = ['rating', 'current_episode', 'created_at', 'total_eps']

    def get_queryset(self):
        user = self.request.user
        return AnimeEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    
    # 1. Update Username
    new_username = request.data.get('username')
    if new_username:
        if User.objects.filter(username=new_username).exclude(id=user.id).exists():
            return Response({"error": "Username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        user.username = new_username

    # 2. Update Password
    new_password = request.data.get('password')
    if new_password:
        if len(new_password) < 6:
            return Response({"error": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)

    user.save()
    return Response({"message": "Profile updated successfully!", "username": user.username}, status=status.HTTP_200_OK)

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
#  OPTIMIZED JIKAN SEARCH & RECOMMENDATIONS
# ======================================================

def fetch_jikan(url, cache_timeout=1800):
    """Utility helper with custom User-Agent to prevent Jikan blocking."""
    cached_response = cache.get(url)
    if cached_response:
        return cached_response

    # Add standard Browser User-Agent header
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        res = requests.get(url, headers=headers, timeout=5)
        
        if res.status_code == 200:
            data = res.json()
            cache.set(url, data, timeout=cache_timeout)
            return data
        else:
            print(f"⚠️ Jikan Returned Non-200 Status: {res.status_code} -> {res.text}")
            
    except Exception as e:
        print(f"❌ Jikan Request Exception ({url}): {e}")

    return {}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_ticket(request):
    subject = request.data.get('subject')
    message = request.data.get('message')

    if not subject or not message:
        return Response({"error": "Subject and message are required."}, status=status.HTTP_400_BAD_REQUEST)

    # 💾 Save ticket directly to database
    SupportTicket.objects.create(
        user=request.user,
        subject=subject,
        message=message
    )

    return Response({"message": "Ticket submitted successfully!"}, status=status.HTTP_201_CREATED)

ANILIST_URL = 'https://graphql.anilist.co'

@api_view(['GET'])
@permission_classes([AllowAny])
def search_anime(request):
    query = request.GET.get('q', '').strip()
    genre = request.GET.get('genre', '').strip()
    min_rating = request.GET.get('min_rating', '').strip()
    duration = request.GET.get('duration', '').strip()
    sort_by = request.GET.get('sort_by', 'latest').strip()

    if not query and not genre and not min_rating and not duration:
        return Response([])

    cache_key = f"anilist_search_{query.lower()}_{genre}_{min_rating}_{duration}_{sort_by}"
    cached_results = cache.get(cache_key)
    if cached_results:
        return Response(cached_results)

    # 1. ADDED meanScore & status TO GRAPHQL QUERY
    gql_query = '''
        query ($search: String, $genre: String, $formatIn: [MediaFormat], $sort: [MediaSort], $statusIn: [MediaStatus]) {
        Page(page: 1, perPage: 20) {
            media(
            search: $search,
            genre: $genre,
            format_in: $formatIn,
            sort: $sort,
            status_in: $statusIn,
            type: ANIME
            ) {
            id
            title {
                english
                romaji
            }
            coverImage {
                extraLarge
            }
            episodes
            averageScore
            meanScore
            status
            }
        }
        }
    '''

    variables = {}
    if query:
        variables['search'] = query
    if genre:
        variables['genre'] = genre

    if duration == 'movie':
        variables['formatIn'] = ['MOVIE']
    elif duration == 'tv':
        variables['formatIn'] = ['TV', 'TV_SHORT']
    elif duration == 'short':
        variables['formatIn'] = ['TV_SHORT', 'SPECIAL', 'OVA']

    if sort_by == 'rating':
        variables['sort'] = ['SCORE_DESC']
    elif sort_by == 'popularity':
        variables['sort'] = ['POPULARITY_DESC']
    else:  # 'latest'
        # Sorts by start date descending
        variables['statusIn'] = ['FINISHED', 'RELEASING']
    try:
        res = requests.post(
            ANILIST_URL,
            json={'query': gql_query, 'variables': variables},
            timeout=5
        )

        if res.status_code == 200:
            data = res.json().get('data', {}).get('Page', {}).get('media', [])
            results = []

            for anime in data:
                # 2. FALLBACK TO meanScore IF averageScore IS NULL
                score = anime.get('averageScore') or anime.get('meanScore')
                
                if min_rating:
                    try:
                        min_score = float(min_rating) * 10
                        if not score or score < min_score:
                            continue
                    except ValueError:
                        pass

                title = anime.get('title', {}).get('english') or anime.get('title', {}).get('romaji')
                poster = anime.get('coverImage', {}).get('extraLarge')

                # 3. FORMAT SCORE OR FALLBACK BASED ON RELEASE STATUS
                formatted_rating = round(score / 10, 1) if score else "N/A"

                results.append({
                    'id': anime.get('id'),
                    'mal_id': anime.get('id'),
                    'title': title,
                    'episodes': anime.get('episodes') or 0,
                    'rating': formatted_rating,
                    'score': formatted_rating,  # Provides both keys for frontend compatibility
                    'status': anime.get('status'),
                    'poster_url': poster,
                    'image': poster,
                    'genres': anime.get('genres', []),
                })

            cache.set(cache_key, results, timeout=3600)
            return Response(results)
            
        else:
            print(f"❌ AniList Search HTTP Error: {res.status_code}")

    except Exception as e:
        print(f"❌ AniList Search Exception: {e}")

    return Response([])



from rest_framework.views import APIView
from rest_framework.permissions import AllowAny # Import AllowAny
from rest_framework.response import Response
from rest_framework import status

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

# Replace with your actual Google Client ID
GOOGLE_CLIENT_ID = "1020067481726-g0gdh2bbfaavjv38ppbgce30gskq3md7.apps.googleusercontent.com"

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify token with Google servers
            id_info = id_token.verify_oauth2_token(
                token, google_requests.Request(), GOOGLE_CLIENT_ID
            )

            email = id_info.get("email")
            first_name = id_info.get("given_name", "")
            last_name = id_info.get("family_name", "")

            # 1. Find existing user by email
            user = User.objects.filter(email=email).first()

            if not user:
                # 2. Derive base username from email prefix
                base_username = email.split("@")[0]
                username = base_username

                # Ensure username is unique to avoid integrity conflicts
                if User.objects.filter(username=username).exists():
                    username = f"{base_username}_{uuid.uuid4().hex[:4]}"

                # 3. Create new user record
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )

            # 4. Generate SimpleJWT access and refresh tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response({"error": "Invalid or expired Google token"}, status=status.HTTP_400_BAD_REQUEST)



import requests
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

def fetch_anilist_popular(limit=10):
    """Fetches popular anime directly from AniList via GraphQL (No API Key Required)."""
    cache_key = f"anilist_popular_{limit}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    query = '''
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: POPULARITY_DESC, type: ANIME) {
          id
          title {
            english
            romaji
          }
          coverImage {
            extraLarge
          }
          genres
          averageScore
        }
      }
    }
    '''
    
    variables = {'page': 1, 'perPage': limit}
    
    try:
        response = requests.post(
            'https://graphql.anilist.co', 
            json={'query': query, 'variables': variables},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            media_list = data.get('data', {}).get('Page', {}).get('media', [])
            
            # Format the output so it matches the structure expected by your frontend
            formatted_anime = []
            for item in media_list:
                title = item.get('title', {}).get('english') or item.get('title', {}).get('romaji')
                formatted_anime.append({
                    "id": item.get('id'),
                    "title": title,
                    "poster_url": item.get('coverImage', {}).get('extraLarge'),
                    "score": item.get('averageScore'),
                    "genres": item.get('genres', []),
                    "source": "Top Rated"
                })
                
            # Cache for 6 hours
            cache.set(cache_key, formatted_anime, timeout=21600)
            return formatted_anime
            
    except Exception as e:
        print(f"AniList API error: {e}")
        
    return []





import requests
from datetime import datetime
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AnimeEntry


ANILIST_URL = 'https://graphql.anilist.co'

def query_anilist(query, variables):
    """Generic GraphQL helper for AniList requests."""
    try:
        response = requests.post(
            ANILIST_URL, 
            json={'query': query, 'variables': variables}, 
            timeout=5
        )
        if response.status_code == 200:
            return response.json().get('data', {})
    except Exception as e:
        print(f"AniList request failed: {e}")
    return {}

def format_anilist_media(media_list, source_label="Recommended"):
    """Formats raw AniList GraphQL results for the frontend."""
    formatted = []
    for item in media_list:
        title = item.get('title', {}).get('english') or item.get('title', {}).get('romaji')
        if title:
            formatted.append({
                "id": item.get('id'),
                "title": title,
                "poster_url": item.get('coverImage', {}).get('extraLarge'),
                "score": item.get('averageScore'),
                "episodes": item.get('episodes') or 0,
                "source": source_label
            })
    return formatted


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommended_anime(request):
    user = request.user
    # Bump key version to v5 to bust old cached responses
    cache_key = f"user_recommendations_v5_{user.id}"
    cached = cache.get(cache_key)

    if cached:
        return Response(cached)

    grouped = {
        "trending": [],
        "because_you_like": [],
        "top": [],
        "time_based": [],
        "genre_action": [],
        "genre_comedy": [],
        "genre_horror": [],
        "genre_drama": []
    }

    used_ids = set()

    def filter_uniques(media_list, label):
        unique_list = []
        for item in media_list:
            item_id = item.get('id')
            if item_id and item_id not in used_ids:
                used_ids.add(item_id)
                unique_list.append(item)
        return format_anilist_media(unique_list, label)

    # -------------------------------------------------------------
    # 1. TRENDING ANIME
    # -------------------------------------------------------------
    trending_query = '''
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME) {
          id
          title { english romaji }
          coverImage { extraLarge }
          averageScore
          episodes
        }
      }
    }
    '''
    trending_data = query_anilist(trending_query, {'perPage': 10})
    grouped['trending'] = filter_uniques(
        trending_data.get('Page', {}).get('media', []), 
        "Trending Now"
    )

    # -------------------------------------------------------------
    # 2. BECAUSE YOU LIKE (Dynamic based on watch history)
    # -------------------------------------------------------------
    entries = AnimeEntry.objects.filter(user=user)
    genre_count = {}
    for entry in entries:
        genres = entry.genres if isinstance(entry.genres, list) else []
        for g in genres:
            name = g.get('name') if isinstance(g, dict) else g
            if name:
                genre_count[name] = genre_count.get(name, 0) + 1

    genre_search_query = '''
    query ($genre: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(genre: $genre, sort: SCORE_DESC, type: ANIME) {
          id
          title { english romaji }
          coverImage { extraLarge }
          averageScore
          episodes
        }
      }
    }
    '''

    if genre_count:
        favorite_genre = sorted(genre_count, key=genre_count.get, reverse=True)[0]
        fav_data = query_anilist(genre_search_query, {'genre': favorite_genre, 'perPage': 10})
        grouped['because_you_like'] = filter_uniques(
            fav_data.get('Page', {}).get('media', []), 
            f"Because you like {favorite_genre}"
        )

    # -------------------------------------------------------------
    # 3. TOP PICKS (Popularity)
    # -------------------------------------------------------------
    top_query = '''
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(sort: POPULARITY_DESC, type: ANIME) {
          id
          title { english romaji }
          coverImage { extraLarge }
          averageScore
          episodes
        }
      }
    }
    '''
    top_data = query_anilist(top_query, {'perPage': 10})
    grouped['top'] = filter_uniques(
        top_data.get('Page', {}).get('media', []), 
        "All Time Popular"
    )

    # -------------------------------------------------------------
    # 4. TIME-BASED RECOMMENDATIONS
    # -------------------------------------------------------------
    hour = datetime.now().hour
    time_query = '''
    query ($formatIn: [MediaFormat], $epLesser: Int, $epGreater: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(
          format_in: $formatIn, 
          episodes_lesser: $epLesser, 
          episodes_greater: $epGreater, 
          sort: [POPULARITY_DESC, SCORE_DESC], 
          type: ANIME
        ) {
          id
          title { english romaji }
          coverImage { extraLarge }
          averageScore
          episodes
        }
      }
    }
    '''
    time_vars = {'perPage': 10}
    if hour < 12:
        time_vars['formatIn'] = ['TV', 'TV_SHORT']
        time_vars['epLesser'] = 13
        time_label = "Quick Morning Picks (Short Anime)"
    elif hour < 18:
        time_vars['formatIn'] = ['MOVIE', 'SPECIAL', 'OVA']
        time_label = "Afternoon Feature Movies"
    else:
        time_vars['formatIn'] = ['TV']
        time_vars['epGreater'] = 24
        time_label = "Night Binge (Long Series)"

    time_data = query_anilist(time_query, time_vars)
    grouped['time_based'] = filter_uniques(
        time_data.get('Page', {}).get('media', []), 
        time_label
    )

    # -------------------------------------------------------------
    # 5. SPECIFIC GENRE ROWS (Action, Comedy, Horror, Drama)
    # -------------------------------------------------------------
    target_genres = [
        ("Action", "genre_action", "Action Hits"),
        ("Comedy", "genre_comedy", "Comedy & Laughs"),
        ("Horror", "genre_horror", "Horror & Thrills"),
        ("Drama", "genre_drama", "Top Dramas"),
    ]

    for genre_name, dict_key, label in target_genres:
        g_data = query_anilist(genre_search_query, {'genre': genre_name, 'perPage': 10})
        grouped[dict_key] = filter_uniques(
            g_data.get('Page', {}).get('media', []), 
            label
        )

    # Cache response for 1 hour
    cache.set(cache_key, grouped, timeout=3600)
    return Response(grouped)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def community_comments(request):
    if request.method == 'GET':
        comments = CommunityComment.objects.all()[:30]
        # Pass request context here!
        serializer = CommunityCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        content = request.data.get('content', '').strip()
        if not content:
            return Response({"error": "Comment cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        
        comment = CommunityComment.objects.create(user=request.user, content=content)
        serializer = CommunityCommentSerializer(comment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_community_comment(request, comment_id):
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

    # Permission check: Only the owner can delete their comment
    if comment.user != request.user:
        return Response({"error": "You are not authorized to delete this comment"}, status=status.HTTP_403_FORBIDDEN)

    comment.delete()
    return Response({"message": "Comment deleted successfully"}, status=status.HTTP_200_OK)

# 2. Fetch Recent Public Episode Notes Across All Users
@api_view(['GET'])
@permission_classes([AllowAny])
def community_public_notes(request):
    # Fetch recent notes
    recent_notes = EpisodeNote.objects.select_related('user', 'anime').order_by('-created_at')[:20]
    serializer = PublicEpisodeNoteSerializer(recent_notes, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_add_anime(request):
    user = request.user
    data = request.data
    poster = data.get('poster_url') or "https://via.placeholder.com/300x450/222/aaa?text=No+Image"
    
    # Parse mal_id cleanly
    raw_mal_id = data.get('mal_id') or data.get('id')
    mal_id = int(raw_mal_id) if raw_mal_id and str(raw_mal_id).isdigit() else None

    anime, created = AnimeEntry.objects.get_or_create(
        user=user,
        title=data.get('title'),
        defaults={
            'poster_url': poster,
            'total_episodes': data.get('episodes') or 0,
            'genres': data.get('genres', []),
            'mal_id': mal_id,
            'status': 'plan_to_watch',
        }
    )

    if not created:
        anime.poster_url = poster or anime.poster_url
        anime.total_episodes = data.get('episodes') or anime.total_episodes
        anime.genres = data.get('genres') or anime.genres
        if not anime.mal_id and mal_id:
            anime.mal_id = mal_id
        anime.save()

    return Response({
        "message": "Added to watchlist." if created else "Already in watchlist.",
        "created": created
    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import SupportTicket, TicketReply

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ticket_replies(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id, user=request.user)

    if request.method == 'GET':
        replies = ticket.replies.all()
        data = [
            {
                'id': r.id,
                'user': r.user.username,
                'is_staff': r.user.is_staff,
                'message': r.message,
                'created_at': r.created_at.strftime('%Y-%m-%d %H:%M')
            }
            for r in replies
        ]
        return Response(data, status=status.HTTP_200_OK)

    if request.method == 'POST':
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        reply = TicketReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=message
        )
        return Response({
            'id': reply.id,
            'user': reply.user.username,
            'is_staff': reply.user.is_staff,
            'message': reply.message,
            'created_at': reply.created_at.strftime('%Y-%m-%d %H:%M')
        }, status=status.HTTP_201_CREATED)

# views.py
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def handle_tickets(request):
    if request.method == 'GET':
        tickets = SupportTicket.objects.filter(user=request.user).order_by('-created_at')
        data = [
            {
                'id': t.id,
                'subject': t.subject,
                'message': t.message,
                'status': t.get_status_display(),
                'admin_response': t.admin_response,  # <--- Send the admin response
                'created_at': t.created_at.strftime('%Y-%m-%d %H:%M')
            }
            for t in tickets
        ]
        return Response(data, status=status.HTTP_200_OK)
    

    # POST: Raise a new ticket
    if request.method == 'POST':
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not subject or not message:
            return Response({"error": "Subject and message are required."}, status=status.HTTP_400_BAD_REQUEST)

        new_ticket = SupportTicket.objects.create(
            user=request.user,
            subject=subject,
            message=message
        )

        return Response({
            'id': new_ticket.id,
            'subject': new_ticket.subject,
            'message': new_ticket.message,
            'status': new_ticket.get_status_display(),
            'created_at': new_ticket.created_at.strftime('%Y-%m-%d %H:%M')
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    user = request.user
    if 'avatar' in request.FILES:
        # Assuming your User or Profile model has an 'avatar' ImageField
        user.profile.avatar = request.FILES['avatar'] # or user.avatar
        user.profile.save()
        return Response({"message": "Avatar uploaded successfully!"}, status=status.HTTP_200_OK)
    return Response({"error": "No avatar file provided"}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import EpisodeNote

@api_view(['GET'])
@permission_classes([AllowAny])
def public_note_detail(request, share_id):
    note = EpisodeNote.objects.filter(share_id=share_id).select_related('anime').first()
    
    if not note:
        return Response(
            {"error": "Note not found or link has expired."}, 
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        "id": str(note.id),
        "share_id": str(note.share_id),
        "anime_title": note.anime.title if note.anime else "Anime Note",
        "poster_url": note.anime.poster_url if note.anime else None,
        "episode_number": note.episode_number,
        "note": note.note,
        "timestamp": note.timestamp,
        "created_at": note.created_at,
    })


# views.py
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ticket_detail_reply(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id, user=request.user)

    # GET: Retrieve ticket detail & all replies
    if request.method == 'GET':
        replies = ticket.replies.all()
        return Response({
            "id": ticket.id,
            "subject": ticket.subject,
            "message": ticket.message,
            "status": ticket.get_status_display(),
            "created_at": ticket.created_at,
            "replies": [
                {
                    "user": r.user.username,
                    "message": r.message,
                    "created_at": r.created_at.strftime('%Y-%m-%d %H:%M')
                } for r in replies
            ]
        })

    # POST: Add a new reply to the ticket
    if request.method == 'POST':
        message = request.data.get('message', '').strip()
        if not message:
            return Response({"error": "Reply message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        reply = TicketReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=message
        )
        return Response({
            "message": "Reply added successfully!",
            "reply": {
                "user": reply.user.username,
                "message": reply.message,
                "created_at": reply.created_at.strftime('%Y-%m-%d %H:%M')
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
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
    data = fetch_jikan(f'https://api.jikan.moe/v4/anime/{mal_id}/recommendations')
    results = []
    for item in data.get('data', []):
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
    res = fetch_jikan(f"https://api.jikan.moe/v4/anime?q={query}&limit=5")

    results = []
    for anime in res.get('data', []):
        results.append({
            "title": anime.get('title'),
            "image": anime.get('images', {}).get('jpg', {}).get('image_url'),
            "reason": f"Recommended for this time: {query}"
        })
    return Response(results)