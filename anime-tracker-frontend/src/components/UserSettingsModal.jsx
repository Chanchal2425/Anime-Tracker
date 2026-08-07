import React, { useState, useEffect } from "react";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./UserSettingsModal.css";

export default function UserSettingsModal({ isOpen, onClose }) {
  const { user, logout, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");

  // Profile Update States
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");

  // Support Tickets State
  const [myTickets, setMyTickets] = useState([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const userKey = user?.id || user?.username;

  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchMyTickets();
    }
  }, [isOpen, activeTab]);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await API.get("/support/tickets/");
      setMyTickets(res.data || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg("❌ Passwords do not match!");
      return;
    }

    setSavingProfile(true);

    try {
      const payload = {};
      if (newUsername !== user?.username) payload.username = newUsername;
      if (newPassword) payload.password = newPassword;

      if (Object.keys(payload).length === 0) {
        setProfileMsg("ℹ️ No changes were made.");
        setSavingProfile(false);
        return;
      }

      await API.patch("/me/update/", payload);

      if (setUser) {
        setUser({ ...user, username: newUsername });
      }

      setProfileMsg("✅ Profile updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setProfileMsg("❌ Could not update profile settings.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = (e) => {
    e.preventDefault();
    if (!selectedFile || !userKey) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      const avatarStorageKey = `user_avatar_${userKey}`;
      localStorage.setItem(avatarStorageKey, base64Image);

      if (setUser) {
        setUser((prevUser) => ({
          ...prevUser,
          avatar: base64Image,
        }));
      }

      setAvatarMessage("✅ Profile picture updated successfully!");
      setUploading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setSubmittingTicket(true);
    setTicketStatus("");

    try {
      const res = await API.post("/support/tickets/", {
        subject: ticketSubject,
        message: ticketMessage,
      });

      setTicketStatus("✅ Ticket submitted successfully!");
      setTicketSubject("");
      setTicketMessage("");

      if (res.data) {
        setMyTickets((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      setTicketStatus("❌ Could not submit ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const storedAvatar = userKey ? localStorage.getItem(`user_avatar_${userKey}`) : null;
  const currentAvatar = previewUrl || user?.avatar || storedAvatar;

  return (
    <div className="settings-modal-overlay">
      <header className="settings-header">
        <div className="settings-header-title">
          <span style={{ fontSize: "1.5rem" }}>⚙️</span>
          <h2>Account Settings</h2>
        </div>
        <button className="settings-close-btn" onClick={onClose}>
          <span>Close</span> ✕
        </button>
      </header>

      <div className="settings-body">
        <aside className="settings-sidebar">
          <div className="settings-tab-list">
            <button
              onClick={() => setActiveTab("profile")}
              className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            >
              👤 Profile & Security
            </button>

            <button
              onClick={() => setActiveTab("support")}
              className={`settings-tab-btn ${activeTab === "support" ? "active" : ""}`}
            >
              🎫 Support Ticket
            </button>

            <button
              onClick={() => setActiveTab("privacy")}
              className={`settings-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
            >
              📜 Privacy Policy
            </button>
          </div>

          <button
            className="settings-signout-btn"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            🚪 Sign Out
          </button>
        </aside>

        <main className="settings-main">
          <div className="settings-content-wrapper">
            {/* PROFILE & SECURITY TAB */}
            {activeTab === "profile" && (
              <div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Profile & Credentials</h3>
                <p style={{ color: "#aaa", marginBottom: "24px" }}>Update your account details, password, and avatar.</p>

                <form
                  onSubmit={handleUpdateProfile}
                  style={{
                    background: "#1e1e1e",
                    border: "1px solid #2d2d2d",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Account Credentials</h4>

                  <div>
                    <label style={{ display: "block", color: "#ccc", fontSize: "0.85rem", marginBottom: "6px" }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#121212",
                        border: "1px solid #333",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "0.95rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", color: "#ccc", fontSize: "0.85rem", marginBottom: "6px" }}>
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#121212",
                        border: "1px solid #333",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "0.95rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {newPassword && (
                    <div>
                      <label style={{ display: "block", color: "#ccc", fontSize: "0.85rem", marginBottom: "6px" }}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "#121212",
                          border: "1px solid #333",
                          borderRadius: "6px",
                          color: "#fff",
                          fontSize: "0.95rem",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingProfile}
                    style={{
                      padding: "10px 20px",
                      background: "#e50914",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      width: "fit-content",
                    }}
                  >
                    {savingProfile ? "Saving..." : "Update Credentials"}
                  </button>

                  {profileMsg && (
                    <p style={{ margin: 0, fontSize: "0.9rem", color: profileMsg.includes("❌") ? "#ff4d4d" : "#4caf50" }}>
                      {profileMsg}
                    </p>
                  )}
                </form>

                <div
                  style={{
                    background: "#1e1e1e",
                    border: "1px solid #2d2d2d",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Avatar Image</h4>
                  <div className="avatar-section">
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "#333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        overflow: "hidden",
                        border: "2px solid #e50914",
                        flexShrink: 0,
                      }}
                    >
                      {currentAvatar ? (
                        <img src={currentAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        user?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ overflow: "hidden", width: "100%" }}>
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ color: "#ccc", maxWidth: "100%" }} />
                    </div>
                  </div>

                  <button
                    onClick={handleUploadAvatar}
                    disabled={!selectedFile || uploading}
                    style={{
                      padding: "10px 20px",
                      background: selectedFile ? "#e50914" : "#333",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: selectedFile ? "pointer" : "default",
                      fontWeight: "bold",
                    }}
                  >
                    {uploading ? "Uploading..." : "Save New Picture"}
                  </button>

                  {avatarMessage && (
                    <p style={{ marginTop: "12px", fontSize: "0.9rem", color: avatarMessage.includes("❌") ? "#ff4d4d" : "#4caf50" }}>
                      {avatarMessage}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SUPPORT TAB */}
            {activeTab === "support" && (
              <div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Support & Tickets</h3>
                <p style={{ color: "#aaa", marginBottom: "24px" }}>Raise an issue or check the resolution status of your tickets.</p>

                <form onSubmit={handleRaiseTicket} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "30px" }}>
                  <div>
                    <label style={{ display: "block", color: "#ccc", marginBottom: "8px", fontSize: "0.9rem" }}>Subject</label>
                    <input
                      type="text"
                      placeholder="Brief title of the issue"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                      style={{ width: "100%", padding: "12px", background: "#1e1e1e", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", color: "#ccc", marginBottom: "8px", fontSize: "0.9rem" }}>Description</label>
                    <textarea
                      rows="4"
                      placeholder="Explain what happened in detail..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      required
                      style={{ width: "100%", padding: "12px", background: "#1e1e1e", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "0.95rem", resize: "vertical", boxSizing: "border-box" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTicket}
                    style={{ padding: "12px 24px", background: "#e50914", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", width: "fit-content" }}
                  >
                    {submittingTicket ? "Submitting..." : "Submit Ticket"}
                  </button>

                  {ticketStatus && (
                    <p style={{ fontSize: "0.9rem", color: ticketStatus.includes("❌") ? "#ff4d4d" : "#4caf50" }}>
                      {ticketStatus}
                    </p>
                  )}
                </form>

                <hr style={{ borderColor: "#262626", marginBottom: "24px" }} />

                <h4 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Your Raised Tickets</h4>

                {loadingTickets ? (
                  <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Loading tickets...</p>
                ) : myTickets.length === 0 ? (
                  <p style={{ color: "#777", fontSize: "0.9rem" }}>No tickets submitted yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {myTickets.map((t) => {
                      const isResolved = t.status === "Resolved" || t.status === "resolved";
                      return (
                        <div
                          key={t.id || t.subject}
                          style={{
                            background: "#1e1e1e",
                            border: "1px solid #2d2d2d",
                            borderRadius: "10px",
                            padding: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "8px",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                              {t.subject}
                            </span>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                background: isResolved ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 193, 7, 0.15)",
                                color: isResolved ? "#4caf50" : "#ffc107",
                                border: `1px solid ${isResolved ? "#4caf50" : "#ffc107"}`,
                              }}
                            >
                              {isResolved ? "✅ Resolved" : "⏳ In Progress"}
                            </span>
                          </div>

                          <p style={{ margin: "0 0 10px 0", color: "#ccc", fontSize: "0.9rem", lineHeight: "1.4" }}>
                            {t.message}
                          </p>

                          {t.admin_response && (
                            <div
                              style={{
                                marginTop: "12px",
                                padding: "12px",
                                background: "#282828",
                                borderLeft: "4px solid #4caf50",
                                borderRadius: "4px",
                              }}
                            >
                              <span style={{ fontWeight: "bold", fontSize: "0.85rem", color: "#4caf50", display: "block", marginBottom: "4px" }}>
                                💬 Support Response:
                              </span>
                              <p style={{ margin: 0, color: "#e0e0e0", fontSize: "0.9rem", lineHeight: "1.4" }}>
                                {t.admin_response}
                              </p>
                            </div>
                          )}

                          <TicketThread ticketId={t.id} />

                          {t.created_at && (
                            <small style={{ color: "#666", display: "block", marginTop: "10px" }}>
                              Submitted on: {t.created_at}
                            </small>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PRIVACY POLICY TAB */}
            {activeTab === "privacy" && (
              <div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Privacy Policy</h3>
                <p style={{ color: "#aaa", marginBottom: "20px" }}>How we collect, handle, store, and protect your data.</p>

                <div
                  style={{
                    background: "#2a2215",
                    border: "1px solid #9a907c",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    fontSize: "0.85rem",
                    color: "#f3d19c",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span>ℹ️</span>
                  <span>
                    By registering, logging in, or accessing your account, you acknowledge and agree to the terms outlined in this Privacy Policy.
                  </span>
                </div>

                <div
                  style={{
                    background: "#1e1e1e",
                    border: "1px solid #2d2d2d",
                    borderRadius: "12px",
                    padding: "20px",
                    lineHeight: "1.6",
                    color: "#ccc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>1. Acceptance of Terms & Information We Collect</h4>
                    <p style={{ margin: 0 }}>
                      All logged-in users are considered to have reviewed and agreed to this policy. When you create an account, we collect basic details such as your username and email address, as well as usage data like your anime watchlist, watched episodes, ratings, reviews, notes, and favorites to enable personalized tracking.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>2. Profile Images & User Content</h4>
                    <p style={{ margin: 0 }}>
                      Uploaded profile pictures and media are stored securely on our media servers. Any reviews, comments, or community notes you publish become visible to other users. You retain control over your content and may edit or delete it where supported.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>3. Data Security</h4>
                    <p style={{ margin: 0 }}>
                      We employ standard technical and organizational measures to safeguard your information. Passwords are never stored in plain text and are server-side hashed using secure algorithms to prevent unauthorized access.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>4. How We Use Your Information</h4>
                    <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                      <li>Create, manage, and secure your account.</li>
                      <li>Sync your anime watchlist and progress across devices.</li>
                      <li>Display your profile and public community contributions.</li>
                      <li>Improve application features, performance, and user experience.</li>
                      <li>Respond to support requests and account inquiries.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>5. Data Sharing</h4>
                    <p style={{ margin: 0 }}>
                      We do not sell your personal information. Limited data may be shared with trusted third-party providers strictly to operate the app under strict confidentiality agreements.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>6. Your Rights</h4>
                    <p style={{ margin: 0 }}>
                      You can update your profile details anytime in the app settings. You also reserve the right to request full deletion of your account and personal data, subject to necessary legal retention requirements.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>7. Children's Privacy</h4>
                    <p style={{ margin: 0 }}>
                      Our service is not intended for children under applicable regional minimum age requirements. We do not knowingly gather data from minors without consent.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: "#fff", fontSize: "1rem", marginBottom: "6px" }}>8. Policy Updates & Contact</h4>
                    <p style={{ margin: 0 }}>
                      We may revise this policy periodically. Updated terms become effective upon publication within the application, and continued use of a logged-in account constitutes agreement to updated terms.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* SUBCOMPONENT: INTERACTIVE TICKET THREAD */
const TicketThread = ({ ticketId }) => {
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReplies = async () => {
    try {
      const res = await API.get(`/support/tickets/${ticketId}/replies/`);
      setReplies(res.data || []);
    } catch (err) {
      console.error("Failed to load replies:", err);
    }
  };

  useEffect(() => {
    if (ticketId) fetchReplies();
  }, [ticketId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const res = await API.post(`/support/tickets/${ticketId}/replies/`, {
        message: replyText,
      });
      setReplies((prev) => [...prev, res.data]);
      setReplyText("");
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "16px", borderTop: "1px solid #2a2a2a", paddingTop: "12px" }}>
      {replies.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
          {replies.map((r) => (
            <div
              key={r.id}
              style={{
                alignSelf: r.is_staff ? "flex-start" : "flex-end",
                background: r.is_staff ? "#263238" : "#2e2e2e",
                borderLeft: r.is_staff ? "3px solid #00bcd4" : "none",
                padding: "8px 12px",
                borderRadius: "8px",
                maxWidth: "85%",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: r.is_staff ? "#00bcd4" : "#aaa", marginBottom: "2px" }}>
                {r.is_staff ? "Support Admin" : "You"} • {r.created_at}
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#fff" }}>{r.message}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSendReply} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Reply to support..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#141414",
            border: "1px solid #333",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "0.85rem",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 14px",
            background: "#e50914",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.85rem",
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};