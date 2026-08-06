import React, { useState, useEffect } from "react";
import API from "../api/api";

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
    // 💡 FIXED: Match the Django router path 'notes'
    const res = await API.get("/notes/"); 
    
    console.log("📥 Raw Notes API Response:", res.data);

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
      fetchUserEpisodeNotes(); // Refetch notes whenever opened
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

  // Format link using the note's UUID (like in your screenshot)
const handleSelectNote = (noteItem) => {
  // Use share_id or public_id if available, falling back to id
  const noteIdentifier = noteItem.share_id || noteItem.public_id || noteItem.id;
  
  // Construct the URL matching your Django url path: path('public-notes/<uuid:share_id>/', ...)
  const publicNoteUrl = `${window.location.origin}/public-notes/${noteIdentifier}`;
  
  // Optional pre-filled text for the comment input
  const formattedText = `Check out my episode note: ${publicNoteUrl}`;

  // Insert into comment input box
  setNewComment((prev) => (prev ? `${prev} ${formattedText}` : formattedText));
  
  // Close the dropdown
  setShowNotesDropdown(false);
};

  return (
    <div className="community-section" style={{ margin: "40px 0", padding: "20px", background: "#181818", borderRadius: "10px" }}>
      <h2>🌐 Anime Community Chat</h2>

      {/* Comment Input Form */}
      <form onSubmit={handlePostComment} style={{ display: "flex", gap: "10px", marginBottom: "20px", position: "relative" }}>
        <input
          type="text"
          placeholder="Share your thoughts with the community..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #444", background: "#222", color: "#fff" }}
        />

        {/* Add Note Button */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={handleToggleNotesDropdown}
            style={{
              padding: "10px 14px",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              whiteSpace: "nowrap"
            }}
          >
            📝 Add Note
          </button>

          {/* Notes Dropdown */}
          {showNotesDropdown && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "110%",
                width: "320px",
                maxHeight: "220px",
                overflowY: "auto",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                zIndex: 100,
                padding: "8px"
              }}
            >
              <div style={{ padding: "4px 8px", fontSize: "0.8rem", color: "#aaa", borderBottom: "1px solid #3d3d3d", marginBottom: "6px" }}>
                Select an Episode Note to attach (Optional):
              </div>

              {userNotes.length === 0 ? (
                <p style={{ padding: "8px", fontSize: "0.85rem", color: "#888", margin: 0 }}>
                  No episode notes found.
                </p>
              ) : (
                userNotes.map((item) => {
                  const animeName = item.anime_title || item.anime?.title || "Anime Note";
                  const noteContent = item.note || item.content || item.thought || "View note";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectNote(item)}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        borderBottom: "1px solid #333"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#383838")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <strong style={{ fontSize: "0.85rem", color: "#e50914", display: "block" }}>
                        {animeName} {item.episode_number ? `— Ep ${item.episode_number}` : ""}
                      </strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        "{noteContent}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <button type="submit" style={{ padding: "10px 20px", background: "#e50914", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          Post
        </button>
      </form>

      {/* Feed List */}
      {loading ? (
        <p style={{ color: "#aaa" }}>Loading chat...</p>
      ) : (
        <div className="comments-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {comments.map((item) => {
            const isOwner = item.is_owner || (activeUser?.username && activeUser.username.toLowerCase() === item.username?.toLowerCase());
            return (
              <div key={item.id} style={{ background: "#222", padding: "12px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: "#e50914" }}>@{item.username}</strong>
                  <p style={{ margin: "5px 0 0 0", color: "#ddd" }}>{item.content}</p>
                  <small style={{ color: "#777" }}>{new Date(item.created_at).toLocaleTimeString()}</small>
                </div>
                {isOwner && (
                  <button onClick={() => handleDeleteComment(item.id)} style={{ background: "#ff4d4d22", border: "1px solid #ff4d4d", color: "#ff4d4d", cursor: "pointer", padding: "6px 12px", borderRadius: "4px" }}>
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