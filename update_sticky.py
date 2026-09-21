import re

with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

# 1. Update Home Tab sticky top-0 to top-[60px]
# And separate Promo Slider

# Let's extract Promo Slider
promo_slider_pattern = r"({\/\* Promotional Slider \*\/}.*?</div>\s*</div>\s*)}\s*)</div>\s*)}\s*({\!isShopPage)"

# The structure currently:
# {/* Promotional Slider */}
# {activeCategory === 'All' ...
#   <div className="w-full px-2 mt-2 mb-1 relative">
#     ...
#   </div>
# )}
# </div>  <-- ends the sticky div
# )} <-- ends activeTab === 'Home'

def promo_replace(match):
    promo_code = match.group(1)
    return f"</div>\n        {promo_code}\n        {match.group(2)}"

# First, modify the Home tab sticky header
home_sticky_old = '<div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">'
home_sticky_new = '<div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40">'
content = content.replace(home_sticky_old, home_sticky_new)

# Apply Promo slider extraction
content = re.sub(promo_slider_pattern, promo_replace, content, flags=re.DOTALL)

# 2. Update Shop Tab sticky top-0
shop_sticky_old = '<div className="sticky top-0 z-40 bg-white pt-4 flex flex-col">'
shop_sticky_new = '<div className="sticky top-[60px] z-40 bg-white pt-4 flex flex-col">'
content = content.replace(shop_sticky_old, shop_sticky_new)

# 3. Update Services Tab sticky top-0
services_sticky_old = '<div className="w-full pt-3 pb-3 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">'
services_sticky_new = '<div className="w-full pt-3 pb-3 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40">'
content = content.replace(services_sticky_old, services_sticky_new)


with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
    f.write(content)

