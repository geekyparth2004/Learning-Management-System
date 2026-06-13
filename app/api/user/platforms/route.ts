import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CACHE_KEYS, cacheDelete, cacheDeletePattern } from "@/lib/redis";
import { fetchCodolioStats } from "@/lib/codolio";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                leetcodeUsername: true,
                codolioUsername: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USER_PLATFORMS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { leetcodeUsername, codolioUsername } = await req.json();

        const updateData: any = {};
        if (leetcodeUsername !== undefined) {
            updateData.leetcodeUsername = leetcodeUsername;
        }

        if (codolioUsername !== undefined) {
            const currentUser = await db.user.findUnique({
                where: { id: session.user.id },
                select: { codolioUsername: true }
            });

            if (currentUser?.codolioUsername !== codolioUsername) {
                updateData.codolioUsername = codolioUsername;
                updateData.codolioBaseline = null;
                updateData.externalRatings = null;

                if (codolioUsername && codolioUsername.trim()) {
                    try {
                        const stats = await fetchCodolioStats(codolioUsername.trim());
                        if (stats) {
                            updateData.externalRatings = stats;
                            updateData.codolioBaseline = stats.totalQuestions;
                        }
                    } catch (err) {
                        console.error("Failed to sync codolio stats on link:", err);
                    }
                }
            }
        }

        const user = await db.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        await cacheDelete(CACHE_KEYS.studentDashboard(session.user.id));
        await cacheDeletePattern(CACHE_KEYS.leaderboard());

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USER_PLATFORMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
