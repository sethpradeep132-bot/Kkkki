const fs = require('fs');
let code = fs.readFileSync('src/components/portals/ProductCard.tsx', 'utf-8');
const imagesCode = code.substring(code.indexOf('let parsedImages ='), code.indexOf('const mainImage = images[0];'));
console.log(imagesCode);
