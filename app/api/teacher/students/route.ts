import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

        const where: Record<string, unknown> = {
            role: "STUDENT"
        };

        if (search.trim()) {
            // Prisma: mode: "insensitive" requires exact shape; keep it simple with explicit OR.
            Object.assign(where, {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } }
                ]
            });
        }

        const [students, total] = await Promise.all([
            db.user.findMany({
                where: where as any,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            }),
            db.user.count({ where: where as any })
        ]);

        return NextResponse.json({
            students,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit))
        });
    } catch (error) {
        console.error("Error fetching teacher students:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

