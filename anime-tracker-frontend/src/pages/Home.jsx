import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import Landing from "./Landing";
import API from "../api/api";
import Row from "../components/Row";
import Hero from "../components/Hero";
import StatsGrid from "../components/StatsGrid";
import Loader from "../components/Loader";
import "../App.css";
import CommunityFeed from "../components/CommunityFeed";

const JIKAN_HERO_CACHE_KEY = "jikan_hero_cache";

function Home() {
  const { user } = useAuth();

  const [animeList, setAnimeList] = useState([]);
  const [watchLogs, setWatchLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [heroAnime, setHeroAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize state when anime is updated via modal/actions
  const handleAnimeUpdated = (updatedAnime) => {
    setAnimeList((prev) =>
      prev.map((item) => {
        if (
          item.id === updatedAnime.id ||
          (item.mal_id && item.mal_id === updatedAnime.mal_id)
        ) {
          const total = Number(
            updatedAnime.total_episodes || item.total_episodes || 1
          );
          const current = Number(updatedAnime.current_episode);
          const isFinished = total > 0 && current >= total;

          return {
            ...item,
            ...updatedAnime,
            status: isFinished
              ? "completed"
              : updatedAnime.status || item.status,
          };
        }
        return item;
      })
    );

    setWatchLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        anime: updatedAnime.id,
        anime_title: updatedAnime.title,
        poster_url: updatedAnime.poster_url || updatedAnime.image_url,
        total_episodes: updatedAnime.total_episodes,
        episode: updatedAnime.current_episode,
        date: new Date().toISOString(),
      },
    ]);
  };

  // Fetch initial user dashboard data only if authenticated
  useEffect(() => {
    if (!user) return;

    Promise.all([
      API.get("/anime/"),
      API.get("/stats/"),
      API.get("/watchlogs/"),
    ])
      .then(([animeRes, statsRes, logsRes]) => {
        const animeData = Array.isArray(animeRes.data)
          ? animeRes.data
          : animeRes.data?.results || [];

        const logsData = Array.isArray(logsRes.data)
          ? logsRes.data
          : logsRes.data?.results || [];

        setAnimeList(animeData);
        setStats(statsRes.data);
        setWatchLogs(logsData);
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false));
  }, [user]);

  // Fetch or retrieve cached hero anime only if authenticated
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(JIKAN_HERO_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 1000 * 60 * 60 * 6) {
          setHeroAnime(parsed.data);
          return;
        }
      } catch (e) {
        localStorage.removeItem(JIKAN_HERO_CACHE_KEY);
      }
    }

    const query = `
      query {
        Page(page: 1, perPage: 1) {
          media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING) {
            id
            title { english romaji }
            description(asHtml: false)
            coverImage { extraLarge }
            bannerImage
            averageScore
          }
        }
      }
    `;

    fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((resData) => {
        const item = resData?.data?.Page?.media?.[0];
        if (item) {
          const formatted = {
            mal_id: item.id,
            title: item.title.english || item.title.romaji,
            synopsis: item.description
              ? item.description.replace(/<[^>]*>?/gm, "")
              : "",
            image: item.bannerImage || item.coverImage?.extraLarge,
            score: item.averageScore
              ? (item.averageScore / 10).toFixed(1)
              : "N/A",
          };
          setHeroAnime(formatted);
          localStorage.setItem(
            JIKAN_HERO_CACHE_KEY,
            JSON.stringify({ data: formatted, timestamp: Date.now() })
          );
        }
      })
      .catch(() => {
        if (animeList.length > 0) {
          setHeroAnime(animeList[0]);
        }
      });
  }, [user, animeList]);

  // Derive Completed list filter
  const completed = animeList.filter((a) => {
    if (a.status === "completed") return true;
    const total = Number(a.total_episodes);
    const current = Number(a.current_episode);
    return total > 0 && current >= total;
  });

  // Derive Continue Watching logic
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
          total_episodes: fullAnime.total_episodes || log.total_episodes || 1,
          current_episode: fullAnime.current_episode ?? log.episode,
          status: fullAnime.status || "watching",
          last_watched_date: log.date,
        };
      })
      .filter((anime) => {
        if (anime.status === "completed") return false;

        const current = Number(anime.current_episode);
        const total = Number(anime.total_episodes);

        if (total > 0 && current >= total) return false;

        return true;
      });
  }, [watchLogs, animeList]);

  // 1. Render Landing page for guests
  if (!user) {
    return <Landing />;
  }

  // 2. Render Loader while authenticated data loads
  if (loading) {
    return <Loader />;
  }

  // 3. Render Dashboard for logged-in users
  return (
    <div className="home">
      {heroAnime ? (
        <Hero anime={heroAnime} />
      ) : (
        animeList[0] && <Hero anime={animeList[0]} />
      )}
      {stats && <StatsGrid stats={stats} />}
      <Row
        title="Continue Watching"
        data={continueWatching}
        onAnimeUpdated={handleAnimeUpdated}
      />

      <CommunityFeed/>
    </div>


  );
}

export default Home;