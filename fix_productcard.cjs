const fs = require('fs');

const codePath = 'src/components/portals/ProductCard.tsx';
let code = fs.readFileSync(codePath, 'utf-8');

const replacement = `  let parsedImages = product['product images'];
  if (typeof parsedImages === 'string') {
    try {
      parsedImages = JSON.parse(parsedImages);
    } catch(e) {}
  }
  const images = (Array.isArray(parsedImages) && parsedImages.length > 0)
    ? parsedImages
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];
  const mainImage = images[0];`;

const oldCode = `  const images = (product['product images'] && product['product images'].length > 0)
    ? product['product images']
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];

  const mainImage = images[0];`;

code = code.replace(oldCode, replacement);
fs.writeFileSync(codePath, code);

// Also fix in CustomerPortal.tsx line 2025 (Cart tab) and similar
let customerPortalCode = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');
customerPortalCode = customerPortalCode.replace(
  /item\['product images'\]\?\.\[0\]/g,
  `getFirstImage(item['product images'])`
);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', customerPortalCode);

console.log('Fixed product images in ProductCard and CustomerPortal cart.');
