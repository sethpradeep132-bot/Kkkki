const fs = require('fs');

const codePath = 'src/components/portals/CustomerPortal.tsx';
let code = fs.readFileSync(codePath, 'utf-8');

const replacement = `const getFirstImage = (imageStr: string | undefined | null) => {
  if (!imageStr) return 'https://via.placeholder.com/150';
  if (imageStr.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(imageStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch(e) {}
  }
  if (imageStr.includes('|||')) {
    return imageStr.split('|||')[0];
  }
  return imageStr;
};`;

code = code.replace(
/const getFirstImage = \(imageStr: string \| undefined \| null\) => \{[\s\S]*?return imageStr;\n\};/,
replacement
);

fs.writeFileSync(codePath, code);

console.log('Fixed getFirstImage in CustomerPortal.');
