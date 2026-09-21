const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');
const getFirstImageCode = code.substring(code.indexOf('const getFirstImage ='), code.indexOf('const CustomerPortal ='));
console.log(getFirstImageCode);
