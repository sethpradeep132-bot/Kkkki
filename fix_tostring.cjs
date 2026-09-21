const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix all instances of .toString() that might fail
    content = content.replace(/([a-zA-Z0-9_]+)\.sum\.toString\(\)/g, '($1.sum || 0).toString()');
    content = content.replace(/([a-zA-Z0-9_]+)\.amount\.toString\(\)/g, '($1.amount || 0).toString()');
    content = content.replace(/([a-zA-Z0-9_]+)\.penaltyAmount\.toString\(\)/g, '($1.penaltyAmount || 0).toString()');
    content = content.replace(/([a-zA-Z0-9_]+)\.totalAmount\.toString\(\)/g, '($1.totalAmount || 0).toString()');
    content = content.replace(/([a-zA-Z0-9_]+)\.payableAmount\.toString\(\)/g, '($1.payableAmount || 0).toString()');

    fs.writeFileSync(filePath, content);
}

fixFile('src/components/portals/AdminPortal.tsx');
fixFile('src/components/portals/ClusterPortal.tsx');
