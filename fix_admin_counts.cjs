const fs = require('fs');

let code = fs.readFileSync('src/components/portals/AdminPortal.tsx', 'utf8');

if (!code.includes('const [updateCounts, setUpdateCounts] = useState({')) {
  code = code.replace(
    'const [showCustomerAdditionalSettings, setShowCustomerAdditionalSettings] = useState(false);',
    'const [updateCounts, setUpdateCounts] = useState({ customer: 0, seller: 0, rider: 0, hub: 0, cluster: 0 });\n\n  useEffect(() => {\n    if (activeTab === "Message & Approval") {\n      supabase.from("announcement_and_update").select("*").then(({data}) => {\n        if (data) {\n          setUpdateCounts({\n            customer: data.filter((d: any) => d.customer_update && d.customer_update.trim() !== "").length,\n            seller: data.filter((d: any) => d.seller_update && d.seller_update.trim() !== "").length,\n            rider: data.filter((d: any) => d.rider_update && d.rider_update.trim() !== "").length,\n            hub: data.filter((d: any) => d.hub_manager_update && d.hub_manager_update.trim() !== "").length,\n            cluster: data.filter((d: any) => d.cluster_update && d.cluster_update.trim() !== "").length\n          });\n        }\n      });\n    }\n  }, [activeTab]);\n\n  const [showCustomerAdditionalSettings, setShowCustomerAdditionalSettings] = useState(false);'
  );
}

// Add badges to the buttons in Announcement & Updates section
code = code.replace(
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'customer_update\', title: \'Customer Update\'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-blue-300 hover:bg-blue-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Customer Update</button>',
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'customer_update\', title: \'Customer Update\'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-blue-300 hover:bg-blue-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Customer Update{updateCounts.customer > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCounts.customer}</span>}</button>'
);

code = code.replace(
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'seller_update\', title: \'Seller Update\'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-purple-300 hover:bg-purple-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Seller Update</button>',
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'seller_update\', title: \'Seller Update\'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-purple-300 hover:bg-purple-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Seller Update{updateCounts.seller > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCounts.seller}</span>}</button>'
);

code = code.replace(
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'rider_update\', title: \'Rider Update\'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-emerald-300 hover:bg-emerald-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Rider Update</button>',
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'rider_update\', title: \'Rider Update\'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-emerald-300 hover:bg-emerald-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Rider Update{updateCounts.rider > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCounts.rider}</span>}</button>'
);

code = code.replace(
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'hub_manager_update\', title: \'Hub Manager Update\'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-orange-300 hover:bg-orange-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Hub Manager Update</button>',
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'hub_manager_update\', title: \'Hub Manager Update\'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-orange-300 hover:bg-orange-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Hub Manager Update{updateCounts.hub > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCounts.hub}</span>}</button>'
);

code = code.replace(
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'cluster_update\', title: \'Cluster Update\'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-indigo-300 hover:bg-indigo-50 transition-colors text-center w-full break-words whitespace-normal leading-tight col-span-2">Cluster Update</button>',
  '<button onClick={() => setShowAnnouncementModal({isOpen: true, type: \'cluster_update\', title: \'Cluster Update\'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-indigo-300 hover:bg-indigo-50 transition-colors text-center w-full break-words whitespace-normal leading-tight col-span-2">Cluster Update{updateCounts.cluster > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCounts.cluster}</span>}</button>'
);

fs.writeFileSync('src/components/portals/AdminPortal.tsx', code);
