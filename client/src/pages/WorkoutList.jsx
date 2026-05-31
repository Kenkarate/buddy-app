import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { normalWorkoutParts } from "../data/dummyNormalWorkouts";

function WorkoutList() {
  const navigate = useNavigate();
  const { part } = useParams();

  const selectedPart = normalWorkoutParts.find((item) => item.slug === part);

  if (!selectedPart) {
    return (
      <div className="elite-empty-card">
        <h2>Workout Not Found</h2>
        <button onClick={() => navigate("/workouts")}>Back</button>
      </div>
    );
  }

  return (
    <div className="workout-list-page">
      <button className="elite-back-btn" onClick={() => navigate("/workouts")}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div
        className="workout-list-hero"
        style={{ backgroundImage: `url(${selectedPart.image})` }}
      >
        <div>
          <p>Body Part</p>
          <h1>{selectedPart.part}</h1>
        </div>
      </div>

      <div className="workout-name-list">
        {selectedPart.workouts.map((workout) => (
          <button
            key={workout.id}
            className="workout-name-card"
            onClick={() => navigate(`/workout-detail/${selectedPart.slug}/${workout.id}`)}
          >
            <div>
              <p>{workout.level}</p>
              <h2>{workout.name}</h2>
              <span>
                {workout.sets} sets · {workout.reps}
              </span>
            </div>

            <Dumbbell size={26} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default WorkoutList;