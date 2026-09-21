const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderPortal.tsx', 'utf8');

code = code.replace(/riderData\?\.id/g, 'riderId');

fs.writeFileSync('src/components/portals/RiderPortal.tsx', code);
