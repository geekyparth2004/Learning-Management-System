import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const s3Client = new S3Client({
    region: "us-east-1", // R2 requires us-east-1
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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

        // Extract Key from URL
        // URL format: https://<endpoint>/<bucket>/<key>
        // OR if endpoint includes bucket (which we fixed), it's https://<endpoint>/<key>
        // Let's try to be smart.

        let key = url;
        const bucketName = process.env.AWS_BUCKET_NAME!;

        // If URL contains bucket name, try to split by it
        if (url.includes(bucketName)) {
            const parts = url.split(bucketName + "/");
            if (parts.length > 1) {
                key = parts[1];
            }
        } else {
            // Fallback: assume it's the last part of the path if no bucket name in URL (unlikely with our setup)
            // But wait, our publicUrl logic was: endpoint + "/" + bucket + "/" + key
            // So splitting by bucketName + "/" is safe.
        }

        // Clean up any query params if present
        key = key.split("?")[0];

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

        return NextResponse.json({ signedUrl });

    } catch (error: any) {
        console.error("Sign URL error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
