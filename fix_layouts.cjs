const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/portals/*.tsx');

for (const file of files) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace the main wrappers
    const wrappers = [
        'className="min-h-screen bg-[#fafafa] text-black flex flex-col font-poppins relative"',
        'className="min-h-screen bg-[#fafafa] text-black flex flex-col font-poppins"',
        'className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 flex flex-col font-poppins antialiased select-none"',
        'className="min-h-screen w-full bg-slate-50 flex flex-col font-poppins antialiased p-3 sm:p-4"'
    ];

    let modified = false;
    for (const wrapper of wrappers) {
        if (code.includes(wrapper)) {
            let replacement = wrapper
                .replace('min-h-screen', 'fixed inset-0')
                .replace('relative', 'overflow-hidden')
                .replace('select-none', 'select-none overflow-hidden')
                .replace('p-3 sm:p-4', 'p-3 sm:p-4 overflow-hidden');
            
            if (wrapper === 'className="min-h-screen bg-[#fafafa] text-black flex flex-col font-poppins"') {
                replacement = 'className="fixed inset-0 bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden"';
            }
            
            code = code.replace(new RegExp(wrapper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
            modified = true;
        }
    }
    
    // Check if main has overflow-y-auto
    // Often main is <main className="flex-1 ..."> 
    // Wait, the main container might need to be fixed for Cluster and Admin portals as well. Let's see later.
    
    if (modified) {
        fs.writeFileSync(file, code);
        console.log(`Updated ${file}`);
    }
}
