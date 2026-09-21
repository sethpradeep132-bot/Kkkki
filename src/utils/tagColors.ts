const colorClasses = [
  'bg-red-600 text-white border-transparent',
  'bg-orange-600 text-white border-transparent',
  'bg-amber-600 text-white border-transparent',
  'bg-yellow-600 text-white border-transparent',
  'bg-lime-600 text-white border-transparent',
  'bg-green-600 text-white border-transparent',
  'bg-emerald-600 text-white border-transparent',
  'bg-teal-600 text-white border-transparent',
  'bg-cyan-600 text-white border-transparent',
  'bg-sky-600 text-white border-transparent',
  'bg-blue-600 text-white border-transparent',
  'bg-indigo-600 text-white border-transparent',
  'bg-violet-600 text-white border-transparent',
  'bg-purple-600 text-white border-transparent',
  'bg-fuchsia-600 text-white border-transparent',
  'bg-pink-600 text-white border-transparent',
  'bg-rose-600 text-white border-transparent',
  'bg-slate-600 text-white border-transparent',
  'bg-gray-600 text-white border-transparent',
  'bg-zinc-600 text-white border-transparent',
  'bg-neutral-600 text-white border-transparent',
  'bg-stone-600 text-white border-transparent'
];

export const getTagColor = (tagName: string) => {
  if (!tagName) return 'bg-slate-600 text-white border-transparent';
  const lower = tagName.toLowerCase();
  if (lower.includes('live')) return 'bg-green-600 text-white border-transparent';
  if (lower.includes('flash') || lower.includes('hot') || lower.includes('rush') || lower.includes('killer') || lower.includes('urgent')) return 'bg-red-600 text-white border-transparent';
  if (lower.includes('new') || lower.includes('latest') || lower.includes('fresh')) return 'bg-blue-600 text-white border-transparent';
  if (lower.includes('best') || lower.includes('top') || lower.includes('winner') || lower.includes('champion') || lower.includes('star')) return 'bg-yellow-600 text-white border-transparent';
  if (lower.includes('sale') || lower.includes('deal') || lower.includes('offer') || lower.includes('steal') || lower.includes('budget') || lower.includes('cheap')) return 'bg-orange-600 text-white border-transparent';
  if (lower.includes('premium') || lower.includes('luxury') || lower.includes('elite') || lower.includes('royal') || lower.includes('pro')) return 'bg-purple-600 text-white border-transparent';
  if (lower.includes('green') || lower.includes('eco') || lower.includes('organic') || lower.includes('natural') || lower.includes('healthy')) return 'bg-emerald-600 text-white border-transparent';
  if (lower.includes('trust') || lower.includes('safe') || lower.includes('verified') || lower.includes('genuine')) return 'bg-teal-600 text-white border-transparent';
  if (lower.includes('rare') || lower.includes('unique') || lower.includes('exclusive') || lower.includes('limited')) return 'bg-indigo-600 text-white border-transparent';
  if (lower.includes('love') || lower.includes('favourite') || lower.includes('cute')) return 'bg-pink-600 text-white border-transparent';
  
  // default mapping
  const hash = lower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorClasses[hash % colorClasses.length];
};
