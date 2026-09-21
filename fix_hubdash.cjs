const fs = require('fs');

let code = fs.readFileSync('src/components/portals/HubDashboardView.tsx', 'utf-8');

code = code.replace(
    /                                  'process type': 'dispatched',\n                'process type': 'shipped',/g,
    `                                  'process type': 'shipped',`
);

code = code.replace(
    /\}\)\.eq\('awb number', shipment\['awb number'\]\)/g,
    `}).eq('order ID', shipment['order ID']).eq('product id', shipment['product id'])`
);

fs.writeFileSync('src/components/portals/HubDashboardView.tsx', code);
console.log('Fixed Dashboard View.');
