const fs = require('fs');
let code = fs.readFileSync('src/components/portals/HubShipmentsView.tsx', 'utf-8');

// Line 69
code = code.replace(
  `!['faild pickup', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'].includes(type)`,
  `!['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'].includes(type)`
);

// Line 1233
code = code.replace(
  `['faild pickup', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'].includes(type)`,
  `['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'].includes(type)`
);

// Line 1280 (add failed delivery etc as well just in case)
code = code.replace(
  `['faild pickup', 'faild delivery', 'rejected by customer', 'return request'].includes(type)`,
  `['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'return request'].includes(type)`
);

fs.writeFileSync('src/components/portals/HubShipmentsView.tsx', code);
