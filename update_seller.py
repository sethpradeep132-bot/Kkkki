with open('src/components/portals/SellerDashboardView.tsx', 'r') as f:
    content = f.read()

target = """<button onClick={() => setShowRoleChatModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 relative">{chatCount > 0 && <span className="absolute -top-1 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{chatCount}</span>}               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>            </div>            <span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Chat an agent</span>          </button>"""

replacement = """<button onClick={() => setShowRoleChatModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>            </div>            <span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Chat an agent</span>          </button>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/portals/SellerDashboardView.tsx', 'w') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("TARGET NOT FOUND")
