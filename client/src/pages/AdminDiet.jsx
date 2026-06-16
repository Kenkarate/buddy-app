import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import api from "../api/api";

const emptyFood = {
  name: "",
  quantity: "",
  unit: "g",
  measure: "grams",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  fiber: "",
  imageUrl: "",
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
                measure: food.measure || "grams",
                calories: food.calories || "",
                protein: food.protein || "",
                carbs: food.carbs || "",
                fats: food.fats || food.fat || "",
                fiber: food.fiber || "",
                imageUrl: food.imageUrl || "",
                notes: food.notes || "",
              }))
            : [{ ...emptyFood }],
        }))
      : [createMeal()],
  };
}

const goalTabs = [
  { value: "cutting", label: "Cutting Diet" },
  { value: "bulking", label: "Bulking Diet" },
];

function AdminDiet() {
  const [plans, setPlans] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState("cutting");
  const [form, setForm] = useState(createPlan("cutting"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [foodLookup, setFoodLookup] = useState({});
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
    setError("");
  }, [activePlan, selectedGoal]);

  const updateMeal = (mealIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, index) => (index === mealIndex ? { ...meal, [field]: value } : meal)),
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
        index === mealIndex ? { ...meal, foods: [...meal.foods, { ...emptyFood }] } : meal
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

  const getLookupKey = (mealIndex, foodIndex) => `${mealIndex}-${foodIndex}`;

  const searchFoodNutrition = async (mealIndex, foodIndex) => {
    const key = getLookupKey(mealIndex, foodIndex);
    const query = form.meals[mealIndex]?.foods[foodIndex]?.name?.trim();

    if (!query || query.length < 2) {
      setFoodLookup((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: "Enter at least 2 letters to search nutrition data.",
          results: [],
        },
      }));
      return;
    }

    try {
      setFoodLookup((prev) => ({
        ...prev,
        [key]: { loading: true, error: "", results: [] },
      }));

      const res = await api.get("/diet-data/nutrition/search", {
        params: { q: query },
      });

      setFoodLookup((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: "",
          results: res.data.foods || [],
        },
      }));
    } catch (lookupError) {
      console.error("Food nutrition lookup error:", lookupError);
      setFoodLookup((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: lookupError.response?.data?.message || "Nutrition lookup failed.",
          results: [],
        },
      }));
    }
  };

  const applyNutritionFood = (mealIndex, foodIndex, food) => {
    setForm((prev) => ({
      ...prev,
      meals: prev.meals.map((meal, index) =>
        index === mealIndex
          ? {
              ...meal,
              foods: meal.foods.map((item, itemIndex) =>
                itemIndex === foodIndex
                  ? {
                      ...item,
                      name: food.name || item.name,
                      quantity: food.quantity || 100,
                      unit: food.unit || "g",
                      measure: food.measure || "grams",
                      calories: food.calories || 0,
                      protein: food.protein || 0,
                      carbs: food.carbs || 0,
                      fats: food.fats || 0,
                      fiber: food.fiber || 0,
                      imageUrl: food.imageUrl || item.imageUrl || "",
                      notes: food.source ? `Nutrition from ${food.source}. Values are per 100g.` : item.notes,
                    }
                  : item
              ),
            }
          : meal
      ),
    }));

    setFoodLookup((prev) => ({
      ...prev,
      [getLookupKey(mealIndex, foodIndex)]: {
        loading: false,
        error: "",
        results: [],
      },
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
            fiber: Number(food.fiber || 0),
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
    <AdminLayout title="Diet Plans" description="Manage the cutting and bulking base plans served to users">
      <div className="admin-diet-page">
        {error && <div className="admin-diet-notice error">{error}</div>}
        {success && <div className="admin-diet-notice success">{success}</div>}

        <div className="admin-diet-tabs">
          <Tabs value={selectedGoal} onValueChange={setSelectedGoal}>
            <TabsList>
              {goalTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="admin-diet-loading">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : (
          <form onSubmit={savePlan} className="admin-diet-form-large">
            <Card className="admin-diet-card">
              <CardHeader>
                <CardTitle>{selectedGoal === "cutting" ? "Cutting Diet" : "Bulking Diet"}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Plan Title</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Base Weight (kg)</Label>
                  <Input
                    type="number"
                    value={form.baseWeight}
                    onChange={(event) => setForm({ ...form, baseWeight: event.target.value })}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Target Calories</Label>
                  <Input
                    type="number"
                    value={form.targetCalories}
                    onChange={(event) => setForm({ ...form, targetCalories: event.target.value })}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Plan Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    placeholder="General notes for this plan"
                  />
                </label>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              {form.meals.map((meal, mealIndex) => (
                <Card key={mealIndex} className="admin-diet-card admin-diet-meal-panel">
                  <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                    <CardTitle className="text-sm">Meal {mealIndex + 1}</CardTitle>
                    {form.meals.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMeal(mealIndex)}
                        aria-label="Remove meal"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Meal Name</Label>
                        <Input
                          value={meal.mealName}
                          onChange={(event) => updateMeal(mealIndex, "mealName", event.target.value)}
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Meal Time</Label>
                        <Input
                          value={meal.time}
                          onChange={(event) => updateMeal(mealIndex, "time", event.target.value)}
                          placeholder="e.g. 8:00 AM"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-3">
                      {meal.foods.map((food, foodIndex) => (
                        <div key={foodIndex} className="rounded-lg border border-border bg-muted/20 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Food {foodIndex + 1}
                            </span>
                            {meal.foods.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeFood(mealIndex, foodIndex)}
                                aria-label="Remove food"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-2 sm:grid-cols-3">
                            <label className="flex flex-col gap-1 sm:col-span-3">
                              <Label className="text-xs text-muted-foreground">Food Item</Label>
                              <div className="admin-food-lookup-row">
                                <Input
                                  value={food.name}
                                  onChange={(event) => updateFood(mealIndex, foodIndex, "name", event.target.value)}
                                  placeholder="Search food, e.g. egg or chicken"
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="admin-diet-secondary-button"
                                  onClick={() => searchFoodNutrition(mealIndex, foodIndex)}
                                >
                                  {foodLookup[getLookupKey(mealIndex, foodIndex)]?.loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Search className="h-4 w-4" />
                                  )}
                                  Find
                                </Button>
                              </div>
                              {foodLookup[getLookupKey(mealIndex, foodIndex)]?.error && (
                                <span className="admin-food-lookup-error">
                                  {foodLookup[getLookupKey(mealIndex, foodIndex)].error}
                                </span>
                              )}
                              {foodLookup[getLookupKey(mealIndex, foodIndex)]?.results?.length > 0 && (
                                <div className="admin-food-lookup-results">
                                  {foodLookup[getLookupKey(mealIndex, foodIndex)].results.map((result) => (
                                    <button
                                      type="button"
                                      key={result.id}
                                      onClick={() => applyNutritionFood(mealIndex, foodIndex, result)}
                                    >
                                      {result.imageUrl ? (
                                        <img src={result.imageUrl} alt="" />
                                      ) : (
                                        <span className="admin-food-lookup-placeholder" />
                                      )}
                                      <span>
                                        <strong>{result.name}</strong>
                                        <small>
                                          {result.calories} kcal - P {result.protein}g - C {result.carbs}g - F {result.fats}g
                                        </small>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </label>

                            <label className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Quantity</Label>
                              <Input
                                type="number"
                                value={food.quantity}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "quantity", event.target.value)}
                                required
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Unit</Label>
                              <select
                                value={food.measure || (food.unit === "g" ? "grams" : food.unit) || "grams"}
                                onChange={(event) => {
                                  updateFood(mealIndex, foodIndex, "measure", event.target.value);
                                  updateFood(mealIndex, foodIndex, "unit", event.target.value === "grams" ? "g" : event.target.value);
                                }}
                              >
                                <option value="grams">grams</option>
                                <option value="ml">ml</option>
                                <option value="piece">piece</option>
                                <option value="large">large</option>
                                <option value="small">small</option>
                                <option value="cup">cup</option>
                                <option value="scoop">scoop</option>
                              </select>
                            </label>
                            <label className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Calories</Label>
                              <Input
                                type="number"
                                value={food.calories}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "calories", event.target.value)}
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Protein</Label>
                              <Input
                                type="number"
                                value={food.protein}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "protein", event.target.value)}
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Carbs</Label>
                              <Input
                                type="number"
                                value={food.carbs}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "carbs", event.target.value)}
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Fats</Label>
                              <Input
                                type="number"
                                value={food.fats}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "fats", event.target.value)}
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Fiber</Label>
                              <Input
                                type="number"
                                value={food.fiber}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "fiber", event.target.value)}
                              />
                            </label>
                            <label className="flex flex-col gap-1 sm:col-span-2">
                              <Label className="text-xs text-muted-foreground">Image URL</Label>
                              <Input
                                value={food.imageUrl}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "imageUrl", event.target.value)}
                                placeholder="Optional"
                              />
                            </label>

                            <label className="flex flex-col gap-1 sm:col-span-3">
                              <Label className="text-xs text-muted-foreground">Food Notes</Label>
                              <Textarea
                                value={food.notes}
                                onChange={(event) => updateFood(mealIndex, foodIndex, "notes", event.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="admin-diet-secondary-button gap-2 self-start"
                      onClick={() => addFood(mealIndex)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Food
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" className="admin-diet-secondary-button gap-2" onClick={addMeal}>
                <Plus className="h-4 w-4" />
                Add Meal
              </Button>

              <Button type="submit" disabled={saving} className="admin-diet-save-button gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Base Diet"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDiet;
