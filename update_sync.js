const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

const replacement = `
    const updateObj: any = {
      'order status': finalOrderStatus,
      'process type': newProcessType
    };
    if (awbNumber) updateObj['awb number'] = awbNumber;
    if (trackingId) updateObj['tracking id number'] = trackingId;
    
    updatePromises.push(
      supabase.from('customer_orders').update(updateObj).eq('id', targetRow.id)
    );
`;

code = code.replace(/updatePromises\.push\(\s*supabase\.from\('customer_orders'\)\.update\(\{\s*'order status': finalOrderStatus,\s*'process type': newProcessType\s*\}\)\.eq\('id', targetRow\.id\)\s*\);/m, replacement);

fs.writeFileSync('src/utils/statusUpdater.ts', code);
