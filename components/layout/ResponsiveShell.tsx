"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MessageSquare,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";

export type IconKey =
  | "home"
  | "dashboard"
  | "briefcase"
  | "building"
  | "file"
  | "users"
  | "user"
  | "messages"
  | "doubts"
  | "reports"
  | "courses"
  | "contests"
  | "quick";

export type BottomNavItem = {
  href: string;
  label: string;
  icon: IconKey;
  match?: "exact" | "prefix";
};

const iconMap: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  home: Home,
  dashboard: LayoutDashboard,
  briefcase: Briefcase,
  building: Building2,
  file: FileText,
  users: Users,
  user: User,
  messages: MessageSquare,
  doubts: MessageCircle,
  reports: BarChart3,
  courses: BookOpen,
  contests: Trophy,
  quick: Zap,
};

function isActivePath(pathname: string, item: BottomNavItem) {
  const match = item.match ?? "prefix";
  if (match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type ResponsiveShellProps = {
  sidebar: React.ReactNode;
  headerTitle: React.ReactNode;
  headerRight?: React.ReactNode;
  bottomNav?: BottomNavItem[];
  wrapperClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export default function ResponsiveShell({
  sidebar,
  headerTitle,
  headerRight,
  bottomNav,
  wrapperClassName,
  headerClassName,
  contentClassName,
  children,
}: ResponsiveShellProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  const bottomPaddingClass = useMemo(() => {
    if (!bottomNav?.length) return "pb-[env(safe-area-inset-bottom)] md:pb-0";
    return "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0";
  }, [bottomNav]);

  return (
    <div className={clsx("flex min-h-[100dvh] overflow-hidden", wrapperClassName)}>
      <div className="hidden md:block">{sidebar}</div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={clsx(
            "sticky top-0 z-40 flex items-center justify-between border-b px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur md:hidden",
            headerClassName ?? "border-white/10 bg-black/40"
          )}
        >
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 ring-1 ring-white/10 hover:bg-white/5 active:scale-[0.98]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 px-3 text-center text-sm font-semibold text-white">
            <div className="truncate">{headerTitle}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center">
            {headerRight ?? <div className="h-10 w-10" />}
          </div>
        </header>

        <div className={clsx("min-h-0 flex-1 overflow-y-auto", bottomPaddingClass, contentClassName)}>
          {children}
        </div>
      </div>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-[100dvh] w-[min(22rem,88vw)] overflow-hidden border-r border-white/10 bg-black/80 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-end border-b border-white/10 px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 ring-1 ring-white/10 hover:bg-white/5 active:scale-[0.98]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="h-[calc(100dvh_-_3.25rem_-_env(safe-area-inset-top))] overflow-y-auto"
              onClickCapture={(event) => {
                const target = event.target as HTMLElement | null;
                const anchor = target?.closest?.("a");
                if (anchor) setIsDrawerOpen(false);
              }}
            >
              {sidebar}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      {bottomNav?.length ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
            {bottomNav.map((item) => {
              const active = isActivePath(pathname, item);
              const Icon = iconMap[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                    active ? "text-white" : "text-white/60 hover:text-white"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={clsx("h-5 w-5", active ? "text-white" : "text-white/60")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
