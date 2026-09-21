const fs = require('fs');
const files = [
  'src/components/portals/AdminPortal.tsx',
  'src/components/portals/CustomerPortal.tsx',
  'src/components/portals/HubLogisticPortal.tsx',
  'src/components/portals/RiderPortal.tsx',
  'src/components/portals/SellerPortal.tsx',
  'src/components/portals/ClusterPortal.tsx'
];

let count = 0;
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    let orig = content;
    content = content.replace(/className="fixed inset-0 bg-\[\#fafafa\] text-black flex flex-col font-poppins overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden"');
    content = content.replace(/className="fixed inset-0 bg-\[\#fafafa\] text-slate-900 flex flex-col font-poppins overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-slate-900 flex flex-col font-poppins overflow-hidden"');

    if (orig !== content) {
      fs.writeFileSync(file, content);
      count++;
    }
  }
});
console.log('Patched', count, 'portals');
