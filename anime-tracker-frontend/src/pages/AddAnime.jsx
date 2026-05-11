import { useState, useEffect } from "react";
import API from "../api/api";
import { useAnimeDetail } from "../context/AnimeDetailContext";
import { useTrailer } from "../context/TrailerContext";
import { useWatchlist } from "../context/WatchlistContext";
import Loader from "../components/Loader";
import "./AddAnime.css";

function AddAnime() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [topAnime, setTopAnime] = useState([]);
  const [topAnimeLoading, setTopAnimeLoading] = useState(true);

  const { openAnimeDetail } = useAnimeDetail();
  const { openTrailer } = useTrailer();
  const { addToWatchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    fetch("https://api.jikan.moe/v4/top/anime?filter=airing&limit=10")
      .then((res) => res.json())
      .then((data) => {
        setTopAnime(data.data || []);
        setTopAnimeLoading(false);
      })
      .catch(() => setTopAnimeLoading(false));
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setHasSearched(false);
      setResults([]);
    }
  }, [query]);

  const searchAnime = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await API.get(`/search/?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getImage = (anime) =>
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url ||
    anime.image_url ||
    anime.image ||
    "https://via.placeholder.com/200x300/222/aaa?text=NA";

  return (
    <div className="add-page">
      {/* ── HERO SEARCH ── */}
      <div className="search-hero">
        <h1 className="search-headline">Discover Your Next Obsession</h1>
        <form onSubmit={searchAnime} className="search-form">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime..."
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </div>
        </form>
      </div>

      {/* ── FLOATING TOP 10 ── */}
      {!hasSearched && (
        topAnimeLoading ? (
          <Loader small />
        ) : topAnime.length > 0 && (
          <div className="floating-row">
            <div className="floating-badge">
              <span className="floating-badge-icon">🔥</span>
              <span className="floating-badge-text">Top 10 Now</span>
            </div>
            <div className="floating-track">
              {[0, 1].map((copyIdx) => (
                <div className="floating-slide" key={copyIdx}>
                  {topAnime.map((anime, i) => {
                    const added = isInWatchlist(anime);
                    return (
                      <div className="floating-card" key={`${copyIdx}-${i}`}>
                        <img src={getImage(anime)} alt={anime.title} loading="lazy" />
                        <div className="floating-card-overlay">
                          <button
                            className="floating-btn play-btn"
                            onClick={(e) => { e.stopPropagation(); openTrailer(anime); }}
                          >
                            ▶ Play
                          </button>
                          <button
                            className={`floating-btn add-btn${added ? " added" : ""}`}
                            onClick={() => addToWatchlist(anime)}
                          >
                            {added ? "✓ Added" : "+ Add"}
                          </button>
                          <button
                            className="floating-btn"
                            onClick={() => openAnimeDetail(anime)}
                          >
                            ℹ More Info
                          </button>
                        </div>
                        <p className="floating-card-title">{anime.title}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* ── SEARCH RESULTS ── */}
      {hasSearched && (
        <div className="search-results">
          {loading ? (
            <Loader small />
          ) : results.length === 0 ? (
            <div className="empty-state">
              <p>No results found for "{query}"</p>
              <span>Try a different title or check your spelling</span>
            </div>
          ) : (
            <div className="search-grid">
              {results.map((anime, index) => {
                const added = isInWatchlist(anime);
                return (
                  <div className="search-card" key={index}>
                    <div className="card-img-container">
                      <img
                        src={getImage(anime)}
                        alt={anime.title}
                        className="card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/200x300/222/aaa?text=No+Image";
                        }}
                      />
                      <div className="card-overlay">
                        <button
                          className="add-btn play-btn"
                          onClick={(e) => { e.stopPropagation(); openTrailer(anime); }}
                        >
                          ▶ Play
                        </button>
                        <button
                          className={`add-btn${added ? " added" : ""}`}
                          onClick={() => addToWatchlist(anime)}
                        >
                          {added ? "✓ Added" : "+ Add"}
                        </button>
                        <button
                          className="add-btn info-btn"
                          onClick={() => openAnimeDetail(anime)}
                        >
                          ℹ More Info
                        </button>
                      </div>
                    </div>
                    <div className="card-info">
                      <h3 className="card-title">{anime.title}</h3>
                      <p className="card-rating">⭐ {anime.rating || "N/A"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AddAnime;