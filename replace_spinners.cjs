const fs = require('fs');
const path = require('path');

const dir = 'src/components/portals';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const getBgColor = (className) => {
  if (className.includes('border-orange-500')) return 'bg-orange-500';
  if (className.includes('border-emerald-500')) return 'bg-emerald-500';
  if (className.includes('border-purple-500')) return 'bg-purple-500';
  if (className.includes('border-blue-600')) return 'bg-blue-600';
  if (className.includes('border-blue-500')) return 'bg-blue-500';
  if (className.includes('border-white')) return 'bg-white';
  if (className.includes('border-t-black')) return 'bg-black';
  return 'bg-blue-500';
}

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  // Find <div className="...animate-spin..." /> or </div>
  const regex = /<div className="[^"]*animate-spin[^"]*">\s*<\/div>|<div className="[^"]*animate-spin[^"]*"\s*\/>/g;
  
  if (regex.test(content)) {
    console.log(`Found in ${file}`);
    content = content.replace(regex, (match) => {
      const bgColor = getBgColor(match);
      return `<FiveDotLoader colorClass="${bgColor}" />`;
    });
    
    // add import if not there
    if (!content.includes('FiveDotLoader')) {
      // should already be replaced, so we add the import
      const importStmt = `import { FiveDotLoader } from './FiveDotLoader';\n`;
      // find last import
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.substring(0, endOfLine + 1) + importStmt + content.substring(endOfLine + 1);
      } else {
        content = importStmt + content;
      }
    } else {
       // if FiveDotLoader is already in the file but import isn't (from previous replacement step)
       if (!content.includes('import { FiveDotLoader }')) {
          const importStmt = `import { FiveDotLoader } from './FiveDotLoader';\n`;
          const lastImportIndex = content.lastIndexOf('import ');
          if (lastImportIndex !== -1) {
            const endOfLine = content.indexOf('\n', lastImportIndex);
            content = content.substring(0, endOfLine + 1) + importStmt + content.substring(endOfLine + 1);
          } else {
            content = importStmt + content;
          }
       }
    }
    fs.writeFileSync(filePath, content);
  }
}
