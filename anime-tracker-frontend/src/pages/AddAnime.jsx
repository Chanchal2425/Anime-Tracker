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

  // Filter Toggle State
  const [showFilters, setShowFilters] = useState(false);

  // Filter Values State
  const [filters, setFilters] = useState({
    genre: "",
    duration: "",
    sortBy: "popularity",
  });

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

  // Handle Input Changes for Filters
  const handleFilterChange = (field, value) => {
    const updatedFilters = { ...filters, [field]: value };
    setFilters(updatedFilters);
    if (hasSearched || query.trim()) {
      executeSearch(query, updatedFilters);
    }
  };

const executeSearch = async (searchQuery, currentFilters) => {
  const hasFilter =
    Boolean(currentFilters.genre) ||
    Boolean(currentFilters.duration) ||
    Boolean(currentFilters.sortBy);

  if (!searchQuery.trim() && !hasFilter) return;

  setLoading(true);
  setHasSearched(true);

  const params = new URLSearchParams();
  if (searchQuery.trim()) params.append("q", searchQuery.trim());
  if (currentFilters.genre) params.append("genre", currentFilters.genre);
  if (currentFilters.duration) params.append("duration", currentFilters.duration);
  if (currentFilters.sortBy) params.append("sort_by", currentFilters.sortBy);

  try {
    const res = await API.get(`/search/?${params.toString()}`);
    let items = res.data || [];

    // Fetch missing scores from AniList for items returning no score
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.score && !item.rating) {
          try {
            const aniRes = await fetch("https://graphql.anilist.co", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  query ($search: String) {
                    Media(search: $search, type: ANIME) {
                      averageScore
                      meanScore
                    }
                  }
                `,
                variables: { search: item.title },
              }),
            });
            const aniData = await aniRes.json();
            const score = aniData?.data?.Media?.averageScore || aniData?.data?.Media?.meanScore;
            if (score) {
              return { ...item, score: (score / 10).toFixed(1) };
            }
          } catch (e) {
            // Silently fallback if fetch fails
          }
        }
        return item;
      })
    );

    setResults(enrichedItems);
  } catch (err) {
    console.error(err);
    setResults([]);
  } finally {
    setLoading(false);
  }
};

  const searchAnime = (e) => {
    e.preventDefault();
    executeSearch(query, filters);
  };

  const getImage = (anime) =>
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url ||
    anime.image_url ||
    anime.image ||
    "https://via.placeholder.com/200x300/222/aaa?text=NA";

  return (
    <div className="add-page">
      {/* ── HERO SEARCH (CENTERED) ── */}
      <div 
        className="search-hero" 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          textAlign: "center", 
          width: "100%", 
          margin: "0 auto",
          padding: "40px 20px" 
        }}
      >
        <h1 className="search-headline" style={{ textAlign: "center", marginBottom: "20px" }}>
          Discover Your Next Obsession
        </h1>

        <div className="search-form-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%", maxWidth: "700px" }}>
          <form onSubmit={searchAnime} className="search-form" style={{ width: "100%", display: "flex", justifyContent: "center", gap: "10px" }}>
            <div className="search-input-wrapper" style={{ flex: 1, display: "flex", alignItems: "center" }}>
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

            {/* Filter Toggle Button */}
            <button
              type="button"
              className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 18px",
                borderRadius: "30px",
                background: showFilters ? "#e50914" : "#222226",
                color: "#fff",
                border: "1px solid #333",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.2s ease"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
            </button>
          </form>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <div
              className="filter-panel"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#1a1a1e",
                padding: "12px 18px",
                borderRadius: "12px",
                border: "1px solid #333",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {/* Genre Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "bold" }}>Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange("genre", e.target.value)}
                  style={{ background: "#2a2a30", color: "#fff", border: "1px solid #444", borderRadius: "6px", padding: "6px 10px", outline: "none" }}
                >
                  <option value="">All Genres</option>
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Romance">Romance</option>
                </select>
              </div>



              {/* Duration Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "bold" }}>Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => handleFilterChange("duration", e.target.value)}
                  style={{ background: "#2a2a30", color: "#fff", border: "1px solid #444", borderRadius: "6px", padding: "6px 10px", outline: "none" }}
                >
                  <option value="">Any Length</option>
                  <option value="movie">Movie</option>
                  <option value="tv">TV Series</option>
                  <option value="short">Short (&lt; 45m)</option>
                </select>
              </div>

              {/* Sorting */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "bold" }}>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  style={{ background: "#2a2a30", color: "#fff", border: "1px solid #444", borderRadius: "6px", padding: "6px 10px", outline: "none" }}
                >
                  <option value="latest">Latest Released</option>
                  <option value="rating">Highest Rating</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
            </div>
          )}
        </div>
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
              <p>No results found</p>
              <span>Try different filters or search keywords</span>
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