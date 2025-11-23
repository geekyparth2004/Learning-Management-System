import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
    try {
        const { filename, contentType } = await request.json();

        if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
            console.error("Missing Google Drive environment variables");
            return NextResponse.json({ error: "Server misconfiguration: Missing Google Drive credentials" }, { status: 500 });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/drive.file"],
        });

        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // Create a file metadata
        const fileMetadata = {
            name: filename,
            parents: [folderId],
        };

        const token = await auth.getAccessToken();

        const origin = request.headers.get("origin") || "http://localhost:3000";

        const initiateResponse = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Upload-Content-Type": contentType,
                    "X-Upload-Content-Length": "", // Optional if unknown
                    "Origin": origin, // Forward the origin to allow CORS on the upload URL
                },
                body: JSON.stringify(fileMetadata),
            }
        );

        if (!initiateResponse.ok) {
            const errorText = await initiateResponse.text();
            throw new Error(`Failed to initiate upload: ${errorText}`);
        }

        const uploadUrl = initiateResponse.headers.get("Location");

        if (!uploadUrl) {
            throw new Error("No upload URL returned from Drive API");
        }

        return NextResponse.json({ uploadUrl });

    } catch (error: any) {
        console.error("Upload initialization error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to initiate upload" },
            { status: 500 }
        );
    }
}
