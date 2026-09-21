import re

with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

# 1. Update Home Tab sticky top-0 to top-[60px]
home_sticky_old = '<div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">'
home_sticky_new = '<div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40">'
content = content.replace(home_sticky_old, home_sticky_new)

# 2. Extract promo slider
# The promo slider block starts with {/* Promotional Slider */}
promo_start_marker = "{/* Promotional Slider */}"
end_of_home_marker = "{!isShopPage && activeTab !== 'Services'"

if promo_start_marker in content:
    start_idx = content.find(promo_start_marker)
    # find where activeTab === 'Home' ends. 
    # The structure is:
    # </div> <-- closes sticky div
    # )} <-- closes activeTab === 'Home'
    # {!isShopPage ...
    end_idx = content.find(end_of_home_marker, start_idx)
    
    if start_idx != -1 and end_idx != -1:
        # the block of code between start_idx and end_idx contains the promo slider and the closing divs.
        # We know it ends with:
        # </div>
        # )}
        
        block = content[start_idx:end_idx]
        
        # We want to change:
        # {/* Promotional Slider */}
        # ... slider code ...
        # </div>
        # )}
        
        # to:
        # </div>
        # {/* Promotional Slider */}
        # ... slider code ...
        # )}
        
        # Find the last "</div>" before the end.
        last_div_idx = block.rfind("</div>")
        if last_div_idx != -1:
            # slider code is everything up to the last </div>
            slider_code = block[:last_div_idx]
            rest = block[last_div_idx:] # "</div>\n        )}\n        "
            
            # Now we swap them!
            # It becomes: "</div>\n" + slider_code + rest.replace("</div>", "", 1)
            new_block = "</div>\n        " + slider_code + "\n" + rest.replace("</div>", "", 1)
            
            content = content[:start_idx] + new_block + content[end_idx:]

# 3. Update Shop Tab sticky top-0
shop_sticky_old = '<div className="sticky top-0 z-40 bg-white pt-4 flex flex-col">'
shop_sticky_new = '<div className="sticky top-[60px] z-40 bg-white pt-4 flex flex-col">'
content = content.replace(shop_sticky_old, shop_sticky_new)

# 4. Update Services Tab sticky top-0
services_sticky_old = '<div className="w-full pt-3 pb-3 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">'
services_sticky_new = '<div className="w-full pt-3 pb-3 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40">'
content = content.replace(services_sticky_old, services_sticky_new)


with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
    f.write(content)
