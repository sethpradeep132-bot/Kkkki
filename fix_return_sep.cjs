const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');
code = code.replace(
  `const returnStatus = existingStatus ? existingStatus + '\\n\\n' + newReturnEntry : newReturnEntry;`,
  `const returnStatus = existingStatus ? existingStatus + ' || ' + newReturnEntry : newReturnEntry;`
);
fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
