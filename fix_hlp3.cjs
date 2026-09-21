const fs = require('fs');
let code = fs.readFileSync('src/components/portals/HubLogisticPortal.tsx', 'utf8');

code = code.replace(/const filteredData = \(data \|\| \[\]\)\.filter\(row => row\['online payment status'\] \|\| \(row\['total online payment'\] && parseFloat\(row\['total online payment'\]\) > 0\)\);/g, 
  "const filteredData = (data || []).filter(row => { const status = (row['online payment status'] || '') + (row['cash payment status'] || ''); return status.includes(`(ID: ${riderId})`) && (row['online payment status'] || (row['total online payment'] && parseFloat(row['total online payment']) > 0)); });");

fs.writeFileSync('src/components/portals/HubLogisticPortal.tsx', code);
console.log("Fixed HLP 3");
