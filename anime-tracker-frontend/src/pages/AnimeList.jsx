import { useEffect, useState, useMemo } from "react";   // ← add useMemo
import API from "../api/api";
import Row from "../components/Row";
import Hero from "../components/Hero";
import Loader from "../components/Loader";
import "../App.css";

function AnimeList() {
  const [animeList, setAnimeList] = useState([]);
  const [watchLogs, setWatchLogs] = useState([]);          // ← NEW state
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {

    API.get("/recommendations/")
      .then(res => {

        setRecommendations([
          ...(res.data.genre_based || []),
          ...(res.data.similar || []),
          ...(res.data.time_based || []),
          ...(res.data.top || []),
        ]);

      })
      .catch(err => console.error(err));

  }, []);

  useEffect(() => {
    API.get("/anime/")
      .then(res => {

        console.log(res.data);

        if (Array.isArray(res.data)) {
          setAnimeList(res.data);
        } else {
          setAnimeList([]);
        }

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setAnimeList([]);
        setLoading(false);
      });
  }, []);

  // ----- NEW: Poll /api/watchlogs/ every 5 seconds -----
  useEffect(() => {
    const fetchWatchLogs = () => {
      API.get("/watchlogs/")
        .then(res => setWatchLogs(res.data))
        .catch(err => console.error(err));
    };

    fetchWatchLogs();                              // initial load
    const interval = setInterval(fetchWatchLogs, 5000);
    return () => clearInterval(interval);
  }, []);
  // ------------------------------------------------------

  const watching = animeList.filter(a => a.status === "watching");
  const completed = animeList.filter(a => a.status === "completed");
  const planned = animeList.filter(a => a.status === "plan_to_watch");

  // ----- NEW: Derive “Continue Watching” from watch logs -----
  const continueWatching = useMemo(() => {
    // Group logs by anime, keep only the most recent entry for each
    const latestByAnime = {};
    watchLogs.forEach(log => {
      const animeId = log.anime; // WatchLog foreign key (the anime entry ID)
      if (
        !latestByAnime[animeId] ||
        new Date(log.date) > new Date(latestByAnime[animeId].date)
      ) {
        latestByAnime[animeId] = log;
      }
    });

    // Convert to array, sorted by most recent watch first
    return Object.values(latestByAnime)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(log => ({
        // Transform into a shape Row expects (title, poster_url, etc.)
        id: log.anime,                        // anime ID
        title: log.anime_title,
        poster_url: log.poster_url,
        total_episodes: log.total_episodes,
        current_episode: log.episode,         // assumes you store episode in WatchLog
        // Add a computed status label if you like
        status: "watching",
        // You can also pass raw log data if Row can handle it
        last_watched_date: log.date,
      }));
  }, [watchLogs]);
  // -----------------------------------------------------------

  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      <Hero anime={animeList[0]} />
      <Row title="Continue Watching" data={continueWatching} />   {/* ← NEW Row */}
      <Row title="Watching" data={watching} />
      <Row title="Plan to Watch" data={planned} />
      <Row title="Completed" data={completed} />
      <Row title="Recommended for You" data={recommendations} />
    </div>
  );
}

export default AnimeList;