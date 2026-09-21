const fs = require('fs');
let file = fs.readFileSync('src/components/portals/ClusterPortal.tsx', 'utf8');

// 1. Initial State
file = file.replace(
  "const [totalPendingDepositCluster, setTotalPendingDepositCluster] = useState(0);",
  "const [totalPendingDepositCluster, setTotalPendingDepositCluster] = useState<number | null>(null);\n  const [pendingDepositsListCluster, setPendingDepositsListCluster] = useState<any[]>([]);\n  const [showPendingDepositModal, setShowPendingDepositModal] = useState(false);"
);

// 2. Fetch Logic
file = file.replace(
  /const fetchClusterPendingDeposit = async \(clusterId: string\) => \{\s*try \{\s*const \{ data \} = await supabase\.from\('cash_with_clusters'\)\.select\('total cash payment'\)\.eq\('cluster id', clusterId\);\s*if \(data\) \{\s*setTotalPendingDepositCluster\(data\.reduce\(\(acc, curr\) => acc \+ \(Number\(curr\['total cash payment'\]\) \|\| 0\), 0\)\);\s*\}\s*\} catch \(err\) \{ console\.error\(err\); \}\s*\};/,
  `const fetchClusterPendingDeposit = async (clusterId: string) => {
      try {
          const { data } = await supabase.from('cash_with_clusters').select('*').eq('cluster id', clusterId);
          if (data) {
             setTotalPendingDepositCluster(data.reduce((acc, curr) => acc + (Number(curr['total cash payment']) || 0), 0));
             setPendingDepositsListCluster(data);
          } else {
             setTotalPendingDepositCluster(0);
             setPendingDepositsListCluster([]);
          }
      } catch (err) { 
          console.error(err); 
          setTotalPendingDepositCluster(0);
      }
  };`
);

// 3. Update UI
const calculateStr = `{totalPendingDepositCluster === null ? (
                       <span className="flex items-center gap-1 text-sm font-medium text-slate-500 h-6">
                         Calculating
                         <span className="flex items-center gap-0.5 mt-1">
                           <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                           <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                           <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                         </span>
                       </span>
                     ) : (
                       \`₹ \${totalPendingDepositCluster}\`
                     )}`;

file = file.replace(
  /<div className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full">\s*<span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Pending Deposit Amount<\/span>\s*<span className="text-2xl truncate font-bold text-slate-800">₹ \{totalPendingDepositCluster\}<\/span>\s*<\/div>/,
  `<div onClick={() => setShowPendingDepositModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 transition-colors">
                     <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Pending Deposit Amount</span>
                     <span className="text-2xl truncate font-bold text-slate-800">
                       ${calculateStr}
                     </span>
                  </div>`
);

// 4. Add the modal
const modalStr = `
      {showPendingDepositModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Pending Deposit Details
              </h3>
              <button onClick={() => setShowPendingDepositModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {pendingDepositsListCluster.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No pending deposits found.</div>
              ) : (
                pendingDepositsListCluster.map((dep, idx) => (
                  <div key={dep.id || idx} className="text-xs text-slate-600 bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex flex-col gap-1">
                    <div className="font-semibold text-slate-800">{dep['cash payment status']}</div>
                    <div className="text-emerald-600 font-bold mt-1 text-sm">Amount: ₹ {dep['total cash payment']}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
`;

file = file.replace(
  "{showCashRidersModal && (",
  modalStr + "\n    {showCashRidersModal && ("
);

fs.writeFileSync('src/components/portals/ClusterPortal.tsx', file);
