const fs = require('fs');
const path = require('path');

const dir = 'src/components/portals/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let changed = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let orig = content;
  
  // 1. Add pb-24 to <main className="flex-1 overflow-y-auto ..."> 
  // It currently looks like: <main className="flex-1 overflow-y-auto bg-white relative">
  // We need to inject pb-24 into the className.
  content = content.replace(/<main([^>]*)className="([^"]*?)"/g, (match, p1, p2) => {
    // If it already has pb-24, ignore
    if (p2.includes('pb-24') || p2.includes('pb-20')) return match;
    // Remove any pb-6 or pb-4 just in case
    p2 = p2.replace(/\bpb-\d+\b/g, '').trim();
    // Add pb-24
    return `<main${p1}className="${p2} pb-24"`;
  });

  if (orig !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated <main> in ${file}`);
    changed++;
  }
});
console.log('Done', changed);
