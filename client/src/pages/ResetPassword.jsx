import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const resetPassword = async (e) => {
    e.preventDefault();

    const res = await api.post(`/auth/reset-password/${token}`, {
      password,
    });

    setMessage(res.data.message);

    setTimeout(() => {
      navigate("/login");
    }, 1200);
  };

  return (
    <div className="auth-page">
      <h1>Reset Password</h1>

      <form onSubmit={resetPassword} className="card">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button>Update Password</button>

        {message && <p className="success">{message}</p>}
      </form>
    </div>
  );
}

export default ResetPassword;