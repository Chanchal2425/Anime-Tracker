import { useEffect, useState, useMemo } from "react";
import API from "../api/api";
import Row from "../components/Row";
import Hero from "../components/Hero";
import Loader from "../components/Loader";
import "../App.css";

function AnimeList() {
  const [animeList, setAnimeList] = useState([]);
  const [watchLogs, setWatchLogs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all initial page data in parallel
  useEffect(() => {
    setLoading(true);

    Promise.all([
      API.get("/anime/"),
      API.get("/recommendations/"),
      API.get("/watchlogs/"),
    ])
      .then(([animeRes, recsRes, logsRes]) => {
        const animeData = Array.isArray(animeRes.data)
          ? animeRes.data
          : animeRes.data?.results || [];

        const logsData = Array.isArray(logsRes.data)
          ? logsRes.data
          : logsRes.data?.results || [];

        setAnimeList(animeData);
        setWatchLogs(logsData);

        setRecommendations([
          ...(recsRes.data?.genre_based || []),
          ...(recsRes.data?.similar || []),
          ...(recsRes.data?.time_based || []),
          ...(recsRes.data?.top || []),
        ]);
      })
      .catch((err) => {
        console.error("Error loading anime list data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

const handleAnimeUpdated = (updatedAnime) => {
  // Find the original item to guarantee we have a valid database ID
  const targetItem = animeList.find(
    (item) =>
      item.id === updatedAnime.id ||
      (item.mal_id && item.mal_id === updatedAnime.mal_id)
  );

  const targetId = updatedAnime.id || targetItem?.id;

  setAnimeList((prev) =>
    prev.map((item) => {
      if (
        item.id === targetId ||
        (item.mal_id && item.mal_id === updatedAnime.mal_id)
      ) {
        const total = Number(updatedAnime.total_episodes || item.total_episodes || 0);
        const current = Number(updatedAnime.current_episode);
        const isFinished = total > 0 && current >= total;

        // Force 'watching' if at least 1 episode is tracked and not finished
        let newStatus = updatedAnime.status || item.status;
        if (isFinished) {
          newStatus = "completed";
        } else if (current > 0) {
          newStatus = "watching";
        }

        return {
          ...item,
          ...updatedAnime,
          id: targetId,
          current_episode: current,
          status: newStatus,
        };
      }
      return item;
    })
  );

  // Append new watch log with guaranteed database ID
  if (targetId) {
    setWatchLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        anime: targetId,
        anime_title: updatedAnime.title || targetItem?.title,
        poster_url: updatedAnime.poster_url || updatedAnime.image_url || targetItem?.poster_url,
        total_episodes: updatedAnime.total_episodes || targetItem?.total_episodes,
        episode: updatedAnime.current_episode,
        date: new Date().toISOString(),
      },
    ]);
  }
};

// Plan to watch excludes anything with > 0 episodes watched
const planned = animeList.filter((a) => {
  const current = Number(a.current_episode || 0);
  return a.status === "plan_to_watch" && current === 0;
});

// Defensive Filters
const watching = animeList.filter((a) => {
  const current = Number(a.current_episode || 0);
  const total = Number(a.total_episodes || 0);
  const isFinished = a.status === "completed" || (total > 0 && current >= total);

  if (isFinished) return false;
  return a.status === "watching" || current > 0;
});

// Exclude items from Plan to Watch if at least 1 episode has been watched

  // Filter lists by status
  // 1. Updated Completed list filter (catches items where status or ep count indicates completion)

  const completed = animeList.filter((a) => {
  if (a.status === "completed") return true;
  const total = Number(a.total_episodes);
  const current = Number(a.current_episode);
  return total > 0 && current >= total;
});

// 2. Updated Continue Watching logic
const continueWatching = useMemo(() => {
  const latestByAnime = {};
  watchLogs.forEach((log) => {
    const animeId = log.anime;
    if (
      !latestByAnime[animeId] ||
      new Date(log.date) > new Date(latestByAnime[animeId].date)
    ) {
      latestByAnime[animeId] = log;
    }
  });

  return Object.values(latestByAnime)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((log) => {
      const fullAnime = animeList.find((a) => a.id === log.anime) || {};
      return {
        ...fullAnime,
        id: log.anime,
        title: log.anime_title || fullAnime.title,
        poster_url: log.poster_url || fullAnime.poster_url,
        total_episodes: fullAnime.total_episodes || log.total_episodes || 1, // Fallback to 1 for movies/OVAs
        current_episode: fullAnime.current_episode ?? log.episode,
        status: fullAnime.status || "watching",
        last_watched_date: log.date,
      };
    })
    .filter((anime) => {
      // Exclude if explicitly completed
      if (anime.status === "completed") return false;

      const current = Number(anime.current_episode);
      const total = Number(anime.total_episodes);

      // Exclude if watched episodes reach or exceed total episodes
      if (total > 0 && current >= total) return false;

      return true;
    });
}, [watchLogs, animeList]);


  // Derive "Continue Watching" by merging logs with actual anime records
// Derive "Continue Watching" by merging logs with actual anime records

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="anime-list-page">
      {animeList.length > 0 && <Hero anime={animeList[0]} />}

      {/* <Row 
        title="Continue Watching" 
        data={continueWatching} 
        onAnimeUpdated={handleAnimeUpdated} 
      /> */}
      <Row 
        title="Continue Watching" 
        data={watching} 
        onAnimeUpdated={handleAnimeUpdated} 
      />
      <Row 
        title="Plan to Watch" 
        data={planned} 
        onAnimeUpdated={handleAnimeUpdated} 
      />
      <Row 
        title="Completed" 
        data={completed} 
        onAnimeUpdated={handleAnimeUpdated} 
      />
      <Row 
        title="Recommended for You" 
        data={recommendations} 
        onAnimeUpdated={handleAnimeUpdated} 
      />
    </div>
  );
}

export default AnimeList;