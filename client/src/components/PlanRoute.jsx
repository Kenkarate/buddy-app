import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api/api";
import { normalizePlan } from "../utils/planAccess";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddyUser") || "{}");
  } catch {
    localStorage.removeItem("buddyUser");
    return {};
  }
}

function hasActiveLocalPurchase(user, plan) {
  const now = Date.now();

  return (user.purchasedPlans || []).some((purchase) => {
    const expiry = purchase.planExpiryDate
      ? new Date(purchase.planExpiryDate).getTime()
      : null;

    return (
      purchase.plan === plan &&
      purchase.paymentStatus === "paid" &&
      (!expiry || expiry > now)
    );
  });
}

function PlanRoute({ children, plan, anyPlans = [] }) {
  const location = useLocation();
  const token = localStorage.getItem("buddyToken");
  const targetPlan = normalizePlan(plan);
  const acceptedPlans = anyPlans.map(normalizePlan).filter(Boolean);

  const [status, setStatus] = useState({
    loading: true,
    allowed: false,
    paymentPath: targetPlan ? `/payment/${targetPlan}` : "/",
  });

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      if (!token) {
        setStatus({ loading: false, allowed: false, paymentPath: "/" });
        return;
      }

      if (acceptedPlans.length) {
        try {
          const profileRes = await api.get("/auth/profile");
          const user = profileRes.data;
          localStorage.setItem("buddyUser", JSON.stringify(user));

          const allowed = acceptedPlans.some((acceptedPlan) => {
            const legacyAllowed =
              user.selectedProgram === acceptedPlan &&
              user.subscriptionStatus === "paid";
            return hasActiveLocalPurchase(user, acceptedPlan) || legacyAllowed;
          });

          if (!cancelled) {
            setStatus({
              loading: false,
              allowed,
              paymentPath: `/payment/${acceptedPlans[0]}`,
            });
          }
        } catch {
          if (!cancelled) {
            setStatus({
              loading: false,
              allowed: false,
              paymentPath: `/payment/${acceptedPlans[0]}`,
            });
          }
        }
        return;
      }

      try {
        const res = await api.get(`/payments/access/${targetPlan}`);
        localStorage.setItem("buddyUser", JSON.stringify(res.data.user));

        if (!cancelled) {
          setStatus({
            loading: false,
            allowed: Boolean(res.data.purchased),
            paymentPath: res.data.paymentPath || `/payment/${targetPlan}`,
          });
        }
      } catch {
        if (!cancelled) {
          setStatus({
            loading: false,
            allowed: false,
            paymentPath: `/payment/${targetPlan}`,
          });
        }
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [acceptedPlans.join(","), targetPlan, token]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (status.loading) {
    return (
      <div className="mobile-shell">
        <main className="page-content">
          <div className="elite-workout-page">
            <div className="skeleton-panel tall" />
            <div className="skeleton-grid">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!status.allowed) {
    const pendingPlan = targetPlan || acceptedPlans[0] || "";
    if (pendingPlan) {
      localStorage.setItem("buddyPendingProgram", pendingPlan);
    }

    return <Navigate to={status.paymentPath} replace />;
  }

  return children;
}

export default PlanRoute;
