import { useEffect, useState } from "react";
import API from "../api/api";
import Row from "../components/Row";
import Hero from "../components/Hero";
import StatsGrid from "../components/StatsGrid";
import Loader from "../components/Loader";
import "../App.css";

function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [stats, setStats] = useState(null);
  const [heroAnime, setHeroAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/anime/"),
      API.get("/stats/")
    ])
      .then(([animeRes, statsRes]) => {
        setAnimeList(animeRes.data);
        setStats(statsRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("https://api.jikan.moe/v4/top/anime?filter=airing&limit=1")
      .then(res => res.json())
      .then(data => {
        if (data.data?.length > 0) {
          setHeroAnime(data.data[0]);
        } else {
          setHeroAnime(animeList[0] || null);
        }
      })
      .catch(() => {
        setHeroAnime(animeList[0] || null);
      });
  }, []);

  const watching = animeList.filter(a => a.status === "watching");

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="home">
      {heroAnime && <Hero anime={heroAnime} />}
      {stats && <StatsGrid stats={stats} />}
      <Row title="Continue Watching" data={watching} />
    </div>
  );
}

export default Home;