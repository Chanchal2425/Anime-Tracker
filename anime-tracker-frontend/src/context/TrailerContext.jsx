import { createContext, useContext, useState } from "react";
import TrailerModal from "../components/TrailerModal";

const TrailerContext = createContext();

export function TrailerProvider({ children }) {
  const [trailerAnime, setTrailerAnime] = useState(null);
  const [embedUrl, setEmbedUrl] = useState(null);

  const openTrailer = async (anime) => {
    // 1. Direct trailer
    if (anime.trailer?.embed_url) {
      setTrailerAnime(anime);
      setEmbedUrl(anime.trailer.embed_url);
      return;
    }

    // 2. Try to find a MAL ID from many possible locations
    const malId =
      anime.mal_id ||
      anime.id ||
      anime.anime_id ||
      anime.anime?.mal_id ||
      anime.anime?.id;

    if (malId) {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
        const data = await res.json();
        const fetchedUrl = data.data?.trailer?.embed_url || null;

        if (fetchedUrl) {
          setTrailerAnime(anime);
          setEmbedUrl(fetchedUrl);
          return;
        }
      } catch (err) {
        console.error("Trailer fetch failed:", err);
      }
    }

    // 3. Fallback: search by title
    const title = anime.title || anime.anime?.title;
    if (title) {
      try {
        const searchRes = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`
        );
        const searchData = await searchRes.json();
        const found = searchData.data?.[0];
        if (found?.trailer?.embed_url) {
          setTrailerAnime(anime);
          setEmbedUrl(found.trailer.embed_url);
          return;
        }
      } catch (err) {
        console.error("Title search fallback failed:", err);
      }
    }

    // 4. If still no trailer, open a search in a new tab (e.g., YouTube)
    const searchQuery = encodeURIComponent(`${title || anime.title} trailer`);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, "_blank");
  };

  const closeTrailer = () => {
    setTrailerAnime(null);
    setEmbedUrl(null);
  };

  return (
    <TrailerContext.Provider value={{ openTrailer }}>
      {children}
      {trailerAnime && embedUrl && (
        <TrailerModal embedUrl={embedUrl} onClose={closeTrailer} />
      )}
    </TrailerContext.Provider>
  );
}

export function useTrailer() {
  const context = useContext(TrailerContext);
  if (!context) {
    throw new Error("useTrailer must be used within TrailerProvider");
  }
  return context;
}