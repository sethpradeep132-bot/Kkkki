const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/portals/*.tsx');

for (const file of files) {
    let code = fs.readFileSync(file, 'utf8');
    
    if (code.includes('min-h-screen')) {
        // We will carefully replace min-h-screen based on context.
        // If it's a root/full-screen modal overlay, "fixed inset-0" is better.
        // If it's just a content container, "min-h-full" is better.
        
        // For AuthLogin.tsx:
        if (file.includes('AuthLogin.tsx')) {
            code = code.replace('w-full min-h-screen bg-[#F8FAFC]', 'fixed inset-0 w-full bg-[#F8FAFC]');
        }
        
        // For ClusterPortal.tsx:
        if (file.includes('ClusterPortal.tsx')) {
            code = code.replace(/min-h-screen w-full bg-\[#F8FAFC\] text-slate-900 flex flex-col relative/g, 
                                'fixed inset-0 w-full bg-[#F8FAFC] text-slate-900 flex flex-col z-50 overflow-y-auto');
        }

        // For CustomerPortal.tsx:
        if (file.includes('CustomerPortal.tsx')) {
            code = code.replace('min-h-screen w-full bg-[#F8FAFC] text-slate-900 flex flex-col relative pb-24', 
                                'w-full h-full min-h-full bg-[#F8FAFC] text-slate-900 flex flex-col relative pb-24');
            code = code.replace('bg-red-500 min-h-screen', 'bg-red-500 min-h-full');
            code = code.replace('bg-slate-50 min-h-screen pb-20', 'bg-slate-50 min-h-full pb-20');
        }
        
        // For UploadProductForm.tsx:
        if (file.includes('UploadProductForm.tsx')) {
            code = code.replace('min-h-screen pb-24 overflow-y-auto', 'pb-24 overflow-y-auto');
        }

        fs.writeFileSync(file, code);
        console.log(`Updated ${file}`);
    }
}
