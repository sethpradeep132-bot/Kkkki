const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

// Block 1 (around 902)
code = code.replace(
  `         if (task['shipment type'] === 'out for pickup' && task['shipment tag'] === 'customer pickup') {
             newShipType = 'delivered';
             newShipTag = 'customer delivery';
         }`,
  `         if (task['shipment type'] === 'out for pickup' && task['shipment tag'] === 'customer pickup') {
             newShipType = 'return pickup faild';
             newShipTag = 'customer pickup';
         }`
);

// Block 2 (around 1301)
code = code.replace(
  `      if (['out for pickup', 'faild pickup', 'failed pickup'].includes(typeLower1) && tagLower1 === 'customer pickup') {
          newShipType = 'delivered';
          newShipTag = 'customer delivery';
      }`,
  `      if (['out for pickup', 'faild pickup', 'failed pickup'].includes(typeLower1) && tagLower1 === 'customer pickup') {
          newShipType = 'return pickup faild';
          newShipTag = 'customer pickup';
      }`
);

// Block 3 (around 2270)
code = code.replace(
  `                     if (task['shipment type'] === 'out for pickup' && task['shipment tag'] === 'customer pickup') {
                         newShipType = 'delivered';
                         newShipTag = 'customer delivery';
                     }`,
  `                     if (task['shipment type'] === 'out for pickup' && task['shipment tag'] === 'customer pickup') {
                         newShipType = 'return pickup faild';
                         newShipTag = 'customer pickup';
                     }`
);

fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
