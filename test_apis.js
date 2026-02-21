const test = async () => {
    try {
        const j0 = await fetch('https://ce.judge0.com/languages');
        console.log('Judge0 CE Public:', j0.status);
    } catch (e) { console.log('Judge0 error', e.message) }

    try {
        const paiza = await fetch('https://api.paiza.io/runners/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_code: 'print("Hello")', language: 'python3', api_key: 'guest' })
        });
        const pData = await paiza.json();
        console.log('Paiza Create:', paiza.status, pData);

        if (pData.id) {
            await new Promise(r => setTimeout(r, 1000));
            const p2 = await fetch(`https://api.paiza.io/runners/get_details?id=${pData.id}&api_key=guest`);
            const p2Data = await p2.json();
            console.log('Paiza Result:', p2Data.stdout);
        }
    } catch (e) { console.log('Paiza error', e.message) }
}
test();
