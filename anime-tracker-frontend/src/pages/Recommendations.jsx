import React, { useEffect, useState } from "react";
import API from "../api/api";
import Row from "../components/Row";
import Loader from "../components/Loader";

function Recommendations() {
  const [recs, setRecs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/recommendations/")
      .then((res) => setRecs(res.data || {}))
      .catch((err) => console.error("❌ Error fetching recommendations:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="recommendations-container" style={{ padding: "10px" }}>
      <h1>Recommended For You</h1>

      {recs.trending?.length > 0 && (
        <Row title="🔥 Trending Anime" data={recs.trending} />
      )}

      {recs.because_you_like?.length > 0 && (
        <Row title="🎯 Because You Like" data={recs.because_you_like} />
      )}

      {recs.top?.length > 0 && (
        <Row title="⭐ Top Picks" data={recs.top} />
      )}

      {recs.time_based?.length > 0 && (
        <Row title="⏰ Watch Right Now" data={recs.time_based} />
      )}

      {recs.genre_action?.length > 0 && (
        <Row title="💥 Action Packed" data={recs.genre_action} />
      )}

      {recs.genre_comedy?.length > 0 && (
        <Row title="😂 Comedy Central" data={recs.genre_comedy} />
      )}

      {recs.genre_horror?.length > 0 && (
        <Row title="👻 Spooky & Horror" data={recs.genre_horror} />
      )}

      {recs.genre_drama?.length > 0 && (
        <Row title="🎭 Dramatic Stories" data={recs.genre_drama} />
      )}
    </div>
  );
}

export default Recommendations;