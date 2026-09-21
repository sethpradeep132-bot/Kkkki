import re
import os

def fix_counts(filepath, update_col, chat_table, user_col):
    with open(filepath, 'r') as f:
        content = f.read()

    # We will look for supabase.from('announcement_and_update') inside a useEffect and replace it.
    
    # Let's find the useEffect that fetches updateCount and chatCount.
    # It usually looks like:
    # supabase.from('announcement_and_update').select...then(...)
    # supabase.from('...').select...then(...)
    
    # A robust way is to replace the whole block or just the lines.
    # Let's replace the .then(...) with async/await if needed, or just change the .then() to use head: true.
    # Actually, it's easier to just replace the select string and then callback.
    
    # Old pattern for announcement:
    # .select('id, seller_update').not('seller_update', 'is', null).then(({data}) => {
    #     if (data) setUpdateCount(data.filter((d: any) => d.seller_update && d.seller_update.trim() !== '').length);
    # });
    
    pattern_update = r"\.select\(([^)]+)\)\.not\('" + update_col + r"', 'is', null\)\.then\(\(\{data\}\) => \{[^}]*setUpdateCount\([^}]*\)[^}]*\}\);"
    new_update = f".select('*', {{count: 'exact', head: true}}).not('{update_col}', 'is', null).neq('{update_col}', '').then(({{count}}) => {{\n        if (count !== null) setUpdateCount(count);\n      }});"
    
    content = re.sub(pattern_update, new_update, content, flags=re.DOTALL)
    
    # Old pattern for chat:
    # .select('id, message').eq('seller_id', sellerData.id).not('message', 'is', null).then(({data}) => {
    #    if (data) setChatCount(data.length);
    # });
    
    pattern_chat = r"\.select\('[^']+'\)\.eq\('" + user_col + r"', [^)]+\)\.not\('message', 'is', null\)\.then\(\(\{data\}\) => \{[^}]*setChatCount\([^}]*\)[^}]*\}\);"
    # Let's be careful with what variable it uses for sellerData.id
    
    # Wait, we can just use regex substitution with groups.
    pattern_chat_group = r"(\.select\('[^']+'\)\.eq\('" + user_col + r"', ([^)]+)\)\.not\('message', 'is', null\))\.then\(\(\{data\}\) => \{[^}]*setChatCount\([^}]*\)[^}]*\}\);"
    
    def repl_chat(m):
        return f".select('*', {{count: 'exact', head: true}}).eq('{user_col}', {m.group(2)}).not('message', 'is', null).then(({{count}}) => {{\n        if (count !== null) setChatCount(count);\n      }});"
        
    content = re.sub(pattern_chat_group, repl_chat, content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)

fix_counts('src/components/portals/CustomerPortal.tsx', 'customer_update', 'chat_for_customers', 'customer_id')
fix_counts('src/components/portals/SellerDashboardView.tsx', 'seller_update', 'chat_for_sellers', 'seller_id')
fix_counts('src/components/portals/RiderDashboardView.tsx', 'rider_update', 'chat_for_riders', 'rider_id')
fix_counts('src/components/portals/HubDashboardView.tsx', 'hub_manager_update', 'chat_for_hub_managers', 'hub_manager_id')

