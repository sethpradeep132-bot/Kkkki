const fs = require('fs');
const files = [
  'src/components/portals/AdminPortal.tsx',
  'src/components/portals/CustomerPortal.tsx',
  'src/components/portals/HubLogisticPortal.tsx',
  'src/components/portals/RiderPortal.tsx',
  'src/components/portals/SellerPortal.tsx',
  'src/components/portals/ClusterPortal.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    // We are looking for something like:
    // <div className="fixed inset-0 bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden">
    content = content.replace(/className="fixed inset-0 bg-\[\#fafafa\] text-black flex flex-col font-poppins overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden"');
    content = content.replace(/className="fixed inset-0 bg-\[\#fafafa\] text-black flex flex-col font-poppins overflow-hidden h-\[100dvh\]"/g, 'className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden"');
    
    // Also patch SellerPortal if it doesn't match the exact above
    content = content.replace(/className="fixed inset-0 bg-\[\#fafafa\] text-slate-900 flex flex-col font-poppins overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-slate-900 flex flex-col font-poppins overflow-hidden"');

    // Cluster Portal
    content = content.replace(/className="fixed inset-0 bg-\[\#fafafa\] text-black flex flex-col font-poppins overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden"');

    fs.writeFileSync(file, content);
  }
});
console.log('Patched portals');
