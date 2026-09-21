const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/portals/*.tsx');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // For any setActiveTab('...'), add pushState
    // E.g. setActiveTab(id) -> { setActiveTab(id); window.history.pushState({ portal: '...', tab: id }, ''); }
    // But we need to know the portal name. We can get it from the file name.
    const portalMap = {
        'CustomerPortal.tsx': 'customer',
        'SellerPortal.tsx': 'seller',
        'HubLogisticPortal.tsx': 'hub',
        'RiderPortal.tsx': 'rider',
        'ClusterPortal.tsx': 'cluster',
        'AdminPortal.tsx': 'admin'
    };
    
    let portalName = 'customer';
    for (const [k, v] of Object.entries(portalMap)) {
        if (file.includes(k)) portalName = v;
    }

    // This is getting very tricky with Regex.
}
