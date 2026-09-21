import re

# 1. AdminPortal.tsx
filepath = 'src/components/portals/AdminPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add RefreshCw import
if "RefreshCw" not in content[:1000]:
    content = content.replace("AlertTriangle, IndianRupee } from 'lucide-react';", "AlertTriangle, IndianRupee, RefreshCw } from 'lucide-react';")

# Replace header height
content = content.replace('h-12 sm:h-13', 'h-14 sm:h-16')

# Replace h1
target_h1 = """<h1 className="text-[13px] sm:text-sm font-bold text-slate-900 tracking-tight flex items-center whitespace-nowrap gap-1.5">
 SURIYAWAN SHOPPING Admin
 <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
 Console
 </span>
 </h1>"""
repl_h1 = """<h1 className="text-[13px] sm:text-sm font-bold text-slate-900 tracking-tight flex items-center min-w-0 gap-1.5">
 <span className="truncate">SURIYAWAN SHOPPING Admin</span>
 <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
 Console
 </span>
 </h1>"""
content = content.replace(target_h1, repl_h1)

# Add Refresh button
target_btn = """<button 
                              onClick={openAdminProfile}"""
repl_btn = """<button onClick={() => window.location.reload()} className="p-1.5 rounded-md hover:bg-indigo-100 transition-colors active:bg-indigo-200 text-indigo-600 border border-transparent hover:border-indigo-300" title="Refresh">
  <RefreshCw size={18} strokeWidth={2.5} />
</button>
<button 
                              onClick={openAdminProfile}"""
content = content.replace(target_btn, repl_btn)

with open(filepath, 'w') as f:
    f.write(content)

# 2. ClusterPortal.tsx
filepath = 'src/components/portals/ClusterPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace header height
content = content.replace('h-12 sm:h-13', 'h-14 sm:h-16')

# Replace h1
target_h1_cluster = """<h1 className="text-[13px] sm:text-sm font-bold text-slate-900 tracking-tight flex items-center whitespace-nowrap gap-1.5">
 Suriyawan Shopping Cluster
 <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 uppercase">
 Console
 </span>
 </h1>"""
repl_h1_cluster = """<h1 className="text-[13px] sm:text-sm font-bold text-slate-900 tracking-tight flex items-center min-w-0 gap-1.5">
 <span className="truncate">Suriyawan Shopping Cluster</span>
 <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 uppercase">
 Console
 </span>
 </h1>"""
content = content.replace(target_h1_cluster, repl_h1_cluster)

with open(filepath, 'w') as f:
    f.write(content)

