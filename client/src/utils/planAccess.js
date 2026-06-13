export const PLAN_ROUTES = {
  "normal-workouts": "/normal-workout",
  "home-workout": "/home-workout",
  "personal-training": "/personal-training",
};

export const PLAN_DETAILS = {
  pte: {
    key: "personal-training",
    title: "Personal Training",
    price: "₹999",
  },
  "personal-training": {
    key: "personal-training",
    title: "Personal Training",
    price: "₹999",
  },
  normal: {
    key: "normal-workouts",
    title: "Normal Workout",
    price: "₹80",
  },
  "normal-workout": {
    key: "normal-workouts",
    title: "Normal Workout",
    price: "₹80",
  },
  "normal-workouts": {
    key: "normal-workouts",
    title: "Normal Workout",
    price: "₹80",
  },
  home: {
    key: "home-workout",
    title: "Home Workout",
    price: "₹150",
  },
  "home-workout": {
    key: "home-workout",
    title: "Home Workout",
    price: "₹150",
  },
  "home-workouts": {
    key: "home-workout",
    title: "Home Workout",
    price: "₹150",
  },
};

export function normalizePlan(program) {
  const plan = PLAN_DETAILS[String(program || "").trim().toLowerCase()];
  return plan?.key || "";
}

export function getPlanDetails(program) {
  const normalized = normalizePlan(program);
  return PLAN_DETAILS[normalized] || PLAN_DETAILS["normal-workouts"];
}

export function getPlanRoute(program) {
  return PLAN_ROUTES[normalizePlan(program)] || "/workouts";
}

export async function routeAfterPlanSelection({ api, navigate, program, replace = false }) {
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
