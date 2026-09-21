const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf-8');

// Replace the out for return text
const target = "newStatusText = `Your order is out for return. Please keep the product safe in its original packaging. on ${formattedDateTime}, Pickup ID: ${pickupId}, Pickup Pin: ${pickupPin}`;";
const replacement = "newStatusText = `Your order is out for return. Please keep the product safe in its original packaging. on ${formattedDateTime}, Pickup Pin: ${pickupPin}`;";
code = code.replace(target, replacement);

fs.writeFileSync('src/utils/statusUpdater.ts', code);
