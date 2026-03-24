import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "No organization" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search");
        const batch = searchParams.get("batch");
        const department = searchParams.get("department");
        const minCgpa = searchParams.get("minCgpa");

        const where: Record<string, unknown> = {
            organizationId: user.organizationId,
            role: "STUDENT",
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const [students, total] = await Promise.all([
            db.user.findMany({
                where,
                orderBy: { name: "asc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    placementProfile: {
                        select: {
                            cgpa: true,
                            batch: true,
                            department: true,
                            degree: true,
                            fatherName: true,
                            ugPercentage: true,
                            pgPercentage: true,
                            skills: true,
                        },
                    },
                    _count: { select: { placementApplications: true } },
                },
            }),
            db.user.count({ where }),
        ]);

        // Apply profile-level filters in application layer
        let filtered = students;
        if (batch) {
            filtered = filtered.filter((s) => s.placementProfile?.batch?.includes(batch));
        }
        if (department) {
            filtered = filtered.filter((s) =>
                s.placementProfile?.department?.toLowerCase().includes(department.toLowerCase())
            );
        }
        if (minCgpa) {
            const min = parseFloat(minCgpa);
            filtered = filtered.filter((s) => (s.placementProfile?.cgpa || 0) >= min);
        }

        return NextResponse.json({
            students: filtered,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
