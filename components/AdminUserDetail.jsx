"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import adminApi from "@/lib/adminApi";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const PLAN_OPTIONS = [
  { value: "normal-workouts", label: "Normal Workout" },
  { value: "home-workout", label: "Home Workout" },
  { value: "personal-training", label: "Personal Training" },
];

const PLAN_LABELS = Object.fromEntries(PLAN_OPTIONS.map((p) => [p.value, p.label]));

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isActivePurchase(purchase) {
  if (purchase.paymentStatus !== "paid") return false;
  if (!purchase.planExpiryDate) return true;
  return new Date(purchase.planExpiryDate) > new Date();
}

// Detail drawer for a single user. Loads the enriched admin profile
// (purchases, payments, activity, support tickets) and hosts the plan
// grant/extend/revoke actions. `userId` opens it; `onChanged` lets the parent
// list refresh after a plan mutation.
function AdminUserDetail({ userId, open, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [grantPlanKey, setGrantPlanKey] = useState("normal-workouts");
  const [grantMonths, setGrantMonths] = useState("1");
  const [actionBusy, setActionBusy] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError("");
      const res = await adminApi.get(`/admin/users/${userId}`);
      setDetail(res.data);
    } catch (loadError) {
      setError(loadError.message || "Could not load user.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!open || !userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [open, userId, load]);

  const runAction = async (key, request) => {
    try {
      setActionBusy(key);
      setError("");
      await request();
      await load();
      onChanged?.();
    } catch (actionError) {
      setError(actionError.message || "Action failed.");
    } finally {
      setActionBusy("");
    }
  };

  const grant = () =>
    runAction("grant", () =>
      adminApi.post(`/admin/users/${userId}/grant-plan`, {
        plan: grantPlanKey,
        durationMonths: Number(grantMonths) || 1,
      })
    );

  const extend = (plan) =>
    runAction(`extend-${plan}`, () =>
      adminApi.post(`/admin/users/${userId}/extend-plan`, { plan, addMonths: 1 })
    );

  const revoke = (plan) =>
    runAction(`revoke-${plan}`, () =>
      adminApi.post(`/admin/users/${userId}/revoke-plan`, { plan })
    );

  const user = detail?.user;
  const purchases = user?.purchasedPlans || [];
  const payments = detail?.payments || [];
  const events = detail?.events || [];
  const tickets = detail?.tickets || [];

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{user?.name || "User details"}</SheetTitle>
          <SheetDescription>{user?.email}</SheetDescription>
        </SheetHeader>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && !detail ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : user ? (
          <Tabs defaultValue="plans" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            {/* Plans: grant / extend / revoke */}
            <TabsContent value="plans" className="flex flex-col gap-4">
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Grant a plan
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <Select value={grantPlanKey} onValueChange={setGrantPlanKey}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={grantMonths} onValueChange={setGrantMonths}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 6, 12].map((month) => (
                        <SelectItem key={month} value={String(month)}>
                          {month} mo
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={grant} disabled={actionBusy === "grant"} className="gap-2">
                    {actionBusy === "grant" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Grant
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Current plans
                </p>
                {purchases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchases yet.</p>
                ) : (
                  purchases.map((purchase) => {
                    const active = isActivePurchase(purchase);
                    return (
                      <div
                        key={purchase.plan + (purchase.purchaseDate || "")}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {PLAN_LABELS[purchase.plan] || purchase.plan}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {active ? "Expires" : "Expired"} {formatDate(purchase.planExpiryDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={active ? "success" : "muted"}>
                            {active ? "active" : purchase.paymentStatus}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extend(purchase.plan)}
                            disabled={actionBusy === `extend-${purchase.plan}`}
                          >
                            +1 mo
                          </Button>
                          {active && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => revoke(purchase.plan)}
                              disabled={actionBusy === `revoke-${purchase.plan}`}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Payments */}
            <TabsContent value="payments" className="flex flex-col gap-2">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{PLAN_LABELS[payment.planKey] || payment.planKey}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.paidAt || payment.createdAt)} · {payment.paymentProvider || "—"}
                      </p>
                    </div>
                    <span className="font-medium">
                      {payment.amount ? `${payment.currency || ""} ${payment.amount}` : "Comp"}
                    </span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Activity */}
            <TabsContent value="activity" className="flex flex-col gap-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                events.map((event) => (
                  <div key={event._id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                    <span className="truncate">
                      {event.eventType} · {event.workoutName || event.source}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Support */}
            <TabsContent value="support" className="flex flex-col gap-2">
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No support tickets.</p>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket._id} className="rounded-lg border p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-medium">{ticket.subject || ticket.type || "Issue"}</span>
                      <Badge variant={ticket.status === "closed" ? "muted" : "default"}>
                        {ticket.status}
                      </Badge>
                    </div>
                    {ticket.message && (
                      <p className="text-xs text-muted-foreground">{ticket.message}</p>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default AdminUserDetail;
