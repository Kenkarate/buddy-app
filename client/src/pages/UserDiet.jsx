import { useEffect, useState } from "react";
import api from "../api/api";

function UserDiet() {
  const [assignment, setAssignment] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDiet = async () => {
    try {
      const res = await api.get("/diet-data/my-diet");

      if (!res.data) {
        setAssignment(null);
        setDietPlan(null);
        setAccepted(false);
        setLoading(false);
        return;
      }

      setAssignment(res.data);
      setDietPlan(res.data.dietPlanId || null);
      setAccepted(Boolean(res.data.warningAccepted));
      setLoading(false);
    } catch (error) {
      console.error("Failed to load diet:", error);
      setAssignment(null);
      setDietPlan(null);
      setAccepted(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiet();
  }, []);

  const acceptWarning = async () => {
    try {
      const res = await api.post("/diet-data/accept-warning");

      setAssignment(res.data);
      setDietPlan(res.data?.dietPlanId || null);
      setAccepted(true);
    } catch (error) {
      console.error("Failed to accept warning:", error);
      alert("No diet assigned yet. Ask your trainer to assign a diet plan.");
    }
  };

  if (loading) {
    return <p className="muted">Loading diet plan...</p>;
  }

  if (!assignment || !dietPlan) {
    return (
      <div>
        <div className="diet-hero-card">
          <p className="eyebrow">Nutrition</p>
          <h1>Diet Plan</h1>
          <p>Your assigned diet plan will appear here.</p>
        </div>

        <div className="empty-diet-card">
          <h2>No Diet Assigned</h2>
          <p>
            Your trainer has not assigned a diet plan yet. Once assigned from
            the admin dashboard, your meals will appear here.
          </p>
        </div>
      </div>
    );
  }

  if (!accepted) {
    return (
      <div>
        <div className="diet-hero-card">
          <p className="eyebrow">Nutrition</p>
          <h1>{dietPlan.title}</h1>
          <p>
            Goal: {dietPlan.goal} · {dietPlan.minCalories}-
            {dietPlan.maxCalories} kcal
          </p>
        </div>

        <div className="warning-card">
          <h2>Before You Start</h2>

          <p>
            This diet plan is general fitness guidance. If you have diabetes,
            thyroid issues, heart problems, kidney problems, pregnancy, food
            allergies, eating disorders, or any medical condition, please
            consult a doctor or certified nutrition professional before
            following this plan.
          </p>

          <button onClick={acceptWarning}>I Understand & Accept</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="diet-hero-card">
        <p className="eyebrow">Nutrition</p>
        <h1>{dietPlan.title}</h1>
        <p>
          Goal: {dietPlan.goal} · {dietPlan.minCalories}-{dietPlan.maxCalories}{" "}
          kcal
        </p>
      </div>

      <div className="diet-list">
        {dietPlan.meals?.map((meal, index) => (
          <div className="diet-meal-card" key={index}>
            <div>
              <p className="meal-label">
                {meal.mealName} {meal.time ? `· ${meal.time}` : ""}
              </p>

              {meal.foods?.map((food, foodIndex) => (
                <div key={foodIndex} className="diet-food-row">
                  <h3>{food.name}</h3>
                  <p>
                    {food.quantity} · {food.calories} kcal · Protein{" "}
                    {food.protein}g · Carbs {food.carbs}g · Fat {food.fat}g
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserDiet;