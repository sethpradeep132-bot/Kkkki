const fs = require('fs');
let content = fs.readFileSync('src/components/portals/HubDispatchView.tsx', 'utf8');

content = content.replace(/\.update\(\{\n                                  \n                                  'updated_at': new Date\(\)\.toISOString\(\)\n                              \}\)/,
    ".update({\n                                  'order status': newOrderStatus,\n                                  'updated_at': new Date().toISOString()\n                              })");

content = content.replace(/const newOrderStatus = previousStatus \? `\$\{orderStatusMsg\}\\n-----------------------------------\\n\$\{previousStatus\}` : orderStatusMsg;/g,
    "const newOrderStatus = previousStatus ? previousStatus + ' || ' + orderStatusMsg : orderStatusMsg;");


fs.writeFileSync('src/components/portals/HubDispatchView.tsx', content);
