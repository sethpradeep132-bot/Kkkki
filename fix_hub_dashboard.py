import re

def fix_hub_dashboard(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    fetch_counts_code = """
  useEffect(() => {
    if (hubManager?.id) {
      supabase.from('announcement_and_update').select('*', {count: 'exact', head: true}).not('hub_manager_update', 'is', null).neq('hub_manager_update', '').then(({count}) => {
        if (count !== null) setUpdateCount(count);
      });
      supabase.from('chat_for_hub_managers').select('*', {count: 'exact', head: true}).eq('hub_manager_id', hubManager.id).not('message', 'is', null).then(({count}) => {
        if (count !== null) setChatCount(count);
      });
    }
  }, [hubManager?.id]);
"""
    if "setChatCount(count);" not in content:
        content = content.replace("const [chatCount, setChatCount] = useState<number>(0);", 
            "const [chatCount, setChatCount] = useState<number>(0);\n" + fetch_counts_code)

    # Fix the missing onClick
    content = content.replace('<button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">\n <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 relative">{chatCount > 0',
                              '<button onClick={() => setShowRoleChatModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">\n <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 relative">{chatCount > 0')

    with open(filepath, 'w') as f:
        f.write(content)

fix_hub_dashboard('src/components/portals/HubDashboardView.tsx')
