import { useAnimeDetail } from "../context/AnimeDetailContext";
import { useTrailer } from "../context/TrailerContext";
import { useWatchlist } from "../context/WatchlistContext";
import "./Row.css";

function Row({ title, data }) {
  const { openAnimeDetail } = useAnimeDetail();
  const { openTrailer } = useTrailer();
  const { addToWatchlist, isInWatchlist } = useWatchlist();

  if (!data || data.length === 0) return null;

  return (
    <div className="row">
      <h2 className="row-title">{title}</h2>
      <div className="row-posters">
        {data.map((item, index) => {
          // Extract real anime object (handles nested recommendation wrapper)
          const anime = item.anime || item;

          const image =
            anime.poster_url ||
            anime.image ||
            anime.images?.jpg?.large_image_url ||
            anime.images?.jpg?.image_url ||
            "https://via.placeholder.com/300x450?text=No+Image";

          const alreadyAdded = isInWatchlist(anime);
          const animeId = anime.mal_id || anime.id;

          // Unique key combining row title, ID, and array index
          const cardKey = `row-${title ? title.replace(/\s+/g, '-') : 'cat'}-${animeId || 'no-id'}-${index}`;

          return (
            <div className="card" key={cardKey}>
              <img
                src={image}
                alt={anime.title || "Anime Poster"}
                className="card-img"
                loading="lazy"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x450/222/aaa?text=No+Image";
                }}
              />
              <div className="card-overlay">
                <h4 className="card-title">{anime.title || "Untitled"}</h4>
                <div className="card-buttons">
                  <button
                    className="card-btn play-btn"
                    onClick={() => openTrailer(anime)}
                  >
                    ▶ Play
                  </button>
                  <button
                    className={`card-btn add-btn ${alreadyAdded ? "added" : ""}`}
                    onClick={() => addToWatchlist(anime)}
                  >
                    {alreadyAdded ? "✓ Added" : "+ Add"}
                  </button>
                  <button
                    className="card-btn info-btn"
                    onClick={() => openAnimeDetail(anime)}
                  >
                    ℹ More Info
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Row;