const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const backFix = `
  // Global interceptor to trap back buttons for portals
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we are in a portal, try to find a UI back button or close button to click instead of exiting
      if (selectedPortal) {
        // Priority 1: Modals (usually have a fixed z-index container with a close button or we can look for specific close buttons)
        const closeButtons = Array.from(document.querySelectorAll('button')).filter(b => 
          b.innerText.toLowerCase() === 'cancel' || 
          b.innerText.toLowerCase() === 'close' ||
          b.innerHTML.includes('lucide-x') || 
          b.innerHTML.includes('lucide-arrow-left')
        );
        
        // Find visible ones
        const visibleClose = closeButtons.find(b => {
           const rect = b.getBoundingClientRect();
           return rect.width > 0 && rect.height > 0 && window.getComputedStyle(b).display !== 'none';
        });

        if (visibleClose) {
           // We found a subpage or modal back/close button! Click it.
           visibleClose.click();
           
           // We must restore the history state so the user doesn't exit on the next back press
           // Because the browser already popped the state, we push it back.
           window.history.pushState({ portal: selectedPortal }, '');
           return;
        }
      }

      // Default behavior
      const state = event.state;
      if (state && state.portal) {
        setSelectedPortal(state.portal);
      } else {
        setSelectedPortal(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPortal]);
`;

// Replace the existing handlePopState in App.tsx
content = content.replace(/\/\/ Handle device \/ browser back button \(popstate\)[\s\S]*?\}, \[\]\);/, backFix);

fs.writeFileSync('src/App.tsx', content);
