const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

const targetStr = `  const { data: coRows } = await supabase
    .from('customer_orders')
    .select('id')
    .eq('order ID', orderId)
    .eq('product id', productId);

  let updatePromises = [];
  if (coRows && coRows.length > 0) {
    updatePromises = coRows.map(row => 
      supabase.from('customer_orders').update({
        'order status': finalOrderStatus,
        'process type': newProcessType
      }).eq('id', row.id)
    );
  }`;

const newStr = `  const { data: coRows } = await supabase
    .from('customer_orders')
    .select('id, "order status"')
    .eq('order ID', orderId)
    .eq('product id', productId);

  let updatePromises = [];
  if (coRows && coRows.length > 0) {
    let targetRow = coRows.find(r => r['order status'] === existingOrderStatus);
    if (!targetRow) targetRow = coRows.find(r => !r['order status']?.includes(newStatusText));
    if (!targetRow) targetRow = coRows[0];
    
    updatePromises.push(
      supabase.from('customer_orders').update({
        'order status': finalOrderStatus,
        'process type': newProcessType
      }).eq('id', targetRow.id)
    );
  }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/utils/statusUpdater.ts', code);
  console.log('Fixed status updater mapping');
} else {
  console.log('Target string not found in statusUpdater.ts');
}
