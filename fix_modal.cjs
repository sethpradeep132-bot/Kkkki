const fs = require('fs');

const codePath = 'src/components/portals/ProductDetailModal.tsx';
let code = fs.readFileSync(codePath, 'utf-8');

const replacement = `  let parsedImages = product['product images'];
  if (typeof parsedImages === 'string') {
    try {
      parsedImages = JSON.parse(parsedImages);
    } catch(e) {}
  }
  const images = (Array.isArray(parsedImages) && parsedImages.length > 0)
    ? parsedImages`;

const oldCode = `  const images = (product['product images'] && product['product images'].length > 0)
    ? product['product images']`;

code = code.replace(oldCode, replacement);

code = code.replace(
  /product\['product images'\]\?\.\[0\]/g,
  `images[0]`
);

fs.writeFileSync(codePath, code);

console.log('Fixed product images in ProductDetailModal.');
