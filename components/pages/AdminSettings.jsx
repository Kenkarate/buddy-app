"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import adminApi from "@/lib/adminApi";

// Plans that support subscription billing. personal-training is always one-time.
const SUBSCRIPTION_CAPABLE = new Set(["normal-workouts", "home-workout"]);

const KNOWN_PLANS = [
  { planKey: "normal-workouts", title: "Normal Workout" },
  { planKey: "home-workout", title: "Home Workout" },
  { planKey: "personal-training", title: "Personal Training" },
];

function AdminSettings() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminApi.get("/admin/pricing");
      const byKey = new Map((res.data || []).map((plan) => [plan.planKey, plan]));

      // Merge DB rows with the known plan list so unseeded plans still show up.
      setPlans(
        KNOWN_PLANS.map((known) => {
          const existing = byKey.get(known.planKey);
          const defaultMonthly = SUBSCRIPTION_CAPABLE.has(known.planKey);
          return {
            planKey: known.planKey,
            title: existing?.title || known.title,
            baseAmount: existing?.baseAmount ?? "",
            baseCurrency: existing?.baseCurrency || "INR",
            monthly: existing ? existing.monthly !== false : defaultMonthly,
          };
        })
      );
    } catch (loadError) {
      setError(loadError.message || "Could not load pricing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const updateField = (planKey, field, value) => {
    setPlans((prev) =>
      prev.map((plan) => (plan.planKey === planKey ? { ...plan, [field]: value } : plan))
    );
  };

  const savePlan = async (plan) => {
    try {
      setSavingKey(plan.planKey);
      setSavedKey("");
      setError("");
      await adminApi.put(`/admin/pricing/${plan.planKey}`, {
        title: plan.title,
        baseCurrency: plan.baseCurrency || "INR",
        baseAmount: Number(plan.baseAmount),
        isActive: true,
        monthly: plan.monthly,
      });
      setSavedKey(plan.planKey);
    } catch (saveError) {
      setError(saveError.message || "Could not save price.");
    } finally {
      setSavingKey("");
    }
  };

  return (
    <AdminLayout title="Settings" description="Edit plan pricing without a code deploy">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div>
            <h2 className="text-sm font-semibold">Plan pricing</h2>
            <p className="text-xs text-muted-foreground">
              Base price in INR. Other currencies are converted automatically at checkout.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {KNOWN_PLANS.map((plan) => (
                <Skeleton key={plan.planKey} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.planKey}
                className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
              >
                <div className="min-w-40 flex-1">
                  <p className="font-medium">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">{plan.planKey}</p>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Price (₹)</span>
                  <Input
                    type="number"
                    min="0"
                    value={plan.baseAmount}
                    onChange={(event) => updateField(plan.planKey, "baseAmount", event.target.value)}
                    className="w-32"
                  />
                </label>

                {SUBSCRIPTION_CAPABLE.has(plan.planKey) && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Billing</span>
                    <div className="flex rounded-md border overflow-hidden text-sm">
                      <button
                        type="button"
                        onClick={() => updateField(plan.planKey, "monthly", true)}
                        className={`px-3 py-1.5 transition-colors ${
                          plan.monthly
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Subscription
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField(plan.planKey, "monthly", false)}
                        className={`px-3 py-1.5 transition-colors ${
                          !plan.monthly
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        One-time
                      </button>
                    </div>
                  </label>
                )}

                <Button
                  onClick={() => savePlan(plan)}
                  disabled={savingKey === plan.planKey || plan.baseAmount === ""}
                  className="gap-2"
                >
                  {savingKey === plan.planKey && <Loader2 className="h-4 w-4 animate-spin" />}
                  {savedKey === plan.planKey ? "Saved" : "Save"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default AdminSettings;
