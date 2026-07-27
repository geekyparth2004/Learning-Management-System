
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { CACHE_KEYS, cacheDelete } from "@/lib/redis";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: contestId } = await params;

        let body: any = {};
        try {
            body = await req.json();
        } catch {
            // no body sent (legacy callers)
        }

        // Assessments send per-round results; recompute the total server-side from round scores
        // instead of trusting a client total. Regular contests send no rounds — leave their
        // submit-accumulated score untouched.
        const rounds = body?.results?.rounds;
        const isAssessmentSubmission = Array.isArray(rounds);
        const score = isAssessmentSubmission
            ? rounds.reduce((sum: number, r: any) => sum + (typeof r?.score === "number" ? Math.max(0, Math.round(r.score)) : 0), 0)
            : 0;

        // Update registration
        await db.contestRegistration.update({
            where: {
                userId_contestId: {
                    userId: session.user.id,
                    contestId: contestId
                }
            },
            data: {
                completedAt: new Date(),
                ...(isAssessmentSubmission ? { score, results: JSON.stringify(body.results) } : {})
            }
        });
        await cacheDelete(CACHE_KEYS.studentDashboard(session.user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to complete contest", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
