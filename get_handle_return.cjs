const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');
const startIdx = code.indexOf("const handleReturnOrder = async () => {");
const endIdx = code.indexOf("return (", startIdx);
console.log(code.substring(startIdx, endIdx));
