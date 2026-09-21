const fs = require('fs');

function fixFile(filename) {
  if (!fs.existsSync(filename)) return;
  let code = fs.readFileSync(filename, 'utf-8');
  
  // Replace 'order status': newOrderStatus without process type
  code = code.replace(
    /'order status': newOrderStatus,/g,
    `'order status': newOrderStatus,\n                'process type': 'shipped',`
  );
  
  // Replace updatedOrderStatus in HubShipmentsView
  code = code.replace(
    /'order status': updatedOrderStatus,/g,
    `'order status': updatedOrderStatus,\n               'process type': 'updated',`
  );

  fs.writeFileSync(filename, code);
  console.log('Fixed', filename);
}

fixFile('src/components/portals/HubDashboardView.tsx');
fixFile('src/components/portals/HubDispatchView.tsx');
fixFile('src/components/portals/HubShipmentsView.tsx');
