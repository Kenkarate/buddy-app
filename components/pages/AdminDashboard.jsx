"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Eye,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import adminApi from "@/lib/adminApi";

const statConfig = [
  ["totalUsers", "Total Users", Users],
  ["paidUsers", "Paid Users", CreditCard],
  ["freeUsers", "Free Users", Users],
  ["newUsersThisWeek", "New This Week", UserPlus],
  ["totalWorkouts", "Workout Library", Dumbbell],
  ["totalAssignedDailyWorkouts", "Daily Plans", CalendarCheck],
  ["totalAssignedWeeklyWorkouts", "Weekly Plans", CalendarCheck],
  ["workoutViews", "Workout Views", Eye],
  ["workoutsCheckedByUsers", "Completed", TrendingUp],
];

const AUTO_REFRESH_MS = 30000;

const PLAN_LABELS = {
  "normal-workouts": "Normal Workout",
  "home-workout": "Home Workout",
  "personal-training": "Personal Training",
};

function planLabel(plan) {
  return PLAN_LABELS[plan] || plan || "Unknown";
}

function formatTimeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [topWorkouts, setTopWorkouts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const [summaryRes, activityRes, topRes, expiringRes] = await Promise.all([
        adminApi.get("/admin/analytics/summary"),
        adminApi.get("/admin/analytics/recent-activity"),
        adminApi.get("/admin/analytics/top-workouts"),
        adminApi.get("/admin/analytics/expiring"),
      ]);

      setSummary(summaryRes.data || {});
      setActivity(activityRes.data?.activity || []);
      setTopWorkouts(topRes.data?.workouts || []);
      setExpiring(expiringRes.data?.expiring || []);
      setLastUpdated(new Date());
    } catch (loadError) {
      console.error("Admin analytics error:", loadError);
      setError("Could not load analytics. Make sure the server is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const interval = setInterval(() => loadAnalytics({ silent: true }), AUTO_REFRESH_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadAnalytics({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [loadAnalytics]);

  const refreshButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => loadAnalytics({ silent: true })}
      disabled={loading || refreshing}
      className="admin-refresh-button"
      aria-label="Refresh dashboard"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      <span>{refreshing ? "Syncing" : "Sync"}</span>
    </Button>
  );

  return (
    <AdminLayout
      title="Dashboard"
      description="Live overview of users, workouts, and engagement"
      actions={refreshButton}
    >
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {lastUpdated && !loading && (
        <p className="admin-last-updated">Updated {formatTimeAgo(lastUpdated)}</p>
      )}

      {loading ? (
        <div className="admin-mobile-stat-grid admin-loading-grid">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="admin-dashboard-stack">
          <section className="admin-mobile-stat-grid">
            {statConfig.map(([key, label, Icon]) => (
              <Card key={key} className="admin-stat-card-mobile">
                <CardContent className="flex flex-col gap-2 p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <strong className="text-2xl font-bold leading-none">{summary?.[key] ?? 0}</strong>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </CardContent>
              </Card>
            ))}
          </section>

          <div className="admin-dashboard-stack">
            <Card>
              <CardHeader>
                <CardTitle>Top Workouts</CardTitle>
                <p className="text-xs text-muted-foreground">Views vs. completions, all time</p>
              </CardHeader>
              <CardContent>
                {topWorkouts.length === 0 ? (
                  <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    No workout events yet.
                  </div>
                ) : (
                  <div className="admin-chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topWorkouts.slice(0, 6)}
                        layout="vertical"
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#273247" horizontal={false} />
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={96}
                          tick={{ fill: "#a9b2c3", fontSize: 10 }}
                          tickFormatter={(value) =>
                            String(value).length > 14 ? `${String(value).slice(0, 14)}...` : value
                          }
                        />
                        <RechartsTooltip
                          contentStyle={{ background: "#131b28", border: "1px solid #273247", borderRadius: 10 }}
                          labelStyle={{ color: "#f7f8fb" }}
                        />
                        <Bar dataKey="views" name="Views" fill="#2dd4bf" radius={[0, 6, 6, 0]} barSize={10} />
                        <Bar dataKey="completions" name="Completions" fill="#f6c85f" radius={[0, 6, 6, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    Most used category
                  </div>
                  <strong className="text-sm">{summary?.mostUsedWorkoutCategory || "Not available"}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    Revenue this month
                  </div>
                  <strong className="text-sm">
                    &#8377;{(summary?.paymentsThisMonth || 0).toLocaleString("en-IN")} ({summary?.paymentsThisMonthCount || 0})
                  </strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Active subscribers
                  </div>
                  <strong className="text-sm">{summary?.activeSubscribers ?? 0}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Paid conversion
                  </div>
                  <strong className="text-sm">{summary?.conversionRate ?? 0}%</strong>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="admin-dashboard-stack">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <p className="text-xs text-muted-foreground">
                  All-time paid revenue · &#8377;{(summary?.totalRevenue || 0).toLocaleString("en-IN")} total
                </p>
              </CardHeader>
              <CardContent>
                {(summary?.revenueByPlan || []).length === 0 ? (
                  <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    No payments recorded yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {summary.revenueByPlan.map((row) => (
                      <div
                        key={row.plan}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3 text-sm"
                      >
                        <span className="font-medium">{planLabel(row.plan)}</span>
                        <span className="text-muted-foreground">
                          &#8377;{(row.amount || 0).toLocaleString("en-IN")} · {row.count} sale{row.count === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expiring Soon</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Plans expiring in the next 7 days ({summary?.expiringSoon ?? expiring.length})
                </p>
              </CardHeader>
              <CardContent>
                {expiring.length === 0 ? (
                  <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    Nothing expiring this week.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {expiring.slice(0, 8).map((item) => (
                      <div
                        key={`${item.userId}-${item.plan}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.name || item.email}</p>
                          <p className="truncate text-xs text-muted-foreground">{planLabel(item.plan)}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(item.planExpiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Live feed of registrations, workouts, and admin actions</p>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  Activity will appear once users interact.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activity.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.detail} · {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;
