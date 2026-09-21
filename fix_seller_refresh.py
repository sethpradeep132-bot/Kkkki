import re

with open('src/components/portals/SellerPortal.tsx', 'r') as f:
    content = f.read()

# Change Refresh button styling since header is white now.
content = content.replace(
    'hover:bg-white/20 active:bg-white/30 transition-colors border border-white/20',
    'hover:bg-blue-50 active:bg-blue-100 transition-colors border border-blue-100'
)

content = content.replace(
    '<RefreshCw size={14} className={`text-white',
    '<RefreshCw size={14} className={`text-blue-600'
)

with open('src/components/portals/SellerPortal.tsx', 'w') as f:
    f.write(content)

