with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

import re
# Replace the double ')}' near {!isShopPage
content = re.sub(r'\}\)\s*\}\)\s*\{\!isShopPage', ')}\n{!isShopPage', content)

with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
    f.write(content)
