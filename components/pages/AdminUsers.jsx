"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import adminApi from "@/lib/adminApi";
import AdminUserDetail from "@/components/AdminUserDetail";

const planLabels = {
  "normal-workouts": "Normal Workout",
  "home-workout": "Home Workout",
  "personal-training": "Personal Training",
  "": "No plan",
};

const subscriptionOptions = [
  { value: "all", label: "All statuses" },
  { value: "none", label: "None" },
  { value: "trial", label: "Trial" },
  { value: "paid", label: "Paid" },
  { value: "expired", label: "Expired" },
];

const planOptions = [
  { value: "all", label: "All plans" },
  { value: "personal-training", label: "Personal Training" },
  { value: "normal-workouts", label: "Normal Workout" },
  { value: "home-workout", label: "Home Workout" },
  { value: "", label: "No plan" },
];

const editSubscriptionOptions = subscriptionOptions.filter((option) => option.value !== "all");
const editPlanOptions = planOptions.filter((option) => option.value !== "all");

function statusVariant(status) {
  if (status === "paid") return "success";
  if (status === "trial") return "default";
  if (status === "expired") return "destructive";
  return "muted";
}

function getChosenWorkout(user = {}) {
  const activePurchase = (user.purchasedPlans || []).find((purchase) => purchase.paymentStatus === "paid");
  const plan = user.selectedPlan || user.selectedProgram || activePurchase?.plan;
  return planLabels[plan] ?? "No workout chosen";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ subscriptionStatus: "none", selectedPlan: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [detailUserId, setDetailUserId] = useState(null);

  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (subscriptionFilter !== "all") params.set("subscriptionStatus", subscriptionFilter);
      if (planFilter !== "all") params.set("selectedPlan", planFilter);
      params.set("page", String(page));
      params.set("limit", String(pagination.limit));

      const res = await adminApi.get(`/admin/users?${params.toString()}`);
      setUsers(res.data || []);
      setPagination({
        page: res.meta?.page || 1,
        limit: res.meta?.limit || 20,
        total: res.meta?.total || 0,
        totalPages: res.meta?.totalPages || 1,
      });
    } catch (loadError) {
      console.error("Admin users error:", loadError);
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, subscriptionFilter, planFilter, pagination.limit]);

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, subscriptionFilter, planFilter]);

  const openEdit = (user) => {
    setEditUser(user);
    setEditError("");
    setEditForm({
      subscriptionStatus: user.subscriptionStatus || "none",
      selectedPlan: user.selectedPlan || user.selectedProgram || "",
    });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    try {
      setSavingEdit(true);
      setEditError("");
      const res = await adminApi.patch(`/admin/users/${editUser.id}`, editForm);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editUser.id
            ? {
                ...user,
                subscriptionStatus: res.data.user.subscriptionStatus,
                selectedPlan: res.data.user.selectedPlan,
                selectedProgram: res.data.user.selectedProgram,
              }
            : user
        )
      );
      setEditUser(null);
    } catch (saveError) {
      console.error("Admin update user error:", saveError);
      setEditError(saveError.message || "Could not update user.");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      setDeleting(true);
      setDeleteError("");
      await adminApi.delete(`/admin/users/${deleteUser.id}`);
      setDeleteUser(null);
      if (users.length === 1 && pagination.page > 1) {
        loadUsers(pagination.page - 1);
      } else {
        loadUsers(pagination.page);
      }
    } catch (deleteErr) {
      console.error("Admin delete user error:", deleteErr);
      setDeleteError(deleteErr.message || "Could not delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name || "Buddy User"}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: "plan",
        header: "Plan",
        accessorFn: (row) => getChosenWorkout(row),
        cell: ({ row }) => <span className="text-sm">{getChosenWorkout(row.original)}</span>,
      },
      {
        accessorKey: "subscriptionStatus",
        header: "Subscription",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.subscriptionStatus)}>
            {row.original.subscriptionStatus || "none"}
          </Badge>
        ),
      },
      {
        id: "engagement",
        header: "Engagement",
        accessorFn: (row) => row.workoutsViewed || 0,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.workoutsViewed || 0} viewed · {row.original.workoutsCompleted || 0} done
          </span>
        ),
      },
      {
        accessorKey: "joinedDate",
        header: "Joined",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.joinedDate)}</span>,
      },
      {
        accessorKey: "lastActiveDate",
        header: "Last Active",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.lastActiveDate)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDetailUserId(row.original.id)}
              aria-label="View user"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => openEdit(row.original)} aria-label="Edit user">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setDeleteError("");
                setDeleteUser(row.original);
              }}
              aria-label="Delete user"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <AdminLayout title="Users" description="Search, filter, and manage registered users">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email"
              className="pl-9"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Subscription</span>
          <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Plan</span>
          <Select
            value={planFilter === "" ? "none-plan" : planFilter}
            onValueChange={(value) => setPlanFilter(value === "none-plan" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planOptions.map((option) => (
                <SelectItem key={option.value || "none"} value={option.value || "none-plan"}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-end justify-start sm:justify-end">
          <Badge variant="muted" className="px-3 py-1.5 text-xs">
            {pagination.total} user{pagination.total === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortState = header.column.getIsSorted();
                      const sortable = header.column.getCanSort();
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : sortable ? (
                            <button
                              type="button"
                              className="flex items-center gap-1 uppercase tracking-wide"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sortState === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : sortState === "desc" ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && users.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => loadUsers(pagination.page - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadUsers(pagination.page + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {editError}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Subscription Status</span>
              <Select
                value={editForm.subscriptionStatus}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, subscriptionStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editSubscriptionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Plan</span>
              <Select
                value={editForm.selectedPlan || "none-plan"}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, selectedPlan: value === "none-plan" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editPlanOptions.map((option) => (
                    <SelectItem key={option.value || "none"} value={option.value || "none-plan"}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="gap-2">
              {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteUser)} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This permanently deletes {deleteUser?.name || deleteUser?.email} and their workout history. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminUserDetail
        userId={detailUserId}
        open={Boolean(detailUserId)}
        onClose={() => setDetailUserId(null)}
        onChanged={() => loadUsers(pagination.page)}
      />
    </AdminLayout>
  );
}

export default AdminUsers;
