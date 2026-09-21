const fs = require('fs');
let code = fs.readFileSync('src/components/portals/SellerDashboardView.tsx', 'utf-8');

code = code.replace(
  `.ilike('shipment type', 'faild pickup')`,
  `.in('shipment type', ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild'])`
);

fs.writeFileSync('src/components/portals/SellerDashboardView.tsx', code);
