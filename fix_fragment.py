import re

with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

# I need to wrap the contents of activeTab === 'Home' in a fragment.
# Right now it's:
# {activeTab === 'Home' && (
# <div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40">
# ...
# </div>
# {/* Promotional Slider */}
# ...
# )}

content = content.replace(
    "{activeTab === 'Home' && (\n <div className=\"w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40\">",
    "{activeTab === 'Home' && (<>\n <div className=\"w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-[60px] z-40\">"
)

# And before the closing )} for activeTab === 'Home', which is followed by {!isShopPage...
# So we look for:
# )}
# {!isShopPage
# And change it to:
# </>
# )}
# {!isShopPage
content = re.sub(r'\)\}\n\{\!isShopPage', r'</>\n)}\n{!isShopPage', content)

with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
    f.write(content)

