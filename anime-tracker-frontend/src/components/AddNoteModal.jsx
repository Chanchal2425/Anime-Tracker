import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function AddNoteModal({ onClose, onNoteAdded }) {
  const [watchlist, setWatchlist] = useState([]);
  const [selectedAnimeId, setSelectedAnimeId] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Load user's watchlist to select from
  useEffect(() => {
    API.get("/watchlist/")
      .then((res) => {
        setWatchlist(res.data || []);
        if (res.data.length > 0) {
          setSelectedAnimeId(res.data[0].id); // Default to first anime
        }
      })
      .catch((err) => console.error("❌ Error loading watchlist:", err));
  }, []);

const handleSubmit = (e) => {
  e.preventDefault();
  if (!selectedAnimeId || !note.trim()) return;

  setLoading(true);

  // 💡 FIXED: Match the Django router path 'notes'
  API.post("/notes/", {
    anime: selectedAnimeId,
    episode_number: episodeNumber,
    note: note.trim()
  })
    .then((res) => {
      setLoading(false);
      if (onNoteAdded) onNoteAdded(res.data);
      onClose();
    })
    .catch((err) => {
      setLoading(false);
      console.error("❌ Failed to save episode note:", err);
    });
};
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ background: "#222", padding: "25px", borderRadius: "10px", width: "90%", maxWidth: "450px", color: "#fff" }}>
        <h3>📝 Add Episode Note</h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
          <label>
            Select Anime:
            <select
              value={selectedAnimeId}
              onChange={(e) => setSelectedAnimeId(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "5px", background: "#333", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
            >
              {watchlist.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Episode Number:
            <input
              type="number"
              min="1"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "5px", background: "#333", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
            />
          </label>

          <label>
            Your Thought/Note:
            <textarea
              rows="4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you think of this episode? Any favorite moments?"
              style={{ width: "100%", padding: "8px", marginTop: "5px", background: "#333", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "#555", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: "8px 16px", background: "#e50914", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              {loading ? "Posting..." : "Share Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}