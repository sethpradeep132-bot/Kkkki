const fs = require('fs');
let content = fs.readFileSync('src/utils/statusUpdater.ts', 'utf-8');

content = content.replace(
  /sourcePortal: string = ''\) => \{/g,
  `sourcePortal: string = '',\n  newPickupPin: string = ''\n) => {`
);

content = content.replace(
  /const pickupPin = sData \? \(sData\['pickup pin'\] \|\| 'N\/A'\) : 'N\/A';/g,
  `const pickupPin = newPickupPin || (sData ? (sData['pickup pin'] || 'N/A') : 'N/A');`
);

fs.writeFileSync('src/utils/statusUpdater.ts', content);
