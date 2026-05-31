import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, ShieldCheck } from "lucide-react";

function DummyRazorpay() {
  const navigate = useNavigate();
  const { program } = useParams();

  const payNow = () => {
    localStorage.setItem("buddySelectedProgram", program);
    localStorage.setItem("buddyPaymentStatus", "paid");
    navigate("/workouts");
  };

  return (
    <div className="dummy-razorpay-page">
      <div className="razorpay-box">
        <div className="razorpay-logo">
          <CreditCard size={34} />
        </div>

        <h1>Razorpay Checkout</h1>
        <p>Dummy payment page for testing Buddy app flow.</p>

        <div className="razorpay-summary">
          <span>Plan</span>
          <strong>
            {program === "normal-workouts"
              ? "Normal Workout"
              : program === "home-workout"
              ? "Home Workout"
              : "Personal Training"}
          </strong>
        </div>

        <div className="razorpay-summary">
          <span>Amount</span>
          <strong>₹499</strong>
        </div>

        <div className="secure-row">
          <ShieldCheck size={20} />
          <span>Dummy secure payment. No real money charged.</span>
        </div>

        <button onClick={payNow}>Pay ₹499</button>

        <button className="edit-bmi-btn" onClick={() => navigate("/")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DummyRazorpay;