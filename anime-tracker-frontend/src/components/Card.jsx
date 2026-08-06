import { useState } from "react";
import "./Card.css";

function Card({ anime }) {
  const [hovered, setHovered] = useState(false);
  let timer;

  const handleEnter = () => {
    timer = setTimeout(() => setHovered(true), 200); // 🔥 delay
  };

  const handleLeave = () => {
    clearTimeout(timer);
    setHovered(false);
  };

  

  return (
    <div
      className={`card ${hovered ? "active" : ""}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
<img
  src={anime.poster_url || anime.image || "https://via.placeholder.com/300x450"}
  alt={anime.title}
/>

      <div className="cardOverlay">
        <h4>{anime.title}</h4>
        <p>{anime.source}</p>

        <div className="cardButtons">
          <button className="play">▶</button>
          <button>＋</button>
          <button>👍</button>
        </div>
      </div>
    </div>
  );
}

export default Card;