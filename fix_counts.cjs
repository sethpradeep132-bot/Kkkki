const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');
code = code.replace(
  '<span className="text-sm font-bold text-gray-800" onClick={() => onShowAnnouncement?.()}>Suriyawan shopping updates</span>',
  '<div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-800" onClick={() => onShowAnnouncement?.()}>Suriyawan shopping updates</span>{updateCount > 0 && <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{updateCount}</span>}</div>'
);
code = code.replace(
  '<span className="text-sm font-bold text-gray-800">Chat an agent</span>',
  '<div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-800">Chat an agent</span>{chatCount > 0 && <span className="bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{chatCount}</span>}</div>'
);
fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
