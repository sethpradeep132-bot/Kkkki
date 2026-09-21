const fs = require('fs');
let code = fs.readFileSync('src/components/portals/SellerOrdersView.tsx', 'utf-8');

code = code.replace(
  `query = query.ilike('shipment type', 'faild pickup').in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);`,
  `query = query.in('shipment type', ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild']).in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);`
);

fs.writeFileSync('src/components/portals/SellerOrdersView.tsx', code);
