"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BookOpen,
  Code,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import TeacherDoubtsBadge from "@/components/TeacherDoubtsBadge";

type TeacherSidebarProps = {
  name: string;
  email: string;
};

const navItems = [
  { label: "My Courses", href: "/teacher/courses", icon: BookOpen },
  { label: "Students", href: "/teacher/students", icon: Users },
  { label: "Analytics", href: "/teacher/analytics", icon: LayoutDashboard },
  { label: "Referrals", href: "/teacher/referrals", icon: Ticket },
  { label: "Reviews", href: "/teacher/reviews", icon: MessageSquare },
  { label: "Doubts", href: "/teacher/doubts", icon: MessageCircle, badge: true },
  { label: "Contests", href: "/teacher/contest", icon: Trophy },
  { label: "Hackathons", href: "/teacher/hackathon", icon: Code },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TeacherSidebar({ name, email }: TeacherSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full md:w-64 flex-col border-r border-gray-800 bg-[#111111] text-white">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Teacher Portal
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative",
                active
                  ? "bg-[#1e1e1e] text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {item.badge ? <TeacherDoubtsBadge /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 text-gray-400">
          <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
            {name?.[0] || "T"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-xs text-gray-500">{email}</p>
          </div>
        </div>

        <Link
          href="/api/auth/signout"
          className="mt-2 flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}

