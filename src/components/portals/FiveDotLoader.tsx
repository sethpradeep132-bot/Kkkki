import React from 'react';

export function FiveDotLoader({ colorClass = 'bg-blue-500' }: { colorClass?: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 h-full min-h-[40px]">
      {[0, 150, 300, 450, 600].map((delay, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full animate-bounce ${colorClass}`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}
