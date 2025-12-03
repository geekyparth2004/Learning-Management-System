import { S3Client, PutBucketCorsCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Load env vars from .env.local
dotenv.config({ path: ".env.local" });

const s3Client = new S3Client({
    region: "us-east-005",
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    credentials: {
        accessKeyId: "0057fefe6aee55b000000002",
        secretAccessKey: "K005ekuAFDHYh3Wic8Uj74QAsKv3z3Y",
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

async function fixCors() {
    try {
        console.log("Testing credentials with ListBuckets...");
        const list = await s3Client.send(new ListBucketsCommand({}));
        console.log("Buckets:", list.Buckets?.map(b => b.Name));
    } catch (error) {
        console.error("ListBuckets failed:", error);
        return;
    }

    const bucketName = "Learning-Management-System";
    console.log("Updating CORS rules for bucket:", bucketName);

    const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT", "HEAD", "POST", "DELETE"],
                    AllowedOrigins: ["*"], // Allow all origins
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3600,
                },
            ],
        },
    });

    try {
        await s3Client.send(command);
        console.log("Successfully updated CORS rules!");
    } catch (error) {
        console.error("Error updating CORS rules:", error);
    }
}

fixCors();
