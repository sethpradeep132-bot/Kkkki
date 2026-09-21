const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderPortal.tsx', 'utf8');

code = code.replace(/\{ riderData\?\.id, onBack \}: \{ riderData\?\.id: string/g, '{ riderId, onBack }: { riderId: string');
code = code.replace(/riderData\?\.id \? /g, 'riderId ? ');
code = code.replace(/\!riderData\?\.id/g, '!riderId');
code = code.replace(/eq\('rider_id', riderData\?\.id\)/g, "eq('rider_id', riderId)");
code = code.replace(/eq\('Rider id', riderData\?\.id\)/g, "eq('Rider id', riderId)");
code = code.replace(/eq\('rider id', riderData\?\.id\)/g, "eq('rider id', riderId)");

// Also line 198: if (activePage === 'loss_penalty' && riderData?.id) { 
code = code.replace(/if \(activePage === 'loss_penalty' && riderData\?\.id\) \{/g, "if (activePage === 'loss_penalty' && riderData.id) {");
code = code.replace(/if \(!riderData\?\.id\) return;/g, 'if (!riderId) return;');

// Wait, the main component is RiderPortal which receives riderData.
// In RiderPortal, activePage === 'loss_penalty' && riderData.id is correct.
// In RiderMyEarning, it uses riderId.

fs.writeFileSync('src/components/portals/RiderPortal.tsx', code);
