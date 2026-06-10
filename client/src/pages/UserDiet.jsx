import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Crown, Flame, Salad, ShieldAlert } from "lucide-react";
import api from "../api/api";

function UserDiet() {
  const navigate = useNavigate();

  const [accepted, setAccepted] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState("cutting");
  const [userWeight, setUserWeight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const warningAccepted = localStorage.getItem("buddyDietWarningAccepted");
    setAccepted(warningAccepted === "true");
  }, []);

  useEffect(() => {
    if (!accepted) return;

    let cancelled = false;

    async function loadPlans() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/diet-data/personalized-plans");
        if (!cancelled) {
          setPlans(res.data.plans || []);
          setUserWeight(res.data.userWeight || null);
          setSelectedGoal(res.data.plans?.[0]?.goal || "cutting");
        }
      } catch (loadError) {
        console.error("Load diet plans error:", loadError);
        if (!cancelled) setError("Could not load diet plans.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, [accepted]);

  const acceptWarning = () => {
    localStorage.setItem("buddyDietWarningAccepted", "true");
    setAccepted(true);
  };

  const selectedPlan = plans.find((plan) => plan.goal === selectedGoal);

  if (!accepted) {
    return (
      <div className="premium-diet-page">
        <div className="premium-diet-header">
          <p>Nutrition</p>
          <h1>Diet Plans</h1>
          <span>Choose a plan based on your fitness goal.</span>
        </div>

        <div className="diet-warning-premium">
          <ShieldAlert size={34} />
          <h2>Health Warning</h2>
          <p>
            These diet plans are general fitness guidance. If you have medical
            conditions, allergies, eating disorders, pregnancy, or any health
            issue, consult a doctor or certified nutrition professional before
            following a diet.
          </p>
          <button onClick={acceptWarning}>I Understand & Accept</button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-diet-page">
      <div className="premium-diet-header">
        <p>Nutrition</p>
        <h1>Diet Plans</h1>
        <span>
          {userWeight
            ? `Personalized for ${userWeight}kg.`
            : "Add your weight to get a personalized diet."}
        </span>
      </div>

      {error && <div className="trainer-empty-state admin-error-state">{error}</div>}

      {loading ? (
        <div className="skeleton-panel tall" />
      ) : plans.length === 0 ? (
        <div className="trainer-empty-state">
          No active cutting or bulking diet has been added by admin yet.
        </div>
      ) : (
        <>
          <div className="diet-goal-toggle">
            {plans.map((plan) => {
              const Icon = plan.goal === "cutting" ? Salad : Flame;
              return (
                <button
                  key={plan.goal}
                  className={selectedGoal === plan.goal ? "active" : ""}
                  onClick={() => setSelectedGoal(plan.goal)}
                >
                  <Icon size={20} />
                  {plan.goal === "cutting" ? "Cutting" : "Bulking"}
                </button>
              );
            })}
          </div>

          {selectedPlan && (
            <div className="diet-select-card recommended">
              <div className="recommended-pill">
                <CheckCircle size={15} />
                {selectedPlan.isPersonalized ? "Personalized" : "Base Plan"}
              </div>

              <div className="diet-card-top">
                <div className="diet-icon-box">
                  {selectedPlan.goal === "cutting" ? <Salad size={28} /> : <Flame size={28} />}
                </div>
                <div>
                  <h2>{selectedPlan.title}</h2>
                  <p>{selectedPlan.personalizedMessage}</p>
                </div>
              </div>

              <div className="diet-calorie-row">
                <span>Target Calories</span>
                <strong>{selectedPlan.adjustedTargetCalories || selectedPlan.targetCalories} kcal</strong>
              </div>

              <div className="diet-calorie-row">
                <span>Base Weight</span>
                <strong>{selectedPlan.baseWeight}kg</strong>
              </div>

              <div className="diet-meal-preview">
                {(selectedPlan.meals || []).map((meal) => (
                  <section className="user-diet-meal" key={meal._id || meal.mealName}>
                    <h3>{meal.mealName}</h3>
                    {meal.time && <small>{meal.time}</small>}
                    {(meal.foods || []).map((food) => (
                      <div className="user-diet-food" key={food._id || food.name}>
                        <div>
                          <strong>{food.name}</strong>
                          <span>
                            {food.adjustedQuantity ?? food.quantity} {food.unit || "g"}
                          </span>
                        </div>
                        <p>
                          {food.adjustedCalories ?? food.calories} kcal · P {food.adjustedProtein ?? food.protein}g · C {food.adjustedCarbs ?? food.carbs}g · F {food.adjustedFats ?? food.fats ?? food.fat}g
                        </p>
                        {food.notes && <small>{food.notes}</small>}
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          )}

          <div className="personal-diet-card">
            <div className="recommended-pill personal">
              <Crown size={15} />
              Best Result
            </div>
            <h2>Personal Diet Plan</h2>
            <p>For medical conditions or precise goals, choose personal training.</p>
            <button onClick={() => navigate("/payment/personal-training")}>
              Take Personal Training
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserDiet;
