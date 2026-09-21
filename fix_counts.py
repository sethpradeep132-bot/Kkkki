import re

def fix_seller_dashboard(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    fetch_counts_code = """
  useEffect(() => {
    if (seller?.id) {
      supabase.from('announcement_and_update').select('*', {count: 'exact', head: true}).not('seller_update', 'is', null).neq('seller_update', '').then(({count}) => {
        if (count !== null) setUpdateCount(count);
      });
      supabase.from('chat_for_sellers').select('*', {count: 'exact', head: true}).eq('seller_id', seller.id).not('message', 'is', null).then(({count}) => {
        if (count !== null) setChatCount(count);
      });
    }
  }, [seller?.id]);
"""
    if "setChatCount(count);" not in content:
        # Check if states exist
        if "const [updateCount, setUpdateCount] = useState<number>(0);" not in content:
            content = content.replace("const [showRoleChatModal, setShowRoleChatModal] = useState(false);", 
                "const [showRoleChatModal, setShowRoleChatModal] = useState(false);\n  const [updateCount, setUpdateCount] = useState<number>(0);\n  const [chatCount, setChatCount] = useState<number>(0);")
        
        content = content.replace("const [showRoleChatModal, setShowRoleChatModal] = useState(false);\n  const [updateCount, setUpdateCount] = useState<number>(0);\n  const [chatCount, setChatCount] = useState<number>(0);", 
            "const [showRoleChatModal, setShowRoleChatModal] = useState(false);\n  const [updateCount, setUpdateCount] = useState<number>(0);\n  const [chatCount, setChatCount] = useState<number>(0);\n" + fetch_counts_code)

    with open(filepath, 'w') as f:
        f.write(content)

fix_seller_dashboard('src/components/portals/SellerDashboardView.tsx')
