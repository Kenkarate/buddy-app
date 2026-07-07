// Shapes the public user object returned by auth endpoints. Matches the
// serializeUser() from the old authRoutes.js so the frontend's stored
// `buddyUser` keeps the same shape.
export function serializeUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    selectedProgram: user.selectedProgram,
    selectedPlan: user.selectedPlan,
    subscriptionStatus: user.subscriptionStatus,
    paymentStatus: user.paymentStatus,
    purchasedPlans: user.purchasedPlans || [],
    avatarUrl: user.avatarUrl,
  };
}
