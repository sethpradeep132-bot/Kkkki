const fs = require('fs');
let file = fs.readFileSync('src/components/portals/ClusterPortal.tsx', 'utf8');

// 1. Initial State
file = file.replace(
  "const [totalCashWithRiders, setTotalCashWithRiders] = useState(0);",
  "const [totalCashWithRiders, setTotalCashWithRiders] = useState<number | null>(null);"
);
file = file.replace(
  "const [totalCashWithHubManagers, setTotalCashWithHubManagers] = useState(0);",
  "const [totalCashWithHubManagers, setTotalCashWithHubManagers] = useState<number | null>(null);"
);

// 2. Fix data fetching defaults
file = file.replace(
  /setTotalCashWithHubManagers\(totalHM\);/g,
  "setTotalCashWithHubManagers(totalHM);\n              } else {\n                  setTotalCashWithHubManagers(0);\n              }"
);
file = file.replace(
  /setTotalCashWithRiders\(tCash\);/g,
  "setTotalCashWithRiders(tCash);\n              } else {\n                  setTotalCashWithRiders(0);\n              }"
);
// Actually let me grep the fetch logic first to see how it's written before blinding replacing.
