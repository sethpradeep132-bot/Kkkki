import sys
import re

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # Find map body and replace
    pattern = r'\{\s*activePromoBanners\.map\(\(banner,\s*idx\)\s*=>\s*\(\s*<div.*?</div>\s*\)\s*\)\s*\}'
    
    new_slider = """{activePromoBanners.map((banner, idx) => {
        const colorMap: Record<string, string> = {
          green: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)]',
          red: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]',
          blue: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)]',
          yellow: 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,1)]',
          purple: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,1)]',
          pink: 'bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,1)]',
          orange: 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)]',
        };
        const sigColor = banner.signalColor || (banner.showGreenSignal ? 'green' : 'none');
        const hasSignal = sigColor !== 'none' && colorMap[sigColor];

        return (
          <div key={banner.id || idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden rounded-2xl shadow-sm">
            <img src={banner.imageUrl} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
            {hasSignal && (
              <div className={`absolute top-3 right-3 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20 ${sigColor === 'green' ? 'px-2.5 py-1.5 gap-1.5 rounded-full' : 'w-7 h-7 rounded-full'}`}>
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${colorMap[sigColor]}`}></div>
                {sigColor === 'green' && (
                  <span className="text-[10px] font-black text-white tracking-widest uppercase drop-shadow-md leading-none mt-0.5">Live</span>
                )}
              </div>
            )}
          </div>
        );
      })}"""

    content = re.sub(pattern, new_slider, content, flags=re.DOTALL)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
