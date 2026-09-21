const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf-8');

code = code.replace(
  `lowerType === 'faild pickup' || lowerType === 'failed pickup' || lowerType === 'qc faild pickup' || lowerType === 'pickup attempt faild'`,
  `lowerType === 'faild pickup' || lowerType === 'failed pickup' || lowerType === 'qc faild pickup' || lowerType === 'pickup attempt faild' || lowerType === 'return pickup faild'`
);

code = code.replace(
  `origType === 'out for pickup' || origType === 'faild pickup' || origType === 'failed pickup' || origType === 'pickup attempt faild'`,
  `origType === 'out for pickup' || origType === 'faild pickup' || origType === 'failed pickup' || origType === 'pickup attempt faild' || origType === 'return pickup faild'`
);

fs.writeFileSync('src/utils/statusUpdater.ts', code);
