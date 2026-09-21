import sys

def fix():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    # Find the AccountView one and remove it
    target = """ const [customerData, setCustomerData] = useState<any>(null);

  const promoSliderRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let interval: any;
    if (promoSliderRef.current) {
      interval = setInterval(() => {
        if (promoSliderRef.current) {
          const el = promoSliderRef.current;
          const maxScroll = el.scrollWidth - el.clientWidth;
          if (el.scrollLeft >= maxScroll - 10) {
            el.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, []);"""

    # Replace the FIRST occurrence only, back to original
    content = content.replace(target, " const [customerData, setCustomerData] = useState<any>(null);", 1)

    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(content)

fix()
