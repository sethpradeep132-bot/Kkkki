const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderPortal.tsx', 'utf8');

code = code.replace(/riderId/g, 'riderData?.id');

fs.writeFileSync('src/components/portals/RiderPortal.tsx', code);
