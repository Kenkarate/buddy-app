import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api/api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const goAfterLogin = () => {
    const pendingProgram = localStorage.getItem("buddyPendingProgram");

    if (pendingProgram) {
      navigate(`/razorpay/${pendingProgram}`);
      return;
    }

    navigate("/workouts");
  };

  const login = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", form);

      if (res.data.user.role === "admin") {
        setError("Use trainer login for admin account.");
        return;
      }

      localStorage.setItem("buddyToken", res.data.token);
      localStorage.setItem("buddyUser", JSON.stringify(res.data.user));

      goAfterLogin();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setError("");

    try {
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      if (res.data.user.role === "admin") {
        setError("Use trainer login for admin account.");
        return;
      }

      localStorage.setItem("buddyToken", res.data.token);
      localStorage.setItem("buddyUser", JSON.stringify(res.data.user));

      goAfterLogin();
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    }
  };

  return (
    <div className="auth-page">
      <h1>Buddy</h1>
      <p className="muted">Login to continue your training</p>

      <form onSubmit={login} className="card">
        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">Login</button>

        <div className="google-login-box">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError("Google login failed")}
          />
        </div>

        <p className="center-text">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className="center-text">
          New user? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
