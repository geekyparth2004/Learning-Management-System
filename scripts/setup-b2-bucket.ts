import { Buffer } from "buffer";

const keyId = process.env.AWS_ACCESS_KEY_ID!;
const applicationKey = process.env.AWS_SECRET_ACCESS_KEY!;

async function setupBucket() {
    if (!keyId || !applicationKey) {
        console.error("Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY");
        return;
    }

    const authString = Buffer.from(`${keyId}:${applicationKey}`).toString("base64");

    try {
        // 1. Authorize Account
        console.log("Authorizing...");
        const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
            headers: { "Authorization": `Basic ${authString}` }
        });

        if (!authRes.ok) {
            throw new Error(`Auth failed: ${await authRes.text()}`);
        }

        const authData = await authRes.json();
        const apiUrl = authData.apiUrl;
        const accountAuthToken = authData.authorizationToken;
        const accountId = authData.accountId;

        console.log("Authorized. Account ID:", accountId);

        // 2. Create Bucket (Lowercase name)
        const bucketName = "lms-system-prod-" + Date.now(); // Unique name
        console.log(`Creating bucket: ${bucketName}...`);

        const createRes = await fetch(`${apiUrl}/b2api/v2/b2_create_bucket`, {
            method: "POST",
            headers: {
                "Authorization": accountAuthToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: accountId,
                bucketName: bucketName,
                bucketType: "allPrivate" // Private bucket
            })
        });

        if (!createRes.ok) {
            throw new Error(`Create bucket failed: ${await createRes.text()}`);
        }

        const bucketData = await createRes.json();
        const bucketId = bucketData.bucketId;
        console.log("Bucket created. ID:", bucketId);

        // 3. Update CORS
        console.log("Updating CORS rules...");
        const updateRes = await fetch(`${apiUrl}/b2api/v2/b2_update_bucket`, {
            method: "POST",
            headers: {
                "Authorization": accountAuthToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: accountId,
                bucketId: bucketId,
                corsRules: [
                    {
                        corsRuleName: "allow-all",
                        allowedOrigins: ["*"],
                        allowedOperations: ["s3_head", "s3_put", "s3_post", "s3_get", "s3_delete"],
                        allowedHeaders: ["*"],
                        exposeHeaders: ["ETag"],
                        maxAgeSeconds: 3600
                    }
                ]
            })
        });

        if (!updateRes.ok) {
            throw new Error(`Update CORS failed: ${await updateRes.text()}`);
        }

        console.log("CORS updated successfully!");
        console.log("\n---------------------------------------------------");
        console.log("NEW BUCKET CREATED SUCCESSFULLY!");
        console.log("Please update your .env.local and Vercel Environment Variables:");
        console.log(`AWS_BUCKET_NAME=${bucketName}`);
        console.log("---------------------------------------------------\n");

    } catch (error) {
        console.error("Error:", error);
    }
}

setupBucket();
