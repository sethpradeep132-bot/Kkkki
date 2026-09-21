const fs = require('fs');
let content = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');

content = content.replace(/const \{ error: customerError \} = await supabase\n          \.from\('customer_orders'\)\n          \/\* no order status update \*\/\n          \.eq\('id', selectedOrder\.id\);/, "const customerError = null;");

content = content.replace(/'order status': returnStatus,/, "");

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', content);
