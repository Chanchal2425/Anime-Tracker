from rest_framework import serializers
from .models import AnimeEntry, EpisodeNote, WatchLog ,CommunityComment, EpisodeNote

class AnimeEntrySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True) # Display the username instead of the user ID

    class Meta:
        model = AnimeEntry
        fields = '__all__'
        read_only_fields = ['user'] #this field ensures that the user field is read-only and cannot be modified through the API/frontend.


class EpisodeNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EpisodeNote
        fields = ['id', 'share_id', 'anime', 'episode_number', 'timestamp', 'note', 'created_at']
        read_only_fields = ['id', 'share_id', 'created_at']

class CommunityCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = CommunityComment
        fields = ['id', 'username', 'content', 'created_at', 'is_owner']

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False

class PublicEpisodeNoteSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    anime_title = serializers.CharField(source='anime.title', read_only=True)
    poster_url = serializers.CharField(source='anime.poster_url', read_only=True)

    class Meta:
        model = EpisodeNote
        fields = ['id', 'username', 'anime_title', 'poster_url', 'episode_number', 'note', 'created_at']


class watchLogSerializer(serializers.ModelSerializer):
    anime_title = serializers.CharField(source='anime.title', read_only=True)
    poster_url = serializers.CharField(source='anime.poster_url', read_only=True)
    total_episodes = serializers.IntegerField(source='anime.total_episodes', read_only=True)

    class Meta:
        model = WatchLog
        fields = '__all__'
        read_only_fields = ['user']
        # Explicitly list fields if you prefer:
        # fields = ['id', 'anime', 'minutes_watched', 'date', 'episode',
        #           'anime_title', 'poster_url', 'total_episodes']

# class watchLogSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = WatchLog
#         fields = '__all__'