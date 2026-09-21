import sys

def fix():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # Find the block we injected and remove it from AccountView
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
    
    # Remove from AccountView
    content = content.replace(state_code, "")

    # Inject into CustomerPortal
    content = content.replace("export const CustomerPortal: React.FC<PortalProps> = ({ onBack }) => {", "export const CustomerPortal: React.FC<PortalProps> = ({ onBack }) => {\n" + state_code, 1)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

fix()
