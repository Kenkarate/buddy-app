export function round(value: unknown): number {
  return Math.round((Number(value || 0) + Number.EPSILON) * 10) / 10;
}

export function getLatestWeight(user: any): number | null {
  if (user?.weight) return Number(user.weight);

  const records = Array.isArray(user?.weightRecords) ? user.weightRecords : [];
  if (!records.length) return null;

  const latest = records
    .slice()
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  return latest?.weight ? Number(latest.weight) : null;
}

export function scalePlan(plan: any, userWeight: number | null) {
  const object = typeof plan.toObject === "function" ? plan.toObject() : plan;
  const baseWeight = Number(object.baseWeight || 70);
  const factor = userWeight ? userWeight / baseWeight : 1;

  return {
    ...object,
    userWeight,
    adjustmentFactor: round(factor),
    isPersonalized: Boolean(userWeight),
    personalizedMessage: userWeight
      ? `Adjusted for ${userWeight}kg.`
      : "Add your weight to get a personalized diet.",
    adjustedTargetCalories: round(
      (object.targetCalories || object.maxCalories || 0) * factor
    ),
    meals: (object.meals || []).map((meal: any) => ({
      ...meal,
      foods: (meal.foods || []).map((food: any) => ({
        ...food,
        adjustedQuantity: round((food.quantity || 0) * factor),
        adjustedCalories: round((food.calories || 0) * factor),
        adjustedProtein: round((food.protein || 0) * factor),
        adjustedCarbs: round((food.carbs || 0) * factor),
        adjustedFats: round((food.fats || food.fat || 0) * factor),
        adjustedFiber: round((food.fiber || 0) * factor),
      })),
    })),
  };
}

export function normalizeFoodProduct(product: any) {
  const nutriments = product.nutriments || {};
  const name =
    product.product_name || product.generic_name || product.brands || "Food item";

  return {
    id: product.code || `${name}-${Math.random().toString(36).slice(2)}`,
    name,
    brand: product.brands || "",
    quantity: 100,
    unit: "g",
    measure: "grams",
    servingSize: product.serving_size || product.quantity || "100 g",
    calories: round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0),
    protein: round(nutriments.proteins_100g || nutriments.proteins || 0),
    carbs: round(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0),
    fats: round(nutriments.fat_100g || nutriments.fat || 0),
    fiber: round(nutriments.fiber_100g || nutriments.fiber || 0),
    imageUrl: product.image_front_url || product.image_url || "",
    source: "Open Food Facts",
  };
}
