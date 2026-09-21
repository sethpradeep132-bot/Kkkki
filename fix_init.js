const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Extract secureTxSettings
    const match = content.match(/const \[secureTxSettings, setSecureTxSettings\] = useState\(\{[\s\S]*?salaryHold: false\n  \}\);/);
    if (match) {
        content = content.replace(match[0], ''); // remove from original position
        content = content.replace('const secureTxSettingsRef', match[0] + '\n  const secureTxSettingsRef');
        fs.writeFileSync(file, content, 'utf8');
    }
}

fixFile('src/components/portals/AdminPortal.tsx');
fixFile('src/components/portals/ClusterPortal.tsx');
