import re

with open('src/components/portals/AdminPortal.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "}, 500);" in line and "handleMarkAsSettled(userId);" in lines[i-1]:
        lines[i] = "" # remove }, 500);
    if "handleMarkAsSettled(userId);" in line and "if (secureTxSettingsRef.current.autoSettlement)" in lines[i-1]:
        pass # this is fine, but it used to have setTimeout

# We also need to fix 6947: setTimeout(() => { ... }, 2000);
# Let's see what is around 6947.
