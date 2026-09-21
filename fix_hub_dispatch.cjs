const fs = require('fs');
let code = fs.readFileSync('src/components/portals/HubDispatchView.tsx', 'utf8');

code = code.replace(
    /const orderIds = scannedShipments\.map\(s => s\['order ID'\]\)\.filter\(Boolean\);[\s\S]*?await Promise\.all\(\[\.\.\.updates, \.\.\.customerOrderUpdates\]\);/,
    "await Promise.all(updates);"
);

fs.writeFileSync('src/components/portals/HubDispatchView.tsx', code);
