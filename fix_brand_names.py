import re

def fix_brand(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the SURIYAWAN span and SHOPPING span
    # In SellerPortal: <span className="text-white">SURIYAWAN</span>
    # In RiderPortal: <span className="text-emerald-600">SURIYAWAN</span>
    # In Hub: <span className="text-purple-600">SURIYAWAN</span>
    
    # We replace any <span className="text-...">SURIYAWAN</span> with <span className="text-[#0038A8]">SURIYAWAN</span>
    content = re.sub(r'<span className="text-[^"]+">SURIYAWAN</span>', '<span className="text-[#0038A8]">SURIYAWAN</span>', content)
    
    # And <span className="text-...">SHOPPING</span> with <span className="text-[#FF5500]">SHOPPING</span>
    content = re.sub(r'<span className="text-[^"]+">SHOPPING</span>', '<span className="text-[#FF5500]">SHOPPING</span>', content)

    # In SellerPortal, change header back to bg-white if it's orange
    if 'SellerPortal' in file_path:
        content = content.replace('bg-orange-500 border-b border-orange-600', 'bg-white border-b border-gray-100')
        # also the "Seller" tag has text-white, let's make it text-slate-500 or something if it was white?
        # <span className="text-white bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[10px] ml-1">Seller</span>
        # Let's change it to a standard tag style since background is white.
        content = content.replace(
            '<span className="text-white bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[10px] ml-1">Seller</span>',
            '<span className="text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Seller</span>'
        )

    # In Hub manager portal:
    if 'HubLogisticPortal' in file_path:
        content = content.replace(
            '<span className="text-white bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub Manager</span>',
            '<span className="text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub Manager</span>'
        )
        content = content.replace(
            '<span className="text-black bg-black/10 border border-black/20 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub Manager</span>',
            '<span className="text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub Manager</span>'
        )
        content = content.replace(
            '<span className="text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub Manager</span>',
            '<span className="text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Hub Manager</span>'
        )
        
    # In Rider portal:
    if 'RiderPortal' in file_path:
        content = content.replace(
            '<span className="text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Rider</span>',
            '<span className="text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Rider</span>'
        )
        content = content.replace(
            '<span className="text-black bg-black/10 border border-black/20 px-1.5 py-0.5 rounded text-[10px] ml-1">Rider</span>',
            '<span className="text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Rider</span>'
        )

    with open(file_path, 'w') as f:
        f.write(content)

fix_brand('src/components/portals/SellerPortal.tsx')
fix_brand('src/components/portals/RiderPortal.tsx')
fix_brand('src/components/portals/HubLogisticPortal.tsx')
