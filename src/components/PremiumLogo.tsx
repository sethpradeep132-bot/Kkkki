import React from 'react';

export const PremiumLogo: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ssBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0038A8" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="ssOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
      <filter id="shadowLogo" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.1" />
      </filter>
    </defs>
    <rect width="120" height="120" rx="30" fill="#ffffff" filter="url(#shadowLogo)" />
    
    <text x="46" y="86" fontFamily="'Syne', 'Outfit', sans-serif" fontSize="76" fontWeight="800" textAnchor="middle" fill="url(#ssBlue)">S</text>
    <text x="74" y="86" fontFamily="'Syne', 'Outfit', sans-serif" fontSize="76" fontWeight="800" textAnchor="middle" fill="url(#ssOrange)">S</text>
  </svg>
);
