const fs = require('fs');
let content = fs.readFileSync('src/components/portals/ClusterPortal.tsx', 'utf8');

// Add handleDeepRefresh
if (!content.includes('handleDeepRefresh')) {
    const match = content.match(/export const ClusterPortal: React\.FC<PortalProps> = \(\{ onBack \}\) => \{/);
    if (match) {
        content = content.replace(match[0], `${match[0]}
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

// Add RefreshCw to the header
const headerMatch = content.match(/<div className="flex items-center gap-2">\s*<button\s*onClick=\{openAdminProfile\}/);
if (headerMatch && !content.includes('onClick={handleDeepRefresh}')) {
    content = content.replace(headerMatch[0], `<div className="flex items-center gap-2">
            <button onClick={handleDeepRefresh} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors active:bg-slate-200 text-slate-600 border border-transparent hover:border-slate-300">
              <RefreshCw size={18} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-blue-600" : ""} />
            </button>
            <button 
              onClick={openAdminProfile}`);
}

fs.writeFileSync('src/components/portals/ClusterPortal.tsx', content);
