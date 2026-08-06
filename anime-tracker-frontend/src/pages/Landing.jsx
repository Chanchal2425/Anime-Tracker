import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bannerImg from "../assets/landing-banner.png"; // Adjust path if using public/
import "./Landing.css";

function Landing() {
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = `
      query {
        Page(page: 1, perPage: 4) {
          media(sort: TRENDING_DESC, type: ANIME) {
            id
            title { english romaji }
            coverImage { extraLarge }
            averageScore
            episodes
          }
        }
      }
    `;

    fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((resData) => {
        const items = resData?.data?.Page?.media || [];
        const formatted = items.map((item) => ({
          title: item.title.english || item.title.romaji,
          score: item.averageScore ? (item.averageScore / 10).toFixed(1) : "8.5",
          ep: item.episodes ? `Ep ${item.episodes}` : "Ongoing",
          image: item.coverImage?.extraLarge,
        }));
        setTrendingAnime(formatted);
      })
      .catch((err) => console.error("Failed to load trending anime:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing-wrapper">
      {/* 1. ENHANCED FULLSCREEN BANNER WITH MICRO-INTERACTIONS */}
      <section className="fullscreen-banner-container">
        <div className="banner-image-wrapper">
          <img src={bannerImg} alt="Anime Tracker Workspace" className="clean-banner-image" />
          
          {/* Cyberpunk Scanline Effect Layer */}
          <div className="banner-scanlines"></div>
          
          {/* Reactive Ambient Red Glow */}
          <div className="banner-ambient-glow"></div>
        </div>

        {/* Scroll Indicator at Bottom of Screen */}
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="mouse-icon">
            <div className="mouse-wheel"></div>
          </div>
        </div>

        {/* Bottom Fade transition to next section */}
        <div className="banner-bottom-fade"></div>
      </section>

      {/* 2. MAIN CONTENT BELOW BANNER */}
      <div className="landing-container">
        <div className="bg-glow glow-top-left"></div>
        <div className="bg-glow glow-bottom-right"></div>

        {/* HERO TEXT & ACTION BUTTONS */}
        <section className="landing-hero">
          <div className="hero-badge">
            <span className="badge-pulsing-dot"></span> Next-Gen Anime Workspace
          </div>
          <h1 className="hero-title">
            Track, Pin & Share <br />
            <span className="gradient-text">Your Ultimate Watch Journey</span>
          </h1>
          <p className="hero-subtitle">
            Log your progress down to the second, preserve peak scene timestamps, share moments with friends, and discover AI recommendations crafted strictly for your taste.
          </p>
          <div className="hero-cta-group">
            {/* UPDATED ROUTE TO LOGIN */}
            <Link to="/login" className="cta-btn primary-btn glow-btn">
              Get Started Free
            </Link>
            <Link to="/login" className="cta-btn secondary-btn">
              Sign In
            </Link>
          </div>
        </section>

        {/* HOW IT WORKS STORY SECTION */}
        <section className="story-timeline">
          <h2 className="story-heading">How It Works</h2>
          <div className="story-steps">
            <div className="story-step">
              <span className="step-num">01</span>
              <h3>Log Every Episode</h3>
              <p>Keep active watch counts synced, track total time spent, and organize your completion list effortlessly.</p>
            </div>

            <div className="story-step highlight-step">
              <span className="step-num">02</span>
              <h3>Share Peak Moments with Exact Timestamps</h3>
              <p>Pin iconic plot twists or legendary fight scenes down to the exact second—then generate instant share links for friends.</p>
            </div>

            <div className="story-step highlight-step">
              <span className="step-num">03</span>
              <h3>Hyper-Personalized AI Recommendations</h3>
              <p>Skip generic top lists. Our AI analyzes your actual ratings, completed titles, and genre preferences to recommend shows tailored strictly for you.</p>
            </div>
          </div>
        </section>

        {/* DYNAMIC TRENDING SHOWCASE */}
        <section className="trending-showcase">
          <div className="showcase-header">
            <h2>Trending Right Now</h2>
            <p>Popular series updating live in real-time</p>
          </div>

          {loading ? (
            <div className="trending-loading">Loading trending anime...</div>
          ) : (
            <div className="trending-grid">
              {trendingAnime.map((anime, index) => (
                <div className="trending-card" key={index}>
                  <div className="card-image-wrapper">
                    <img src={anime.image} alt={anime.title} loading="lazy" />
                    <span className="score-badge">★ {anime.score}</span>
                    <span className="ep-badge">{anime.ep}</span>
                  </div>
                  <div className="card-info">
                    <h4>{anime.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DASHBOARD INTERFACE PREVIEW */}
        <section className="mockup-section">
          <div className="mockup-window">
            <div className="window-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
              <span className="window-title">Anime Tracker Live Interface</span>
            </div>
            <div className="mockup-content">
              <div className="mockup-stat-bar">
                <div className="m-stat"><span>Episodes Tracked</span> <strong>142 Ep</strong></div>
                <div className="m-stat"><span>Completed Series</span> <strong>28 Titles</strong></div>
                <div className="m-stat"><span>Mean Score</span> <strong>8.8 / 10</strong></div>
              </div>
              <div className="mockup-note-preview">
                <div className="note-header-line">
                  <span className="note-time">@ 14:22 in Ep 8</span>
                  <span className="share-pill">🔗 Shared Note Link</span>
                </div>
                <p>"The plot twist and animation sequence here set a new benchmark!"</p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="landing-bottom-cta">
          <h2>Ready To Upgrade Your Watch Experience?</h2>
          <p>Set up your account in seconds and start cataloging your peak anime moments.</p>
          {/* UPDATED ROUTE TO LOGIN */}
          <Link to="/login" className="cta-btn primary-btn glow-btn">
            Create Free Account
          </Link>
        </section>
      </div>

      {/* 3. FOOTER SECTION */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-left">
            <h3 className="footer-logo">Anime Tracker</h3>
            <p>Your ultimate workspace for tracking, pinning, and sharing anime moments.</p>
          </div>

          <div className="footer-center">
            <p>© {new Date().getFullYear()} Anime Tracker. All rights reserved.</p>
          </div>

          <div className="footer-right">
            <span>Connect with me:</span>
            <a 
              href="https://www.linkedin.com/in/chanchal-mankar-1b1305344" 
              target="_blank" 
              rel="noopener noreferrer"
              className="linkedin-link"
            >
              <svg className="linkedin-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;