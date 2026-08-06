import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../api/api"; // Adjust this import based on your API setup

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { token } = useParams(); // Extracts token from URL (e.g., /reset-password/:token)
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      // Endpoint depends on your backend setup
      await API.post(`/auth/reset-password/${token}/`, { password: newPassword });
      setMessage("Password has been reset successfully! Redirecting...");
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. The link might be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Create New Password</h2>
        
        {error && <div className="auth-error" style={{ color: "#ff4d4d" }}>{error}</div>}
        {message && <div className="auth-success" style={{ color: "#4caf50", marginBottom: "15px" }}>{message}</div>}
        
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <button disabled={loading} type="submit">
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}