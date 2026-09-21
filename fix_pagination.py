import re

with open('src/components/portals/ProductDetailModal.tsx', 'r') as f:
    content = f.read()

# 1. Add state for visible reviews
import_pattern = r"const \[selectedImageIndex, setSelectedImageIndex\] = useState\(0\);"
if import_pattern in content:
    content = content.replace(import_pattern, import_pattern + "\n  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);")
else:
    # Just in case, try adding it near the top of the component
    comp_start = r"export const ProductDetailModal: React.FC<ProductDetailModalProps> = \(\{.*?\}\) => \{"
    match = re.search(comp_start, content, re.DOTALL)
    if match:
        content = content[:match.end()] + "\n  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);" + content[match.end():]

# 2. Update first reviews section (lines around 1060-1080)
old_reviews = r"""\{productRatings\.length > 0 \? \(
          <div className="flex flex-col gap-3">
            \{productRatings\.map\(\(rating, idx\) => \(""".replace('\\', '\\\\')

old_reviews = """{productRatings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {productRatings.map((rating, idx) => ("""

new_reviews = """{productRatings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {productRatings.slice(0, visibleReviewsCount).map((rating, idx) => ("""
content = content.replace(old_reviews, new_reviews)

# Update "View More" for first block
old_end_reviews = """            ))}
          </div>
        ) : ("""

new_end_reviews = """            ))}
            {productRatings.length > visibleReviewsCount && (
              <button 
                onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                className="w-full py-2 flex flex-col items-center justify-center text-blue-600 font-semibold text-xs mt-2"
              >
                <span>View More</span>
                <ChevronDown size={16} className="mt-1" />
              </button>
            )}
          </div>
        ) : ("""
content = content.replace(old_end_reviews, new_end_reviews)


# 3. Update second reviews section (around 1830)
old_reviews_2 = """<div className="space-y-3">
            {productRatings.map((rating, idx) => {"""
new_reviews_2 = """<div className="space-y-3">
            {productRatings.slice(0, visibleReviewsCount).map((rating, idx) => {"""
content = content.replace(old_reviews_2, new_reviews_2)

old_end_reviews_2 = """              );
            })}
          </div>
        </div>
      )}"""
new_end_reviews_2 = """              );
            })}
            {productRatings.length > visibleReviewsCount && (
              <button 
                onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                className="w-full py-2 flex flex-col items-center justify-center text-blue-600 font-semibold text-xs mt-2"
              >
                <span>View More</span>
                <ChevronDown size={16} className="mt-1" />
              </button>
            )}
          </div>
        </div>
      )}"""
content = content.replace(old_end_reviews_2, new_end_reviews_2)


with open('src/components/portals/ProductDetailModal.tsx', 'w') as f:
    f.write(content)

