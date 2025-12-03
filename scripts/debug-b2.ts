import { S3Client, ListBucketsCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const secretKey = "K005ekuAFDHYh3Wic8Uj74QAsKv3z3Y".trim();
const accountId = "0057fefe6aee55b000000002".trim();
const bucketName = "Learning-Management-System";

async function tryConnection(keyId: string, region: string) {
    console.log(`\nTesting KeyID: ${keyId} | Region: ${region}`);
    const s3 = new S3Client({
        region: region,
        endpoint: "https://s3.us-east-005.backblazeb2.com",
        credentials: {
            accessKeyId: keyId,
            secretAccessKey: secretKey,
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
        forcePathStyle: true,
    });

    try {
        const data = await s3.send(new ListBucketsCommand({}));
        console.log("✅ Success! Buckets:", data.Buckets?.map(b => b.Name));

        console.log("Attempting to update CORS...");
        await s3.send(new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "PUT", "HEAD", "POST", "DELETE"],
                        AllowedOrigins: ["*"],
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3600,
                    },
                ],
            },
        }));
        console.log("✅ CORS Updated Successfully!");
        return true;
    } catch (error: any) {
        console.error(`❌ Failed: ${error.name}: ${error.message}`);
        return false;
    }
}

async function run() {
    // 1. Try Raw Account ID
    if (await tryConnection(accountId, "us-east-005")) return;

    // 2. Try Account ID with 005 prefix (common B2 pattern)
    if (await tryConnection(`005${accountId}`, "us-east-005")) return;

    // 3. Try Raw ID with generic region
    if (await tryConnection(accountId, "us-east-1")) return;
}

run();
