const fs = require('fs');
const files = [
  'src/components/portals/HubDashboardView.tsx',
  'src/components/portals/RiderDashboardView.tsx',
  'src/components/portals/HubDispatchView.tsx',
  'src/components/portals/RiderTasksView.tsx',
  'src/components/portals/HubShipmentsView.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  const searchRegex1 = /payload\['pickup ID'\] \|\| fullShipmentData\['pickup ID'\],\n\s*sourcePortal\n\s*\);/g;
  const replace1 = `payload['pickup ID'] || fullShipmentData['pickup ID'],\n            sourcePortal,\n            payload['pickup pin'] || fullShipmentData['pickup pin'] || ''\n        );`;
  content = content.replace(searchRegex1, replace1);

  const searchRegex2 = /payload\['pickup ID'\] \|\| fullShipmentData\['pickup ID'\]\n\s*\);/g;
  const replace2 = `payload['pickup ID'] || fullShipmentData['pickup ID'],\n            '',\n            payload['pickup pin'] || fullShipmentData['pickup pin'] || ''\n        );`;
  content = content.replace(searchRegex2, replace2);

  const searchRegex3 = /payload\['pickup ID'\] \|\| fullShipmentData\['pickup ID'\],\n\s*'hub_shipments'\n\s*\);/g;
  const replace3 = `payload['pickup ID'] || fullShipmentData['pickup ID'],\n            'hub_shipments',\n            payload['pickup pin'] || fullShipmentData['pickup pin'] || ''\n        );`;
  content = content.replace(searchRegex3, replace3);

  fs.writeFileSync(file, content);
}

// Update statusUpdater.ts
let updaterContent = fs.readFileSync('src/utils/statusUpdater.ts', 'utf-8');
updaterContent = updaterContent.replace(
  /sourcePortal: string = ''\) => \{/g,
  `sourcePortal: string = '',\n  newPickupPin: string = ''\n) => {`
);

updaterContent = updaterContent.replace(
  /const pickupPin = sData \? \(sData\['pickup pin'\] \|\| 'N\/A'\) : 'N\/A';/g,
  `const pickupPin = newPickupPin || (sData ? (sData['pickup pin'] || 'N/A') : 'N/A');`
);

fs.writeFileSync('src/utils/statusUpdater.ts', updaterContent);
