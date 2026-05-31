import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Crown, Dumbbell } from "lucide-react";

function Payment() {
  const navigate = useNavigate();
  const { program } = useParams();

  const planDetails = {
    "personal-training": {
      title: "Personal Training",
      price: "₹999",
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
      price: "₹499",
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
      price: "₹299",
      description: "Home workout suggestions based on your available equipment.",
      benefits: [
        "Equipment-based workout suggestions",
        "No gym required",
        "Sets and reps included",
        "Beginner-friendly home plans",
      ],
    },
  };

  const selectedPlan = planDetails[program] || planDetails["normal-workouts"];

  const proceedToPay = () => {
    navigate(`/razorpay/${program}`);
  };

  return (
    <div className="premium-payment-page">
      <div className="payment-hero-premium">
        <Crown size={36} />
        <p>Buddy Premium</p>
        <h1>{selectedPlan.title}</h1>
        <span>{selectedPlan.description}</span>
      </div>

      <div className="premium-price-card">
        <Dumbbell size={30} />
        <h2>{selectedPlan.price}</h2>
        <p>One-time dummy payment for testing.</p>

        <div className="premium-benefits">
          {selectedPlan.benefits.map((benefit) => (
            <div key={benefit}>
              <CheckCircle size={18} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <button onClick={proceedToPay}>Proceed to Pay</button>
      </div>
    </div>
  );
}

export default Payment;