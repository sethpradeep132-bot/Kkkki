const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

const oldHeader = `<div className="flex items-center gap-2">
          <div className="bg-black text-white px-4 py-2.5 text-sm font-bold rounded-none flex gap-2 overflow-x-auto no-scrollbar w-max max-w-[70vw] uppercase tracking-wider">`;
const newHeader = `<div className="flex items-center gap-2 w-full">
          <div className="bg-black text-white px-4 py-2.5 text-sm font-bold rounded-none flex gap-2 overflow-x-auto no-scrollbar flex-1 uppercase tracking-wider">`;

code = code.replace(oldHeader, newHeader);

fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
