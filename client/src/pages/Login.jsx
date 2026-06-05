import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

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

      const pendingProgram = localStorage.getItem("buddyPendingProgram");

if (pendingProgram) {
  navigate(`/razorpay/${pendingProgram}`);

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

    const pendingProgram = localStorage.getItem("buddyPendingProgram");

    if (pendingProgram) {
      navigate(`/razorpay/${pendingProgram}`);
      return;
    }

    navigate("/workouts");
  } catch (err) {
    setError(err.response?.data?.message || "Google login failed");
  }
};

  return;
}

navigate("/workouts");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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

        <button>Login</button>

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