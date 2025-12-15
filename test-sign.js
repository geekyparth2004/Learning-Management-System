const fetch = require('node-fetch');

async function testSign() {
    try {
        const res = await fetch('http://localhost:3000/api/video/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://pub-r2.r2.dev/test-video.mp4' })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testSign();
