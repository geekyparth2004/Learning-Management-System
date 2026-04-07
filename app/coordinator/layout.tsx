import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import CoordinatorSidebar from "@/components/coordinator/CoordinatorSidebar";
import ResponsiveShell from "@/components/layout/ResponsiveShell";

export default async function CoordinatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "COORDINATOR") redirect("/");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            organizationId: true,
            organization: { select: { name: true } },
        },
    });

    if (!user?.organizationId || !user.organization) {
        redirect("/");
    }

    return (
        <ResponsiveShell
            wrapperClassName="bg-gray-50 text-gray-900"
            headerClassName="border-black/10 bg-white/70"
            headerTitle={user.organization.name}
            sidebar={
                <CoordinatorSidebar
                    orgName={user.organization.name}
                    userName={user.name || "Coordinator"}
                />
            }
            bottomNav={[
                { label: "Dashboard", href: "/coordinator", icon: "dashboard", match: "exact" },
                { label: "Opps", href: "/coordinator/opportunities", icon: "briefcase" },
                { label: "Students", href: "/coordinator/students", icon: "users" },
                { label: "Groups", href: "/coordinator/groups", icon: "messages" },
                { label: "Reports", href: "/coordinator/reports", icon: "reports" },
            ]}
            contentClassName="bg-gray-50"
        >
            {children}
        </ResponsiveShell>
    );
}
