import re

# 1. Seller Portal
with open('src/components/portals/SellerPortal.tsx', 'r') as f:
    seller_content = f.read()

# Replace the Premium Member Glow section with the new layout including refresh button
old_seller_premium = r"""              \{/\* Premium Member Glow \*/\}
              <div className="relative group inline-flex overflow-hidden rounded-full mt-1">
                <span className="text-\[10px\] sm:text-\[11px\] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                  <span>👑</span> Premium Member
                </span>
                \{/\* Smooth Shine Animation \*/\}
                <div className="absolute inset-0 -translate-x-full animate-\[shimmer_2\.5s_infinite\] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
              </div>"""

new_seller_premium = """              <div className="flex items-center gap-2 mt-1">
                {/* Premium Member Glow */}
                <div className="relative group inline-flex overflow-hidden rounded-full">
                  <span className="text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                    <span>👑</span> Premium Member
                  </span>
                  {/* Smooth Shine Animation */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
                </div>
                
                {/* Refresh Button - Moved here */}
                <button onClick={handleDeepRefresh} className="flex items-center justify-center p-1 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors border border-white/20" title="Refresh">
                  <RefreshCw size={14} className={`text-white ${isDeepRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>"""

seller_content = re.sub(old_seller_premium, new_seller_premium, seller_content)

# Remove old refresh button from Right Actions
old_seller_right = r"""            <button onClick=\{handleDeepRefresh\} className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors">
              <RefreshCw size=\{22\} className=\{`text-white \$\{isDeepRefreshing \? 'animate-spin' : ''\}`\} />
            </button>"""

seller_content = re.sub(old_seller_right, "", seller_content)

with open('src/components/portals/SellerPortal.tsx', 'w') as f:
    f.write(seller_content)


# 2. Rider Portal
with open('src/components/portals/RiderPortal.tsx', 'r') as f:
    rider_content = f.read()

old_rider_right = r"""          \{/\* Right Actions \(Refresh\) \*/\}
          <div className="flex items-center gap-1 text-slate-700 z-10">
            <button onClick=\{handleDeepRefresh\} className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
              <RefreshCw size=\{22\} className=\{`text-slate-600 \$\{isDeepRefreshing \? 'animate-spin' : ''\}`\} />
            </button>
          </div>"""

new_rider_right = """          {/* Right Actions (Refresh) */}
          <div className="flex items-center gap-3 pr-2 text-slate-700 z-10">
            <button onClick={handleDeepRefresh} className="p-1.5 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
              <RefreshCw size={18} className={`text-slate-600 ${isDeepRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>"""

rider_content = re.sub(old_rider_right, new_rider_right, rider_content)

with open('src/components/portals/RiderPortal.tsx', 'w') as f:
    f.write(rider_content)

# 3. Hub Logistic Portal
with open('src/components/portals/HubLogisticPortal.tsx', 'r') as f:
    hub_content = f.read()

hub_content = re.sub(old_rider_right, new_rider_right, hub_content) # Exact same string match

with open('src/components/portals/HubLogisticPortal.tsx', 'w') as f:
    f.write(hub_content)
