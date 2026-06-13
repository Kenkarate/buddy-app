import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Crown, Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/api";
import { getPlanDetails, normalizePlan } from "../utils/planAccess";
import { fetchCurrencyPricing } from "../utils/currency";

function Payment() {
  const navigate = useNavigate();
  const { program } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchCurrencyPricing(api).then((data) => {
      if (!cancelled) setPricing(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const planDetails = {
    "personal-training": {
      title: "Personal Training",
      price: getPlanDetails("personal-training").price,
      description: "Trainer-guided workout and personal diet support.",
      benefits: [
        "Personal workout plan",
        "Personal diet guidance",
        "Progress tracking",
        "Trainer support",
      ],
    },
    "normal-workouts": {
      title: "Normal Workout",
      price: getPlanDetails("normal-workouts").price,
      description: "Gym workout plans with all body-part sessions.",
      benefits: [
        "Chest, back, legs, shoulders, arms and core",
        "Sets and reps included",
        "Beginner-friendly plans",
        "Access to workout dashboard",
      ],
    },
    "home-workout": {
  title: "Home Workout",
  price: getPlanDetails("home-workout").price,
  description: "Home workout suggestions based on your available equipment.",
  benefits: [
    "Equipment-based workout suggestions",
    "No gym required",
    "Sets and reps included",
    "Beginner-friendly home plans",
  ],
},
  };

  const normalizedProgram = normalizePlan(program) || "normal-workouts";
  const selectedPlan = planDetails[normalizedProgram] || planDetails["normal-workouts"];
  const displayPrice = pricing?.prices?.[normalizedProgram]?.formatted || selectedPlan.price;

  const proceedToPay = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      localStorage.setItem("buddyPendingProgram", normalizedProgram);
      const res = await api.post("/payments/select-plan", {
        program: normalizedProgram,
      });

      if (res.data.user) {
        localStorage.setItem("buddyUser", JSON.stringify(res.data.user));
      }

      if (res.data.purchased) {
        localStorage.removeItem("buddyPendingProgram");
        localStorage.setItem("buddySelectedProgram", res.data.program);
        localStorage.setItem("buddyPaymentStatus", "paid");
        navigate(res.data.redirectPath, { replace: true });
        return;
      }

      navigate(`/razorpay/${normalizedProgram}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to open payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-payment-page">
      <div className="payment-hero-premium">
        <Crown size={36} />
        <p>Buddy Training</p>
        <h1>{selectedPlan.title}</h1>
        <span>{selectedPlan.description}</span>
      </div>

      <div className="premium-price-card">
        <Dumbbell size={30} />
        <h2>{displayPrice}</h2>
        <p>One-time dummy payment for testing.</p>

        <div className="premium-benefits">
          {selectedPlan.benefits.map((benefit) => (
            <div key={benefit}>
              <CheckCircle size={18} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <button onClick={proceedToPay} disabled={loading}>
          {loading ? "Checking plan..." : "Proceed to Pay"}
        </button>
      </div>
    </div>
  );
}

export default Payment;
