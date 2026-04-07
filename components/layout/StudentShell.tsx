"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { BookOpen, Home, Trophy, User, Zap } from "lucide-react";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/practice", label: "Practice", icon: Zap },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/contest", label: "Contests", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="relative md:block">
      <div className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
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
    </div>
  );
}

