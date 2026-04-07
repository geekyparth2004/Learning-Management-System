import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PlacementSidebar from "@/components/placement/PlacementSidebar";
import ResponsiveShell from "@/components/layout/ResponsiveShell";

export default async function PlacementLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            organizationId: true,
            organization: { select: { name: true } },
            placementProfile: {
                select: { department: true, batch: true },
            },
        },
    });

    if (!user?.organizationId || !user.organization) {
        redirect("/jobs");
    }

    return (
        <ResponsiveShell
            wrapperClassName="bg-[#0e0e0e] text-white"
            headerTitle={user.organization.name}
            sidebar={
                <PlacementSidebar
                    orgName={user.organization.name}
                    userName={user.name || "Student"}
                    userDepartment={user.placementProfile?.department || undefined}
                    userBatch={user.placementProfile?.batch || undefined}
                />
            }
            bottomNav={[
                { label: "Dashboard", href: "/placement", icon: "dashboard", match: "exact" },
                { label: "Apps", href: "/placement/applications", icon: "file" },
                { label: "Opps", href: "/placement/opportunities", icon: "building" },
                { label: "Groups", href: "/placement/groups", icon: "users" },
                { label: "Profile", href: "/placement/profile", icon: "user" },
            ]}
        >
            {children}
        </ResponsiveShell>
    );
}
