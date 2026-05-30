import { useState } from "react";
import api from "../api/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    const res = await api.post("/auth/forgot-password", {
      email,
    });

    setMessage(res.data.message);
  };

  return (
    <div className="auth-page">
      <h1>Forgot Password</h1>
      <p className="muted">Enter your email to generate a reset link.</p>

      <form onSubmit={submit} className="card">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button>Send Reset Link</button>

        {message && <p className="success">{message}</p>}
      </form>
    </div>
  );
}

export default ForgotPassword;