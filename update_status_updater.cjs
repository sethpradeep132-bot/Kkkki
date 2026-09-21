const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

// Fix 1: 'picked upsuccessfully' to 'picked up successfully'
code = code.replace(
    /picked upsuccessfully/g,
    'picked up successfully'
);

// Fix 2: Remove the customer pickup failed update
code = code.replace(
    /  else if \(\(lowerType === 'faild pickup' \|\| lowerType === 'failed pickup' \|\| lowerType === 'qc faild pickup' \|\| lowerType === 'pickup attempt faild'\) && lowerTag === 'customer pickup'\) {\n    newStatusText = `Your return pickup has failed\. on \$\{formattedDateTime\}`;\n  }/,
    `  // Customer pickup fail -> NO order status update as requested\n  else if ((lowerType === 'faild pickup' || lowerType === 'failed pickup' || lowerType === 'qc faild pickup' || lowerType === 'pickup attempt faild') && lowerTag === 'customer pickup') {\n    // Intentionally left blank so no status update happens\n  }`
);

fs.writeFileSync('src/utils/statusUpdater.ts', code);
