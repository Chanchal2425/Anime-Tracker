import { useEffect, useState } from "react";
import API from "../api/api";
import { useAnimeDetail } from "../context/AnimeDetailContext";
import "./AnimeDetailModal.css";

function AnimeDetailModal({ anime, onClose }) {
  const { openAnimeDetail } = useAnimeDetail();
  const [details, setDetails] = useState(null);
  const [staff, setStaff] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingChars, setLoadingChars] = useState(true);

  // Local copy of the anime entry for instant UI updates
  const [localAnime, setLocalAnime] = useState({ ...anime });
  useEffect(() => {
    setLocalAnime({ ...anime });
  }, [anime]);

  const [note, setNote] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [saving, setSaving] = useState(false);
  const [episodeNotes, setEpisodeNotes] = useState([]);

  // Fetch existing notes
  useEffect(() => {
    if (!localAnime?.id) return;
    API.get(`/notes/?anime=${localAnime.id}`)
      .then(res => setEpisodeNotes(res.data))
      .catch(err => console.error("Failed to load notes:", err));
  }, [localAnime?.id]);

  const nextEpisode = (localAnime.current_episode || 0) + 1;

  // Fetch Jikan details
  useEffect(() => {
    const malId = anime?.mal_id;
    if (!malId) return;

    fetch(`https://api.jikan.moe/v4/anime/${malId}`)
      .then(res => res.json())
      .then(data => {
        setDetails(data.data);
        setLoadingInfo(false);
      })
      .catch(() => setLoadingInfo(false));

    fetch(`https://api.jikan.moe/v4/anime/${malId}/staff`)
      .then(res => res.json())
      .then(data => {
        setStaff(data.data || []);
        setLoadingStaff(false);
      })
      .catch(() => setLoadingStaff(false));

    fetch(`https://api.jikan.moe/v4/anime/${malId}/characters`)
      .then(res => res.json())
      .then(data => {
        setCharacters(data.data || []);
        setLoadingChars(false);
      })
      .catch(() => setLoadingChars(false));
  }, [anime?.mal_id]);

  // Keyboard & overlay handlers
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("detail-overlay")) onClose();
  };

  const isValidTimestamp = (ts) => /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(ts);

  const markEpisodeWatched = async (animeId, episodeNumber) => {
    if (saving) return;
    if (episodeNumber > (localAnime.total_episodes || 0)) {
      alert("You've already completed all episodes!");
      return;
    }
    if (saving) return;
    if (timestamp.trim() && !isValidTimestamp(timestamp.trim())) {
      alert("Timestamp format should be like 12:34 or 1:02:45");
      return;
    }
    setSaving(true);
    try {
      // 1. Create watch log
      await API.post("/watchlogs/", {
        anime: animeId,
        episode: episodeNumber,
        minutes_watched: 24,
        date: new Date().toISOString().slice(0, 10),
      });

      // 2. Save note (optional)
      if (note.trim() || timestamp.trim()) {
        await API.post("/notes/", {
          anime: animeId,
          episode_number: episodeNumber,
          note: note.trim(),
          timestamp: timestamp.trim(),
        });
        setNote("");
        setTimestamp("");
      }

      // 3. Update anime progress
      const payload = { current_episode: episodeNumber };
      if (localAnime.total_episodes && episodeNumber >= localAnime.total_episodes) {
        payload.status = "completed";
      }
      await API.patch(`/anime/${animeId}/`, payload);

      // 4. Update local state so UI reacts instantly
      setLocalAnime(prev => ({
        ...prev,
        current_episode: episodeNumber,
        status: payload.status || prev.status
      }));

      // 5. Refresh notes
      const refreshed = await API.get(`/notes/?anime=${animeId}`);
      setEpisodeNotes(refreshed.data);

    } catch (error) {
      console.error("Failed to save progress:", error.response?.data || error.message);
      alert("Error saving progress. See console for details.");
    } finally {
      setSaving(false);
    }
  };


  const handleShareNote = (noteItem) => {
    const title = localAnime?.title || "Unknown Anime";
    const ep = noteItem.episode_number;
    const ts = noteItem.timestamp ? ` (${noteItem.timestamp})` : "";
    const text = noteItem.note;
    const shareMessage = `${title} - Ep ${ep}${ts}\n"${text}"\n— Tracked with MyAnimeTracker`;

    navigator.clipboard.writeText(shareMessage)
      .then(() => alert("Note copied to clipboard!"))
      .catch(() => alert("Failed to copy."));
  };

  if (!localAnime) return null;

  const image =
    localAnime.poster_url ||
    localAnime.image ||
    localAnime.image_url ||
    details?.images?.jpg?.large_image_url ||
    details?.images?.jpg?.image_url ||
    details?.trailer?.images?.large_image_url ||
    details?.main_picture?.large ||
    "https://via.placeholder.com/1280x720/222/aaa?text=No+Image";

  const directors = staff.filter(s =>
    s.positions?.some(p => p.toLowerCase().includes("director"))
  );
  const mainCharacters = characters.filter(c => c.role?.toLowerCase() === "main");

  return (
    <div className="detail-overlay" onClick={handleOverlayClick}>
      <div className="detail-modal">
        <button className="detail-close" onClick={onClose}>✕</button>

        {loadingInfo ? (
          <div className="detail-loading">Loading info…</div>
        ) : details ? (
          <div className="detail-content">
            <div className="detail-header">
              <img src={image} alt={details.title} className="detail-poster" />
              <div className="detail-main-info">
                <h2>{details.title}</h2>
                <div className="detail-meta">
                  <span>⭐ {details.score || "N/A"}</span>
                  <span>📺 {details.episodes || "?"} eps</span>
                  <span>📅 {details.aired?.string || "?"}</span>
                </div>
                <p className="detail-synopsis">{details.synopsis}</p>
              </div>

              {/* Episode button – only when watching */}
              {localAnime.status === "watching" && nextEpisode <= (localAnime.total_episodes || Infinity) && (
                <div className="episode-action">
                  <button
                    onClick={() => markEpisodeWatched(localAnime.id, nextEpisode)}
                    disabled={saving}
                    className="mark-episode-btn"
                  >
                    {saving ? "Saving…" : `Mark Episode ${nextEpisode} Watched`}
                  </button>
                  <input
                    type="text"
                    placeholder="Add a note (best moments…)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={saving}
                    className="episode-note-input"
                  />
                  <input
                    type="text"
                    placeholder="Timestamp (e.g. 12:34)"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    disabled={saving}
                    className="timestamp-input"
                  />
                </div>
              )}
            </div>

            {/* Notes section */}
            {episodeNotes.length > 0 && (
              <div className="episode-notes-section">
                <h3>📝 Your Episode Notes</h3>
                {episodeNotes
                  .sort((a, b) => a.episode_number - b.episode_number)
                  .map(noteItem => (
                    <div key={noteItem.id} className="note-card">
                      <div className="note-header">
                        <span className="note-episode">Ep {noteItem.episode_number}</span>
                        {noteItem.timestamp && (
                          <span className="note-timestamp">⏱ {noteItem.timestamp}</span>
                        )}
                      </div>
                      <p className="note-text">{noteItem.note}</p>
                      <div className="note-footer">
                        <span className="note-date">
                          {new Date(noteItem.created_at).toLocaleDateString()}
                        </span>
                        <button
                          className="share-note-btn"
                          onClick={() => handleShareNote(noteItem)}
                        >
                          🔗 Share
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Directors & Characters */}
            <div className="detail-extra">
              <div className="detail-section">
                <h3>🎬 Directors</h3>
                {loadingStaff ? (
                  <p className="loading-text">Loading…</p>
                ) : directors.length > 0 ? (
                  <ul className="director-list">
                    {directors.slice(0, 3).map(s => (
                      <li key={s.person.mal_id}>
                        {s.person.name}
                        <span className="director-role">{s.positions.join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No director info available</p>
                )}
              </div>

              <div className="detail-section">
                <h3>👥 Main Characters</h3>
                {loadingChars ? (
                  <p className="loading-text">Loading…</p>
                ) : mainCharacters.length > 0 ? (
                  <div className="character-grid">
                    {mainCharacters.slice(0, 6).map(c => {
                      const charImage = c.character.images?.jpg?.image_url || null;
                      const jpVA = c.voice_actors?.find(va => va.language === "Japanese");
                      const vaImage = jpVA?.person?.images?.jpg?.image_url || null;
                      return (
                        <div className="character-card" key={c.character.mal_id}>
                          {charImage && (
                            <div className="char-avatar-wrapper">
                              <img src={charImage} alt={c.character.name}
                                className="char-avatar" loading="lazy"
                                onError={(e) => { e.target.style.display = "none"; }} />
                            </div>
                          )}
                          <div className="character-name">{c.character.name}</div>
                          {jpVA && (
                            <div className="voice-actor">
                              {vaImage ? (
                                <img src={vaImage} alt={jpVA.person.name}
                                  className="va-avatar" loading="lazy"
                                  onError={(e) => { e.target.src = "https://via.placeholder.com/28x28/444/fff?text=VA"; }} />
                              ) : (
                                <div className="va-avatar-placeholder">
                                  {jpVA.person.name.charAt(0)}
                                </div>
                              )}
                              <span className="va-name">{jpVA.person.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-data">No main characters found</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="detail-error">Failed to load anime details.</div>
        )}
      </div>
    </div>
  );
}

export default AnimeDetailModal;