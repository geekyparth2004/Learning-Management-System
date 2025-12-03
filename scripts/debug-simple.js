const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    credentials: {
        accessKeyId: "0057fefe6aee55b000000002",
        secretAccessKey: "K005ekuAFDHYh3Wic8Uj74QAsKv3z3Y"
    },
    forcePathStyle: true
});

async function run() {
    try {
        console.log("Testing connection...");
        const data = await s3.send(new ListBucketsCommand({}));
        console.log("Success!", data.Buckets.map(b => b.Name));
    } catch (e) {
        console.error("Error:", e.name, e.message);
    }
}

run();
