import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const programNames = {
  "personal-training": "Personal Training",
  "normal-workouts": "Normal Workouts",
  "home-workout": "Home Workout",
};

function Payment() {
  const { program } = useParams();
  const navigate = useNavigate();

  const startTrial = async () => {
    const token = localStorage.getItem("buddyToken");

    if (!token) {
      localStorage.setItem("selectedProgram", program);
      navigate("/register");
      return;
    }

    const res = await api.post("/subscription/start-trial", {
      selectedProgram: program,
    });

    const oldUser = JSON.parse(localStorage.getItem("buddyUser") || "{}");

    localStorage.setItem(
      "buddyUser",
      JSON.stringify({
        ...oldUser,
        selectedProgram: res.data.selectedProgram,
        subscriptionStatus: res.data.subscriptionStatus,
      })
    );

    navigate("/workouts");
  };

  const mockPayment = async () => {
    const token = localStorage.getItem("buddyToken");

    if (!token) {
      localStorage.setItem("selectedProgram", program);
      navigate("/register");
      return;
    }

    const res = await api.post("/subscription/mock-payment-success");

    const oldUser = JSON.parse(localStorage.getItem("buddyUser") || "{}");

    localStorage.setItem(
      "buddyUser",
      JSON.stringify({
        ...oldUser,
        subscriptionStatus: res.data.subscriptionStatus,
      })
    );

    navigate("/workouts");
  };

  return (
    <div className="auth-page">
      <div className="payment-card">
        <p className="eyebrow">Selected Plan</p>
        <h1>{programNames[program]}</h1>

        <div className="price-box">
          <h2>3 Days Free Trial</h2>
          <p>Start now. Upgrade after trial.</p>
        </div>

        <div className="payment-benefits">
          <p>✓ Workout section</p>
          <p>✓ Diet section</p>
          <p>✓ BMI calculator</p>
          <p>✓ Weight tracking chart</p>
          <p>✓ Trainer-assigned plans</p>
        </div>

        <button onClick={startTrial}>Start 3-Day Free Trial</button>

        <button className="secondary-btn" onClick={mockPayment}>
          Mock Payment Success
        </button>

        <p className="small-note">
          Real payment gateway can be connected after this version works.
        </p>
      </div>
    </div>
  );
}

export default Payment;