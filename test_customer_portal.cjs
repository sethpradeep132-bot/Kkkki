const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

// Find where order_details is defined
console.log(code.substring(code.indexOf('if (activePage === \'order_details\' && selectedOrder) {'), code.indexOf('if (activePage === \'order_details\' && selectedOrder) {') + 1000));
