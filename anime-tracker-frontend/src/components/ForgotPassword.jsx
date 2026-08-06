import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api"; // Adjust this import based on your API setup

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      // Endpoint depends on your backend setup
      await API.post("/auth/forgot-password/", { email });
      setMessage("If an account exists, a reset link has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Reset Password</h2>
        <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "20px" }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {error && <div className="auth-error" style={{ color: "#ff4d4d" }}>{error}</div>}
        {message && <div className="auth-success" style={{ color: "#4caf50", marginBottom: "15px" }}>{message}</div>}
        
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <button disabled={loading} type="submit">
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        
        <p className="auth-switch">
          Remembered your password? <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}