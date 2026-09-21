import sys
import re

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # 1. Remove the global PROMO_CARDS array
    content = re.sub(r'const PROMO_CARDS = \[.*?\];', '', content, flags=re.DOTALL)

    # 2. Add state and effect and useMemo inside CustomerPortal component
    state_code = """  const [headerLogo, setHeaderLogo] = useState('');
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
  }, []);

  const promoCards = React.useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let liveSaleStatus = "Coming Soon...";
    let liveSaleBadge = "तैयार हो जाइए!";
    let liveSaleTitleBold = "COMING SOON";
    let liveSaleDiscount = "Stay Tuned";

    if (liveSaleDates.start && liveSaleDates.end) {
      const start = new Date(liveSaleDates.start);
      start.setHours(0,0,0,0);
      const end = new Date(liveSaleDates.end);
      end.setHours(23,59,59,999);

      if (today >= start && today <= end) {
        liveSaleStatus = "LIVE SALE";
        liveSaleBadge = "Sale is Live!";
        liveSaleTitleBold = "LIVE SALE";
        liveSaleDiscount = "Shop Now!";
      } else if (today < start) {
         liveSaleStatus = `Starts ${start.toLocaleDateString()}`;
         liveSaleDiscount = "Coming Soon";
      } else {
         liveSaleStatus = "Sale Ended";
         liveSaleDiscount = "Stay Tuned";
      }
    }

    const speech = specialSpeech || "इस रविवार खरीदारी का मज़ा दोगुना!";

    return [
      {
        id: 1,
        badge: "आज का खास दिन!",
        title: "SPECIAL",
        titleBold: "SUNDAY SALE",
        discount: "UP TO 50% OFF",
        subtitle: speech,
        features: ["100% भरोसा", "तेज़ डिलीवरी", "बेस्ट प्राइस"],
        bgClass: "from-amber-400 via-orange-500 to-red-600",
        badgeBg: "bg-yellow-300 text-yellow-900 border border-yellow-400",
        iconColor: "text-white"
      },
      {
        id: 2,
        badge: liveSaleBadge,
        title: "MEGA",
        titleBold: liveSaleTitleBold,
        discount: liveSaleDiscount,
        subtitle: liveSaleStatus,
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
    ];
  }, [liveSaleDates, specialSpeech]);
"""
    # Insert it inside CustomerPortal Component, right after "const [customerData, setCustomerData] = useState<any>(null);"
    content = content.replace('const [customerData, setCustomerData] = useState<any>(null);', 'const [customerData, setCustomerData] = useState<any>(null);\n' + state_code, 1)

    # Replace PROMO_CARDS with promoCards where it is used
    content = content.replace('{PROMO_CARDS.map', '{promoCards.map')

    # Capitalize SURIYAWAN SHOPPING
    old_title = '''<span className="text-[#0038A8]">Suriyawan</span>
 <span className="text-[#FF5500]">Shopping</span>'''
    new_title = '''<span className="text-[#0038A8]">SURIYAWAN</span>
 <span className="text-[#FF5500]">SHOPPING</span>'''
    content = content.replace(old_title, new_title)
    
    old_title2 = '''<span className="text-[#0038A8]">Suriyawan</span>
<span className="text-[#FF5500]">Shopping</span>'''
    content = content.replace(old_title2, new_title)
    
    # regex for safer replacement
    content = re.sub(r'<span className="text-\[#0038A8\]">Suriyawan</span>\s*<span className="text-\[#FF5500\]">Shopping</span>', new_title, content)


    # Add logo to Right Actions
    old_right_actions = '''{/* Right Actions (Search & Refresh) */}
 <div className="flex items-center gap-1 text-slate-700 z-10">'''
    new_right_actions = '''{/* Right Actions (Search & Refresh) */}
 <div className="flex items-center gap-1 text-slate-700 z-10">
 {headerLogo && <img src={headerLogo} alt="Logo" className="h-8 w-auto max-w-[60px] object-contain mr-1 rounded" />}'''
    content = content.replace(old_right_actions, new_right_actions)
    
    old_ra2 = '''{/* Right Actions (Search & Refresh) */}
<div className="flex items-center gap-1 text-slate-700 z-10">'''
    content = content.replace(old_ra2, new_right_actions)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
