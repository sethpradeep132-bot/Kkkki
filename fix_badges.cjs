const fs = require('fs');

['src/components/portals/SellerDashboardView.tsx', 'src/components/portals/RiderDashboardView.tsx', 'src/components/portals/HubDashboardView.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');

  // Fix Announcement badge
  code = code.replace(
    '<div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">',
    '<div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 relative">{updateCount > 0 && <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{updateCount}</span>}'
  );
  code = code.replace(
    '<div className="relative w-full"><span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Announcement</span>{updateCount > 0 && <span className="absolute -top-6 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{updateCount}</span>}</div>',
    '<span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Announcement</span>'
  );

  // Fix Chat badge
  code = code.replace(
    '<div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">',
    '<div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 relative">{chatCount > 0 && <span className="absolute -top-1 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{chatCount}</span>}'
  );
  code = code.replace(
    '<div className="relative w-full"><span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Chat an agent</span>{chatCount > 0 && <span className="absolute -top-6 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{chatCount}</span>}</div>',
    '<span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Chat an agent</span>'
  );

  fs.writeFileSync(file, code);
});

