import re

with open('src/components/portals/RiderPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace('ml-1">Rider</span>', 'ml-1">Work Flow</span>')

with open('src/components/portals/RiderPortal.tsx', 'w') as f:
    f.write(content)


with open('src/components/portals/HubLogisticPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace('ml-1">Hub Manager</span>', 'ml-1">Management</span>')

with open('src/components/portals/HubLogisticPortal.tsx', 'w') as f:
    f.write(content)

