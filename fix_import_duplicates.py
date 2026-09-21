import re

with open('src/components/portals/ProductDetailModal.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('import { ChevronDown,'):
        if 'lucide-react' in line:
            # this is the one we want to keep ChevronDown in
            pass
        else:
            line = line.replace('import { ChevronDown, ', 'import { ')
    new_lines.append(line)

with open('src/components/portals/ProductDetailModal.tsx', 'w') as f:
    f.writelines(new_lines)

