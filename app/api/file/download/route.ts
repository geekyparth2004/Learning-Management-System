import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME!;

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

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        // Optional session check to secure downloads
        // if (!session?.user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

        const searchParams = request.nextUrl.searchParams;
        const urlStr = searchParams.get("url");

        if (!urlStr) {
            return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
        }

        let key = urlStr;
        try {
            const urlObj = new URL(urlStr);
            let path = urlObj.pathname;
            if (path.startsWith("/")) path = path.substring(1);
            path = decodeURIComponent(path);

            if (path.startsWith(BUCKET_NAME + "/")) {
                path = path.substring(BUCKET_NAME.length + 1);
            }
            key = path;
        } catch (e) {
            key = urlStr.split("?")[0];
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.redirect(signedUrl);

    } catch (error: any) {
        console.error("File download proxy error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
