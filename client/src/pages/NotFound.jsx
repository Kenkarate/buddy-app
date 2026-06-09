import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="home-screen not-found-screen">
      <div className="elite-empty-card">
        <p className="eyebrow">404</p>
        <h1>Page Not Found</h1>
        <p className="muted">
          This page does not exist or the link has changed.
        </p>

        <div className="not-found-actions">
          <button type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate("/")}
          >
            <Home size={18} />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
