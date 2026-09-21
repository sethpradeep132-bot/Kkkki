import re

# 1. Seller Portal
with open('src/components/portals/SellerPortal.tsx', 'r') as f:
    seller = f.read()

# Fix Brand Colors
seller = seller.replace('<span className="text-[#0038A8]">SURIYAWAN</span>', '<span className="text-orange-600">SURIYAWAN</span>')
seller = seller.replace('<span className="text-[#FF5500]">SHOPPING</span>', '<span className="text-black">SHOPPING</span>')

# Fix Seller tag color (make it orange, since it's Seller portal)
seller = seller.replace('<span className="text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Seller</span>', '<span className="text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Seller</span>')

# Fix Refresh button color to grey and add stopPropagation
# Currently: onClick={handleDeepRefresh} className="flex items-center justify-center p-1 rounded-full hover:bg-blue-50 active:bg-blue-100 transition-colors border border-blue-100" title="Refresh">
# <RefreshCw size={14} className={`text-blue-600 ${isDeepRefreshing ? 'animate-spin' : ''}`} />
old_seller_refresh = r"""onClick=\{handleDeepRefresh\} className="flex items-center justify-center p-1 rounded-full hover:bg-blue-50 active:bg-blue-100 transition-colors border border-blue-100" title="Refresh">
                  <RefreshCw size=\{14\} className=\{`text-blue-600 \$\{isDeepRefreshing \? 'animate-spin' : ''\}`\} />"""
new_seller_refresh = """onClick={(e) => { e.stopPropagation(); handleDeepRefresh(); }} className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200" title="Refresh">
                  <RefreshCw size={14} className={`text-gray-500 ${isDeepRefreshing ? 'animate-spin' : ''}`} />"""
seller = re.sub(old_seller_refresh, new_seller_refresh, seller)

with open('src/components/portals/SellerPortal.tsx', 'w') as f:
    f.write(seller)

# 2. Rider Portal
with open('src/components/portals/RiderPortal.tsx', 'r') as f:
    rider = f.read()

# Fix Brand Colors
rider = rider.replace('<span className="text-[#0038A8]">SURIYAWAN</span>', '<span className="text-emerald-600">SURIYAWAN</span>')
rider = rider.replace('<span className="text-[#FF5500]">SHOPPING</span>', '<span className="text-black">SHOPPING</span>')

# Add "Rider" tag to brand name
rider_brand_old = r"""              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">
                <span className="text-emerald-600">SURIYAWAN</span>
                <span className="text-black">SHOPPING</span>
              </h1>"""
rider_brand_new = """              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">
                <span className="text-emerald-600">SURIYAWAN</span>
                <span className="text-black">SHOPPING</span>
                <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Rider</span>
              </h1>"""
rider = rider.replace(
    '              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">\n                <span className="text-emerald-600">SURIYAWAN</span>\n                <span className="text-black">SHOPPING</span>\n              </h1>',
    '              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">\n                <span className="text-emerald-600">SURIYAWAN</span>\n                <span className="text-black">SHOPPING</span>\n                <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Rider</span>\n              </h1>'
)

# Move refresh button next to premium member
rider_premium_old = r"""              {/* Premium Member Glow */}
              <div className="relative group inline-flex overflow-hidden rounded-full mt-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                  <span>👑</span> Premium Member
                </span>
                {/* Smooth Shine Animation */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
              </div>"""
rider_premium_new = """              <div className="flex items-center gap-2 mt-1">
                {/* Premium Member Glow */}
                <div className="relative group inline-flex overflow-hidden rounded-full">
                  <span className="text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                    <span>👑</span> Premium Member
                  </span>
                  {/* Smooth Shine Animation */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
                </div>
                
                {/* Refresh Button */}
                <button onClick={(e) => { e.stopPropagation(); handleDeepRefresh(); }} className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200" title="Refresh">
                  <RefreshCw size={14} className={`text-gray-500 ${isDeepRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>"""
rider = re.sub(rider_premium_old, rider_premium_new, rider)

# Remove old right-side refresh
rider = re.sub(r'\{\/\* Right Actions \(Refresh\) \*\/\}.*?</div>', '', rider, flags=re.DOTALL)
# It might leave a trailing </div> or so, let's just do an exact match:
old_right_refresh_exact = """          {/* Right Actions (Refresh) */}
          <div className="flex items-center gap-3 pr-2 text-slate-700 z-10">
            <button onClick={handleDeepRefresh} className="p-1.5 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
              <RefreshCw size={18} className={`text-slate-600 ${isDeepRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>"""
rider = rider.replace(old_right_refresh_exact, "")

with open('src/components/portals/RiderPortal.tsx', 'w') as f:
    f.write(rider)


# 3. Hub Logistic Portal
with open('src/components/portals/HubLogisticPortal.tsx', 'r') as f:
    hub = f.read()

# Fix Brand Colors
hub = hub.replace('<span className="text-[#0038A8]">SURIYAWAN</span>', '<span className="text-purple-600">SURIYAWAN</span>')
hub = hub.replace('<span className="text-[#FF5500]">SHOPPING</span>', '<span className="text-black">SHOPPING</span>')

# Add "Hub Manager" tag to brand name
hub = hub.replace(
    '              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">\n                <span className="text-purple-600">SURIYAWAN</span>\n                <span className="text-black">SHOPPING</span>\n              </h1>',
    '              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">\n                <span className="text-purple-600">SURIYAWAN</span>\n                <span className="text-black">SHOPPING</span>\n                <span className="text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub Manager</span>\n              </h1>'
)

# Move refresh button next to premium member
hub = re.sub(rider_premium_old, rider_premium_new, hub)

# Remove old right-side refresh
hub = hub.replace(old_right_refresh_exact, "")

with open('src/components/portals/HubLogisticPortal.tsx', 'w') as f:
    f.write(hub)

