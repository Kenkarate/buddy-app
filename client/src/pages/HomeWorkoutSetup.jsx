import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Home, CheckCircle } from "lucide-react";

const equipmentOptions = [
  "No Equipment",
  "Dumbbells",
  "Resistance Band",
  "Skipping Rope",
  "Pull-up Bar",
  "Yoga Mat",
];

const homeWorkoutSuggestions = {
  "No Equipment": [
    { name: "Push Ups", sets: 4, reps: "12 reps", muscle: "Chest" },
    { name: "Bodyweight Squats", sets: 4, reps: "15 reps", muscle: "Legs" },
    { name: "Plank", sets: 3, reps: "45 sec", muscle: "Core" },
    { name: "Mountain Climbers", sets: 3, reps: "30 sec", muscle: "Core" },
    { name: "Lunges", sets: 3, reps: "12 each leg", muscle: "Legs" },
  ],
  Dumbbells: [
    { name: "Dumbbell Shoulder Press", sets: 4, reps: "12 reps", muscle: "Shoulders" },
    { name: "Dumbbell Rows", sets: 4, reps: "12 reps", muscle: "Back" },
    { name: "Dumbbell Curls", sets: 3, reps: "15 reps", muscle: "Biceps" },
    { name: "Goblet Squats", sets: 4, reps: "15 reps", muscle: "Legs" },
    { name: "Dumbbell Chest Press", sets: 4, reps: "12 reps", muscle: "Chest" },
  ],
  "Resistance Band": [
    { name: "Band Rows", sets: 4, reps: "15 reps", muscle: "Back" },
    { name: "Band Chest Press", sets: 4, reps: "12 reps", muscle: "Chest" },
    { name: "Band Biceps Curl", sets: 3, reps: "15 reps", muscle: "Biceps" },
    { name: "Band Squats", sets: 4, reps: "15 reps", muscle: "Legs" },
    { name: "Band Pull Aparts", sets: 3, reps: "20 reps", muscle: "Shoulders" },
  ],
};

function HomeWorkoutSetup() {
  const navigate = useNavigate();
  const [selectedEquipment, setSelectedEquipment] = useState(["No Equipment"]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const toggleEquipment = (equipment) => {
    if (equipment === "No Equipment") {
      setSelectedEquipment(["No Equipment"]);
      return;
    }

    let updated = selectedEquipment.filter((item) => item !== "No Equipment");

    if (updated.includes(equipment)) {
      updated = updated.filter((item) => item !== equipment);
    } else {
      updated.push(equipment);
    }

    setSelectedEquipment(updated.length ? updated : ["No Equipment"]);
  };

  const getSuggestedWorkouts = () => {
    let workouts = [];

    selectedEquipment.forEach((equipment) => {
      workouts = [...workouts, ...(homeWorkoutSuggestions[equipment] || [])];
    });

    if (workouts.length === 0) {
      workouts = homeWorkoutSuggestions["No Equipment"];
    }

    return workouts.slice(0, 10);
  };

  const startHomeWorkout = () => {
    localStorage.setItem("buddySelectedProgram", "home-workout");
    localStorage.setItem("buddyHomeEquipment", JSON.stringify(selectedEquipment));
    localStorage.setItem("buddyHomeWorkouts", JSON.stringify(getSuggestedWorkouts()));
    navigate("/home-workout");
  };

  return (
    <div className="home-workout-setup-page">
      <div className="premium-bmi-header">
        <p>Home Workout</p>
        <h1>Your Setup</h1>
        <span>Select the equipment you have. Buddy will suggest workouts for you.</span>
      </div>

      <div className="equipment-grid">
        {equipmentOptions.map((equipment) => {
          const active = selectedEquipment.includes(equipment);

          return (
            <button
              key={equipment}
              className={active ? "equipment-card active" : "equipment-card"}
              onClick={() => toggleEquipment(equipment)}
            >
              {active ? <CheckCircle size={24} /> : <Dumbbell size={24} />}
              <span>{equipment}</span>
            </button>
          );
        })}
      </div>

      <button className="show-suggestion-btn" onClick={() => setShowSuggestions(true)}>
        Suggest Workouts
      </button>

      {showSuggestions && (
        <div className="home-suggestion-list">
          <h2>Suggested Home Workouts</h2>

          {getSuggestedWorkouts().map((workout, index) => (
            <div className="home-suggestion-card" key={`${workout.name}-${index}`}>
              <div>
                <p>{workout.muscle}</p>
                <h3>{workout.name}</h3>
              </div>

              <span>
                {workout.sets} sets · {workout.reps}
              </span>
            </div>
          ))}

          <button onClick={startHomeWorkout}>
            <Home size={20} />
            Start Home Workout
          </button>
        </div>
      )}
    </div>
  );
}

export default HomeWorkoutSetup;
