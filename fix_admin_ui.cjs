const fs = require('fs');
let code = fs.readFileSync('src/components/portals/AdminPortal.tsx', 'utf-8');

const divRegex = /<div className="flex justify-between items-start mb-2">/g;
code = code.replace(divRegex, `<div className="flex justify-between items-start mb-2 gap-2">`);

// Hm Name
code = code.replace(/\{hm\.hub_manager_name\} <span className="text-\[10px\] font-mono font-bold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200">\{hm\.short_id\}<\/span><\/span>\s*<div className="flex flex-col items-end gap-0\.5 text-right">/g, 
`<span className="truncate">{hm.hub_manager_name}</span> <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{hm.short_id}</span></span>
                       <div className="flex flex-col items-end gap-0.5 text-right shrink-0">`);

// Rider Name
code = code.replace(/\{rider\.rider_name\} <span className="text-\[10px\] font-mono font-bold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200">\{rider\.short_id\}<\/span><\/span>\s*<div className="flex flex-col items-end gap-0\.5 text-right">/g, 
`<span className="truncate">{rider.rider_name}</span> <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{rider.short_id}</span></span>
                       <div className="flex flex-col items-end gap-0.5 text-right shrink-0">`);

// Cluster Name
code = code.replace(/\{cluster\.name\} <span className="text-\[10px\] font-mono font-bold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200">\{cluster\.short_id\}<\/span><\/span>\s*<div className="flex flex-col items-end gap-0\.5 text-right">/g, 
`<span className="truncate">{cluster.name}</span> <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{cluster.short_id}</span></span>
                       <div className="flex flex-col items-end gap-0.5 text-right shrink-0">`);

// Customer Name
code = code.replace(/\{cust\.full_name\} <span className="text-\[10px\] font-mono font-bold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200">\{cust\.short_id\}<\/span><\/span>\s*<div className="flex flex-col items-end gap-0\.5 text-right">/g, 
`<span className="truncate">{cust.full_name}</span> <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{cust.short_id}</span></span>
                       <div className="flex flex-col items-end gap-0.5 text-right shrink-0">`);

// Seller Name
code = code.replace(/\{seller\.seller_name\} <span className="text-\[10px\] font-mono font-bold bg-slate-100 text-slate-500 px-1\.5 py-0\.5 rounded border border-slate-200">\{seller\.short_id\}<\/span><\/span>\s*<div className="flex flex-col items-end gap-0\.5 text-right">/g, 
`<span className="truncate">{seller.seller_name}</span> <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{seller.short_id}</span></span>
                       <div className="flex flex-col items-end gap-0.5 text-right shrink-0">`);

// Also add 'flex-1 min-w-0' to the wrapper span that has gap-1.5
code = code.replace(/<span className="font-bold text-slate-800 text-sm flex items-center gap-1\.5">/g, 
`<span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0">`);

fs.writeFileSync('src/components/portals/AdminPortal.tsx', code);
