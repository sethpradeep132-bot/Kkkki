const fs = require('fs');
let code = fs.readFileSync('src/components/portals/AdminLiveShipmentCard.tsx', 'utf-8');

code = code.replace(
  `setFailedPickupCount(await getCountIlike('faild pickup'));`,
  `setFailedPickupCount(await getCountWithDirectCluster('shipment type.ilike.faild pickup,shipment type.ilike.failed pickup,shipment type.ilike.qc faild pickup,shipment type.ilike.pickup attempt faild,shipment type.ilike.return pickup faild', false));`
);

fs.writeFileSync('src/components/portals/AdminLiveShipmentCard.tsx', code);
