import re
import os

filepath = 'src/components/portals/ClusterPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add states
states_str = "  const [updateCount, setUpdateCount] = useState<number>(0);\n  const [chatCount, setChatCount] = useState<number>(0);"
if "const [updateCount" not in content:
    content = content.replace("const [clusterUserData, setClusterUserData] = useState<any>(null);", "const [clusterUserData, setClusterUserData] = useState<any>(null);\n" + states_str)

# Add useEffect for fetching counts
fetch_counts_code = """
  useEffect(() => {
    if (clusterUserData?.id) {
      supabase.from('announcement_and_update').select('*', {count: 'exact', head: true}).not('cluster_update', 'is', null).neq('cluster_update', '').then(({count}) => {
        if (count !== null) setUpdateCount(count);
      });
      supabase.from('chat_for_clusters').select('*', {count: 'exact', head: true}).eq('admin_id', clusterUserData.id).not('message', 'is', null).then(({count}) => {
        if (count !== null) setChatCount(count);
      });
    }
  }, [clusterUserData?.id]);
"""
if "setUpdateCount(count);" not in content:
    content = content.replace("const [clusterUserData, setClusterUserData] = useState<any>(null);\n" + states_str, "const [clusterUserData, setClusterUserData] = useState<any>(null);\n" + states_str + "\n" + fetch_counts_code)

# Add badges to UI
# For Suriyawan Shopping Update
target_1 = """<span className="text-xs sm:text-[13px] font-bold text-slate-900 block leading-tight truncate"> Suriyawan Shopping Update </span>"""
repl_1 = """<span className="text-xs sm:text-[13px] font-bold text-slate-900 block leading-tight truncate"> Suriyawan Shopping Update </span>
 {updateCount > 0 && <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCount}</span>}"""

content = content.replace(target_1, repl_1)

# Ensure the icon div has relative
target_icon_1 = """<div className="flex items-center justify-between w-full"> <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform"> <TrendingUp size={16} strokeWidth={2.2} /> </div>"""
repl_icon_1 = target_icon_1.replace('bg-slate-800', 'bg-slate-800 relative')
content = content.replace(target_icon_1, repl_icon_1)

# For Chat With Admin
target_2 = """<span className="text-xs sm:text-[13px] font-bold text-slate-900 block leading-tight truncate"> Chat With Admin </span>"""
repl_2 = """<span className="text-xs sm:text-[13px] font-bold text-slate-900 block leading-tight truncate"> Chat With Admin </span>
 {chatCount > 0 && <span className="absolute -top-1 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{chatCount}</span>}"""

content = content.replace(target_2, repl_2)

# Ensure the icon div has relative
target_icon_2 = """<div className="flex items-center justify-between w-full"> <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform"> <MessageSquare size={16} strokeWidth={2.2} /> </div>"""
repl_icon_2 = target_icon_2.replace('bg-slate-800', 'bg-slate-800 relative')
content = content.replace(target_icon_2, repl_icon_2)

with open(filepath, 'w') as f:
    f.write(content)

