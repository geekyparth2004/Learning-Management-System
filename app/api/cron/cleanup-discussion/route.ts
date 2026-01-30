import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME!;

const ENDPOINT = R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : process.env.AWS_ENDPOINT?.replace(new RegExp(`/${BUCKET_NAME}$`), "").replace(/\/$/, "");

const s3Client = new S3Client({
    region: "auto",
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST - Clean up old discussion messages (older than 7 days)
 * Call from Vercel cron or external scheduler
 */
export async function POST(request: Request) {
    try {
        // Verify cron secret if set
        if (CRON_SECRET) {
            const authHeader = request.headers.get("authorization");
            if (authHeader !== `Bearer ${CRON_SECRET}`) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find messages older than 7 days
        const oldMessages = await db.discussionMessage.findMany({
            where: {
                createdAt: { lt: sevenDaysAgo }
            },
            select: {
                id: true,
                mediaUrl: true
            }
        });

        if (oldMessages.length === 0) {
            return NextResponse.json({
                message: "No old messages to clean up",
                deletedCount: 0
            });
        }

        // Delete media files from R2
        const mediaUrls = oldMessages
            .filter(m => m.mediaUrl)
            .map(m => m.mediaUrl!);

        let deletedMediaCount = 0;
        for (const url of mediaUrls) {
            try {
                // Extract key from URL
                const key = url.includes("chat-media/")
                    ? url.substring(url.indexOf("chat-media/"))
                    : null;

                if (key) {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: key
                    }));
                    deletedMediaCount++;
                }
            } catch (error) {
                console.error("Error deleting media:", url, error);
            }
        }

        // Delete messages from database
        const deleteResult = await db.discussionMessage.deleteMany({
            where: {
                createdAt: { lt: sevenDaysAgo }
            }
        });

        return NextResponse.json({
            message: "Cleanup completed",
            deletedMessages: deleteResult.count,
            deletedMedia: deletedMediaCount
        });

    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}
