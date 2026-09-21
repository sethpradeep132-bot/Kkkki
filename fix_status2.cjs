const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

// Replace the last 3 else if blocks
const regex = /else if \(\(lowerType === 'rescheduled pickup'[\s\S]*?newProcessType = 'order cancelled';\s*\}/m;

const replacement = `
  } else if (lowerType === 'pickup attempt faild' && lowerTag === 'seller pickup') {
    newStatusText = \`Your order has been cancelled on \${formattedDateTime}\`;
    newProcessType = 'order cancelled';
  } else if (lowerType === 'pickup attempt faild' && lowerTag === 'customer pickup') {
    newStatusText = \`Your return pickup has failed. on \${formattedDateTime}\`;
    newProcessType = 'return pickup faild';
  } else if (lowerType === 'delivery attempt faild' && lowerTag === 'customer delivery') {
    newStatusText = \`Your order has been cancelled on \${formattedDateTime}\`;
    newProcessType = 'order cancelled';
  }
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('src/utils/statusUpdater.ts', code);
