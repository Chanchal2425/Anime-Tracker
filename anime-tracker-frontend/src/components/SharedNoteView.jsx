import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./SharedNoteView.css";

function SharedNoteView() {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/public-notes/${noteId}/`)
      .then((res) => setNote(res.data))
      .catch((err) => {
        console.error("Failed to load note:", err);
        setError("Note not found or link has expired.");
      })
      .finally(() => setLoading(false));
  }, [noteId]);

  if (loading) return <div className="share-page-status">Loading shared note…</div>;
  if (error) return <div className="share-page-status error">{error}</div>;

  return (
    <div className="shared-note-wrapper">
      <div className="shared-note-card">
        {note.poster_url && (
          <div className="shared-note-poster">
            <img src={note.poster_url} alt={note.anime_title} />
          </div>
        )}
        
        <div className="shared-note-body">
          <div className="shared-note-header">
            <h2>{note.anime_title}</h2>
            <div className="shared-badges">
              <span className="badge ep-badge">Episode {note.episode_number}</span>
              {note.timestamp && (
                <span className="badge time-badge">⏱ {note.timestamp}</span>
              )}
            </div>
          </div>

          <div className="shared-note-content">
            <p>"{note.note}"</p>
          </div>

          <div className="shared-note-footer">
            <span className="date-text">
              Shared on {new Date(note.created_at).toLocaleDateString()}
            </span>
            <Link to="/" className="explore-btn">
              Explore App 🚀
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedNoteView;