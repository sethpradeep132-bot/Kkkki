import re
import os

filepath = 'src/components/portals/AdminPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Remove state and useEffect
target_state = "const [updateCounts, setUpdateCounts] = useState({ customer: 0, seller: 0, rider: 0, hub: 0, cluster: 0 });"
pattern_effect = r"useEffect\(\(\) => \{\s*if \(activeTab === \"Message & Approval\"\)[^{]*\{[^{]*supabase\.from\(\"announcement_and_update\"\)\.select\(\"\*\"\)\.then[^{]*\{[^}]*\}[^}]*\}[^}]*\}[^}]*\}[^}]*\}, \[activeTab\]\);"

content = content.replace(target_state, "")
content = re.sub(pattern_effect, "", content, flags=re.DOTALL)

# Remove badges from buttons
pattern_badges = r"\{updateCounts\.[a-z]+ > 0 && <span[^>]+>\{updateCounts\.[a-z]+\}<\/span>\}"
content = re.sub(pattern_badges, "", content)

with open(filepath, 'w') as f:
    f.write(content)

