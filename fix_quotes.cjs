const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');
code = code.replace(/“Your return pickup has failed\./g, 'Your return pickup has failed.');
fs.writeFileSync('src/utils/statusUpdater.ts', code);
