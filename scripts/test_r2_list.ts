
import { S3Client, HeadObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env" });

const client = new S3Client({
    region: "us-east-005",
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    credentials: {
        accessKeyId: "0057fefe6aee55b000000003",
        secretAccessKey: "K005pjGDNrfAUU46psk92AVG41Pvs8k",
    },
    forcePathStyle: true,
});

async function main() {
    try {
        const key = "videos/1768314025967-2026-01-13-19-41-56.mkv";
        const cmd = new HeadObjectCommand({ Bucket: "LMS-System", Key: key });
        const res = await client.send(cmd);
        fs.writeFileSync("head_test.log", `Success IN BACKBLAZE. File found. Size: ${res.ContentLength}\nContent-Type: ${res.ContentType}`);
    } catch (e: any) {
        fs.writeFileSync("head_test.log", `Error (Backblaze): ${e.message}\n${JSON.stringify(e)}`);
    }
}
main();
