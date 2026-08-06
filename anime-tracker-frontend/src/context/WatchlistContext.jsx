import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api";

const WatchlistContext = createContext();

// ---------- Helpers ----------
const getAnimeId = (anime) =>
  anime.mal_id || anime.id || anime.anime?.mal_id || anime.anime?.id || null;

const extractAnimeData = (anime) => anime.anime || anime;

const mapToBackendFormat = (anime) => {
  const poster =
    anime.poster_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url ||
    anime.image_url ||
    anime.image ||
    "https://via.placeholder.com/300x450/222/aaa?text=No+Image";

  return {
    mal_id: anime.mal_id || anime.id || null,
    title: anime.title || "",
    poster_url: poster,
    synopsis: anime.synopsis || "",
    episodes: anime.episodes || 0,
    score: anime.score || null,
    status: "plan_to_watch",
  };
};

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return; // 👈 Skip fetch if unauthenticated

    API.get("/anime/")
      .then((res) => setWatchlist(res.data || []))
      .catch((err) => {
        if (err.response?.status !== 403 && err.response?.status !== 401) {
          console.error("Failed to fetch watchlist:", err);
        }
      });
  }, []);

  const isInWatchlist = (anime) => {
    const animeId = getAnimeId(anime);
    if (!animeId) return false;
    return watchlist.some((item) => getAnimeId(item) === animeId);
  };

  const addToWatchlist = async (anime) => {
    const token = localStorage.getItem("access");
    if (!token) {
      alert("Please log in to add items to your watchlist.");
      return false;
    }

    if (isInWatchlist(anime)) {
      alert("Already in your watchlist!");
      return false;
    }

    const rawAnime = extractAnimeData(anime);
    const payload = mapToBackendFormat(rawAnime);

    try {
      await API.post("/auto-add/", payload);
      alert("Added to watchlist!");
      setWatchlist((prev) => [...prev, payload]);
      return true;
    } catch (err) {
      console.error("❌ Add failed. Server response:", err.response?.data || err.message);
      alert("Failed to add anime");
      return false;
    }
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
}