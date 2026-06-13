import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api/api";
import { getPlanRoute, routeAfterPlanSelection } from "../utils/planAccess";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goAfterLogin = async (user) => {
    const pendingProgram = localStorage.getItem("buddyPendingProgram");
    const returnPath = location.state?.from;

    if (pendingProgram) {
      await routeAfterPlanSelection({
        api,
        navigate,
        program: pendingProgram,
        replace: true,
      });
      return;
    }

    const purchasedPlan = user?.selectedPlan || user?.selectedProgram;
    navigate(returnPath || getPlanRoute(purchasedPlan) || "/workouts", {
      replace: Boolean(returnPath),
    });
  };

  const login = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      if (res.data.user.role === "admin") {
        setError("Use trainer login for admin account.");
        return;
      }

      localStorage.setItem("buddyToken", res.data.token);
      localStorage.setItem("buddyUser", JSON.stringify(res.data.user));

      await goAfterLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (loading) return;
    setError("");
    setLoading(true);

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

      await goAfterLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
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

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

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
