
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CACHE_KEYS, cacheDelete } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { leetcodeUsername, codeforcesUsername, gfgUsername } = await req.json();

        const user = await db.user.update({
            where: { id: session.user.id },
            data: {
                leetcodeUsername,
                codeforcesUsername,
                gfgUsername,
            },
        });
        await cacheDelete(CACHE_KEYS.studentDashboard(session.user.id));

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USER_PLATFORMS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
