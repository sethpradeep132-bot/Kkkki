import sys
import re

def patch():
    with open('src/components/portals/ClusterPortal.tsx', 'r') as f:
        content = f.read()

    state_code = """  const [headerLogo, setHeaderLogo] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ss_customer_additional_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
      }
    } catch (e) {}
  }, []);
"""
    if 'const [activeTab, setActiveTab] = useState(\'Dashboard\');' in content:
        content = content.replace("const [activeTab, setActiveTab] = useState('Dashboard');", "const [activeTab, setActiveTab] = useState('Dashboard');\n" + state_code, 1)

    new_title = '''<span className="text-pink-600">SURIYAWAN</span> <span className="text-black">SHOPPING</span>'''
    content = re.sub(r'<span className="text-pink-600">Suriyawan</span> <span className="text-black">Shopping</span>', new_title, content)

    # Add logo to right actions
    new_ra = '''{/* Right Actions */}
          <div className="flex items-center gap-1 z-10">
            {headerLogo && <img src={headerLogo} alt="Logo" className="h-8 w-auto max-w-[60px] object-contain mr-1 rounded" />}'''
            
    content = re.sub(r'\{\/\* Right Actions \*\/\}\s*<div className="flex items-center gap-1 z-10">', new_ra, content)

    with open('src/components/portals/ClusterPortal.tsx', 'w') as f:
        f.write(content)

patch()
