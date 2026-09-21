const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

// Line 106
code = code.replace(
  `'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup',`,
  `'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup',`
);

// Line 134
code = code.replace(
  `'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup',`,
  `'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup',`
);

// Line 165
code = code.replace(
  `['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer'].includes(type)`,
  `['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer'].includes(type)`
);

// Line 588
code = code.replace(
  `['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild'].includes`,
  `['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild'].includes`
);

fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
