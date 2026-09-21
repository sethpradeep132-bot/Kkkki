import sys
import re

def fix():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # Find the specific div class in activePromoBanners.map
    # Replace anything between `className="w-full flex-shrink-0 snap-center` and `"`
    
    content = re.sub(r'className="w-full flex-shrink-0 snap-center relative aspect-\[16/9\] sm:aspect-\[21/9\] [^"]*"', 
                     'className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden rounded-xl"', 
                     content)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

fix()
