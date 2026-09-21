const fs = require('fs');
const path = require('path');

const dir = 'src/components/portals/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));

let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let orig = content;
  
  // Replace fixed inset-0 on root views inside these files
  content = content.replace(/className="fixed inset-0 z-50 bg-\[\#fafafa\] flex flex-col overflow-hidden font-poppins"/g, 'className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden font-poppins"');
  content = content.replace(/className="fixed inset-0 z-50 bg-\[\#fafafa\] flex flex-col overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden"');
  content = content.replace(/className="fixed inset-0 w-full bg-\[\#F8FAFC\] text-slate-900 flex flex-col font-poppins antialiased select-none overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 flex flex-col font-poppins antialiased select-none overflow-hidden"');
  content = content.replace(/className="fixed inset-0 z-50 bg-\[\#fafafa\] flex flex-col overflow-hidden font-poppins"/g, 'className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden font-poppins"');

  if (orig !== content) {
    fs.writeFileSync(file, content);
    count++;
  }
});
console.log('Patched', count, 'inner files');
