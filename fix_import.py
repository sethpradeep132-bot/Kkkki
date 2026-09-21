import re

with open('src/components/portals/ProductDetailModal.tsx', 'r') as f:
    content = f.read()

if 'ChevronDown' not in content:
    content = content.replace('import { X, Star, ShoppingBag, Plus, Minus, Info, Search, Truck, Zap, Share2, Heart, ExternalLink, ShieldCheck } from \'lucide-react\';',
                              'import { X, Star, ShoppingBag, Plus, Minus, Info, Search, Truck, Zap, Share2, Heart, ExternalLink, ShieldCheck, ChevronDown } from \'lucide-react\';')
    
    # Try alternate pattern
    content = content.replace('import { ', 'import { ChevronDown, ')

with open('src/components/portals/ProductDetailModal.tsx', 'w') as f:
    f.write(content)

