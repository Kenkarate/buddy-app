import { requireAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";

// Server-side admin gate. Admin pages render their own AdminShell/AdminLayout,
// so this layout only enforces the admin role (redirects to /admin-login).
export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
