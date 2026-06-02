import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await api.post(`/auth/reset-password/${token}`, {
        password,
      });

      setMessage(res.data.message || "Password updated successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="auth-page">
      <h1>Buddy</h1>
      <p className="muted">Create new password</p>

      <form onSubmit={resetPassword} className="card">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <button>Reset Password</button>

        <p className="center-text">
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;