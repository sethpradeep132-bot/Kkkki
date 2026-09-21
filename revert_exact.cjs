const fs = require('fs');

function revertHubDashboard() {
    let code = fs.readFileSync('src/components/portals/HubDashboardView.tsx', 'utf-8');
    code = code.replace(
        /\}\)\.eq\('order ID', shipment\['order ID'\]\)\.eq\('product id', shipment\['product id'\]\)/g,
        `}).eq('awb number', shipment['awb number'])`
    );
    fs.writeFileSync('src/components/portals/HubDashboardView.tsx', code);
}

function revertHubDispatch() {
    let code = fs.readFileSync('src/components/portals/HubDispatchView.tsx', 'utf-8');
    code = code.replace(
        /select\('id, "order ID", "order status", "awb number", "product id"'\)\.in\('order ID', orderIds\)/g,
        `select('id, "order ID", "order status", "awb number"').in('order ID', orderIds)`
    );
    code = code.replace(
        /const matchingCos = coData\.filter\(co => co\['order ID'\] === s\['order ID'\] && co\['product id'\] === s\['product id'\]\);/g,
        `const matchingCos = coData.filter(co => co['order ID'] === s['order ID']);`
    );
    fs.writeFileSync('src/components/portals/HubDispatchView.tsx', code);
}

function revertOthers(filename) {
    if (!fs.existsSync(filename)) return;
    let code = fs.readFileSync(filename, 'utf-8');
    
    // HubShipmentsView
    code = code.replace(
        /\.eq\('order ID', targetShipment\['order ID'\]\)\.eq\('product id', targetShipment\['product id'\]\)/g,
        `.eq('order ID', targetShipment['order ID'])`
    );
    code = code.replace(
        /\.eq\('order ID', s\['order ID'\]\)\.eq\('product id', s\['product id'\]\)/g,
        `.eq('order ID', s['order ID'])`
    );
    code = code.replace(
        /\.eq\('order ID', ship\['order ID'\]\)\.eq\('product id', ship\['product id'\]\)/g,
        `.eq('order ID', ship['order ID'])`
    );

    // RiderTasksView
    code = code.replace(
        /\.eq\('order ID', task\['order ID'\]\)\.eq\('product id', task\['product id'\]\)/g,
        `.eq('order ID', task['order ID'])`
    );

    // RiderDashboardView
    code = code.replace(
        /\.eq\('order ID', ship\['order ID'\]\)\.eq\('product id', ship\['product id'\]\)/g,
        `.eq('order ID', ship['order ID'])`
    );

    fs.writeFileSync(filename, code);
}

revertHubDashboard();
revertHubDispatch();
revertOthers('src/components/portals/HubShipmentsView.tsx');
revertOthers('src/components/portals/RiderTasksView.tsx');
revertOthers('src/components/portals/RiderDashboardView.tsx');

console.log('Reverted exact matches.');
