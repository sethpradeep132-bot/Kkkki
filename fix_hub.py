import re

with open('src/components/portals/HubLogisticPortal.tsx', 'r') as f:
    content = f.read()

logo_state = """  const [headerLogo, setHeaderLogo] = useState('');
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ss_customer_additional_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
      }
    } catch (e) {}
  }, []);"""

# inject right after const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);
content = re.sub(r'(const \[isDeepRefreshing.*?;\n)', r'\1\n' + logo_state + '\n', content)

replacement = """      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center justify-between relative w-full h-[60px] px-4">
          
          {/* Left Actions (Logo and Brand) */}
          <div className="flex items-center gap-3 text-slate-700 z-10 h-full cursor-pointer" onClick={onBack}>
            {headerLogo ? (
              <img src={headerLogo} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain rounded drop-shadow-sm" />
            ) : (
               <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-black text-xs">Logo</div>
            )}
            
            {/* Brand Name */}
            <div className="flex flex-col items-start justify-center select-none">
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">
                <span className="text-[#0038A8]">SURIYAWAN</span>
                <span className="text-[#FF5500]">SHOPPING</span>
                <span className="text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub</span>
              </h1>
              
              {/* Premium Member Glow */}
              <div className="relative group inline-flex overflow-hidden rounded-full mt-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                  <span>👑</span> Premium Member
                </span>
                {/* Smooth Shine Animation */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
              </div>
            </div>
          </div>

          {/* Right Actions (Refresh) */}
          <div className="flex items-center gap-1 text-slate-700 z-10">
            <button onClick={handleDeepRefresh} className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
              <RefreshCw size={22} className={`text-slate-600 ${isDeepRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>"""

new_content = re.sub(r'<header className="sticky top-0 z-50 bg-white border-b border-gray-200.*?</header>', replacement, content, flags=re.DOTALL)

with open('src/components/portals/HubLogisticPortal.tsx', 'w') as f:
    f.write(new_content)
