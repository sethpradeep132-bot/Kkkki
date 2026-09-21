import re

filepath = 'src/components/portals/ClusterPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add badge for Shopping Update
target_icon_1 = '<div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">\n <TrendingUp size={16} strokeWidth={2.2} />\n </div>'
repl_icon_1 = '<div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 relative text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">{updateCount > 0 && <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCount}</span>}\n <TrendingUp size={16} strokeWidth={2.2} />\n </div>'
content = content.replace(target_icon_1, repl_icon_1)

# Add badge for Chat With Admin
target_icon_2 = '<div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">\n <MessageSquare size={16} strokeWidth={2.2} />\n </div>'
repl_icon_2 = '<div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 relative text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">{chatCount > 0 && <span className="absolute -top-1 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{chatCount}</span>}\n <MessageSquare size={16} strokeWidth={2.2} />\n </div>'
content = content.replace(target_icon_2, repl_icon_2)

with open(filepath, 'w') as f:
    f.write(content)

