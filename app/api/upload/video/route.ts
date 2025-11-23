import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
    try {
        const { filename, contentType } = await request.json();

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/drive.file"],
        });

        const drive = google.drive({ version: "v3", auth });

        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // Create a file metadata
        const fileMetadata = {
            name: filename,
            parents: [folderId!],
        };

        // Request a resumable upload URL
        // We use 'create' with 'uploadType=resumable'
        // But the googleapis library handles this slightly differently.
        // We can get the generated upload URL by manually making the request or using the library's media upload.
        // However, for client-side direct upload, we need the session URI.

        // A cleaner way is to use the drive.files.create method but intercept the request to get the location header?
        // Or simpler: just use the access token to make the initial POST request manually to get the location.

        const token = await auth.getAccessToken();

        const initiateResponse = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Upload-Content-Type": contentType,
                    "X-Upload-Content-Length": "", // Optional if unknown
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
