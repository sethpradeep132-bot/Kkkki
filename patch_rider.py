import sys
import re

def patch():
    with open('src/components/portals/RiderPortal.tsx', 'r') as f:
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
    if 'const [activeTab, setActiveTab] = useState(\'Home\');' in content:
        content = content.replace("const [activeTab, setActiveTab] = useState('Home');", "const [activeTab, setActiveTab] = useState('Home');\n" + state_code, 1)

    # Replace title
    new_title = '''<span className="text-emerald-600">SURIYAWAN</span> <span className="text-black">SHOPPING</span>'''
    content = re.sub(r'<span className="text-emerald-600">Suriyawan</span> <span className="text-black">Shopping</span>', new_title, content)

    # Add logo to right actions
    old_ra = '''{/* Right Actions */}
          <div className="flex items-center gap-1">'''
    new_ra = '''{/* Right Actions */}
          <div className="flex items-center gap-1">
            {headerLogo && <img src={headerLogo} alt="Logo" className="h-8 w-auto max-w-[60px] object-contain mr-1 rounded" />}'''
    content = content.replace(old_ra, new_ra)
    
    # Try Regex if above fails
    content = re.sub(r'\{\/\* Right Actions \*\/\}\s*<div className="flex items-center gap-1">', new_ra, content)

    with open('src/components/portals/RiderPortal.tsx', 'w') as f:
        f.write(content)

patch()
