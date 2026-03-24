import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ApplicantsTable from "@/components/coordinator/ApplicantsTable";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DriveApplicantsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "COORDINATOR") redirect("/");

    const { id } = await params;

    const drive = await db.recruitmentDrive.findUnique({
        where: { id },
        include: {
            _count: { select: { applications: true } },
        },
    });

    if (!drive) redirect("/coordinator/opportunities");

    return (
        <div className="min-h-screen">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/coordinator/opportunities" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Opportunities
                    </Link>
                    <span className="text-sm font-semibold text-gray-900">Applicant Management</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search applicants..."
                            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-4 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>
            </header>

            <main className="p-8">
                <ApplicantsTable
                    driveId={drive.id}
                    driveName={`${drive.role} - ${drive.company}`}
                    driveStatus={drive.status}
                    totalApplicants={drive._count.applications}
                />
            </main>
        </div>
    );
}
