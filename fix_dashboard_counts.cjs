const fs = require('fs');

function processDashboard(filePath, updateType, chatTable, idField) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Add state variables if not present
  if (!code.includes('const [updateCount, setUpdateCount]')) {
    code = code.replace(
      'const [showRoleChatModal, setShowRoleChatModal] = useState(false);',
      'const [showRoleChatModal, setShowRoleChatModal] = useState(false);\n  const [updateCount, setUpdateCount] = useState<number>(0);\n  const [chatCount, setChatCount] = useState<number>(0);'
    );
  }

  // Add the count fetch logic inside the useEffect where seller/rider/hub data is fetched
  // Actually, we can add a new useEffect
  const useEffectString = `\n  useEffect(() => {\n    if (sellerData?.id) {\n      supabase.from('announcement_and_update').select('id, ${updateType}').not('${updateType}', 'is', null).then(({data}) => {\n        if (data) setUpdateCount(data.filter((d: any) => d.${updateType} && d.${updateType}.trim() !== '').length);\n      });\n      supabase.from('${chatTable}').select('id, message').eq('${idField}', sellerData.id).not('message', 'is', null).then(({data}) => {\n        if (data) setChatCount(data.length);\n      });\n    }\n  }, [sellerData?.id]);\n`;
  
  if (!code.includes('setUpdateCount(data.filter')) {
    code = code.replace('useEffect(() => {', useEffectString.replace(/sellerData/g, idField === 'seller_id' ? 'sellerData' : idField === 'rider_id' ? 'riderData' : 'hubData') + '  useEffect(() => {');
  }

  // Update UI for Announcement button
  code = code.replace(
    '<span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Announcement</span>',
    '<div className="relative w-full"><span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Announcement</span>{updateCount > 0 && <span className="absolute -top-6 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{updateCount}</span>}</div>'
  );

  // Update UI for Chat button
  code = code.replace(
    '<span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Chat an agent</span>',
    '<div className="relative w-full"><span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Chat an agent</span>{chatCount > 0 && <span className="absolute -top-6 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{chatCount}</span>}</div>'
  );

  fs.writeFileSync(filePath, code);
}

processDashboard('src/components/portals/SellerDashboardView.tsx', 'seller_update', 'chat_for_sellers', 'seller_id');
processDashboard('src/components/portals/RiderDashboardView.tsx', 'rider_update', 'chat_for_riders', 'rider_id');
processDashboard('src/components/portals/HubDashboardView.tsx', 'hub_manager_update', 'chat_for_hub_managers', 'hub_manager_id');
