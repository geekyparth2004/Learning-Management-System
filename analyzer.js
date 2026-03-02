const data = require('./.open-next/server-functions/default/handler.mjs.meta.json');
const sizes = Object.entries(data.inputs).map(([k, v]) => [k, v.bytesInOutput]).sort((a, b) => b[1] - a[1]).slice(0, 30);
console.log(sizes.map(s => `${s[0]}: ${Math.round(s[1] / 1024)} KB`).join('\n'));
