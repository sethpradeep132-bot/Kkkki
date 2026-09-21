const fs = require('fs');

const codeToInject = `
  // Global history back handler trap
  useEffect(() => {
    const handlePopState = (e) => {
      // If we are currently showing a subpage or modal, close it and prevent going back to portal selection
      let handled = false;
      
      // Try to close things in order of priority (modals first, then subpages, then tabs)
      if (typeof setShowLogoutModal === 'function' && showLogoutModal) { setShowLogoutModal(false); handled = true; }
      else if (typeof setShowAnnouncementModal === 'function' && showAnnouncementModal) { setShowAnnouncementModal(false); handled = true; }
      else if (typeof setShowRoleChatModal === 'function' && showRoleChatModal) { setShowRoleChatModal(false); handled = true; }
      else if (typeof setIsShopSearchOpen === 'function' && isShopSearchOpen) { setIsShopSearchOpen(false); handled = true; }
      else if (typeof setSelectedProduct === 'function' && selectedProduct) { setSelectedProduct(null); handled = true; }
      else if (typeof setIsCategoryBubbleOpen === 'function' && isCategoryBubbleOpen) { setIsCategoryBubbleOpen(false); handled = true; }
      else if (typeof activePage !== 'undefined' && activePage !== 'main' && typeof setActivePage === 'function') { setActivePage('main'); handled = true; }
      else if (typeof activeTab !== 'undefined' && activeTab !== 'Home' && typeof setActiveTab === 'function') { setActiveTab('Home'); handled = true; }
      else if (typeof activeTab !== 'undefined' && activeTab !== 'Dashboard' && typeof setActiveTab === 'function') { setActiveTab('Dashboard'); handled = true; }

      if (handled) {
        // Re-push the portal state so we don't exit the portal on the next back press
        // unless we actually want to exit. Since the browser popped the state, we need to push it back
        // to stay in the portal.
        const portalName = typeof PORTAL_NAME !== 'undefined' ? PORTAL_NAME : 'customer';
        window.history.pushState({ portal: portalName }, '');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
     typeof showLogoutModal !== 'undefined' ? showLogoutModal : false,
     typeof showAnnouncementModal !== 'undefined' ? showAnnouncementModal : false,
     typeof showRoleChatModal !== 'undefined' ? showRoleChatModal : false,
     typeof isShopSearchOpen !== 'undefined' ? isShopSearchOpen : false,
     typeof selectedProduct !== 'undefined' ? selectedProduct : false,
     typeof isCategoryBubbleOpen !== 'undefined' ? isCategoryBubbleOpen : false,
     typeof activePage !== 'undefined' ? activePage : 'main',
     typeof activeTab !== 'undefined' ? activeTab : 'Home'
  ]);
`;
// Actually, injecting this might conflict with existing popstates. Let's see.
