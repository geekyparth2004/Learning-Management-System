import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const s3Client = new S3Client({
    region: "us-east-1", // R2 requires us-east-1 for S3 compatibility
    endpoint: process.env.AWS_ENDPOINT?.replace(new RegExp(`/${process.env.AWS_BUCKET_NAME}$`), "").replace(/\/$/, ""),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    forcePathStyle: true,
});

console.log("S3 Config:", {
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    bucket: process.env.AWS_BUCKET_NAME,
    hasKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecret: !!process.env.AWS_SECRET_ACCESS_KEY
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType } = await request.json();

        // Create unique key
        const key = `videos/${Date.now()}-${filename.replace(/\s+/g, "-")}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // Construct public URL (B2 specific structure or generic S3)
        // For B2 private buckets, we might need a presigned GET url for playback, 
        // OR if it's public we can use the direct link.
        // The user selected "Private", so we actually need a presigned GET URL for playback too!
        // However, for simplicity in the builder, we'll store the KEY or the direct URL 
        // and generate a signed GET url when playing.

        // For now, let's return the public URL format.
        // B2 Friendly URL: https://f005.backblazeb2.com/file/<bucket_name>/<key>
        // But since it's private, this won't work for playback without auth.
        // Let's store the full S3 URI or just the Key. Storing the Key is safer.
        // But existing logic expects a URL.

        // Let's return the endpoint + key as the "url" and handle signing on playback if needed.
        const publicUrl = `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET_NAME}/${key}`;

        return NextResponse.json({
            uploadUrl,
            publicUrl,
            key
        });

    } catch (error: any) {
        console.error("Presigned URL error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
