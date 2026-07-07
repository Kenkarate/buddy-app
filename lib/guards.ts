import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasActivePurchase } from "@/lib/payments";

// Server-side page guards (used by Server Component pages) that replace the old
// client-side ProtectedRoute / PlanRoute / AdminRoute. They run before render so
// there is no unauthorized content flash. Authentication is also enforced by
// proxy.ts; these add the role/plan checks that need a DB lookup.

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");
  if (user.role !== "admin") redirect("/admin-login");
  return user;
}

// Ensures the user holds an active purchase for at least one of `plans`,
// otherwise redirects to the payment page for `paymentPlan`.
export async function requirePlan(plans: string[], paymentPlan: string) {
  const user = await requireAuth();
  const allowed = plans.some((plan) => hasActivePurchase(user, plan));
  if (!allowed) redirect(`/payment/${paymentPlan}`);
  return user;
}
