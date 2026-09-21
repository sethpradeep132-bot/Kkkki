const fs = require('fs');
let code = fs.readFileSync('src/components/portals/ClusterPortal.tsx', 'utf-8');

const hmRegex = /<span className="font-bold text-slate-800 text-sm flex items-center gap-1\.5">\{hm\.hub_manager_name\} <span className="text-\[10px\] font-mono font-bold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200">\{hm\.short_id\}<\/span><\/span>\s*<div className="flex flex-col items-end gap-0\.5 text-right">/g;

code = code.replace(hmRegex, `<span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0"><span className="truncate">{hm.hub_manager_name}</span> <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{hm.short_id}</span></span>
                       <div className="flex flex-col items-end gap-0.5 text-right shrink-0">`);

const hmDivRegex = /<div className="flex justify-between items-start mb-2">/g;
code = code.replace(hmDivRegex, `<div className="flex justify-between items-start mb-2 gap-2">`);

const riderRegex = /<span className="font-bold text-slate-800 text-sm flex items-center gap-1\.5">\{rider\.rider_name\} <span className="text-\[10px\] font-mono font-bold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200">\{rider\.short_id\}<\/span><\/span>\s*<div className="flex flex-col items-end gap-0\.5 text-right">/g;
code = code.replace(riderRegex, `<span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0"><span className="truncate">{rider.rider_name}</span> <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{rider.short_id}</span></span>
                       <div className="flex flex-col items-end gap-0.5 text-right shrink-0">`);

fs.writeFileSync('src/components/portals/ClusterPortal.tsx', code);
