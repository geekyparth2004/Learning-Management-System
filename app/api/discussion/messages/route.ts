import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch recent messages (last 100)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const messages = await db.discussionMessage.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        // Return in chronological order (oldest first for chat display)
        return NextResponse.json({ messages: messages.reverse() });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

// POST - Create new message
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, mediaUrl, mediaType } = await request.json();

        // Validate - must have either content or media
        if (!content && !mediaUrl) {
            return NextResponse.json({ error: "Message content or media required" }, { status: 400 });
        }

        const message = await db.discussionMessage.create({
            data: {
                userId: session.user.id,
                content: content || null,
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
