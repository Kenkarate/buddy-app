"use client";

// React Router -> Next App Router compatibility shims. Lets the ported pages
// keep using `useNavigate()`, `useLocation()`, `<Link to>`, `<NavLink to>` and
// `useParams()` almost verbatim, mapping them onto next/navigation.
import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
} from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, opts?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (opts?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();
  // react-router's location.state is not available in the App Router; callers
  // that relied on it fall back to null.
  return { pathname: pathname || "/", search: "", hash: "", state: null };
}

export const useParams = useNextParams;

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  to: string;
  children?: ReactNode;
};

export function Link({ to, children, ...props }: LinkProps) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

type NavLinkProps = Omit<ComponentProps<typeof NextLink>, "href" | "className"> & {
  to: string;
  end?: boolean;
  className?: string | ((args: { isActive: boolean }) => string);
  children?: ReactNode | ((args: { isActive: boolean }) => ReactNode);
};

export function NavLink({ to, end, className, children, ...props }: NavLinkProps) {
  const pathname = usePathname() || "/";
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const cls = typeof className === "function" ? className({ isActive }) : className;
  const content = typeof children === "function" ? children({ isActive }) : children;
  return (
    <NextLink href={to} className={cls} {...props}>
      {content}
    </NextLink>
  );
}
