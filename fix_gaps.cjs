const fs = require('fs');
const path = require('path');

const dir = 'src/components/portals/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let orig = content;
  
  // 1. Remove pb-24 from the inner wrapper divs (e.g. w-full min-h-full ... pb-24)
  content = content.replace(/className="w-full min-h-full([^"]*)pb-24([^"]*)"/g, 'className="w-full min-h-full$1$2"');
  
  // Also if they have 'flex-1 overflow-y-auto p-4 space-y-4 pb-24' etc
  content = content.replace(/className="flex-1 overflow-y-auto([^"]*)pb-24([^"]*)"/g, 'className="flex-1 overflow-y-auto$1$2"');
  
  // 2. Change pb-24 on <main> wrappers to pb-6
  content = content.replace(/<main([^>]*)className="([^"]*)pb-24([^"]*)"/g, '<main$1className="$2pb-6$3"');
  
  // Any residual pb-24 that might be causing gaps, let's just replace them with pb-6 if they are layout wrappers
  content = content.replace(/pb-24/g, 'pb-6');

  if (orig !== content) {
    // clean up double spaces
    content = content.replace(/  +/g, ' ');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
