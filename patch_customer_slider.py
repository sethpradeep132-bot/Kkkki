import sys

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    slider_old = """      {activePromoBanners.map((banner, idx) => (
        <div key={banner.id || idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden rounded-xl">
          <img src={banner.imageUrl} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
          {banner.showGreenSignal && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse"></div>
              <span className="text-[9px] font-extrabold text-white tracking-widest uppercase">Live</span>
            </div>
          )}
        </div>
      ))}"""

    slider_new = """      {activePromoBanners.map((banner, idx) => {
        const colorMap: Record<string, string> = {
          green: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)]',
          red: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]',
          blue: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)]',
          yellow: 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,1)]',
          purple: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,1)]',
          pink: 'bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,1)]'
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

    content = content.replace(slider_old, slider_new)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
