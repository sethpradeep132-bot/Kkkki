import sys
import re

def fix():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # The previous regex might have left `className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 overflow-hidden"`
    # Let's replace it to have rounded-xl and border back.
    old = """className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 overflow-hidden">"""
    new = """className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden rounded-xl">"""
    
    # Actually, only inside the map.
    
    # We can just run a general replace for this exact string since it's unique enough.
    content = content.replace(old, new)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

fix()
