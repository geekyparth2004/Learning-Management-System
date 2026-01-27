
import { S3Client, GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import fs from "fs";

// Manually load envs ensuring we get the .env file values
dotenv.config({ path: ".env" });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

console.log("Config:");
console.log("Account ID:", R2_ACCOUNT_ID);
console.log("Bucket:", R2_BUCKET_NAME);
console.log("Access Key Present:", !!R2_ACCESS_KEY_ID);

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error("Missing R2 credentials");
    process.exit(1);
}

const r2Client = new S3Client({
    region: "us-east-1",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

async function main() {
    // Delete log file first
    try { fs.unlinkSync("scripts/verify_r2_output.txt"); } catch (e) { }
    const key = "videos/1768314025967-2026-01-13-19-41-56.mkv";

    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync("scripts/verify_r2_output.txt", msg + "\n");
    };

    // clear file
    fs.writeFileSync("scripts/verify_r2_output.txt", "");

    // Test ListObjects first to verify credentials/bucket existence
    try {
        log("Attempting to list objects in bucket...");
        const listCmd = new ListObjectsCommand({ Bucket: R2_BUCKET_NAME, MaxKeys: 5 });
        const listRes = await r2Client.send(listCmd);
        log(`ListObjects Success. Found ${listRes.Contents?.length || 0} items.`);
        if (listRes.Contents?.length) {
            log(`First item: ${listRes.Contents[0].Key}`);
        }
    } catch (err: any) {
        fs.appendFileSync("scripts/verify_r2_output.txt", `ListObjects FAILED: ${err.message}\n`);
        console.error("ListObjects failed:", err);
    }

    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ResponseContentType: "video/webm"
        });

        log(`Generating signed URL for key: ${key}`);
        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        log("Signed URL generated successfully.");
        log(`URL: ${signedUrl}`);

        // Optional: Check if we can fetch it (HEAD request)
        log("Verifying access...");
        const res = await fetch(signedUrl, { method: "HEAD" });
        log(`Status: ${res.status}`);
        log(`Content-Type: ${res.headers.get("content-type")}`);

        if (res.ok) {
            log("SUCCESS: Video is accessible.");
        } else {
            log("FAILURE: Could not access video via signed URL.");
        }

    } catch (error) {
        fs.appendFileSync("scripts/verify_r2_output.txt", "Error: " + JSON.stringify(error) + "\n");
        console.error("Error:", error);
    }
}

main();
