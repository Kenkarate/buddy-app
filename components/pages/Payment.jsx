"use client";

import { useNavigate, useParams } from "@/lib/navigation";
import { CheckCircle, Crown, Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getPlanDetails, normalizePlan, isSubscriptionPlan } from "@/lib/planAccess";
import { detectClientCountry, fetchCurrencyPricing } from "@/lib/currencyClient";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddyUser") || "{}");
  } catch {
    localStorage.removeItem("buddyUser");
    return {};
  }
}

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
    return () => { cancelled = true; };
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
  const subscription = pricing?.billingModes != null
    ? pricing.billingModes[normalizedProgram] === "subscription"
    : isSubscriptionPlan(normalizedProgram);

  const openSubscription = async () => {
    const subRes = await api.post(`/payments/subscribe/${normalizedProgram}`);
    const { subscriptionId, keyId, planTitle } = subRes.data;
    const user = getStoredUser();

    if (!window.Razorpay) throw new Error("Razorpay script not loaded. Please refresh.");

    const options = {
      key: keyId,
      subscription_id: subscriptionId,
      name: "Buddy Fitness",
      description: `${planTitle} · Monthly`,
      prefill: { name: user.name || "", email: user.email || "" },
      theme: { color: "#050605" },
      handler: async function (response) {
        const verifyRes = await api.post("/payments/subscription/verify", response);
        if (verifyRes.data.success) {
          localStorage.setItem("buddyUser", JSON.stringify(verifyRes.data.user));
          localStorage.setItem("buddySelectedProgram", verifyRes.data.program);
          localStorage.setItem("buddyPaymentStatus", "paid");
          localStorage.removeItem("buddyPendingProgram");
          navigate(verifyRes.data.redirectPath || "/workouts", { replace: true });
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const openOrder = async () => {
    const orderRes = await api.post("/payments/create-order", {
      program: normalizedProgram,
      country: pricing?.country || (await detectClientCountry()),
    });
    const { orderId, amount, currency, keyId, planTitle } = orderRes.data;
    const user = getStoredUser();

    if (!window.Razorpay) throw new Error("Razorpay script not loaded. Please refresh.");

    const options = {
      key: keyId,
      amount,
      currency,
      name: "Buddy Fitness",
      description: planTitle,
      order_id: orderId,
      prefill: { name: user.name || "", email: user.email || "" },
      theme: { color: "#050605" },
      handler: async function (response) {
        const verifyRes = await api.post("/payments/verify", {
          ...response,
          program: normalizedProgram,
        });
        if (verifyRes.data.success) {
          localStorage.setItem("buddyUser", JSON.stringify(verifyRes.data.user));
          localStorage.setItem("buddySelectedProgram", verifyRes.data.program);
          localStorage.setItem("buddyPaymentStatus", "paid");
          localStorage.removeItem("buddyPendingProgram");
          navigate(verifyRes.data.redirectPath || "/workouts", { replace: true });
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const proceedToPay = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      localStorage.setItem("buddyPendingProgram", normalizedProgram);
      const res = await api.post("/payments/select-plan", { program: normalizedProgram });

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

      if (subscription) {
        await openSubscription();
      } else {
        await openOrder();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to open payment. Please try again."
      );
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
        <h2>{displayPrice}{subscription ? " / month" : ""}</h2>
        <p>{subscription ? "Auto-renewing monthly subscription. Cancel anytime." : "One-time payment."}</p>

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
          {loading ? "Opening Razorpay..." : "Proceed to Pay"}
        </button>
      </div>
    </div>
  );
}

export default Payment;
