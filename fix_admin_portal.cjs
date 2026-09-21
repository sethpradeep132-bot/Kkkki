const fs = require('fs');
let lines = fs.readFileSync('src/components/portals/AdminPortal.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('}, 500);') && lines[i-1].includes('handleMarkAsSettled(userId);')) {
        lines[i] = ''; // remove }, 500);
    }
}
fs.writeFileSync('src/components/portals/AdminPortal.tsx', lines.join('\n'));
