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

const USER_COLUMN_QUERY = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
`;

const OPTIONAL_USER_COLUMNS = [
    "phone",
    "image",
    "subscriptionStatus",
    "trialExpiresAt",
    "createdAt",
] as const;

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

        const columnsResult = await db.$queryRawUnsafe<Array<{ column_name: string }>>(USER_COLUMN_QUERY);
        const availableColumns = new Set(columnsResult.map((column) => column.column_name));

        const selectFields = [`"id"`, `"name"`, `"email"`];
        for (const column of OPTIONAL_USER_COLUMNS) {
            if (availableColumns.has(column)) {
                selectFields.push(`"${column}"`);
            }
        }

        const filters = [`"role" = $1`];
        const queryParams: Array<string | number> = ["STUDENT"];

        if (searchValue) {
            queryParams.push(`%${searchValue}%`);
            const searchParamIndex = queryParams.length;
            filters.push(`("name" ILIKE $${searchParamIndex} OR "email" ILIKE $${searchParamIndex})`);
        }

        queryParams.push(limit);
        const limitParamIndex = queryParams.length;
        queryParams.push(skip);
        const skipParamIndex = queryParams.length;

        const orderBy = availableColumns.has("createdAt")
            ? `"createdAt" DESC`
            : `"name" ASC NULLS LAST, "email" ASC`;

        const studentsQuery = `
            SELECT ${selectFields.join(", ")}
            FROM "User"
            WHERE ${filters.join(" AND ")}
            ORDER BY ${orderBy}
            LIMIT $${limitParamIndex}
            OFFSET $${skipParamIndex}
        `;

        const countQuery = `
            SELECT COUNT(*)::int AS total
            FROM "User"
            WHERE ${filters.join(" AND ")}
        `;

        const countParams = searchValue ? queryParams.slice(0, 2) : queryParams.slice(0, 1);

        const [students, total] = await Promise.all([
            db.$queryRawUnsafe<Array<Record<string, unknown>>>(studentsQuery, ...queryParams),
            db.$queryRawUnsafe<Array<{ total: number }>>(countQuery, ...countParams),
        ]);

        const normalizedStudents: TeacherStudentRow[] = students.map((student) => ({
            id: String(student.id),
            name: typeof student.name === "string" ? student.name : null,
            email: String(student.email),
            phone: typeof student.phone === "string" ? student.phone : null,
            image: typeof student.image === "string" ? student.image : null,
            subscriptionStatus: typeof student.subscriptionStatus === "string" ? student.subscriptionStatus : null,
            trialExpiresAt: student.trialExpiresAt instanceof Date
                ? student.trialExpiresAt.toISOString()
                : typeof student.trialExpiresAt === "string"
                    ? student.trialExpiresAt
                    : null,
            createdAt: student.createdAt instanceof Date
                ? student.createdAt.toISOString()
                : typeof student.createdAt === "string"
                    ? student.createdAt
                    : null,
        }));

        const totalStudents = total[0]?.total ?? 0;

        return NextResponse.json({
            students: normalizedStudents,
            total: totalStudents,
            page,
            totalPages: Math.max(1, Math.ceil(totalStudents / limit))
        });
    } catch (error) {
        console.error("Error fetching teacher students:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

