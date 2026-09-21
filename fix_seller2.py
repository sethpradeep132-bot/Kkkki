import sys

def fix():
    with open('src/components/portals/SellerPortal.tsx', 'r') as f:
        content = f.read()

    new_ra = '''{/* Right Actions */}
 <div className="flex items-center gap-0.5 text-white z-10">
   {headerLogo && <img src={headerLogo} alt="Logo" className="h-8 w-auto max-w-[60px] object-contain mr-1 bg-white/20 rounded p-0.5" />}'''
    content = content.replace('''{/* Right Actions */}
 <div className="flex items-center gap-0.5 text-white z-10">''', new_ra)

    with open('src/components/portals/SellerPortal.tsx', 'w') as f:
        f.write(content)

fix()
