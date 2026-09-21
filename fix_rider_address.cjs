const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf8');

const targetStr = `                  sellerName: sInfo.seller_name,
                  address: task['full address'] || task.address || sInfo.registered_full_address,
                  landmark: task.landmark || '',
                  pincode: task.pincode || sInfo.registered_pincode,`;

const newStr = `                  sellerName: sInfo.seller_name,
                  address: sInfo.registered_full_address || task['full address'] || task.address || '',
                  landmark: task.landmark || '',
                  pincode: sInfo.registered_pincode || task.pincode || '',`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
  console.log('Fixed RiderTasksView.tsx address mapping');
} else {
  console.log('Target string not found in RiderTasksView.tsx');
}
