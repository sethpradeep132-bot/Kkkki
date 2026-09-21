import re

def fix_premium_refresh(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the Premium Member block
    premium_regex = r"(\{\/\* Premium Member Glow \*\/\}\s*<div className=\"relative group inline-flex overflow-hidden rounded-full mt-1\">\s*<span className=\"[^\"]+\">\s*<span>👑<\/span> Premium Member\s*<\/span>\s*\{\/\* Smooth Shine Animation \*\/\}\s*<div className=\"[^\"]+\" \/>\s*<\/div>)"

    match = re.search(premium_regex, content)
    if match:
        old_block = match.group(1)
        # We need to wrap it in a flex container with the refresh button
        # Removing ' mt-1' from the inner div class, and adding it to wrapper.
        inner_div_fixed = old_block.replace('rounded-full mt-1"', 'rounded-full"')
        
        new_block = f"""<div className="flex items-center gap-2 mt-1">
                {inner_div_fixed}
                
                {{/* Refresh Button */}}
                <button onClick={{(e) => {{ e.stopPropagation(); handleDeepRefresh(); }}}} className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200" title="Refresh">
                  <RefreshCw size={{14}} className={{`text-gray-500 ${{isDeepRefreshing ? 'animate-spin' : ''}}`}} />
                </button>
              </div>"""
              
        content = content.replace(old_block, new_block)
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    else:
        print(f"Could not find premium block in {filepath}")

fix_premium_refresh('src/components/portals/RiderPortal.tsx')
fix_premium_refresh('src/components/portals/HubLogisticPortal.tsx')

