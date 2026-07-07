import UserLayout from "@/components/UserLayout";

// Wraps every user-facing page in the mobile shell (top bar + FooterNav).
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
