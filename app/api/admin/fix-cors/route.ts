import { NextResponse } from "next/server";

const keyId = "7fefe6aee55b";
const applicationKey = "00592621332427b97436be42ed614428513660e32d";
const bucketId = "47ff2e7f3e16ea5e9ea5051b";

export async function GET() {
    try {
        console.log("Authenticating with B2 Native API...");

        // Manual Base64 encoding
        const authString = Buffer.from(keyId + ":" + applicationKey).toString("base64");

        const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
            headers: {
                "Authorization": "Basic " + authString
            }
        });

        if (!authRes.ok) {
            const errorText = await authRes.text();
            console.error("Auth Failed:", errorText);
            return NextResponse.json({ success: false, error: "Auth Failed", details: errorText }, { status: 500 });
        }

        const authData = await authRes.json();
        const apiUrl = authData.apiUrl;
        const accountAuthToken = authData.authorizationToken;
        const accountId = authData.accountId;

        console.log("Updating Bucket CORS...");
        const updateRes = await fetch(apiUrl + "/b2api/v2/b2_update_bucket", {
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
                        allowedOrigins: [
                            "https://technical-interview-practice.vercel.app",
                            "http://localhost:3000"
                        ],
                        allowedOperations: ["s3_head", "s3_put", "s3_post", "s3_get", "s3_delete"],
                        allowedHeaders: ["authorization", "content-type", "x-amz-date", "x-amz-content-sha256", "x-amz-user-agent"],
                        exposeHeaders: ["ETag"],
                        maxAgeSeconds: 3600
                    }
                ]
            })
        });

        if (!updateRes.ok) {
            const errorText = await updateRes.text();
            console.error("Update Failed:", errorText);
            return NextResponse.json({ success: false, error: "Update Failed", details: errorText }, { status: 500 });
        }

        const updateData = await updateRes.json();

        return NextResponse.json({
            success: true,
            message: "CORS Updated Successfully via Native API!",
            rules: updateData.corsRules
        });

    } catch (error: any) {
        console.error("CORS Fix Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
