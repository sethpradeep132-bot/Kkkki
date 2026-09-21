import sys
import re

def patch():
    with open('src/components/portals/SellerPortal.tsx', 'r') as f:
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
    # Insert right after: const [activeTab, setActiveTab] = useState('Home');
    if 'const [activeTab, setActiveTab] = useState(\'Home\');' in content:
        content = content.replace("const [activeTab, setActiveTab] = useState('Home');", "const [activeTab, setActiveTab] = useState('Home');\n" + state_code, 1)

    # Replace title
    old_title = '''<span className="text-white">Suriyawan</span>
 <span className="text-white">Shopping</span>'''
    new_title = '''<span className="text-white">SURIYAWAN</span>
 <span className="text-white">SHOPPING</span>'''
    content = content.replace(old_title, new_title)
    
    # Another pattern possibility
    content = re.sub(r'<span className="text-white">Suriyawan</span>\s*<span className="text-white">Shopping</span>', new_title, content)

    # Add logo to right actions
    old_ra = '''{/* Right Actions */}
 <div className="flex items-center gap-0.5 text-white z-10">'''
    new_ra = '''{/* Right Actions */}
 <div className="flex items-center gap-0.5 text-white z-10">
 {headerLogo && <img src={headerLogo} alt="Logo" className="h-8 w-auto max-w-[60px] object-contain mr-1 bg-white/20 rounded p-0.5" />}'''
    content = content.replace(old_ra, new_ra)
    
    content = re.sub(r'\{\/\* Right Actions \*\/\}\s*<div className="flex items-center gap-0\.5 text-white z-10">', new_ra, content)


    with open('src/components/portals/SellerPortal.tsx', 'w') as f:
        f.write(content)

patch()
