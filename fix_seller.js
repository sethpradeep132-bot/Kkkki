const fs = require('fs');
let content = fs.readFileSync('src/components/portals/SellerOrdersView.tsx', 'utf8');

content = content.replace(/\/\/ removed order status update/g, (match, offset, str) => {
  // restore line 335 and 345 logic safely
  // For line 335: finalShipmentStatus = await buildShipmentStatus('Cancelled by seller', currentData, { 'order status': finalOrderStatus });
  // But wait, we don't want to pass 'order status' if it's supposed to not update.
  // We can just pass {} instead of { 'order status': ... }
  // Wait, let's just restore it without 'order status'
  return ""; 
});

fs.writeFileSync('src/components/portals/SellerOrdersView.tsx', content);
