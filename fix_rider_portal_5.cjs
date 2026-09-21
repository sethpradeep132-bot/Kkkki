const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderPortal.tsx', 'utf8');

const regex = /const \[riderData, setRiderData\] = useState<any>\(null\);/;
const replacement = `const [riderData, setRiderData] = useState<any>(null);
  const riderId = riderData?.id;`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/portals/RiderPortal.tsx', code);
