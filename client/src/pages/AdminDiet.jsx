import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import AdminShell from "../components/AdminShell";
import api from "../api/api";

const emptyFood = {
  name: "",
  quantity: "",
  unit: "g",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  notes: "",
};

const createMeal = () => ({
  mealName: "Meal",
  time: "",
  foods: [{ ...emptyFood }],
});

const createPlan = (goal) => ({
  title: goal === "cutting" ? "Cutting Diet" : "Bulking Diet",
  goal,
  baseWeight: 70,
  targetCalories: "",
  notes: "",
  meals: [createMeal()],
});

function normalizePlan(plan, goal) {
  if (!plan) return createPlan(goal);

  return {
    title: plan.title || (goal === "cutting" ? "Cutting Diet" : "Bulking Diet"),
    goal,
    baseWeight: plan.baseWeight || 70,
    targetCalories: plan.targetCalories || plan.maxCalories || "",
    notes: plan.notes || "",
    meals: plan.meals?.length
      ? plan.meals.map((meal) => ({
          mealName: meal.mealName || "Meal",
          time: meal.time || "",
          foods: meal.foods?.length
            ? meal.foods.map((food) => ({
                name: food.name || "",
                quantity: food.quantity || "",
                unit: food.unit || "g",
                calories: food.calories || "",
                protein: food.protein || "",
                carbs: food.carbs || "",
                fats: food.fats || food.fat || "",
                notes: food.notes || "",
              }))
            : [{ ...emptyFood }],
        }))
      : [createMeal()],
  };
}

function AdminDiet() {
  const [plans, setPlans] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState("cutting");
  const [form, setForm] = useState(createPlan("cutting"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activePlan = useMemo(
    () => plans.find((plan) => plan.goal === selectedGoal),
    [plans, selectedGoal]
  );

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/diet-data/base-plans");
      setPlans(res.data.plans || []);
    } catch (loadError) {
      console.error("Load diet plans error:", loadError);
      setError("Could not load diet plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    setForm(normalizePlan(activePlan, selectedGoal));
    setSuccess("");
  }, [activePlan, selectedGoal]);

  const updateMeal = (mealIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, index) =>
        index === mealIndex ? { ...meal, [field]: value } : meal
      ),
    }));
  };

  const updateFood = (mealIndex, foodIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, index) =>
        index === mealIndex
          ? {
              ...meal,
              foods: meal.foods.map((food, itemIndex) =>
                itemIndex === foodIndex ? { ...food, [field]: value } : food
              ),
            }
          : meal
      ),
    }));
  };

  const addMeal = () => {
    setForm((prev) => ({ ...prev, meals: [...prev.meals, createMeal()] }));
  };

  const removeMeal = (mealIndex) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, index) => index !== mealIndex),
    }));
  };

  const addFood = (mealIndex) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, index) =>
        index === mealIndex
          ? { ...meal, foods: [...meal.foods, { ...emptyFood }] }
          : meal
      ),
    }));
  };

  const removeFood = (mealIndex, foodIndex) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, index) =>
        index === mealIndex
          ? { ...meal, foods: meal.foods.filter((_, itemIndex) => itemIndex !== foodIndex) }
          : meal
      ),
    }));
  };

  const savePlan = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.put(`/diet-data/base-plans/${selectedGoal}`, {
        ...form,
        goal: selectedGoal,
        baseWeight: Number(form.baseWeight || 70),
        targetCalories: Number(form.targetCalories || 0),
        meals: form.meals.map((meal) => ({
          ...meal,
          foods: meal.foods.map((food) => ({
            ...food,
            quantity: Number(food.quantity || 0),
            calories: Number(food.calories || 0),
            protein: Number(food.protein || 0),
            carbs: Number(food.carbs || 0),
            fats: Number(food.fats || 0),
          })),
        })),
      });

      await loadPlans();
      setSuccess(`${selectedGoal === "cutting" ? "Cutting" : "Bulking"} diet saved.`);
    } catch (saveError) {
      console.error("Save diet plan error:", saveError);
      setError(saveError.response?.data?.message || "Could not save diet plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Diet Plans">
      {error && <div className="admin-notice error">{error}</div>}
      {success && <div className="admin-notice success">{success}</div>}

      <div className="admin-chip-grid">
        {["cutting", "bulking"].map((goal) => (
          <button
            key={goal}
            type="button"
            className={selectedGoal === goal ? "active" : ""}
            onClick={() => setSelectedGoal(goal)}
          >
            {goal === "cutting" ? "Cutting Diet" : "Bulking Diet"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton-panel tall" />
      ) : (
        <form className="admin-flow-card admin-diet-form" onSubmit={savePlan}>
          <p className="admin-step-label">Base Plan</p>
          <h2>{selectedGoal === "cutting" ? "Cutting Diet" : "Bulking Diet"}</h2>

          <label>
            <span>Diet Type</span>
            <input value={selectedGoal} disabled />
          </label>

          <label>
            <span>Base Weight (kg)</span>
            <input
              type="number"
              value={form.baseWeight}
              onChange={(event) => setForm({ ...form, baseWeight: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Target Calories</span>
            <input
              type="number"
              value={form.targetCalories}
              onChange={(event) => setForm({ ...form, targetCalories: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Plan Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="General notes"
            />
          </label>

          <div className="admin-diet-meals">
            {form.meals.map((meal, mealIndex) => (
              <section className="admin-diet-meal-card" key={`${mealIndex}-${meal.mealName}`}>
                <div className="admin-diet-meal-head">
                  <strong>Meal {mealIndex + 1}</strong>
                  {form.meals.length > 1 && (
                    <button type="button" onClick={() => removeMeal(mealIndex)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <input
                  placeholder="Meal name"
                  value={meal.mealName}
                  onChange={(event) => updateMeal(mealIndex, "mealName", event.target.value)}
                  required
                />

                <input
                  placeholder="Meal time"
                  value={meal.time}
                  onChange={(event) => updateMeal(mealIndex, "time", event.target.value)}
                />

                {meal.foods.map((food, foodIndex) => (
                  <div className="admin-food-row" key={`${foodIndex}-${food.name}`}>
                    <div className="admin-food-head">
                      <span>Food {foodIndex + 1}</span>
                      {meal.foods.length > 1 && (
                        <button type="button" onClick={() => removeFood(mealIndex, foodIndex)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <input
                      placeholder="Food item"
                      value={food.name}
                      onChange={(event) => updateFood(mealIndex, foodIndex, "name", event.target.value)}
                      required
                    />

                    <div className="admin-food-grid">
                      <input type="number" placeholder="Qty" value={food.quantity} onChange={(event) => updateFood(mealIndex, foodIndex, "quantity", event.target.value)} required />
                      <input placeholder="Unit" value={food.unit} onChange={(event) => updateFood(mealIndex, foodIndex, "unit", event.target.value)} />
                      <input type="number" placeholder="Calories" value={food.calories} onChange={(event) => updateFood(mealIndex, foodIndex, "calories", event.target.value)} />
                      <input type="number" placeholder="Protein" value={food.protein} onChange={(event) => updateFood(mealIndex, foodIndex, "protein", event.target.value)} />
                      <input type="number" placeholder="Carbs" value={food.carbs} onChange={(event) => updateFood(mealIndex, foodIndex, "carbs", event.target.value)} />
                      <input type="number" placeholder="Fats" value={food.fats} onChange={(event) => updateFood(mealIndex, foodIndex, "fats", event.target.value)} />
                    </div>

                    <textarea
                      placeholder="Food notes"
                      value={food.notes}
                      onChange={(event) => updateFood(mealIndex, foodIndex, "notes", event.target.value)}
                    />
                  </div>
                ))}

                <button type="button" className="secondary-btn" onClick={() => addFood(mealIndex)}>
                  <Plus size={16} />
                  Add Food
                </button>
              </section>
            ))}
          </div>

          <button type="button" className="secondary-btn" onClick={addMeal}>
            <Plus size={16} />
            Add Meal
          </button>

          <button type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? "Saving..." : "Save Base Diet"}
          </button>
        </form>
      )}
    </AdminShell>
  );
}

export default AdminDiet;
