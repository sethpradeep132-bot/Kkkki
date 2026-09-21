import sys

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # Old left actions
    left_old = """             {/* Left Actions (Menu) */}
             <div className="flex items-center text-slate-700 z-10">
               <button className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors active:bg-gray-100">
                 <Menu size={24} strokeWidth={2.5} />
               </button>
             </div>"""
             
    left_new = """             {/* Left Actions (Logo) */}
             <div className="flex items-center text-slate-700 z-10">
               {headerLogo && <img src={headerLogo} alt="Logo" className="h-10 w-auto max-w-[80px] object-contain rounded" />}
             </div>"""

    content = content.replace(left_old, left_new)

    # Old right actions
    right_old = """             {/* Right Actions (Search & Refresh) */}
             <div className="flex items-center gap-1 text-slate-700 z-10">
               {headerLogo && <img src={headerLogo} alt="Logo" className="h-8 w-auto max-w-[60px] object-contain mr-1 rounded" />}
               <button 
                 onClick={openShopSearch}
                 className="p-2 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-colors active:bg-orange-100 cursor-pointer"
                 title="Search Products & Categories"
               >
                 <Search size={20} strokeWidth={2.5} />
               </button>
               <button onClick={handleDeepRefresh} className="p-2 -mr-2 rounded-full hover:bg-gray-50 transition-colors active:bg-gray-100 cursor-pointer" title="Refresh Products">
                 <RefreshCw size={20} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-blue-600" : ""} />
               </button>
             </div>"""

    right_new = """             {/* Right Actions (Refresh) */}
             <div className="flex items-center gap-1 text-slate-700 z-10">
               <button onClick={handleDeepRefresh} className="p-2 -mr-2 rounded-full hover:bg-gray-50 transition-colors active:bg-gray-100 cursor-pointer" title="Refresh Products">
                 <RefreshCw size={20} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-blue-600" : ""} />
               </button>
             </div>"""
             
    content = content.replace(right_old, right_new)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
