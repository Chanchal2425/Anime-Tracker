import React, { useState, useEffect } from "react";
import API from "../api/api";
import "../App.css";

export default function CommunityFeed({ currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Notes state
  const [userNotes, setUserNotes] = useState([]);
  const [showNotesDropdown, setShowNotesDropdown] = useState(false);

  const activeUser = currentUser || JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchComments();
    fetchUserEpisodeNotes();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await API.get("/community/comments/");
      setComments(res.data || []);
    } catch (err) {
      console.error("❌ Failed to load community comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEpisodeNotes = async () => {
    try {
      const res = await API.get("/notes/"); 
      let notesList = [];
      if (Array.isArray(res.data)) {
        notesList = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        notesList = res.data.results;
      }
      setUserNotes(notesList);
    } catch (err) {
      console.error("❌ Failed to load user episode notes:", err);
    }
  };

  const handleToggleNotesDropdown = () => {
    if (!showNotesDropdown) {
      fetchUserEpisodeNotes();
    }
    setShowNotesDropdown(!showNotesDropdown);
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    API.post("/community/comments/", { content: newComment })
      .then((res) => {
        const createdComment = { ...res.data, is_owner: true };
        setComments([createdComment, ...comments]);
        setNewComment("");
      })
      .catch((err) => console.error("❌ Failed to post comment:", err));
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    API.delete(`/community/comments/${commentId}/`)
      .then(() => {
        setComments((prev) => prev.filter((item) => item.id !== commentId));
      })
      .catch((err) => console.error("❌ Failed to delete comment:", err));
  };

  const handleSelectNote = (noteItem) => {
    const noteIdentifier = noteItem.share_id || noteItem.public_id || noteItem.id;
    const publicNoteUrl = `${window.location.origin}/public-notes/${noteIdentifier}`;
    const formattedText = `Check out my episode note: ${publicNoteUrl}`;

    setNewComment((prev) => (prev ? `${prev} ${formattedText}` : formattedText));
    setShowNotesDropdown(false);
  };

  return (
    <div className="community-section">
      <h2>🌐 Anime Community Chat</h2>

      {/* Comment Input Form */}
      <form className="community-form" onSubmit={handlePostComment}>
        <input
          type="text"
          className="chat-input"
          placeholder="Share your thoughts with the community..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />

        <div className="button-group">
          <div className="dropdown-wrapper">
            <button
              type="button"
              className="add-note-btn"
              onClick={handleToggleNotesDropdown}
            >
              📝 Add Note
            </button>

            {/* Notes Dropdown */}
            {showNotesDropdown && (
              <div className="notes-dropdown">
                <div className="dropdown-header">
                  Select an Episode Note to attach:
                </div>

                {userNotes.length === 0 ? (
                  <p className="no-notes">No episode notes found.</p>
                ) : (
                  userNotes.map((item) => {
                    const animeName = item.anime_title || item.anime?.title || "Anime Note";
                    const noteContent = item.note || item.content || item.thought || "View note";

                    return (
                      <div
                        key={item.id}
                        className="note-item"
                        onClick={() => handleSelectNote(item)}
                      >
                        <strong className="note-title">
                          {animeName} {item.episode_number ? `— Ep ${item.episode_number}` : ""}
                        </strong>
                        <p className="note-preview">"{noteContent}"</p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <button type="submit" className="post-btn">
            Post
          </button>
        </div>
      </form>

      {/* Feed List */}
      {loading ? (
        <p className="loading-text">Loading chat...</p>
      ) : (
        <div className="comments-list">
          {comments.map((item) => {
            const isOwner = item.is_owner || (activeUser?.username && activeUser.username.toLowerCase() === item.username?.toLowerCase());
            return (
              <div key={item.id} className="comment-card">
                <div className="comment-body">
                  <strong className="author">@{item.username}</strong>
                  <p className="comment-text">{item.content}</p>
                  <small className="timestamp">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </small>
                </div>
                {isOwner && (
                  <button onClick={() => handleDeleteComment(item.id)} className="delete-btn">
                    🗑️ Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}