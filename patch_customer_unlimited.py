import sys
import re

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # 1. Update State & Effect
    state_old = """  const [headerLogo, setHeaderLogo] = useState('');
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

    state_new = """  const [headerLogo, setHeaderLogo] = useState('');
  const [activePromoBanners, setActivePromoBanners] = useState<any[]>([]);

  useEffect(() => {
    let interval: any;
    const evaluateBanners = () => {
      try {
        const stored = localStorage.getItem('ss_customer_additional_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
          
          if (parsed.promoBanners && Array.isArray(parsed.promoBanners)) {
            const now = new Date();
            // Local date string in YYYY-MM-DD
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayDateString = `${year}-${month}-${day}`;
            
            // Local day of week 0-6
            const todayDayNumber = now.getDay().toString();

            const active = parsed.promoBanners.filter((b: any) => {
              if (!b.isActive || !b.imageUrl) return false;
              if (b.scheduleType === 'date' && b.targetDate === todayDateString) return true;
              if (b.scheduleType === 'day' && b.targetDay === todayDayNumber) return true;
              return false;
            });
            setActivePromoBanners(active);
          } else {
             setActivePromoBanners([]);
          }
        }
      } catch (e) {}
    };

    evaluateBanners(); // Run immediately

    // Real-time sync every 1 minute
    interval = setInterval(() => {
      evaluateBanners();
    }, 60000);

    return () => clearInterval(interval);
  }, []);"""

    content = content.replace(state_old, state_new)

    # 2. Update UI
    ui_old = r'\{promoImages\.map\(\(img, idx\) => \(\s*<div key=\{idx\}.*?</div>\s*\)\s*\)\}'
    
    ui_new = """{activePromoBanners.map((banner, idx) => (
         <div key={banner.id || idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden">
           <img src={banner.imageUrl} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
         </div>
       ))}"""
    
    content = re.sub(ui_old, ui_new, content, flags=re.DOTALL)
    
    # Hide the slider wrapper if there are no active banners to maintain clean UI
    slider_wrap_old = """{activeCategory === 'All' && !viewAllTitle && (
   <div className="w-full px-2 mt-2 mb-1 relative">"""
    slider_wrap_new = """{activeCategory === 'All' && !viewAllTitle && activePromoBanners.length > 0 && (
   <div className="w-full px-2 mt-2 mb-1 relative">"""
    
    content = content.replace(slider_wrap_old, slider_wrap_new)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

patch()
