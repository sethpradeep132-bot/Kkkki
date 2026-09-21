const fs = require('fs');

const file = fs.readFileSync('src/components/portals/AuthLogin.tsx', 'utf8');
if (!file.includes('export const AuthLogin')) {
  console.log("AuthLogin missing export!");
} else {
  console.log("AuthLogin OK");
}
