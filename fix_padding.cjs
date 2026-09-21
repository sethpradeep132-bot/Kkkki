const fs = require('fs');
const path = require('path');

const dir = 'src/components/portals/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let orig = content;
  
  // Ensure that <main ... overflow-y-auto> has pb-24
  content = content.replace(/<main([^>]*)className="([^"]*?flex-1 overflow-y-auto[^"]*?)"/g, (match, p1, p2) => {
    if (!p2.includes('pb-24') && !p2.includes('pb-20')) {
      p2 = p2.replace(/\bpb-\d+\b/g, '').trim();
      return `<main${p1}className="${p2} pb-24"`;
    }
    return match;
  });

  // Ensure inner sub-pages inside CustomerPortal, etc that might NOT be inside <main> also have proper padding if they represent a full page.
  // Actually, wait, let's just make sure AccountView and similar have pb-24 if they are direct children of the screen, 
  // but since they are rendered inside <main>, they don't need it. 
  // What about activePage in CustomerPortal that returns <div w-full min-h-full> instead of rendering inside <main>?
  // In CustomerPortal, if activePage === 'personal', it returns early! It replaces the whole screen!
  // So those early returns DO need pb-24 because they don't render inside <main pb-24>.
  
  // Let's add pb-24 to those w-full min-h-full that are the root of an early return.
  content = content.replace(/return \(\s*<div className="w-full min-h-full([^"]*?)"/g, (match, p1) => {
    if (!p1.includes('pb-24') && !p1.includes('pb-20')) {
      p1 = p1.replace(/\bpb-\d+\b/g, '').trim();
      return `return (\n      <div className="w-full min-h-full${p1} pb-24"`;
    }
    return match;
  });

  if (orig !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});
