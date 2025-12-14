
const bucketName = "learningsystem";

function extractKey(fileUrl: string) {
    console.log(`\nTesting URL: ${fileUrl}`);
    try {
        const urlObj = new URL(fileUrl);
        console.log(`Pathname: ${urlObj.pathname}`);
        console.log(`Hash: ${urlObj.hash}`);

        // Simulating the fix in lib/s3.ts
        const fullPath = urlObj.pathname + (urlObj.hash || "");
        const pathParts = fullPath.split("/");

        let key = "";
        if (pathParts.includes(bucketName)) {
            const bucketIndex = pathParts.indexOf(bucketName);
            key = pathParts.slice(bucketIndex + 1).join("/");
        } else {
            key = fullPath.substring(1);
        }

        // Decode logic
        key = decodeURIComponent(key);
        console.log(`Extracted Key: ${key}`);
        return key;
    } catch (e) {
        console.error("Error parsing URL");
        return null;
    }
}

// Test Cases
extractKey("https://eb6b901.r2.cloudflarestorage.com/learningsystem/videos/123-video.mp4");
extractKey("https://eb6b901.r2.cloudflarestorage.com/learningsystem/videos/123-video-#01.mp4"); // The problem case
extractKey("https://eb6b901.r2.cloudflarestorage.com/learningsystem/videos/space%20name.mp4");
extractKey("https://eb6b901.r2.cloudflarestorage.com/learningsystem/videos/hash%23tag.mp4"); // Encoded hash
