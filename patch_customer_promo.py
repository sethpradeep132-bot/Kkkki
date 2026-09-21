import sys

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # 1. State & Effect
    state_old = """  const [headerLogo, setHeaderLogo] = useState('');
  const [liveSaleDates, setLiveSaleDates] = useState({ start: '', end: '' });
  const [specialSpeech, setSpecialSpeech] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ss_customer_additional_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
        if (parsed.liveSaleStartDate) setLiveSaleDates(prev => ({...prev, start: parsed.liveSaleStartDate}));
        if (parsed.liveSaleEndDate) setLiveSaleDates(prev => ({...prev, end: parsed.liveSaleEndDate}));
        if (parsed.specialSpeech) setSpecialSpeech(parsed.specialSpeech);
      }
    } catch (e) {}
  }, []);"""

    state_new = """  const [headerLogo, setHeaderLogo] = useState('');
  const [promoImages, setPromoImages] = useState<string[]>(['', '', '', '']);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ss_customer_additional_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
        if (parsed.promoImages) setPromoImages(parsed.promoImages);
      }
    } catch (e) {}
  }, []);"""
    
    content = content.replace(state_old, state_new)
    
    # 2. Remove promoCards useMemo
    import re
    content = re.sub(r'\s*const promoCards = React\.useMemo\(\(\) => \{.*?\},\s*\[liveSaleDates,\s*specialSpeech\]\);', '', content, flags=re.DOTALL)

    # 3. Replace Slider UI
    ui_old = """       {promoCards.map((card, idx) => (
         <div key={idx} className={`w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br ${card.bgClass} overflow-hidden flex flex-col justify-between p-3 sm:p-4 text-white shadow-inner`}>
           {/* Decorative background shapes */}
           <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-black opacity-15 rounded-full blur-xl pointer-events-none"></div>
           
           <div className="flex justify-between items-start relative z-10">
             <div className={`px-2.5 py-1 rounded-full text-[9px] sm:text-xs font-extrabold shadow-sm ${card.badgeBg}`}>
               {card.badge}
             </div>
             <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/40 shadow-sm">
               <span className="text-[10px] sm:text-xs font-black drop-shadow-md text-white tracking-wide">{card.discount}</span>
             </div>
           </div>

           <div className="flex flex-col items-center justify-center flex-1 relative z-10 text-center my-1.5">
             <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-none drop-shadow-lg text-white">
               <span className="font-extrabold text-white/90 drop-shadow-sm">{card.title} </span>
               <br className="sm:hidden" />
               {card.titleBold}
             </h2>
             <p className="text-[10px] sm:text-sm font-bold mt-1.5 opacity-95 drop-shadow-md max-w-[90%] mx-auto leading-tight">{card.subtitle}</p>
           </div>

           <div className="flex justify-around items-center w-full relative z-10 bg-black/15 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-sm">
             {card.features.map((feat, i) => (
               <div key={i} className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></div>
                 <span className="text-[8px] sm:text-[10px] font-extrabold text-center leading-tight opacity-100 text-white drop-shadow-sm tracking-wide">{feat}</span>
               </div>
             ))}
           </div>
           
           <div className="absolute bottom-14 left-2 opacity-15 pointer-events-none transform -rotate-12">
              <ShoppingBag size={56} className={card.iconColor} strokeWidth={2.5} />
           </div>
           <div className="absolute top-10 right-4 opacity-15 pointer-events-none transform rotate-12">
              <Gift size={48} className={card.iconColor} strokeWidth={2.5} />
           </div>
         </div>
       ))}"""
       
    ui_new = """       {promoImages.map((img, idx) => (
         <div key={idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden">
           {img ? (
             <img src={img} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
               <Image size={32} className="opacity-50 mb-2" />
               <span className="text-xs font-bold opacity-70">Banner {idx + 1}</span>
             </div>
           )}
         </div>
       ))}"""

    if ui_old in content:
        content = content.replace(ui_old, ui_new)
    else:
        # Regex fallback
        content = re.sub(r'\{promoCards\.map\(\(card, idx\) => \(.*?\)\s*\)\}', ui_new, content, flags=re.DOTALL)
        
    # Also need to make sure Image is imported in CustomerPortal if it's not.
    if 'import { Image } from \'lucide-react\';' not in content and 'Image,' not in content:
        content = content.replace("ShoppingBag,", "ShoppingBag, Image,")

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
