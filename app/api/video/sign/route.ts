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
    region: "us-east-1",
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

        try {
            const urlObj = new URL(url);
            let path = urlObj.pathname;
            // Remove leading slash
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            // Decode path
            path = decodeURIComponent(path);

            // Remove bucket prefix if present (handling path-style URLs)
            if (path.startsWith(BUCKET_NAME + "/")) {
                path = path.substring(BUCKET_NAME.length + 1);
            }

            // Handle R2 Public Domain specific case if needed, but the above generic path logic often covers it 
            // if the public domain maps to bucket root. 
            // If explicit R2_PUBLIC_DOMAIN env is set and matches, we validly assume the path is the key.

            key = path;
        } catch (e) {
            console.warn("Invalid URL format in signing request, using raw string:", url);
            // Fallback to simpler extraction or raw string if not a valid URL (e.g. just a filename)
            key = url.split("?")[0];
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ResponseContentType: "video/mp4", // Force browser to treat content as MP4 (fixes MKV playback issues)
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800 }); // 7 days

        return NextResponse.json({ signedUrl });

    } catch (error: any) {
        console.error("Sign URL error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
