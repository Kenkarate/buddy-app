import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, ShieldCheck } from "lucide-react";
import api from "../api/api";

function DummyRazorpay() {
  const navigate = useNavigate();
  const { program } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const planName =
    program === "normal-workouts"
      ? "Normal Workout"
      : program === "home-workout"
      ? "Home Workout"
      : "Personal Training";

  const startPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const orderRes = await api.post("/payments/create-order", {
        program,
      });

      const { orderId, amount, currency, keyId, planTitle } = orderRes.data;

      const user = JSON.parse(localStorage.getItem("buddyUser") || "{}");

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Buddy Fitness",
        description: planTitle,
        order_id: orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#050605",
        },
        handler: async function (response) {
          const verifyRes = await api.post("/payments/verify", {
            ...response,
            program,
          });

          if (verifyRes.data.success) {
            localStorage.setItem("buddySelectedProgram", program);
            localStorage.setItem("buddyPaymentStatus", "paid");

            if (program === "home-workout") {
              navigate("/home-workout-setup");
              return;
            }

            navigate("/workouts");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.response?.data?.message || "Payment failed");
      setLoading(false);
    }
  };

  return (
    <div className="dummy-razorpay-page">
      <div className="razorpay-box">
        <div className="razorpay-logo">
          <CreditCard size={34} />
        </div>

        <h1>Razorpay Checkout</h1>
        <p>Complete payment to unlock {planName}.</p>

        <div className="razorpay-summary">
          <span>Plan</span>
          <strong>{planName}</strong>
        </div>

        <div className="secure-row">
          <ShieldCheck size={20} />
          <span>Secured by Razorpay</span>
        </div>

        {error && <p className="error">{error}</p>}

        <button onClick={startPayment} disabled={loading}>
          {loading ? "Opening Razorpay..." : "Proceed to Pay"}
        </button>

        <button className="edit-bmi-btn" onClick={() => navigate("/")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DummyRazorpay;