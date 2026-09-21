with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

bad_string = """   </div>
)} 
 )}
{!isShopPage"""

good_string = """   </div>
)}
{!isShopPage"""

content = content.replace(bad_string, good_string)

with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
    f.write(content)
