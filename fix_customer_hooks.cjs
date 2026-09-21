const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

// Remove from the middle
code = code.replace(`    const [isRetrying, setIsRetrying] = useState(false);\n    \n    const handleRetryReturn`, `    const handleRetryReturn`);

// Add to the top where other useStates are
code = code.replace(`  const [isSubmittingRating, setIsSubmittingRating] = useState(false);`, `  const [isSubmittingRating, setIsSubmittingRating] = useState(false);\n  const [isRetrying, setIsRetrying] = useState(false);`);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
