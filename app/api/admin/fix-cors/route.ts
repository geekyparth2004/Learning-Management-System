import { NextResponse } from "next/server";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

export async function GET() {
    try {
        const s3Client = new S3Client({
            region: "auto",
            endpoint: process.env.AWS_ENDPOINT?.replace(new RegExp(`/${process.env.AWS_BUCKET_NAME}$`), "").replace(/\/$/, ""),
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true,
        });

        const command = new PutBucketCorsCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                        AllowedOrigins: ["*"],
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3600,
                    },
                ],
            },
        });

        await s3Client.send(command);

        return NextResponse.json({ success: true, message: "CORS Updated Successfully for R2!" });
    } catch (error: any) {
        console.error("CORS Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
