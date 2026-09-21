const fs = require('fs');

const codePath = 'src/components/portals/ProductCard.tsx';
let code = fs.readFileSync(codePath, 'utf-8');

const replacement = `  let parsedImages = product['product images'];
  if (typeof parsedImages === 'string') {
    if (parsedImages.includes('|||')) {
      parsedImages = parsedImages.split('|||');
    } else {
      try {
        parsedImages = JSON.parse(parsedImages);
      } catch(e) {}
    }
  }
  const images = (Array.isArray(parsedImages) && parsedImages.length > 0)
    ? parsedImages
    : (typeof parsedImages === 'string' && parsedImages.trim() !== '') ? [parsedImages] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];
`;

code = code.replace(
/  let parsedImages = product\['product images'\];\n[\s\S]*?\? parsedImages\n    : \['https:\/\/images.unsplash.com\/photo-1523275335684-37898b6baf30\?w=600&auto=format&fit=crop&q=80'\];/g,
replacement
);

fs.writeFileSync(codePath, code);

console.log('Fixed ProductCard images parsing');
