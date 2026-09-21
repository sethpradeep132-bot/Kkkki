import re

with open('src/components/portals/ProductDetailModal.tsx', 'r') as f:
    content = f.read()

# Fix 'upload service' to 'upload services'
content = content.replace("product['upload service']", "product['upload services']")
content = content.replace("p['upload service']", "p['upload services']")

with open('src/components/portals/ProductDetailModal.tsx', 'w') as f:
    f.write(content)

