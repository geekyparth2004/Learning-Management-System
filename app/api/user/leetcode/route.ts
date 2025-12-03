import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        await db.user.update({
            where: { id: session.user.id },
            data: { leetcodeUsername: username },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating LeetCode username:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
