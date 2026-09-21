import fs from 'fs';
let content = fs.readFileSync('src/components/portals/SellerOrdersView.tsx', 'utf8');

content = content.replace(
  /const \{ data: coRows \} = await supabase\.from\('customer_orders'\)\.select\('id, "tracking id number"'\)\.eq\('order ID', orderId\);/g,
  `const { data: coRows } = await supabase.from('customer_orders').select('id, "tracking id number", "product id"').eq('order ID', orderId);`
);

content = content.replace(
  /let targetRow = coRows\.find\(r => !r\['tracking id number'\]\);/g,
  `let targetRow = currentData && currentData['product id'] ? coRows.find(r => r['product id'] === currentData['product id'] && !r['tracking id number']) : null;
              if (!targetRow) targetRow = coRows.find(r => !r['tracking id number']);`
);

fs.writeFileSync('src/components/portals/SellerOrdersView.tsx', content);
