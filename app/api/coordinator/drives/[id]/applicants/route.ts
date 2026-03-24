import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search");
        const minCgpa = searchParams.get("minCgpa");

        const where: Record<string, unknown> = { driveId: id };
        if (status && status !== "ALL") {
            where.status = status;
        }

        // Build user filter for search and minCgpa
        const userWhere: Record<string, unknown> = {};
        if (search) {
            userWhere.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (Object.keys(userWhere).length > 0) {
            where.user = userWhere;
        }

        const [applicants, total, statusCounts] = await Promise.all([
            db.placementApplication.findMany({
                where,
                orderBy: { appliedAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            placementProfile: {
                                select: {
                                    cgpa: true,
                                    skills: true,
                                    department: true,
                                    batch: true,
                                    fatherName: true,
                                    ugPercentage: true,
                                    pgPercentage: true,
                                    degree: true,
                                },
                            },
                        },
                    },
                },
            }),
            db.placementApplication.count({ where }),
            // Get counts per status for filter tabs
            db.placementApplication.groupBy({
                by: ["status"],
                where: { driveId: id },
                _count: true,
            }),
        ]);

        // Filter by minCgpa in application layer (since it's on a relation)
        let filtered = applicants;
        if (minCgpa) {
            const min = parseFloat(minCgpa);
            filtered = applicants.filter(
                (a) => (a.user.placementProfile?.cgpa || 0) >= min
            );
        }

        const counts: Record<string, number> = { ALL: 0 };
        statusCounts.forEach((s) => {
            counts[s.status] = s._count;
            counts.ALL += s._count;
        });

        return NextResponse.json({
            applicants: filtered,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            statusCounts: counts,
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
