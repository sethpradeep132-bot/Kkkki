const fs = require('fs');
let content = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');

// For cancelStatus
content = content.replace(/const \{ error: customerError \} = await supabase\n          \.from\('customer_orders'\)\n\/\/\n          \.eq\('id', selectedOrder\.id\);/, "const customerError = null;");

// For returnStatus
content = content.replace(/\.update\(\{ 'order status': returnStatus \}\)/, "/* no order status update */");

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', content);
