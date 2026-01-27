
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const s3Client = new S3Client({
    region: "us-east-1",
    endpoint: process.env.AWS_ENDPOINT?.replace(new RegExp(`/${process.env.AWS_BUCKET_NAME}$`), "").replace(/\/$/, ""),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
});

export async function GET(request: NextRequest) {
    const session = await auth();
    // Optional: Check if user is authenticated to view images?
    if (!session) {
        // allow for now, or restrict. Better to allow if it's just course content.
        // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contentType = searchParams.get("contentType");
    const key = searchParams.get("key");

    if (!key) {
        return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ResponseContentType: contentType || undefined, // Allow overriding content type (e.g. video/webm for mkv)
        });

        // Generate signed URL
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // Redirect to the signed URL
        return NextResponse.redirect(signedUrl);

    } catch (error) {
        console.error("Image proxy error:", error);
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }
}
