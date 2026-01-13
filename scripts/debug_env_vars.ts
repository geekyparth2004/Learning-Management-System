
const dotenv = require('dotenv');
dotenv.config();

console.log("Checking Environment Variables...");

const vars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "AWS_BUCKET_NAME",
    "AWS_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_REGION",
    "R2_BUCKET_NAME",
    "R2_ENDPOINT",
    "R2_ACCOUNT_ID"
];

vars.forEach(v => {
    const val = process.env[v];
    console.log(`${v}: ${val ? (val.length > 5 ? val.substring(0, 5) + "..." : val) : "MISSING"}`);
});

export { }; // Module
