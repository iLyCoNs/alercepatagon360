const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const v = Date.now();
html = html.replace(/src="js\/modules\/([^"]+\.js)(?:\?v=\d+)?"/g, `src="js/modules/$1?v=${v}"`);
fs.writeFileSync('index.html', html);
console.log('Cache bust applied to index.html');
