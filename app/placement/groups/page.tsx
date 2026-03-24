import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ActiveGroupsList from "@/components/placement/ActiveGroupsList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true },
    });

    if (!user?.organizationId) redirect("/jobs");

    const groups = await db.placementGroup.findMany({
        where: { organizationId: user.organizationId },
        include: {
            _count: { select: { members: true } },
            members: {
                where: { userId: session.user.id },
                select: { id: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const groupsData = groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description || undefined,
        icon: g.icon || undefined,
        color: g.color || undefined,
        memberCount: g._count.members,
        isMember: g.members.length > 0,
    }));

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/placement" className="rounded-lg p-2 hover:bg-gray-800 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-400" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Groups</h1>
            </div>
            <ActiveGroupsList groups={groupsData} />
        </div>
    );
}
