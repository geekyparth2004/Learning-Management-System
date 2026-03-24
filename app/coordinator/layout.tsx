import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import CoordinatorSidebar from "@/components/coordinator/CoordinatorSidebar";

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
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <CoordinatorSidebar
                orgName={user.organization.name}
                userName={user.name || "Coordinator"}
            />
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
