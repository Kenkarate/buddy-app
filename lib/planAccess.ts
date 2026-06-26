export const PLAN_ROUTES: Record<string, string> = {
  "normal-workouts": "/normal-workout",
  "home-workout": "/home-workout",
  "personal-training": "/personal-training",
};

export const PLAN_DETAILS: Record<string, { key: string; title: string; price: string }> = {
  pte: { key: "personal-training", title: "Personal Training", price: "₹999" },
  "personal-training": { key: "personal-training", title: "Personal Training", price: "₹999" },
  normal: { key: "normal-workouts", title: "Normal Workout", price: "₹80" },
  "normal-workout": { key: "normal-workouts", title: "Normal Workout", price: "₹80" },
  "normal-workouts": { key: "normal-workouts", title: "Normal Workout", price: "₹80" },
  home: { key: "home-workout", title: "Home Workout", price: "₹150" },
  "home-workout": { key: "home-workout", title: "Home Workout", price: "₹150" },
  "home-workouts": { key: "home-workout", title: "Home Workout", price: "₹150" },
};

// Plans billed as auto-renewing monthly subscriptions (vs one-time payment).
// Must mirror SUBSCRIPTION_PROGRAMS in lib/payments.ts.
// Empty when the Razorpay Subscriptions addon is not enabled on the account.
export const SUBSCRIPTION_PLANS = new Set<string>([]);

export function normalizePlan(program: unknown): string {
  const plan = PLAN_DETAILS[String(program || "").trim().toLowerCase()];
  return plan?.key || "";
}

export function isSubscriptionPlan(program: unknown): boolean {
  return SUBSCRIPTION_PLANS.has(normalizePlan(program));
}

export function getPlanDetails(program: unknown) {
  const normalized = normalizePlan(program);
  return PLAN_DETAILS[normalized] || PLAN_DETAILS["normal-workouts"];
}

export function getPlanRoute(program: unknown): string {
  return PLAN_ROUTES[normalizePlan(program)] || "/workouts";
}

export async function routeAfterPlanSelection({
  api,
  navigate,
  program,
  replace = false,
}: {
  api: { post: (url: string, body: unknown) => Promise<{ data: any }> };
  navigate: (path: string, opts?: { replace?: boolean }) => void;
  program: unknown;
  replace?: boolean;
}) {
  const normalized = normalizePlan(program);

  if (!normalized) {
    navigate("/", { replace });
    return;
  }

  localStorage.setItem("buddyPendingProgram", normalized);

  const res = await api.post("/payments/select-plan", { program: normalized });
  const nextUser = res.data.user;

  if (nextUser) {
    localStorage.setItem("buddyUser", JSON.stringify(nextUser));
    localStorage.setItem("buddySelectedProgram", res.data.program || normalized);
  }

  if (res.data.purchased) {
    localStorage.removeItem("buddyPendingProgram");
    localStorage.setItem("buddyPaymentStatus", "paid");
    navigate(res.data.redirectPath || getPlanRoute(normalized), { replace });
    return;
  }

  navigate(res.data.paymentPath || `/payment/${normalized}`, { replace });
}
