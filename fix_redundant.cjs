const fs = require('fs');

function fix(filename) {
    if (!fs.existsSync(filename)) return;
    let code = fs.readFileSync(filename, 'utf-8');
    
    code = code.replace(
        /\.eq\('product id', targetShipment\['product id'\]\)\.eq\('product id', targetShipment\['product id'\]\)/g,
        `.eq('product id', targetShipment['product id'])`
    );
    code = code.replace(
        /\.eq\('product id', s\['product id'\]\)\.eq\('product id', s\['product id'\]\)/g,
        `.eq('product id', s['product id'])`
    );
    code = code.replace(
        /\.eq\('product id', ship\['product id'\]\)\.eq\('product id', ship\['product id'\]\)/g,
        `.eq('product id', ship['product id'])`
    );
    code = code.replace(
        /\.eq\('product id', task\['product id'\]\)\.eq\('product id', task\['product id'\]\)/g,
        `.eq('product id', task['product id'])`
    );

    fs.writeFileSync(filename, code);
}

fix('src/components/portals/HubShipmentsView.tsx');
fix('src/components/portals/RiderTasksView.tsx');
fix('src/components/portals/RiderDashboardView.tsx');

console.log('Fixed redundant.');
