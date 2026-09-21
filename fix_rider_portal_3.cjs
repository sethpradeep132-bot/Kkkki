const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderPortal.tsx', 'utf8');

code = code.replace(/riderData\?\.id=\{riderData\?\.id\}/g, 'riderId={riderData.id}');

fs.writeFileSync('src/components/portals/RiderPortal.tsx', code);
