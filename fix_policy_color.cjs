const fs = require('fs');
let code = fs.readFileSync('src/components/portals/UploadProductForm.tsx', 'utf-8');

const targetStr = `!features[idx] ? 'bg-gray-100 text-gray-500 border border-white hover:bg-gray-200 animate-pulse' : 'bg-blue-50/80 text-blue-800 border-blue-200 hover:bg-blue-100'`;
const replacement = `!features[idx] ? 'bg-blue-100 text-blue-600 border border-blue-300 hover:bg-blue-200 animate-pulse' : 'bg-blue-50/80 text-blue-800 border-blue-200 hover:bg-blue-100'`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/portals/UploadProductForm.tsx', code);
  console.log('Replaced return policy blinking color successfully.');
} else {
  console.log('Could not find target string.');
}
