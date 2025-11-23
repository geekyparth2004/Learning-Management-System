import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(request: Request) {
    try {
        // We don't strictly need to read the body for a simple signature, 
        // but we could accept folder names etc. in the future.
        // const body = await request.json(); 

        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

        if (!apiSecret || !apiKey || !cloudName) {
            console.error("Missing Cloudinary environment variables");
            return NextResponse.json(
                { error: "Server misconfiguration: Missing Cloudinary credentials" },
                { status: 500 }
            );
        }

        // Timestamp is required for the signature
        const timestamp = Math.round((new Date).getTime() / 1000);
        const folder = "assignments";

        // Generate Signature
        // We sign the parameters that we will send to the upload API
        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp,
                folder: folder,
            },
            apiSecret
        );

        return NextResponse.json({
            signature,
            timestamp,
            cloudName,
            apiKey,
            folder
        });

    } catch (error: any) {
        console.error("Cloudinary signature error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate signature" },
            { status: 500 }
        );
    }
}
