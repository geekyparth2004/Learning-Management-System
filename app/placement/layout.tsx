import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PlacementSidebar from "@/components/placement/PlacementSidebar";

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
        <div className="flex h-screen bg-[#0e0e0e] text-white overflow-hidden">
            {/* Sidebar */}
            <PlacementSidebar
                orgName={user.organization.name}
                userName={user.name || "Student"}
                userDepartment={user.placementProfile?.department || undefined}
                userBatch={user.placementProfile?.batch || undefined}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
