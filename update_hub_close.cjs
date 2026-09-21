const fs = require('fs');
let code = fs.readFileSync('src/components/portals/HubShipmentsView.tsx', 'utf-8');

// The line is: return ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'rejected by customer'].includes(type);
code = code.replace(
  /return \['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'rejected by customer'\]\.includes\(type\);/g,
  `return ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild'].includes(type);`
);

// We should also ensure pickupsheet array has the delivery variants in case they scanned a delivery in a pickupsheet.
// The pickupsheet line is: return ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'].includes(type);
code = code.replace(
  /return \['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'\]\.includes\(type\);/g,
  `return ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup'].includes(type);`
);

fs.writeFileSync('src/components/portals/HubShipmentsView.tsx', code);
