const fs = require('fs');

function fix(filename) {
    if (!fs.existsSync(filename)) return;
    let code = fs.readFileSync(filename, 'utf-8');
    
    // In DashboardView
    code = code.replace(
        /supabase\.from\('customer_orders'\)\.update\(\{\s+'order status': newOrderStatus,/g,
        `supabase.from('customer_orders').update({\n                'order status': newOrderStatus,\n                'process type': 'shipped',`
    );
    
    // In DispatchView
    code = code.replace(
        /supabase\.from\('customer_orders'\)\.update\(\{\s+'order status': newOrderStatus,/g,
        `supabase.from('customer_orders').update({\n                                  'order status': newOrderStatus,\n                                  'process type': 'dispatched',`
    );

    // In HubShipmentsView
    code = code.replace(
        /supabase\.from\('customer_orders'\)\.update\(\{\s+'order status': updatedOrderStatus,/g,
        `supabase.from('customer_orders').update({\n               'order status': updatedOrderStatus,\n               'process type': 'updated',`
    );

    fs.writeFileSync(filename, code);
}

fix('src/components/portals/HubDashboardView.tsx');
fix('src/components/portals/HubDispatchView.tsx');
fix('src/components/portals/HubShipmentsView.tsx');

