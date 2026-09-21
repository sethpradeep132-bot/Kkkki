const fs = require('fs');
const content = fs.readFileSync('src/components/portals/HubShipmentsView.tsx', 'utf-8');
const handleConfirmCode = content.substring(content.indexOf('const handleConfirmPickup = async () => {'), content.indexOf('const fetchAllSheets = async () => {'));
console.log(handleConfirmCode);
