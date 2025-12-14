
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const s3Client = new S3Client({
    region: "us-east-1",
    endpoint: process.env.AWS_ENDPOINT?.replace(new RegExp(`/${process.env.AWS_BUCKET_NAME}$`), "").replace(/\/$/, ""),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    forcePathStyle: true,
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType } = await request.json();

        if (!contentType.startsWith("image/")) {
            return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
        }

        // Create unique key
        const key = `images/${Date.now()}-${filename.replace(/\s+/g, "-")}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // Use the public R2/S3 URL for display. 
        // Note: Make sure the bucket/folder is public or we need signed URLs for display too.
        // Assuming strictly R2 public access for images for now based on "visible in description" request.
        // The previous code constructed publicUrl. We will do the same.
        const publicUrl = `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET_NAME}/${key}`;

        return NextResponse.json({
            uploadUrl,
            publicUrl,
            key
        });

    } catch (error: any) {
        console.error("Image Presigned URL error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
