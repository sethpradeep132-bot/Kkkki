import re

def fix_gaps(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Shop page and other lists in CustomerPortal
    if 'CustomerPortal' in filepath:
        content = content.replace('className="grid grid-cols-2 sm:grid-cols-3 gap-0"', 'className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2"')
        content = content.replace('className="grid grid-cols-2 sm:grid-cols-3 gap-1"', 'className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2"')
        content = content.replace('className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1 pt-4"', 'className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 pt-4"')
        
        # Horizontal list
        content = content.replace('className="flex overflow-x-auto gap-1 pb-1 no-scrollbar snap-x snap-mandatory px-3"', 'className="flex overflow-x-auto gap-2 pb-2 no-scrollbar snap-x snap-mandatory px-3"')

    if 'ProductDetailModal' in filepath:
        # Horizontal list
        content = content.replace('className="flex items-stretch gap-1 w-max"', 'className="flex items-stretch gap-3 w-max"')
        # Horizontal wrapper
        content = content.replace('className="w-[130px] flex-shrink-0 snap-center"', 'className="w-[140px] flex-shrink-0 snap-center"')
        
        # Vertical grid
        content = content.replace('className="px-0 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1"', 'className="p-2 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2"')

    with open(filepath, 'w') as f:
        f.write(content)

fix_gaps('src/components/portals/CustomerPortal.tsx')
fix_gaps('src/components/portals/ProductDetailModal.tsx')

