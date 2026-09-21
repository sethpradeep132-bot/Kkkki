const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const backFix = `
  // Global interceptor to trap back buttons for portals
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      let handledByUI = false;

      if (selectedPortal) {
        // Find all buttons that could act as a 'back' or 'close' button
        const closeButtons = Array.from(document.querySelectorAll('button')).filter(b => 
          b.innerText.toLowerCase() === 'cancel' || 
          b.innerText.toLowerCase() === 'close' ||
          b.innerHTML.includes('lucide-x') || 
          b.innerHTML.includes('lucide-arrow-left')
        );
        
        // Find the LAST visible one (most likely the top-most modal or active subpage)
        const visibleClose = closeButtons.reverse().find(b => {
           const rect = b.getBoundingClientRect();
           if (rect.width === 0 || rect.height === 0) return false;
           const style = window.getComputedStyle(b);
           if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
           return true;
        });

        if (visibleClose) {
           visibleClose.click();
           handledByUI = true;
           
           // Restore history state so we don't exit the portal on next back press
           window.history.pushState({ portal: selectedPortal }, '');
        }
      }

      if (!handledByUI) {
        // Default behavior: exit portal or switch portal
        const state = event.state;
        if (state && state.portal) {
          setSelectedPortal(state.portal);
        } else {
          setSelectedPortal(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPortal]);
`;

// Replace again
content = content.replace(/\/\/ Global interceptor to trap back buttons for portals[\s\S]*?\}, \[selectedPortal\]\);/, backFix);

fs.writeFileSync('src/App.tsx', content);
