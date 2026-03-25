import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME!;

// Construct endpoint: R2 specific or generic AWS
const ENDPOINT = R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : process.env.AWS_ENDPOINT?.replace(new RegExp(`/${BUCKET_NAME}$`), "").replace(/\/$/, "");

const s3Client = new S3Client({
    region: "auto", // R2 uses 'auto'
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
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType } = await request.json();

        // Create unique key for resume
        const key = `resumes/${Date.now()}-${filename.replace(/\s+/g, "-")}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        const publicDomain = process.env.R2_PUBLIC_DOMAIN || ENDPOINT; // Fallback to endpoint
        
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
        console.error("Presigned URL error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
