const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

const oldShortStatusRegex = /const getShortStatus = \(statusText: string\) => \{[\s\S]*?return 'Pending';\n\};/;
const newShortStatus = `const getShortStatus = (statusText: string) => {
  if (!statusText) return 'Pending';
  const lower = statusText.toLowerCase();
  if (lower.includes('cancel') || lower.includes('fail') || lower.includes('reject')) return 'Cancelled';
  if (lower.includes('return')) return 'Returned';
  if (lower.includes('deliver')) return 'Delivered';
  if (lower.includes('out for delivery')) return 'Out for Delivery';
  if (lower.includes('ship')) return 'Shipped';
  if (lower.includes('dispatch')) return 'Dispatched';
  if (lower.includes('hub')) return 'At Hub';
  if (lower.includes('pick')) return 'Picked Up';
  if (lower.includes('accept')) return 'Accepted';
  return 'Pending';
};`;

code = code.replace(oldShortStatusRegex, newShortStatus);

// Also fix timeline split logic so it can handle different delimiters
const oldSplit = `const statusParts = currentStatusString.split('||').map(s => s.trim()).filter(Boolean);`;
const newSplit = `const statusParts = currentStatusString.split(/\\|\\||\\n-----------------------------------\\n|\\n\\n/).map(s => s.trim()).filter(Boolean);`;
code = code.replace(oldSplit, newSplit);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
console.log('Fixed short status.');
