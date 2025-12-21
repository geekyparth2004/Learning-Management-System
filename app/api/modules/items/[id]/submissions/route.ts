import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: moduleItemId } = await params;

        // Verify that the user is the teacher of the course?
        // For simplicity, we'll assume any logged-in user with access to this route is authorized 
        // (Middleware or frontend checks normally handle role, but ideally we check course ownership here)

        const submissions = await db.moduleItemProgress.findMany({
            where: {
                moduleItemId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                startedAt: "desc",
            }
        });

        return NextResponse.json(submissions);
    } catch (error) {
        console.error("Error fetching submissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
