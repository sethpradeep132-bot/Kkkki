import React from 'react';
import { 
  ShoppingBag, 
  Sparkles, ShieldCheck, 
  PhoneCall, 
  Layers, 
  ArrowLeft,
  ChevronRight,
  Headphones
} from 'lucide-react';
import { PortalId } from '../types';
import { PORTAL_LIST } from '../data/portalData';

interface HeaderProps {
  currentPortal: PortalId | null;
  onSelectPortal: (portal: PortalId | null) => void;
  cartCount: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPortal,
  onSelectPortal,
  cartCount,
  onOpenCart,
}) => {
  const activePortalData = PORTAL_LIST.find((p) => p.id === currentPortal);

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Top micro utility ribbon */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-slate-900 text-slate-100 text-xs py-1.5 px-4 sm:px-8 border-b border-blue-800/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-[11px] border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {'All 5 Portals Live & Operational'}
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">
              {'Superfast 15-30 Min Delivery across Suriyawan & Regions'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            
            <div className="hidden md:flex items-center gap-1 text-slate-300 hover:text-white transition">
              <Headphones className="w-3.5 h-3.5 text-orange-400" />
              <span>{'24x7 Support: 1800-890-SHOPPING'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Brand & Logo Bar */}
      <div className="glass-nav px-4 sm:px-8 py-3.5 sm:py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left section / Portal back button if in portal */}
          <div className="flex items-center gap-3">
            {currentPortal ? (
              <button
                onClick={() => onSelectPortal(null)}
                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-semibold text-xs sm:text-sm border border-slate-200 transition-all shadow-sm cursor-pointer group"
                id="btn-back-to-home"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-orange-500" />
                <span>{'← All 5 Portals'}</span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>{'Multi-Portal Ecosystem'}</span>
              </div>
            )}
          </div>

          {/* Centered Brand & Tagline as explicitly requested */}
          <div className="flex flex-col items-center justify-center text-center select-none cursor-pointer" onClick={() => onSelectPortal(null)}>
            <div className="inline-flex items-center group">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-poppins drop-shadow-sm flex items-center justify-center gap-2">
                <span className="text-[#0038A8]">Suriyawan</span>
                <span className="text-[#FF5500]">Shopping</span>
              </h1>
            </div>

            {/* Tagline directly beneath the logo */}
            <div className="mt-0.5 sm:mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/70 shadow-xs">
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span className="text-[11px] text-slate-600 font-sans">One Platform, All Services</span>
              </span>
            </div>
          </div>

          {/* Right Section: Quick Switcher / Cart / Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick dropdown for all 5 portals */}
            <div className="relative hidden md:block">
              <select
                value={currentPortal || ''}
                onChange={(e) => onSelectPortal(e.target.value ? (e.target.value as PortalId) : null)}
                className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-xs transition cursor-pointer appearance-none"
                aria-label="Select Portal"
              >
                <option value="">{'⚡ Quick Switch Portal'}</option>
                {PORTAL_LIST.map((portal) => (
                  <option key={portal.id} value={portal.id}>
                    {portal.nameEn}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>

            {/* Customer Cart trigger if any */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-2 sm:px-3 sm:py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm shadow-orange-500/20 cursor-pointer"
                id="btn-header-cart"
                title="Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">{'Cart'}</span>
                {cartCount > 0 && (
                  <span className="ml-1 bg-white text-orange-600 font-extrabold text-xs px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Active Portal Indicator Banner if inside a portal */}
        {activePortalData && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {'Active Portal:'}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                {activePortalData.nameEn}
              </span>
              <span className="hidden sm:inline text-slate-500">
                — {activePortalData.taglineEn}
              </span>
            </div>
            <button
              onClick={() => onSelectPortal(null)}
              className="text-orange-600 hover:text-orange-700 font-medium hover:underline cursor-pointer"
            >
              {'Back to Main Screen'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
