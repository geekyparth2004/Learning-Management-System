import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME!;

// Construct endpoint
const ENDPOINT = R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : process.env.AWS_ENDPOINT;

const s3Client = new S3Client({
    region: "auto",
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { url } = await request.json();
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        let key = url;

        // Key Extraction Logic
        // 1. Check if it matches Public Domain
        if (process.env.R2_PUBLIC_DOMAIN && url.includes(process.env.R2_PUBLIC_DOMAIN)) {
            key = url.replace(process.env.R2_PUBLIC_DOMAIN + "/", "");
        }
        // 2. Check if it matches Bucket Name part (Standard S3 Path Style)
        else if (url.includes(BUCKET_NAME + "/")) {
            key = url.split(BUCKET_NAME + "/")[1];
        }

        // Clean up any query params
        key = key.split("?")[0];

        // Decoding URI component in case spaces were encoded
        key = decodeURIComponent(key);

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

        return NextResponse.json({ signedUrl });

    } catch (error: any) {
        console.error("Sign URL error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
