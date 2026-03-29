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
    credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    forcePathStyle: true,
});

const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
];

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(contentType)) {
            return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
        }

        const key = `group-files/${Date.now()}-${session.user.id}-${filename.replace(/\s+/g, "-")}`;

        const command = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, ContentType: contentType });
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        const publicUrl = process.env.R2_PUBLIC_DOMAIN
            ? `${process.env.R2_PUBLIC_DOMAIN}/${key}`
            : `${ENDPOINT}/${BUCKET_NAME}/${key}`;

        return NextResponse.json({ uploadUrl, publicUrl, key });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
