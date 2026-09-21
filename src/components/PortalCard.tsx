import React from 'react';
import { 
  ShoppingCart, 
  Store, 
  Building2, 
  Truck, 
  Crown, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { PortalItem } from '../types';

interface PortalCardProps {
  portal: PortalItem;
  onOpenPortal: (id: PortalItem['id']) => void;
  index: number;
}

export const PortalCard: React.FC<PortalCardProps> = ({
  portal,
  onOpenPortal,
  index,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingCart':
        return <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8" />;
      case 'Store':
        return <Store className="w-7 h-7 sm:w-8 sm:h-8" />;
      case 'Building2':
        return <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />;
      case 'Truck':
        return <Truck className="w-7 h-7 sm:w-8 sm:h-8" />;
      case 'Crown':
        return <Crown className="w-7 h-7 sm:w-8 sm:h-8" />;
      default:
        return <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />;
    }
  };

  const isOrangeAccent = portal.id === 'seller' || portal.id === 'rider';
  const isCrownAccent = portal.id === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => onOpenPortal(portal.id)}
      id={`portal-card-${portal.id}`}
      className="group relative h-full flex flex-col justify-between p-6 sm:p-7 rounded-3xl glass-card glass-card-hover cursor-pointer transition-all duration-300 border border-slate-200/90 hover:border-orange-400/60 shadow-lg hover:shadow-2xl overflow-hidden select-none"
    >
      {/* Decorative ambient corner glow */}
      <div 
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none"
        style={{ backgroundColor: portal.accentColor }}
      />

      {/* Top row: Order Number chip, Icon & Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-5">
          {/* Glowing Icon Container */}
          <div className="relative">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300"
              style={{
                background: `linear-gradient(135deg, ${portal.accentColor}, #0f172a)`,
                boxShadow: `0 8px 20px -4px ${portal.glowColor}`,
              }}
            >
              {getIcon(portal.iconName)}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-white text-slate-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
              #{portal.orderNumber}
            </span>
          </div>

          {/* Special badge / Offer Pill */}
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full border shadow-xs transition ${
              isOrangeAccent 
                ? 'bg-orange-50 text-orange-700 border-orange-200 group-hover:bg-orange-500 group-hover:text-white' 
                : isCrownAccent
                ? 'bg-purple-50 text-purple-700 border-purple-200 group-hover:bg-purple-600 group-hover:text-white'
                : 'bg-sky-50 text-sky-700 border-sky-200 group-hover:bg-sky-600 group-hover:text-white'
            }`}>
              <Zap className="w-3 h-3" />
              {portal.badgeEn}
            </span>
            <span className="text-[10px] font-medium text-slate-600 tracking-wider uppercase">
              {portal.targetRole.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Portal Title & Sequence */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors font-brand">
              {portal.nameEn}
            </h3>
          </div>

          {/* 1-Line concise description as requested */}
          <p className="text-slate-600 text-sm leading-relaxed font-normal min-h-[42px] line-clamp-2">
            {portal.descriptionEn}
          </p>
        </div>

        {/* Key Features Quick Chips */}
        <div className="mt-4 pt-4 border-t border-slate-100/90 space-y-2">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-500" />
            <span>{'Key Portal Capabilities'}</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {portal.featuresEn.slice(0, 2).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer with Quick Metric & Action button */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 truncate">
          {portal.keyStatsEn.split('•')[0]}
        </div>

        {/* Enter Portal Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenPortal(portal.id);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md group-hover:shadow-lg cursor-pointer shrink-0"
          style={{
            background: isOrangeAccent 
              ? 'linear-gradient(135deg, #f97316, #ea580c)' 
              : isCrownAccent
              ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
              : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          }}
        >
          <span>{'Enter Portal'}</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
