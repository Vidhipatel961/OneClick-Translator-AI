const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

code = code.replace(/max-width: 100% !important;/g, '');

fs.writeFileSync('frontend/src/index.css', code);
console.log('Fixed max-width');
