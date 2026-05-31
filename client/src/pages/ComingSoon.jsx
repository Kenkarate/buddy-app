import { useNavigate } from "react-router-dom";
import { Crown, ArrowLeft } from "lucide-react";

function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="coming-soon-page">
      <button className="elite-back-btn" onClick={() => navigate("/")}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="coming-soon-card">
        <Crown size={46} />

        <p>Buddy Elite</p>
        <h1>Personal Training Coming Soon</h1>

        <span>
          One-to-one trainer guidance, custom workouts, personal diet plans and
          progress tracking will be available soon.
        </span>

        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    </div>
  );
}

export default ComingSoon;