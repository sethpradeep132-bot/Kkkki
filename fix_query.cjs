const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

const regex = /const \{ data: coRows \} = await supabase\s*\.from\('customer_orders'\)\s*\.select\('id, "order status"'\)\s*\.eq\('order ID', orderId\)\s*\.eq\('product id', productId\);/;

const replacement = `
  let query = supabase
    .from('customer_orders')
    .select('id, "order status"')
    .eq('order ID', orderId);
  if (productId) {
    query = query.eq('product id', productId);
  }
  const { data: coRows } = await query;
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('src/utils/statusUpdater.ts', code);
