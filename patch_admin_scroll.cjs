const fs = require('fs');

let content = fs.readFileSync('src/components/portals/AdminPortal.tsx', 'utf-8');
let orig = content;

// Many of these fixed inset-0 z-[60] wrappers in AdminPortal have overflow-hidden.
// We should make sure the inner main has overflow-y-auto, OR change the wrapper to overflow-hidden h-[100dvh] and ensure the main works.
// First, let's fix the h-[100dvh] for the fixed inset-0 wrappers everywhere in AdminPortal
content = content.replace(/className="fixed inset-0 z-\[60\] flex flex-col bg-slate-50 overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden"');
content = content.replace(/className="fixed inset-0 w-full bg-slate-50 flex flex-col font-poppins antialiased p-3 sm:p-4 overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] w-full bg-slate-50 flex flex-col font-poppins antialiased p-3 sm:p-4 overflow-hidden"');
content = content.replace(/className="fixed inset-0 z-\[70\] bg-\[\#F8FAFC\] flex flex-col animate-in fade-in duration-200 overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden"');
content = content.replace(/className="fixed inset-0 z-\[100\] bg-white flex flex-col animate-in fade-in duration-200"/g, 'className="fixed inset-0 h-[100dvh] z-[100] bg-white flex flex-col animate-in fade-in duration-200"');
content = content.replace(/className="fixed inset-0 z-\[60\] bg-slate-50 flex flex-col animate-in fade-in duration-200"/g, 'className="fixed inset-0 h-[100dvh] z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200"');
content = content.replace(/className="fixed inset-0 z-\[70\] flex flex-col bg-slate-50 overflow-hidden"/g, 'className="fixed inset-0 h-[100dvh] z-[70] flex flex-col bg-slate-50 overflow-hidden"');
content = content.replace(/className="fixed inset-0 z-\[70\] flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-200"/g, 'className="fixed inset-0 h-[100dvh] z-[70] flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-200"');

// For the main sections, let's make sure they are overflow-y-auto and pb-20
// Let's replace pb-32, pb-44, pb-24 with pb-20
content = content.replace(/pb-44/g, 'pb-20');
content = content.replace(/pb-32/g, 'pb-20');
content = content.replace(/pb-24/g, 'pb-20');

if (orig !== content) {
    fs.writeFileSync('src/components/portals/AdminPortal.tsx', content);
    console.log("Patched AdminPortal 100dvh wrappers and pb-20");
} else {
    console.log("No changes in AdminPortal wrappers.");
}

