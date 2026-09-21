import re

with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace("'CGST (0%): ₹0.00\nSGST (0%): ₹0.00'", "'CGST (0%): ₹0.00\\nSGST (0%): ₹0.00'")

with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
    f.write(content)
