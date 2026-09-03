import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type TeacherStudentRow = {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    subscriptionStatus: string | null;
    trialExpiresAt: string | null;
    createdAt: string | null;
};

export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const pageRaw = parseInt(searchParams.get("page") || "1", 10);
        const limitRaw = parseInt(searchParams.get("limit") || "10", 10);
        const search = searchParams.get("search") || "";

        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;
        const skip = (page - 1) * limit;
        const searchValue = search.trim();

        // Build Prisma where clause
        const where: Record<string, unknown> = { role: "STUDENT" };

        if (searchValue) {
            where.OR = [
                { name: { contains: searchValue, mode: "insensitive" } },
                { email: { contains: searchValue, mode: "insensitive" } },
            ];
        }

        const [students, total] = await Promise.all([
            db.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    image: true,
                    subscriptionStatus: true,
                    trialExpiresAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
            }),
            db.user.count({ where }),
        ]);

        const normalizedStudents: TeacherStudentRow[] = students.map((student) => ({
            id: student.id,
            name: student.name ?? null,
            email: student.email,
            phone: student.phone ?? null,
            image: student.image ?? null,
            subscriptionStatus: student.subscriptionStatus ?? null,
            trialExpiresAt: student.trialExpiresAt
                ? student.trialExpiresAt.toISOString()
                : null,
            createdAt: student.createdAt
                ? student.createdAt.toISOString()
                : null,
        }));

        return NextResponse.json({
            students: normalizedStudents,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit))
        });
    } catch (error) {
        console.error("Error fetching teacher students:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


