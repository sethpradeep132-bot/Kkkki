const fs = require('fs');
let code = fs.readFileSync('src/components/portals/SellerOrdersView.tsx', 'utf8');

code = code.replace(
    /"shipment tag": "Seller pickup",\n            "tracking id number": trackingId\n        };/,
    `"shipment tag": "Seller pickup",\n            "tracking id number": trackingId,\n            "order status": finalOrderStatus\n        };`
);

fs.writeFileSync('src/components/portals/SellerOrdersView.tsx', code);
