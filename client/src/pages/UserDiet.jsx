import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Crown, Flame, Salad, ShieldAlert } from "lucide-react";

function getRecommendedDiet() {
  const savedResult = localStorage.getItem("buddyLatestBmiResult");

  if (!savedResult) {
    return "fat-loss";
  }

  const result = JSON.parse(savedResult);

  if (result.bmi >= 25) return "fat-loss";
  if (result.bmi < 18.5) return "muscle-gain";

  return "fat-loss";
}

function UserDiet() {
  const navigate = useNavigate();

  const [accepted, setAccepted] = useState(false);
  const [recommendedDiet, setRecommendedDiet] = useState("fat-loss");
  const [selectedDiet, setSelectedDiet] = useState(null);

  useEffect(() => {
    const warningAccepted = localStorage.getItem("buddyDietWarningAccepted");
    const recommendation = getRecommendedDiet();

    setAccepted(warningAccepted === "true");
    setRecommendedDiet(recommendation);
  }, []);

  const acceptWarning = () => {
    localStorage.setItem("buddyDietWarningAccepted", "true");
    setAccepted(true);
  };

  const commonDiets = [
    {
      id: "fat-loss",
      title: "Weight Loss Diet",
      subtitle: "Best for fat loss and BMI control",
      calories: "1400 - 1900 kcal",
      icon: Salad,
      meals: [
        "Breakfast: 2 eggs + banana",
        "Lunch: rice + chicken breast + vegetables",
        "Snack: fruit or black coffee",
        "Dinner: lean protein + salad",
      ],
    },
    {
      id: "muscle-gain",
      title: "Muscle Gain Diet",
      subtitle: "Best for bulking and strength gain",
      calories: "2200 - 3000 kcal",
      icon: Flame,
      meals: [
        "Breakfast: 4 eggs + banana",
        "Lunch: rice + chicken breast",
        "Snack: peanut butter toast or shake",
        "Dinner: rice/chapati + protein source",
      ],
    },
  ];

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
            These diet plans are general fitness guidance. If you have diabetes,
            thyroid issues, kidney problems, heart problems, pregnancy, food
            allergies, eating disorders, or any medical condition, consult a
            doctor or certified nutrition professional before following a diet.
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
          Recommended based on your latest BMI result. For best results, take a
          personal diet plan.
        </span>
      </div>

      <div className="diet-card-list">
        {commonDiets.map((diet) => {
          const Icon = diet.icon;
          const isRecommended = recommendedDiet === diet.id;
          const isSelected = selectedDiet === diet.id;

          return (
            <div
              className={
                isRecommended
                  ? "diet-select-card recommended"
                  : "diet-select-card"
              }
              key={diet.id}
              onClick={() => setSelectedDiet(isSelected ? null : diet.id)}
            >
              {isRecommended && (
                <div className="recommended-pill">
                  <CheckCircle size={15} />
                  Recommended
                </div>
              )}

              <div className="diet-card-top">
                <div className="diet-icon-box">
                  <Icon size={28} />
                </div>

                <div>
                  <h2>{diet.title}</h2>
                  <p>{diet.subtitle}</p>
                </div>
              </div>

              <div className="diet-calorie-row">
                <span>Target Calories</span>
                <strong>{diet.calories}</strong>
              </div>

              {isSelected && (
                <div className="diet-meal-preview">
                  {diet.meals.map((meal) => (
                    <p key={meal}>{meal}</p>
                  ))}
                </div>
              )}

              <button>
                {isSelected ? "Hide Diet" : "View Common Diet"}
              </button>
            </div>
          );
        })}

        <div className="personal-diet-card">
          <div className="recommended-pill personal">
            <Crown size={15} />
            Best Result
          </div>

          <div className="diet-card-top">
            <div className="diet-icon-box premium">
              <Crown size={28} />
            </div>

            <div>
              <h2>Personal Diet Plan</h2>
              <p>
                Custom diet made for your body, BMI, goal, food preference and
                progress.
              </p>
            </div>
          </div>

          <ul>
            <li>Trainer-guided diet</li>
            <li>Goal-based calories</li>
            <li>Better for medical or special conditions</li>
            <li>Workout + diet accountability</li>
          </ul>

          <button onClick={() => navigate("/payment/personal-training")}>
            Take Personal Training
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDiet;