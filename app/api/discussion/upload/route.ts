import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

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
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    forcePathStyle: true,
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType, mediaType } = await request.json();

        if (!filename || !contentType || !mediaType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate media type
        if (!["image", "voice", "video"].includes(mediaType)) {
            return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
        }

        // Create unique key in chat-media folder
        const key = `chat-media/${mediaType}/${Date.now()}-${session.user.id}-${filename.replace(/\s+/g, "-")}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // Construct public URL
        let publicUrl = "";
        if (process.env.R2_PUBLIC_DOMAIN) {
            publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
        } else {
            publicUrl = `${ENDPOINT}/${BUCKET_NAME}/${key}`;
        }

        return NextResponse.json({
            uploadUrl,
            publicUrl,
            key
        });

    } catch (error: any) {
        console.error("Discussion upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
