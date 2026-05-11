import { useEffect, useState, useRef } from "react";  // 👈 add useRef
import API from "../api/api";
import Row from "../components/Row";
import Loader from "../components/Loader";


function Recommendations() {
  const [recs, setRecs] = useState({
    genre_based: [],
    similar: [],
    time_based: [],
    top: []
  });
  const [loading, setLoading] = useState(true);        // 👈 add loading
  const fetchedRef = useRef(false);

  useEffect(() => {
    API.get("/recommendations/")
      .then(res => {
        const data = res.data || {};
        setRecs({
          genre_based: data.genre_based || [],
          similar: data.similar || [],
          time_based: data.time_based || [],
          top: data.top || []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Recommendation error:", err.response?.data || err.message);
        setLoading(false);
      });
  }, []);

  const hasData =
    recs.genre_based.length > 0 ||
    recs.similar.length > 0 ||
    recs.time_based.length > 0 ||
    recs.top.length > 0;

  return (
    <div className="page">
      <h1>Recommendations</h1>

      {loading && <Loader />}

      {!loading && hasData && (
        <>
          {recs.genre_based.length > 0 && (
            <Row title="Because You Like" data={recs.genre_based} />
          )}
          {recs.similar.length > 0 && (
            <Row title="Similar Anime" data={recs.similar} />
          )}
          {recs.time_based.length > 0 && (
            <Row title="Watch Now" data={recs.time_based} />
          )}
          {recs.top.length > 0 && (
            <Row title="Top Picks" data={recs.top} />
          )}
        </>
      )}

      {!loading && !hasData && (
        <p style={{ color: "#aaa", padding: "20px" }}>
          No recommendations available
        </p>
      )}
    </div>
  );
}

export default Recommendations;