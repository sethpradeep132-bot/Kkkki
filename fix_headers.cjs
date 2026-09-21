const fs = require('fs');

function processFile(file, isWhite) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add RefreshCw to imports if not present
    if (!content.includes('RefreshCw')) {
        content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
            return `import { RefreshCw, ${p1.trim()} } from 'lucide-react';`;
        });
    }

    // Add handleDeepRefresh
    if (!content.includes('handleDeepRefresh')) {
        const portalMatch = content.match(/export const \w+Portal: React\.FC<PortalProps> = \(\{ onBack \}\) => \{/);
        if (portalMatch) {
            content = content.replace(portalMatch[0], `${portalMatch[0]}
  const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);
  const handleDeepRefresh = () => {
    setIsDeepRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
`);
        }
    }

    // Add back button to the device back button listener?
    
    // Fix Hub, Rider, Cluster headers
    if (file.includes('HubLogisticPortal') || file.includes('RiderPortal') || file.includes('ClusterPortal')) {
        if (!content.includes('handleDeepRefresh')) {
             // Just replaced above
        }
        
        // Find header
        const headerRegex = /<header className="sticky top-0[^>]+>([\s\S]*?)<\/header>/;
        const match = content.match(headerRegex);
        if (match) {
            let inner = match[1];
            if (!inner.includes('RefreshCw')) {
                const colorClass = isWhite ? 'text-white' : 'text-slate-700';
                const hoverClass = isWhite ? 'hover:bg-white/20' : 'hover:bg-gray-100';
                
                let newHeader = `<header className="sticky top-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-16 shadow-sm shrink-0">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors active:bg-gray-100 text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight" onClick={onBack}>`;
                
                if (file.includes('HubLogistic')) {
                    newHeader += `\n            <span className="text-purple-600">Suriyawan</span> <span className="text-black">Shopping</span>`;
                } else if (file.includes('Rider')) {
                    newHeader += `\n            <span className="text-emerald-600">Suriyawan</span> <span className="text-black">Shopping</span>`;
                } else if (file.includes('Cluster')) {
                    // Cluster is different
                    newHeader = match[0]; // Let's not break cluster
                }

                if (!file.includes('Cluster')) {
                    newHeader += `\n          </h1>
          <button onClick={handleDeepRefresh} className="p-2 -mr-2 rounded-full hover:bg-gray-50 transition-colors active:bg-gray-100 text-slate-700">
            <RefreshCw size={20} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-blue-600" : ""} />
          </button>
        </header>`;
                    content = content.replace(match[0], newHeader);
                }
            }
        }
        
        // Handle Cluster Portal specifically
        if (file.includes('ClusterPortal')) {
            const clusterHeaderRegex = /<header className="sticky top-0 z-40 bg-white border-b border-slate-200\/90 flex items-center justify-between px-3\.5 sm:px-5 h-12 sm:h-13 shrink-0 shadow-xs">([\s\S]*?)<\/header>/;
            const clusterMatch = content.match(clusterHeaderRegex);
            if (clusterMatch && !clusterMatch[0].includes('RefreshCw')) {
                // Add RefreshCw to the right side
                const rightSideRegex = /<div className="flex items-center gap-1\.5 sm:gap-2">([\s\S]*?)<\/div>\s*<\/header>/;
                if (content.match(rightSideRegex)) {
                    content = content.replace(rightSideRegex, `<div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={handleDeepRefresh} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors active:bg-slate-200 text-slate-600">
              <RefreshCw size={18} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-blue-600" : ""} />
            </button>
$1</div>
        </header>`);
                }
            }
        }
    }

    // CustomerPortal and SellerPortal
    if (file.includes('CustomerPortal') || file.includes('SellerPortal')) {
        // Change fetchProducts to handleDeepRefresh in onClick for RefreshCw
        if (content.includes('onClick={fetchProducts}')) {
             content = content.replace(/<button onClick=\{fetchProducts\} className="([^"]+)" title="Refresh Products">/, '<button onClick={handleDeepRefresh} className="$1" title="Refresh Products">');
             content = content.replace(/className=\{isProductsLoading \? "animate-spin" : ""\}/, 'className={isDeepRefreshing ? "animate-spin text-blue-600" : ""}');
        } else if (file.includes('SellerPortal')) {
             // Seller portal has:
             // <button className="p-1.5 rounded-full hover:bg-white/20 transition-colors active:bg-white/30">
             //   <RefreshCw size={16} strokeWidth={2.5} />
             // </button>
             const sellerRefresh = /<button className="p-1\.5 rounded-full hover:bg-white\/20 transition-colors active:bg-white\/30">\s*<RefreshCw size=\{16\} strokeWidth=\{2\.5\} \/>\s*<\/button>/;
             if (content.match(sellerRefresh)) {
                 content = content.replace(sellerRefresh, `<button onClick={handleDeepRefresh} className="p-1.5 rounded-full hover:bg-white/20 transition-colors active:bg-white/30">
              <RefreshCw size={16} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin" : ""} />
            </button>`);
             }
        }
    }

    fs.writeFileSync(file, content);
}

processFile('src/components/portals/CustomerPortal.tsx', false);
processFile('src/components/portals/SellerPortal.tsx', true);
processFile('src/components/portals/HubLogisticPortal.tsx', false);
processFile('src/components/portals/RiderPortal.tsx', false);
processFile('src/components/portals/ClusterPortal.tsx', false);

console.log("Headers updated");
