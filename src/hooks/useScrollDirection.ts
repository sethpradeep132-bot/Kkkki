import { useState, useEffect } from 'react';

export function useScrollDirection(threshold = 10) {
  const [scrollDir, setScrollDir] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let lastScrollY = window.scrollY || 0;
    let ticking = false;

    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      
      let scrollY = 0;
      if (target === document) {
        scrollY = window.scrollY;
      } else if ('scrollTop' in target) {
        const el = target as HTMLElement;
        // Ignore small scrolling containers (e.g., horizontal chip lists or small text boxes)
        if (el.clientHeight < window.innerHeight * 0.4) {
          return;
        }
        scrollY = el.scrollTop;
      } else {
        return;
      }

      if (scrollY < 0) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (Math.abs(scrollY - lastScrollY) < threshold) {
            ticking = false;
            return;
          }
          setScrollDir(scrollY > lastScrollY ? 'down' : 'up');
          lastScrollY = scrollY > 0 ? scrollY : 0;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    return () => window.removeEventListener('scroll', onScroll, { capture: true } as any);
  }, [threshold]);

  return scrollDir;
}
