import sys
import re

def patch():
    with open('src/components/portals/AdminPortal.tsx', 'r') as f:
        content = f.read()

    # Replace Asuryawan Shopping Admin text in header
    content = re.sub(r'Asuryawan Shopping', 'SURIYAWAN SHOPPING', content)
    content = re.sub(r'Suriyawan Shopping', 'SURIYAWAN SHOPPING', content)

    with open('src/components/portals/AdminPortal.tsx', 'w') as f:
        f.write(content)

patch()
