from django.db import models
from django.contrib.auth.models import User
import uuid

# Create your models here.

class AnimeEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
   
    mal_id = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=500)
   
    poster_url = models.URLField(blank=True)
    STATUS_CHOICES = [
        ('watching','Watching'),
        ('completed','Completed'),
        ('dropped',"Dropped"),
        ('plan_to_watch','Plan to Watch'),
    ]
    status = models.CharField(max_length=20 ,choices=STATUS_CHOICES, default='plan_to_watch')
    share_id = models.UUIDField(default=uuid.uuid4, unique=True ,null=True, blank=True)

    current_episode = models.IntegerField(default=0)
    total_episodes = models.IntegerField(null=True,blank=True)
    
    rating = models.FloatField(null=True,blank=True)
    notes = models.TextField(blank=True)
    genres = models.JSONField(default=list,blank=True)

    started_at = models.DateField(null=True,blank=True)
    completed_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'mal_id']

    def __str__(self):
        return f"{self.title} -{self.status} ({self.user.username})"


class EpisodeNote(models.Model):
    anime = models.ForeignKey(AnimeEntry, on_delete=models.CASCADE, related_name='episode_notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    episode_number = models.IntegerField()
    timestamp = models.CharField(max_length=50, blank=True ,null=True) 

    note = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.anime.title} - EP {self.episode_number}"


class WatchLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    anime = models.ForeignKey(AnimeEntry, on_delete=models.CASCADE)
    episode = models.IntegerField(default=1)


    minutes_watched = models.IntegerField()
    date = models.DateField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.anime} - Date {self.date}"



