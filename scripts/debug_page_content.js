const fs = require('fs');
const content = fs.readFileSync('app/assignment/[id]/page.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 1080; i < 1100; i++) {
    console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
