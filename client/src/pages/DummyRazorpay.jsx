import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, ShieldCheck } from "lucide-react";
import api from "../api/api";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddyUser") || "{}");
  } catch {
    localStorage.removeItem("buddyUser");
    return {};
  }
}

function DummyRazorpay() {
  const navigate = useNavigate();
  const { program } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedProgram = String(program || "")
    .trim()
    .toLowerCase();

  const planDetails = {
    normal: {
      title: "Normal Workout",
      amount: "₹80",
    },
    "normal-workout": {
      title: "Normal Workout",
      amount: "₹80",
    },
    "normal-workouts": {
      title: "Normal Workout",
      amount: "₹80",
    },
    home: {
      title: "Home Workout",
      amount: "₹150",
    },
    "home-workout": {
      title: "Home Workout",
      amount: "₹150",
    },
  };

  const selectedPlan = planDetails[normalizedProgram] || {
    title: "Normal Workout",
    amount: "₹80",
  };

  const startPayment = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Sending program:", normalizedProgram);

      const orderRes = await api.post("/payments/create-order", {
        program: normalizedProgram,
      });

      const { orderId, amount, currency, keyId, planTitle } = orderRes.data;

      const user = getStoredUser();

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
            program: normalizedProgram,
          });

          if (verifyRes.data.success) {
            const updatedUser = verifyRes.data.user;

            localStorage.setItem("buddyUser", JSON.stringify(updatedUser));
            localStorage.setItem("buddySelectedProgram", verifyRes.data.program);
            localStorage.setItem("buddyPaymentStatus", "paid");
            localStorage.removeItem("buddyPendingProgram");

            if (verifyRes.data.program === "home-workout") {
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
      setError(
        err.response?.data?.message ||
        err.response?.data?.normalizedProgram ||
        "Payment failed"
      );
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
        <p>Complete payment to unlock {selectedPlan.title}.</p>

        <div className="razorpay-summary">
          <span>Plan</span>
          <strong>{selectedPlan.title}</strong>
        </div>

        <div className="razorpay-summary">
          <span>Amount</span>
          <strong>{selectedPlan.amount}</strong>
        </div>

        <div className="secure-row">
          <ShieldCheck size={20} />
          <span>Secured by Razorpay</span>
        </div>

        {error && <p className="error">{error}</p>}

        <button onClick={startPayment} disabled={loading}>
          {loading ? "Opening Razorpay..." : "Proceed to Pay"}
        </button>

        <button className="razorpay-cancel-btn" onClick={() => navigate("/")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DummyRazorpay;
