import { useAnimeDetail } from "../context/AnimeDetailContext";
import { useTrailer } from "../context/TrailerContext";
import "./Hero.css";

function Hero({ anime }) {
  const { openAnimeDetail } = useAnimeDetail();
  const { openTrailer } = useTrailer();

  if (!anime) return null;

  const heroImage =
    anime.poster_url ||
    anime.image ||
    anime.image_url ||
    anime.images?.jpg?.large_image_url ||
    anime.images?.jpg?.image_url ||
    anime.trailer?.images?.large_image_url ||
    anime.main_picture?.large ||
    "https://via.placeholder.com/1280x720/222/aaa?text=No+Image";

  return (
    <div className="hero">
      <div className="hero-backdrop">
        <img src={heroImage} alt={anime.title} className="hero-img" />
        <div className="hero-gradient" />
      </div>
      <div className="hero-content">
        <h1 className="hero-title">{anime.title}</h1>
        <p className="hero-synopsis">{anime.synopsis?.slice(0, 200)}...</p>
        <div className="hero-buttons">
          <button className="hero-btn play-btn" onClick={() => openTrailer(anime)}>
            ▶ Play
          </button>
          <button className="hero-btn info-btn" onClick={() => openAnimeDetail(anime)}>
            ℹ More Info
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hero;