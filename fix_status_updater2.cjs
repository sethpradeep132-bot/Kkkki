const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

code = code.replace(/if \(coRows && coRows\.length > 0\) {([\s\S]*?)await Promise\.all\(updatePromises\);\s*}/, `let updatePromises = [];
  if (coRows && coRows.length > 0) {
    updatePromises = coRows.map(row => 
      supabase.from('customer_orders').update({
        'order status': finalOrderStatus,
        'process type': newProcessType
      }).eq('id', row.id)
    );
  }
  if (shipmentId) {
    updatePromises.push(
      supabase.from('accepted_shipments').update({
        'order status': finalOrderStatus
      }).eq('id', shipmentId)
    );
  }
  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }`);

fs.writeFileSync('src/utils/statusUpdater.ts', code);
console.log('Done');
