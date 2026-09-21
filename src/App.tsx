import React, { useState, useEffect } from 'react';
import { CustomerPortal } from './components/portals/CustomerPortal';
import { SellerPortal } from './components/portals/SellerPortal';
import { HubLogisticPortal } from './components/portals/HubLogisticPortal';
import { RiderPortal } from './components/portals/RiderPortal';
import { AdminPortal } from './components/portals/AdminPortal';
import { ClusterPortal } from './components/portals/ClusterPortal';
import { SecurityProtector } from './components/common/SecurityProtector';
import { executeBackHandlers } from './lib/backNavigation';
import { 
  ShoppingCart, 
  Store, 
  Building2, 
  Truck, 
  Crown,
  ArrowRight
} from 'lucide-react';

interface PortalChip {
  id: string;
  name: string;
  icon: React.ElementType;
  cardBg: string;
  cardBorder: string;
  iconGradient: string;
  iconShadow: string;
  accentBadge: string;
}

const PORTAL_CHIPS: PortalChip[] = [
  {
    id: 'customer',
    name: 'Customer Portal',
    icon: ShoppingCart,
    cardBg: 'bg-gradient-to-b from-blue-50/90 via-white to-white',
    cardBorder: 'border-blue-200/90 hover:border-blue-400',
    iconGradient: 'from-blue-600 to-indigo-600',
    iconShadow: 'shadow-blue-500/25',
    accentBadge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'seller',
    name: 'Seller Portal',
    icon: Store,
    cardBg: 'bg-gradient-to-b from-orange-50/90 via-white to-white',
    cardBorder: 'border-orange-200/90 hover:border-orange-400',
    iconGradient: 'from-orange-500 to-amber-600',
    iconShadow: 'shadow-orange-500/25',
    accentBadge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    id: 'hub',
    name: 'Hub Logistic Portal',
    icon: Building2,
    cardBg: 'bg-gradient-to-b from-purple-50/90 via-white to-white',
    cardBorder: 'border-purple-200/90 hover:border-purple-400',
    iconGradient: 'from-purple-600 to-indigo-700',
    iconShadow: 'shadow-purple-500/25',
    accentBadge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'rider',
    name: 'Rider Portal',
    icon: Truck,
    cardBg: 'bg-gradient-to-b from-emerald-50/90 via-white to-white',
    cardBorder: 'border-emerald-200/90 hover:border-emerald-400',
    iconGradient: 'from-emerald-500 to-teal-600',
    iconShadow: 'shadow-emerald-500/25',
    accentBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'cluster',
    name: 'Cluster Portal',
    icon: Building2,
    cardBg: 'bg-gradient-to-b from-slate-50/90 via-white to-white',
    cardBorder: 'border-slate-200/90 hover:border-slate-400',
    iconGradient: 'from-slate-700 to-slate-900',
    iconShadow: 'shadow-slate-500/25',
    accentBadge: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'admin',
    name: 'Admin Portal',
    icon: Crown,
    cardBg: 'bg-gradient-to-b from-rose-50/90 via-white to-white',
    cardBorder: 'border-rose-200/90 hover:border-rose-400',
    iconGradient: 'from-rose-600 to-pink-600',
    iconShadow: 'shadow-rose-500/25',
    accentBadge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

/**
 * Exact Match 3D "SS" Interlocking Vector Emblem (Faithful to Reference Image on Clean White Canvas)
 * 
 * Features:
 * - Upper 'S' in vibrant 3D Sunburst Yellow-Gold to Deep Sunset Orange gradient with sharp wing tips
 * - Lower 'S' in rich 3D Royal Sapphire / Cobalt to Midnight Blue gradient with beveled depth
 * - Central aerodynamic speed separation swoosh wave across the diagonal interlock
 * - 100% transparent vector rendering for crisp display on white background
 */
export default function App() {
  const [resolvedConfig] = useState(() => {
    if (typeof window === 'undefined') return { portal: null, isLocked: false };

    // 1. Environment lockdown (for dedicated single-portal hosting deployment)
    const envLock = (import.meta.env.VITE_LOCK_PORTAL as string)?.toLowerCase();
    if (envLock && ['customer', 'seller', 'hub', 'rider', 'admin', 'cluster'].includes(envLock)) {
      return { portal: envLock, isLocked: true };
    }

    // 2. Subdomain auto-detection (e.g. customer.yourdomain.com or shop.yourdomain.com)
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.startsWith('customer.') || hostname.startsWith('shop.') || hostname.startsWith('store.')) {
      return { portal: 'customer', isLocked: true };
    }
    if (hostname.startsWith('seller.')) {
      return { portal: 'seller', isLocked: true };
    }
    if (hostname.startsWith('rider.')) {
      return { portal: 'rider', isLocked: true };
    }
    if (hostname.startsWith('hub.') || hostname.startsWith('logistics.')) {
      return { portal: 'hub', isLocked: true };
    }
    if (hostname.startsWith('cluster.')) {
      return { portal: 'cluster', isLocked: true };
    }
    if (hostname.startsWith('admin.')) {
      return { portal: 'admin', isLocked: true };
    }

    // 3. Clean Path-based routing (/customer, /seller, /rider, etc.)
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.startsWith('/customer')) {
      return { portal: 'customer', isLocked: false };
    }
    if (pathname.startsWith('/seller')) {
      return { portal: 'seller', isLocked: false };
    }
    if (pathname.startsWith('/rider')) {
      return { portal: 'rider', isLocked: false };
    }
    if (pathname.startsWith('/hub')) {
      return { portal: 'hub', isLocked: false };
    }
    if (pathname.startsWith('/cluster')) {
      return { portal: 'cluster', isLocked: false };
    }
    if (pathname.startsWith('/admin')) {
      return { portal: 'admin', isLocked: false };
    }

    // 4. Query param (?portal=customer)
    const params = new URLSearchParams(window.location.search);
    const queryPortal = params.get('portal')?.toLowerCase();
    if (queryPortal && ['customer', 'seller', 'hub', 'rider', 'admin', 'cluster'].includes(queryPortal)) {
      return { portal: queryPortal, isLocked: false };
    }

    if (window.history.state?.portal) {
      return { portal: window.history.state.portal, isLocked: false };
    }

    return { portal: null, isLocked: false };
  });

  const [selectedPortal, setSelectedPortal] = useState<string | null>(resolvedConfig.portal);
  const isPortalLocked = resolvedConfig.isLocked;

  
  
  // Initialize baseline history entry to prevent browser back exhaustion
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentState = window.history.state || {};
      if (!currentState.suriyawanRoot) {
        window.history.replaceState({ ...currentState, suriyawanRoot: true, portal: selectedPortal }, '');
        window.history.pushState({ ...currentState, suriyawanRoot: true, portal: selectedPortal }, '');
      }
    }
  }, []);

  // Centralized popstate back handler across portals
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 1. Try to let registered UI handlers (modals, subpages, tabs) handle the back press
      const handled = executeBackHandlers();
      if (handled) {
        // UI handled the back press (e.g. closed modal, navigated back to main tab).
        // Maintain history entry so subsequent back presses don't exhaust history or reload page
        window.history.pushState({ suriyawanRoot: true, portal: selectedPortal }, '');
        return;
      }

      // 2. If no inner UI handler consumed it, we are at the portal root:
      if (selectedPortal) {
        if (isPortalLocked) {
          // Locked portal stays on portal root and maintains history
          window.history.pushState({ suriyawanRoot: true, portal: selectedPortal }, '');
        } else {
          // Exit portal to Portal Chooser
          setSelectedPortal(null);
          try {
            localStorage.removeItem('active_selected_portal');
          } catch (e) {}
          window.history.pushState({ suriyawanRoot: true, portal: null }, '');
        }
        return;
      }

      // 3. Already on Portal Chooser - maintain base state to prevent browser reload or page exit
      window.history.pushState({ suriyawanRoot: true, portal: null }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPortal, isPortalLocked]);



  // Handle keyboard open/close and dismiss on scroll/touch
  React.useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        document.body.classList.add('keyboard-open');
      }
    };
    
    const handleFocusOut = () => {
      document.body.classList.remove('keyboard-open');
    };

    const blurInput = () => {
       if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
         (document.activeElement as HTMLElement).blur();
       }
    };

    const handleTouchStart = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      // Do not blur if touching another input or a button
      if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
        // Also ensure it's not a label containing an input
        if (typeof target.closest === 'function' && !target.closest('input') && !target.closest('button')) {
          blurInput();
        } else if (typeof target.closest !== 'function') {
           blurInput();
        }
      }
    };

    const handleScrollOrMove = (e: TouchEvent | Event) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      blurInput();
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('touchmove', handleScrollOrMove, { passive: true });
    window.addEventListener('scroll', handleScrollOrMove, { passive: true, capture: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('mousedown', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('touchmove', handleScrollOrMove);
      window.removeEventListener('scroll', handleScrollOrMove, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousedown', handleTouchStart);
    };
  }, []);

  const handleSelectPortal = (portalId: string) => {
    try {
      localStorage.removeItem('active_selected_portal');
    } catch (e) {}
    setSelectedPortal(portalId);
    window.history.pushState({ suriyawanRoot: true, portal: portalId }, '');
  };

  const handleBackToPortals = () => {
    try {
      localStorage.removeItem('active_selected_portal');
    } catch (e) {}
    setSelectedPortal(null);
    window.history.pushState({ suriyawanRoot: true, portal: null }, '');
  };

  const renderActivePortal = () => {
    const portalBackHandler = isPortalLocked ? () => {} : handleBackToPortals;

    if (selectedPortal === 'customer') return <CustomerPortal onBack={portalBackHandler} />;
    if (selectedPortal === 'seller') return <SellerPortal onBack={portalBackHandler} />;
    if (selectedPortal === 'hub') return <HubLogisticPortal onBack={portalBackHandler} />;
    if (selectedPortal === 'rider') return <RiderPortal onBack={portalBackHandler} />;
    if (selectedPortal === 'admin') return <AdminPortal onBack={portalBackHandler} />;
    if (selectedPortal === 'cluster') return <ClusterPortal onBack={portalBackHandler} />;
    return null;
  };

  if (selectedPortal) {
    return (
      <>
        <SecurityProtector />
        {renderActivePortal()}
      </>
    );
  }

  return (
    <>
      <SecurityProtector />
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-orange-500 selection:text-white">
      {/* Centered clean layout container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-10 sm:space-y-14 py-6">
        
        {/* ========================================================
            TOP BRAND HEADER: Exact 3D "SS" Logo + Royal Blue / Orange Typography + Ecosystem Tagline
            ======================================================== */}
        <header className="flex flex-col items-center justify-center text-center space-y-2.5" id="brand-logo-header">
          
          {/* Main Logo + Brand Title Row */}
          <div className="flex items-center justify-center select-none">
            <h1 className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 drop-shadow-sm">
              <span className="text-[#0038A8]">Suriyawan</span> <span className="text-[#FF5500]">Shopping</span>
            </h1>
          </div>

          {/* Ecosystem Tagline / Title */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Unified Multi-Service Portal Ecosystem
            </p>
          </div>

        </header>

        {/* ========================================================
            CENTER GRID: 5 Uniform Portal Chips with Access Buttons & Distinct Color Themes
            ======================================================== */}
        <main className="w-full" id="portal-selection-grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
            {PORTAL_CHIPS.map((chip) => {
              const IconComponent = chip.icon;

              return (
                <div
                  key={chip.id}
                  id={`portal-chip-${chip.id}`}
                  onClick={() => handleSelectPortal(chip.id)}
                  className={`w-full h-50 sm:h-56 ${chip.cardBg} rounded-2xl border-2 ${chip.cardBorder} shadow-sm flex flex-col items-center justify-between p-5 text-center select-none cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-200`}
                >
                  {/* Distinct Colored Icon Container */}
                  <div 
                    className={`w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br ${chip.iconGradient} text-white flex items-center justify-center shadow-md ${chip.iconShadow} group-hover:scale-105 transition-transform duration-200 shrink-0 mt-1`}
                  >
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.2} />
                  </div>

                  {/* Clean Portal Name & Hindi Subtitle */}
                  <div className="space-y-0.5 my-auto">
                    <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight block">
                      {chip.name}
                    </span>
                    </div>

                  {/* Action "Access" Button with Arrow Icon */}
                  <div 
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold border ${chip.accentBadge} flex items-center justify-center gap-1.5 group-hover:shadow-xs transition-all`}
                  >
                    <span>Access</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center pt-2 text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} Suriyawan Shopping Services Pvt. Ltd. • All Rights Reserved
        </footer>

      </div>
    </div>
    </>
  );
}
