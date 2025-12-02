import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.join(process.cwd(), ".env");
console.log("CWD:", process.cwd());
console.log("Env Path:", envPath);
console.log("Exists:", fs.existsSync(envPath));

const envLocalPath = path.join(process.cwd(), ".env.local");
console.log("Env Local Path:", envLocalPath);
console.log("Exists:", fs.existsSync(envLocalPath));

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath, override: true });
console.log("DATABASE_URL:", process.env.DATABASE_URL);
