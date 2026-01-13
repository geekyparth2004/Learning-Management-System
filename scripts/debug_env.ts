
const dotenv = require('dotenv');
dotenv.config();

console.log("Checking Environment Variables for R2...");
const bucket = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
const region = process.env.R2_REGION || process.env.AWS_REGION || "auto"; // Default in code was "auto", now "us-east-1"
const endpoint = process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : process.env.AWS_ENDPOINT;

console.log(`R2_BUCKET_NAME: ${bucket}`);
console.log(`Region (env): ${region}`);
console.log(`Endpoint (constructed): ${endpoint}`);

if (bucket !== 'learningsystem') {
    console.warn("WARNING: Environment bucket name does not match 'learningsystem' seen in URLs!");
} else {
    console.log("SUCCESS: Bucket name matches URLs.");
}
