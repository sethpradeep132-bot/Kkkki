const fs = require('fs');
let code = fs.readFileSync('src/components/portals/HubDispatchView.tsx', 'utf8');

code = code.replace(
    /return supabase\n                 \.from\('accepted_shipments'\)\n                 \.update\(payload\)\n                 \.eq\('id', s\.id\);/,
    "return updateAcceptedShipment(payload, s.id, s);"
);

// We should also remove the manual customer_orders update since updateAcceptedShipment handles it!
// Let's remove the block:
// const orderIds = scannedShipments.map(s => s['order ID']).filter(Boolean);
// ...
// await Promise.all([...updates, ...customerOrderUpdates]);
// 
// and replace with:
// await Promise.all(updates);

fs.writeFileSync('src/components/portals/HubDispatchView.tsx', code);
