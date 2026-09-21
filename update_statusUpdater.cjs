const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf-8');

code = code.replace(
  `const { data: sData } = await supabase.from('accepted_shipments').select('"shipment type", "shipment tag", "Rider id", "cancellation code"').eq('id', shipmentId).maybeSingle();`,
  `const { data: sData } = await supabase.from('accepted_shipments').select('"shipment type", "shipment tag", "Rider id", "cancellation code", "pickup pin"').eq('id', shipmentId).maybeSingle();`
);

const oldOutForPickup = `  else if (lowerType === 'out for pickup' && lowerTag === 'customer pickup') {
    newStatusText = \`Your order is out for return. Please keep the product safe in its original packaging. on \${formattedDateTime}, Pickup ID: \${pickupId}\`;
  }`;

const newOutForPickup = `  else if (lowerType === 'out for pickup' && lowerTag === 'customer pickup') {
    const pickupPin = sData ? (sData['pickup pin'] || 'N/A') : 'N/A';
    newStatusText = \`Your order is out for return. Please keep the product safe in its original packaging. on \${formattedDateTime}, Pickup ID: \${pickupId}, Pickup Pin: \${pickupPin}\`;
  }`;

if (code.includes(oldOutForPickup)) {
    code = code.replace(oldOutForPickup, newOutForPickup);
} else {
    console.error("Could not find oldOutForPickup string block to replace.");
}

fs.writeFileSync('src/utils/statusUpdater.ts', code);
