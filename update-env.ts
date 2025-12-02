import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
const dbUrl = "postgresql://neondb_owner:npg_m19EAzgyVnZU@ep-green-frost-a1v9ip83-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

let content = "";
if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
}

// Check if DATABASE_URL exists
if (content.includes("DATABASE_URL=")) {
    // Replace it
    content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${dbUrl}"`);
} else {
    // Append it
    content += `\nDATABASE_URL="${dbUrl}"\n`;
}

// Ensure GitHub vars exist (if missing, append them for convenience)
if (!content.includes("AUTH_GITHUB_ID=")) {
    content += `\nAUTH_GITHUB_ID="Ov23liFtlXrfFuFv4fE7"\n`;
}
if (!content.includes("AUTH_GITHUB_SECRET=")) {
    content += `\nAUTH_GITHUB_SECRET="74024f25a48b005540aa8c5d9858ee168682d9db"\n`;
}
if (!content.includes("AUTH_SECRET=")) {
    content += `\nAUTH_SECRET="secret"\n`;
}

fs.writeFileSync(envPath, content);
console.log("Updated .env file successfully.");
