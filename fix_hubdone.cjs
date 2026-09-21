const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf8');

// Replace the newShipType logic in handleHubDone
const regex = /let newShipType = 'pickup attempt faild';[\s\S]*?newShipTag = 'customer delivery';\s*\}/m;
const replacement = `
          let newShipType = 'pickup attempt faild';
          let newShipTag = task['shipment tag'];
          
          if (isHubDeliveryOver3OrFailed) {
              newShipType = 'delivery attempt faild';
          }
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
