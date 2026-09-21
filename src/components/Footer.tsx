import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Heart, 
  Headphones, 
  MapPin, 
  Award, 
  Globe2,
  Layers
} from 'lucide-react';
import { PortalId } from '../types';

interface FooterProps {
  onSelectPortal: (id: PortalId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectPortal }) => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 pt-14 pb-10 px-4 sm:px-8 border-t border-slate-800 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Top enterprise trust strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">
                {'100% Secure Payments'}
              </h5>
              <p className="text-[11px] text-slate-400">UPI, NetBanking, RuPay & COD</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">
                {'100% Verified Quality'}
              </h5>
              <p className="text-[11px] text-slate-400">Direct From Suriyawan & Local Farms</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">
                {'15-30 Min Fast Delivery'}
              </h5>
              <p className="text-[11px] text-slate-400">Smart GPS Route Optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">
                {'24x7 Dedicated Support'}
              </h5>
              <p className="text-[11px] text-slate-400">1800-890-SHOPPING</p>
            </div>
          </div>
        </div>

        {/* Brand columns and navigation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-orange-500 flex items-center justify-center text-white font-stylish font-extrabold text-xl shadow-lg border border-white/10">
                SS
              </div>
              <span className="text-2xl font-extrabold font-stylish tracking-tighter text-white">
                Suriyawan <span className="text-orange-400">Shopping</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-devanagari">
              "One Platform, All Services" — The premier integrated e-commerce and smart logistics ecosystem powering consumers, verified merchants, regional distribution hubs, and delivery fleets.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Suriyawan Central Hub, District Bhadohi, Uttar Pradesh, PIN - 221402</span>
            </div>
          </div>

          {/* All 5 Portals direct jumping list */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>{'Explore All 5 Portals'}</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onSelectPortal('customer')}
                  className="hover:text-orange-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span>1. 🛒 Customer Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPortal('seller')}
                  className="hover:text-orange-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span>2. 🏪 Seller Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPortal('hub')}
                  className="hover:text-orange-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span>3. 🏢 Hub Logistic Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPortal('rider')}
                  className="hover:text-orange-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span>4. 🚚 Rider Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPortal('admin')}
                  className="hover:text-orange-400 transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span>5. 👑 Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {'Trust & Compliance'}
            </h4>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div>• GST & FSSAI Certified Commerce</div>
              <div>• ISO 9001:2015 Quality Logistics</div>
              <div>• 256-Bit SSL Encrypted Banking</div>
              <div>• 100% Refund & Easy Return Guarantee</div>
              <div>• Made with pride for Suriyawan & India 🇮🇳</div>
            </div>
          </div>
        </div>

        {/* Exact Copyright line as strictly requested in prompt: */}
        {/* "Copyright: © Suriyawan Shopping. All Rights Reserved." */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="font-semibold text-slate-300">
            © Suriyawan Shopping. All Rights Reserved.
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-white transition cursor-pointer">
              {'Privacy Policy'}
            </span>
            <span>•</span>
            <span className="hover:text-white transition cursor-pointer">
              {'Terms of Service'}
            </span>
            <span>•</span>
            <span className="hover:text-white transition cursor-pointer">
              {'Security & Trust'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
