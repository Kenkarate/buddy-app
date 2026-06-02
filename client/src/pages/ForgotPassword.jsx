import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const submitForgotPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setResetLink("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", {
        email,
      });

      setMessage(res.data.message || "Password reset link created.");

      if (res.data.resetLink) {
        setResetLink(res.data.resetLink);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Buddy</h1>
      <p className="muted">Reset your password</p>

      <form onSubmit={submitForgotPassword} className="card">
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {resetLink && (
          <div className="reset-link-box">
            <p>Temporary reset link:</p>
            <Link to={resetLink.replace(window.location.origin, "")}>
              Open Reset Page
            </Link>
          </div>
        )}

        <button disabled={loading}>
          {loading ? "Please wait..." : "Get Reset Link"}
        </button>

        <p className="center-text">
          Remember password? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;