import re

with open('src/components/portals/SellerPortal.tsx', 'r') as f:
    content = f.read()

replacement = """          {/* Right Actions (Refresh & Bell) */}
          <div className="flex items-center gap-1 text-white z-10">
            <button onClick={handleDeepRefresh} className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors">
              <RefreshCw size={22} className={`text-white ${isDeepRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowNotifications(true)} className="relative p-2 rounded-full hover:bg-white/20 transition-colors active:bg-white/30">
              <Bell size={22} className="text-white" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full border border-orange-500">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>"""

content = re.sub(r'\{\/\* Right Actions \(Refresh \& Bell\)\ \*\/.*?</div>\s*</div>\s*</header>', replacement + '\n        </div>\n      </header>', content, flags=re.DOTALL)

with open('src/components/portals/SellerPortal.tsx', 'w') as f:
    f.write(content)
