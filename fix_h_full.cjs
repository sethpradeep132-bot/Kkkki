const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/portals/*.tsx');

for (const file of files) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace w-full h-full that are used for pages inside a main container
    let modified = false;
    if (code.includes('w-full h-full')) {
        // We only want to replace it when it's a root div of a view component
        code = code.replace(/<div className="([^"]*)w-full h-full([^"]*)"/g, (match, prefix, suffix) => {
            // Check if it's likely a view wrapper
            if (suffix.includes('flex flex-col')) {
                modified = true;
                return `<div className="${prefix}w-full min-h-full${suffix}"`;
            }
            return match;
        });
    }
    
    if (modified) {
        fs.writeFileSync(file, code);
        console.log(`Updated ${file}`);
    }
}
