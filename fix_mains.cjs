const fs = require('fs');
const path = require('path');

const dir = 'src/components/portals/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let orig = content;
  
  // RiderPortal
  content = content.replace(/<main className="flex-1 pb-20">/g, '<main className="flex-1 overflow-y-auto pb-24">');
  content = content.replace(/<main className="flex-1 pb-24">/g, '<main className="flex-1 overflow-y-auto pb-24">');
  
  // HubLogisticPortal
  content = content.replace(/<main className="flex-1 overflow-y-auto">/g, '<main className="flex-1 overflow-y-auto pb-24">');
  
  // SellerPortal & ClusterPortal & CustomerPortal & ProductDetailModal
  content = content.replace(/pb-20/g, 'pb-24');

  if (orig !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
