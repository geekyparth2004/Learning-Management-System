const test = async () => {
    // Test Judge0
    try {
        const j0 = await fetch('https://ce.judge0.com/submissions?wait=true', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_code: 'print("Hello world from Judge0")', language_id: 71 }) // 71 = Python
        });
        const jData = await j0.json();
        console.log('Judge0 Exec:', j0.status, jData);
    } catch (e) { console.log('Judge0 error', e.message) }

    // Test Codex API
    try {
        const cp = require('child_process');
        cp.execSync('curl -s -X POST https://api.codex.jaagrav.in -H "Content-Type: application/json" -d "{\\"code\\":\\"print(\'Hello world from Codex\')\\",\\"language\\":\\"py\\"}" > codex.json');
        const fs = require('fs');
        console.log('Codex API:', fs.readFileSync('codex.json', 'utf8'));
    } catch (e) { console.log('Codex error', e.message) }
}
test();
