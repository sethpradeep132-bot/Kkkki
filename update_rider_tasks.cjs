const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

// Line 105 & 133
code = code.replace(
  /'faild pickup', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'/g,
  `'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'`
);

// Line 164
code = code.replace(
  `['faild pickup', 'faild delivery', 'rejected by customer'].includes(type)`,
  `['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer'].includes(type)`
);

// Line 587
code = code.replace(
  `const isHubFailed = isHubView && (task['shipment type'] || '').toLowerCase() === 'faild pickup';`,
  `const isHubFailed = isHubView && ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild'].includes((task['shipment type'] || '').toLowerCase());`
);

fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
