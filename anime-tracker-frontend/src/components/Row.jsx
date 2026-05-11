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
          // 🔥 EXTRACT REAL ANIME (handles nested recommendation objects)
          const anime = item.anime || item;

          const image =
            anime.poster_url ||
            anime.image ||
            anime.images?.jpg?.large_image_url ||
            anime.images?.jpg?.image_url ||
            "https://via.placeholder.com/300x450?text=No+Image";

          const alreadyAdded = isInWatchlist(anime);
          const animeId = anime.mal_id || anime.id;

          return (
            <div className="card" key={animeId || index}>
              <img
                src={image}
                alt={anime.title}
                className="card-img"
                loading="lazy"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x450/222/aaa?text=No+Image";
                }}
              />
              <div className="card-overlay">
                <h4 className="card-title">{anime.title}</h4>
                <div className="card-buttons">
                  <button
                    className="card-btn play-btn"
                    onClick={() => openTrailer(anime)}
                  >
                    ▶ Play
                  </button>
                  <button
                    className={`card-btn add-btn ${alreadyAdded ? "added" : ""}`}
                    onClick={() => {
                      if (!animeId) {
                        alert("Cannot add – missing ID.");
                        return;
                      }
                      addToWatchlist(anime);
                    }}
                  >
                    {alreadyAdded ? "✓ Added" : "+ Add"}
                  </button>
                  <button
                    className="card-btn info-btn"
                    onClick={() => {
                      if (animeId) {
                        openAnimeDetail(anime);
                      } else {
                        alert("No details available.");
                      }
                    }}
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