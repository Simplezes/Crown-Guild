import type { UserSummary } from "@/server/services/summary";

export interface ShellUser {
  id: string;
  name: string;
  image: string | null;
}

export type ShellSummary = UserSummary;

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home", match: (path) => path === "/" },
  {
    href: "/investigation",
    label: "Monsters",
    icon: "monsters",
    match: (path) => path.startsWith("/investigation") || path.startsWith("/monster"),
  },
  {
    href: "/compare",
    label: "Compare",
    icon: "compare",
    match: (path) => path.startsWith("/compare"),
  },
];

export function titleFor(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/investigation")) return "Monsters";
  if (pathname.startsWith("/monster")) return "Monster";
  if (pathname.startsWith("/compare")) return "Compare";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Crown Guild";
}
