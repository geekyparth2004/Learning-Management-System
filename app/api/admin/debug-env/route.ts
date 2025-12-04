import { NextResponse } from "next/server";

export async function GET() {
    const keyId = process.env.AWS_ACCESS_KEY_ID || "";
    const secret = process.env.AWS_SECRET_ACCESS_KEY || "";
    const bucket = process.env.AWS_BUCKET_NAME || "";
    const region = process.env.AWS_REGION || "";
    const endpoint = process.env.AWS_ENDPOINT || "";

    return NextResponse.json({
        AWS_ACCESS_KEY_ID: keyId.substring(0, 5) + "...",
        AWS_SECRET_ACCESS_KEY: secret.substring(0, 5) + "...",
        AWS_BUCKET_NAME: bucket,
        AWS_REGION: region,
        AWS_ENDPOINT: endpoint,
        // Check if it matches the Master Key ID (7fefe...)
        IS_MASTER_KEY: keyId.startsWith("7fefe"),
        IS_STANDARD_KEY: keyId.startsWith("0057")
    });
}
