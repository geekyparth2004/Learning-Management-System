import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: process.env.AWS_ENDPOINT ? process.env.AWS_ENDPOINT.replace(new RegExp(`/${process.env.AWS_BUCKET_NAME}$`), "").replace(/\/$/, "") : undefined,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
});

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function signR2Url(fileUrl: string) {
    if (!fileUrl || !fileUrl.includes("r2.cloudflarestorage.com")) return fileUrl;

    try {
        const bucketName = process.env.AWS_BUCKET_NAME;
        if (!bucketName) return fileUrl;

        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split("/");
        let key = "";

        if (pathParts.includes(bucketName)) {
            const bucketIndex = pathParts.indexOf(bucketName);
            key = pathParts.slice(bucketIndex + 1).join("/");
        } else {
            key = urlObj.pathname.substring(1);
        }
        key = decodeURIComponent(key);

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        console.error("Error signing R2 URL:", error);
        return fileUrl;
    }
}

export async function deleteFromR2(fileUrl: string) {
    if (!fileUrl) return;

    try {
        // Check if it's an R2 URL
        if (!fileUrl.includes("r2.cloudflarestorage.com")) {
            console.log("Not an R2 URL, skipping deletion:", fileUrl);
            return;
        }

        // Extract key from URL
        // URL format: https://<endpoint>/<bucket>/<key> or https://<custom-domain>/<key>
        // Assuming standard R2 public URL structure or the one we generate

        let key = "";
        const bucketName = process.env.AWS_BUCKET_NAME;

        if (!bucketName) {
            console.error("AWS_BUCKET_NAME not set");
            return;
        }

        // Simple extraction: split by bucket name if present, or just take the last part
        // Our public URLs usually look like: https://<account>.r2.cloudflarestorage.com/<bucket>/<filename>

        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split("/");

        // If path starts with /, split gives ["", "bucket", "key..."]
        // We need to find where the bucket name is, or assume the rest is the key

        if (pathParts.includes(bucketName)) {
            const bucketIndex = pathParts.indexOf(bucketName);
            key = pathParts.slice(bucketIndex + 1).join("/");
        } else {
            // Fallback: assume the whole path after domain is the key (if using custom domain mapped to bucket)
            // But we are using the R2 endpoint directly usually.
            // Let's try to decode it.
            key = urlObj.pathname.substring(1); // Remove leading /
        }

        key = decodeURIComponent(key);

        console.log(`Deleting file from R2. Bucket: ${bucketName}, Key: ${key}`);

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        await s3Client.send(command);
        console.log("Successfully deleted from R2");
    } catch (error) {
        console.error("Error deleting file from R2:", error);
        // Don't throw, just log. We don't want to stop DB deletion if file deletion fails.
    }
}
