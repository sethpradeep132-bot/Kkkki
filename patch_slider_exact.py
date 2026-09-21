import sys

def patch():
    with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
        content = f.read()

    target = """ </div>
 
 </div>
 </div>
 )}
 {!isShopPage && activeTab !== 'Services' && activeTab !== 'Account' && activeTab !== 'Cart' && ("""
    
    replace_with = """ </div>
 </div>

 {/* Promotional Slider */}
 {activeCategory === 'All' && !viewAllTitle && (
   <div className="w-full px-2 mt-2 mb-1 relative">
     <div 
       ref={promoSliderRef}
       className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-xl shadow-sm border border-gray-100"
       style={{ scrollBehavior: 'smooth' }}
     >
       {PROMO_IMAGES.map((img, idx) => (
         <div key={idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100">
           <img src={img} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
         </div>
       ))}
     </div>
   </div>
 )}

 </div>
 )}
 {!isShopPage && activeTab !== 'Services' && activeTab !== 'Account' && activeTab !== 'Cart' && ("""
    
    # We may have whitespace issues, let's do a more robust replace
    import re
    # Using regex to find the exact block safely
    pattern = re.compile(r'</div>\s*</div>\s*</div>\s*\)}\s*\{!isShopPage && activeTab !== \'Services\' && activeTab !== \'Account\' && activeTab !== \'Cart\' && \(')
    
    if pattern.search(content):
        content = pattern.sub(replace_with, content)
        with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
            f.write(content)
        print("Patched successfully")
    else:
        print("Target block not found")

patch()
