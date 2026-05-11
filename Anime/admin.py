from django.contrib import admin
from .models import AnimeEntry, EpisodeNote, WatchLog

# Register your models here.
admin.site.register(AnimeEntry)
admin.site.register(EpisodeNote)
admin.site.register(WatchLog)