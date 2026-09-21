const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderDashboardView.tsx', 'utf8');

const target = `            stats.extraQtyEarning = 0;
            stats.lastActiveCount = allPicCount !== null ? allPicCount : stats.lastActiveCount;
        } else if (allPicCount !== null) {`;

const replacement = `            stats.extraQtyEarning = 0;
            stats.seenPickedIds = [];
            stats.seenDeliveredIds = [];
            stats.seenPickupGroups = {};
            stats.seenDeliveryGroups = {};
            stats.lastActiveCount = allPicCount !== null ? allPicCount : stats.lastActiveCount;
        } else if (allPicCount !== null) {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/portals/RiderDashboardView.tsx', code);
console.log("Replaced RiderDash");
