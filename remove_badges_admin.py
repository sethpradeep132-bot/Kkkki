import re
filepath = 'src/components/portals/AdminPortal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Pattern to remove {updateCounts.xxx > 0 && <span ...>{updateCounts.xxx}</span>}
pattern_badges = r"\{updateCounts\.[a-z]+ > 0 && <span[^>]+>\{updateCounts\.[a-z]+\}<\/span>\}"
content = re.sub(pattern_badges, "", content)

with open(filepath, 'w') as f:
    f.write(content)

