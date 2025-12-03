const keyId = "7fefe6aee55b";
const applicationKey = "00592621332427b97436be42ed614428513660e32d";
const bucketId = "47ff2e7f3e16ea5e9ea5051b";

async function fixCorsNative() {
    console.log("Authenticating with B2 Native API...");

    // Manual Base64 encoding to be absolutely sure
    const authString = Buffer.from(keyId + ":" + applicationKey).toString("base64");
    console.log("Auth Header Prefix:", authString.substring(0, 5));

    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
        headers: {
            "Authorization": "Basic " + authString
        }
    });

    if (!authRes.ok) {
        console.error("Auth Failed:", await authRes.text());
        return;
    }

    const authData = await authRes.json();
    const apiUrl = authData.apiUrl;
    const accountAuthToken = authData.authorizationToken;
    console.log("✅ Authenticated!");

    console.log("Updating Bucket CORS...");
    const updateRes = await fetch(apiUrl + "/b2api/v2/b2_update_bucket", {
        method: "POST",
        headers: {
            "Authorization": accountAuthToken,
            "Content-Type": "application/json"
        })
});

if (!updateRes.ok) {
    console.error("Update Failed:", await updateRes.text());
    return;
}

const updateData = await updateRes.json();
console.log("✅ CORS Updated Successfully via Native API!");
console.log("New Rules:", JSON.stringify(updateData.corsRules, null, 2));
}

fixCorsNative();
