import re

with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

# 1. Fix Home Tab Sticky and separate Promo Slider
# Currently the Home tab wrapper starts as:
# <div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">
# and the promo slider is inside it.

# We will match the Home tab sticky header and change top-0 to top-[60px]
content = content.replace(
    '<div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">',
    '<div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40">'
)

# Now we need to extract the promo slider from inside this div and put it outside.
# Let's find the promo slider code block
promo_regex = r"(\{\/\* Promotional Slider \*\/\}.*?</div>\s*\)\}\s*</div>\s*\)\})"
promo_match = re.search(promo_regex, content, flags=re.DOTALL)
if promo_match:
    promo_code = promo_match.group(1)
    # Remove from its current location
    content = content.replace(promo_code, "")
    
    # Place it right after the closing </div> of the sticky header.
    # The sticky header closes right after the promo code was located, which is followed by:
    # </div>
    # )}
    # {!isShopPage && activeTab !== 'Services'
    # Actually, wait. Let's look at the original code layout:
    # {activeCategory === 'All' && !viewAllTitle && activePromoBanners.length > 0 && ( ... )}
    # </div> <!-- Ends sticky div -->
    # )} <!-- Ends activeTab === 'Home' -->
    
    # If we removed promo_code from inside, now we need to put it OUTSIDE the sticky div, but INSIDE activeTab === 'Home'.
    # Actually, the simplest is to just split the activeTab === 'Home' into two blocks or just close the sticky div before promo slider, and let promo slider be in normal flow.
pass
