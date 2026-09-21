import sys
import re

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    ui_old = """       {activePromoBanners.map((banner, idx) => (
         <div key={banner.id || idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden">
           <img src={banner.imageUrl} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
         </div>
       ))}"""
    
    ui_new = """       {activePromoBanners.map((banner, idx) => (
         <div key={banner.id || idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden">
           <img src={banner.imageUrl} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
           {banner.showGreenSignal && (
             <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
               <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse"></div>
               <span className="text-[9px] font-extrabold text-white tracking-widest uppercase">Live</span>
             </div>
           )}
         </div>
       ))}"""
       
    content = content.replace(ui_old, ui_new)
    
    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
