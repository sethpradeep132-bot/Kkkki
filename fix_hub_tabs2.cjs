const fs = require('fs');
let code = fs.readFileSync('src/components/portals/HubShipmentsView.tsx', 'utf-8');

code = code.replace(
  `'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild'].includes(type);`,
  `'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild'].includes(type);`
);

fs.writeFileSync('src/components/portals/HubShipmentsView.tsx', code);
