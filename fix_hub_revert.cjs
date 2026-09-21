const fs = require('fs');

function fix(filename) {
    if (!fs.existsSync(filename)) return;
    let code = fs.readFileSync(filename, 'utf-8');
    
    // We want to keep 'process type' ONLY in supabase.from('customer_orders').update({...})
    // Let's first remove all 'process type' that I injected wrongly in updatePayload.
    
    code = code.replace(
        /'order status': newOrderStatus,\s+'process type': 'shipped',/g,
        `'order status': newOrderStatus,`
    );
    
    code = code.replace(
        /'order status': updatedOrderStatus,\s+'process type': 'updated',/g,
        `'order status': updatedOrderStatus,`
    );

    fs.writeFileSync(filename, code);
}

fix('src/components/portals/HubDashboardView.tsx');
fix('src/components/portals/HubDispatchView.tsx');
fix('src/components/portals/HubShipmentsView.tsx');

