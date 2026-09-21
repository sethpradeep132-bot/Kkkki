import sys

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # 1. Replace PROMO_IMAGES array with PROMO_CARDS
    promo_images_str = """const PROMO_IMAGES = [
  '/Screenshot_2026-09-17-21-25-50-99_e5d3893ac03954c6bb675ef2555b879b (1).jpg',
  '/Screenshot_2026-09-17-21-26-14-61_e5d3893ac03954c6bb675ef2555b879b (1).jpg',
  '/Screenshot_2026-09-17-21-26-17-99_e5d3893ac03954c6bb675ef2555b879b (1).jpg',
  '/Screenshot_2026-09-17-21-26-21-52_e5d3893ac03954c6bb675ef2555b879b (1).jpg'
];"""
    
    promo_cards_str = """const PROMO_CARDS = [
  {
    id: 1,
    badge: "आज का खास दिन!",
    title: "SPECIAL",
    titleBold: "SUNDAY SALE",
    discount: "UP TO 50% OFF",
    subtitle: "इस रविवार खरीदारी का मज़ा दोगुना!",
    features: ["100% भरोसा", "तेज़ डिलीवरी", "बेस्ट प्राइस"],
    bgClass: "from-amber-400 via-orange-500 to-red-600",
    badgeBg: "bg-yellow-300 text-yellow-900 border border-yellow-400",
    iconColor: "text-white"
  },
  {
    id: 2,
    badge: "तैयार हो जाइए!",
    title: "LIVE",
    titleBold: "SALE",
    discount: "Coming Soon...",
    subtitle: "सबसे बेहतरीन डील्स के लिए!",
    features: ["स्पेशल डिस्काउंट", "लिमिटेड टाइम ऑफर", "ट्रेंडिंग प्रोडक्ट्स"],
    bgClass: "from-emerald-500 via-green-600 to-teal-700",
    badgeBg: "bg-white text-emerald-800 border border-emerald-100",
    iconColor: "text-emerald-100"
  },
  {
    id: 3,
    badge: "खरीदारी अब बने और भी खास!",
    title: "SHOPPING",
    titleBold: "UTSAV",
    discount: "धमाकेदार डील्स",
    subtitle: "सुसिया शॉपिंग उत्सव - आपकी खुशियों की ऑनलाइन मंडी",
    features: ["विश्वसनीय सेलर", "सुरक्षित भुगतान", "बेहतरीन ग्राहक सेवा"],
    bgClass: "from-blue-600 via-indigo-600 to-blue-800",
    badgeBg: "bg-orange-500 text-white border border-orange-400",
    iconColor: "text-blue-200"
  },
  {
    id: 4,
    badge: "सीमित समय के लिए",
    title: "MEGA",
    titleBold: "CLEARANCE",
    discount: "FLAT 60% OFF",
    subtitle: "अच्छी चीज़ें कभी इंतज़ार नहीं करतीं!",
    features: ["बेस्ट सेलर्स", "एक्सक्लूसिव डील्स", "तुरंत खरीदें"],
    bgClass: "from-fuchsia-600 via-purple-600 to-violet-800",
    badgeBg: "bg-yellow-300 text-yellow-900 border border-yellow-400",
    iconColor: "text-fuchsia-200"
  }
];"""

    if promo_images_str in content:
        content = content.replace(promo_images_str, promo_cards_str)
    else:
        print("Warning: PROMO_IMAGES not found exactly as expected.")
        # Fallback regex replace
        import re
        content = re.sub(r'const PROMO_IMAGES = \[.*?\];', promo_cards_str, content, flags=re.DOTALL)

    # 2. Replace the slider rendering
    slider_old = """      {PROMO_IMAGES.map((img, idx) => (
         <div key={idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100">
           <img src={img} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
         </div>
       ))}"""

    slider_new = """      {PROMO_CARDS.map((card, idx) => (
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

    if slider_old in content:
        content = content.replace(slider_old, slider_new)
    else:
        print("Warning: Slider render block not found exactly as expected.")
        import re
        content = re.sub(r'\{PROMO_IMAGES\.map.*?</div>\s*\)\)}', slider_new, content, flags=re.DOTALL)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
