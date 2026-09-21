import React, { useState } from 'react';
import { Eye, Edit3, Trash2, Box, Check, X, Pencil, ShoppingCart, Star, MoreHorizontal } from 'lucide-react';
import { SupabaseProduct } from '../../types/product';
import { categoryData } from '../../categories';
import { getTagColor } from '../../utils/tagColors';

interface ProductCardProps {
  isInCart?: boolean;
  onAddToCart?: (product: SupabaseProduct) => void;
  isCustomerView?: boolean;
  isHorizontalList?: boolean;
  isFlashSale?: boolean;
  isLiveSaleActive?: boolean;
  product: SupabaseProduct;
  status: 'Active' | 'Inactive' | 'Draft';
  showDelete?: boolean;
  isInventoryMode?: boolean;
  onSelectImage: (product: SupabaseProduct) => void;
  onUpdateStock?: (productId: string, newStock: string) => Promise<void>;
  onEdit?: (product: SupabaseProduct) => void;
  onDelete?: (productId: string, status?: string) => Promise<void>;
}


// Basic Countdown Timer for Flash Sale
const FlashTimer = ({ durationStr, createdAt }: { durationStr?: string; createdAt?: string }) => {
  const [timeLeft, setTimeLeft] = React.useState({ h: 0, m: 0, s: 0 });
  
  React.useEffect(() => {
    // Try to parse duration string. If it's a number (hours) or HH:MM format
    let totalSeconds = 24 * 3600; // default 24h
    if (durationStr) {
      if (durationStr.includes(':')) {
        const parts = durationStr.split(':');
        totalSeconds = (parseInt(parts[0])||0)*3600 + (parseInt(parts[1])||0)*60 + (parseInt(parts[2])||0);
      } else {
        const num = parseFloat(durationStr);
        if (!isNaN(num)) totalSeconds = num * 3600;
      }
    }
    
    
    // Use createdAt as deterministic offset, fallback to startOfDay
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const offsetSeed = createdAt ? new Date(createdAt).getTime() : startOfDay;
    const elapsed = Math.floor((now.getTime() - offsetSeed) / 1000);

    let remaining = totalSeconds - (elapsed % totalSeconds);

    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining < 0) remaining = totalSeconds;
      setTimeLeft({
        h: Math.floor(remaining / 3600),
        m: Math.floor((remaining % 3600) / 60),
        s: remaining % 60
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [durationStr]);

  return (
    <div className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10">
      <span className="animate-pulse">⏳</span>
      {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
    </div>
  );
};


const formatViewsCount = (value: any): string => {
  if (!value) return '0';
  const num = parseInt(value?.toString() || '0', 10);
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
  return num.toString();
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  status,
  showDelete = false,
  isInventoryMode = false,
  isCustomerView = false,
  isHorizontalList = false,
  isFlashSale = false,
  isLiveSaleActive = false,
  onSelectImage,
  onUpdateStock,
  onEdit,
  onDelete, isInCart, onAddToCart}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [stockInput, setStockInput] = useState(product.available_stock || '0');
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);

  React.useEffect(() => {
    if (isCustomerView && product.id) {
       const fetchRating = async () => {
          try {
             const { supabase } = await import('../../lib/supabase');
             const { data } = await supabase.from('product_rating').select('"rating star"').eq('product id', product.id);
             if (data && data.length > 0) {
                let sum = 0;
                let count = 0;
                data.forEach(r => {
                   const s = Number(r['rating star']);
                   if (s > 0) { sum += s; count++; }
                });
                if (count > 0) {
                   setAvgRating(Math.round(sum / count));
                   setRatingCount(count);
                }
             }
          } catch(e) {}
       };
       fetchRating();
    }
  }, [product.id, isCustomerView]);

  let parsedImages = product['product images'];
  if (typeof parsedImages === 'string') {
    if (parsedImages.includes('|||')) {
      parsedImages = parsedImages.split('|||');
    } else {
      try {
        parsedImages = JSON.parse(parsedImages);
      } catch(e) {}
    }
  }
  const images = (Array.isArray(parsedImages) && parsedImages.length > 0)
    ? parsedImages
    : (typeof parsedImages === 'string' && parsedImages.trim() !== '') ? [parsedImages] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];

  const mainImage = images[0];

  const mainCategoryObj = categoryData.find(c => c.id === product['main category']);
  const mainCategoryName = mainCategoryObj?.name || product['main category'] || 'General';
  const middleCategoryObj = mainCategoryObj?.middle?.find(m => m.id === product['middle category']);
  const middleCategoryName = middleCategoryObj?.name || product['middle category'] || '';
  const subCategoryObj = middleCategoryObj?.sub?.find(s => s.id === product['sub category']);
  const subCategoryName = subCategoryObj?.name || product['sub category'] || '';

  const tags = product.tags || [];
  const categoryTags = product['category tags'] || [];

  const stockNum = parseInt(product.available_stock || '0', 10);
  const parseAmt = (val: any) => parseFloat(String(val || '0').replace(/[^0-9.]/g, '')) || 0;
  
  const sellingPrice = parseAmt(product['selling price']);
  const marketValue = parseAmt(product['price info']);
  const discountVal = parseAmt(product['discount %']);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmYes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(product.id, status);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleConfirmNo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  const handleSaveStock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateStock) return;
    setIsSavingStock(true);
    try {
      await onUpdateStock(product.id, stockInput);
      setIsEditingStock(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingStock(false);
    }
  };

  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInCart && onAddToCart) {
      setIsAddingToCart(true);
      await onAddToCart(product);
      setIsAddingToCart(false);
    }
  };

  return (
    <div 
      className={`w-full bg-white rounded-sm border border-slate-200/90 hover:border-orange-400/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-4px_rgba(249,115,22,0.12)] transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer ${isHorizontalList ? 'min-h-[110px]' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelectImage(product); }}
    >
      {/* Top Header Strip: SKU Code + Category Breadcrumb + Status Pill */}
      {!isCustomerView && (
      <div className="px-3.5 py-1.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 truncate min-w-0 max-w-[70%]">
          <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[11px] border border-orange-200/70 shrink-0">
            {product['product_sku_code'] || 'NO-SKU'}
          </span>
          <span className="text-slate-300 font-bold">·</span>
          <span className="text-slate-600 font-semibold truncate text-xs">
            {subCategoryName || middleCategoryName || mainCategoryName}
          </span>
        </div>

        {/* Status Pill with indicator dot */}
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 border shadow-2xs ${
          status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
            : status === 'Inactive'
            ? 'bg-rose-50 text-rose-700 border-rose-200/80'
            : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            status === 'Active' ? 'bg-emerald-500 ring-2 ring-emerald-300/50' : status === 'Inactive' ? 'bg-rose-500' : 'bg-indigo-500'
          }`} />
          <span>{status === 'Active' ? 'Active' : status === 'Inactive' ? 'Inactive' : 'Draft'}</span>
        </span>
      </div>
      )}

      {/* Main Card Body: Vertical for Customer, Horizontal for Seller */}
      {isCustomerView ? (
        <div className={`flex flex-col w-full h-full`}>
          {/* Customer View: Aspect 4:5 Image */}
          <div 
            onClick={() => onSelectImage(product)}
            className={`relative overflow-hidden bg-slate-50 shrink-0 select-none group/img cursor-pointer w-full aspect-[4/5]`}
          >
            <img 
              src={mainImage} 
              alt={product['product name']} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
              {categoryTags && categoryTags.length > 0 && categoryTags.map((tag, idx) => {
                const colorClass = getTagColor(tag);
                return (
                  <div key={`ct-${idx}`} className={`${colorClass} font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg max-w-[120px] truncate`}>
                    {tag}
                  </div>
                );
              })}
              {tags && tags.length > 0 && tags.map((tag, idx) => {
                const colorClass = getTagColor(tag);
                return (
                  <div key={`t-${idx}`} className={`${colorClass} font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg max-w-[120px] truncate`}>
                    {tag}
                  </div>
                );
              })}
            </div>
            
            {/* Live Sale Dot */}
            {isLiveSaleActive && (
              <div className="absolute top-2 right-2 flex items-center justify-center z-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.7)] border border-white/60"></span>
                </span>
              </div>
            )}
            
            {isFlashSale && <FlashTimer durationStr={product['time duration']} createdAt={product.created_at} />}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-2xs text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs z-10">
                {images.length} 📷
              </div>
            )}
            
          </div>
          {/* Customer View: Details below image */}
          <div className="flex flex-col justify-center min-w-0 p-2 gap-1.5 border-t border-slate-100 flex-1">
            <div className="flex justify-between items-start gap-1">
              <div className="flex flex-col min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors leading-tight">
                  {product['product name']}
                </h3>
                {product['product title name'] && (
                  <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium leading-tight">
                    {product['product title name']}
                  </p>
                )}
              </div>
              {isCustomerView && avgRating > 0 && (
                <div className="flex items-center gap-0.5 shrink-0 bg-yellow-50 px-1 py-0.5 rounded border border-yellow-100">
                  <span className="text-[10px] text-yellow-500">★</span>
                  <span className="text-[10px] font-bold text-yellow-700">{avgRating.toFixed(1)}</span>
                  <span className="text-[9px] text-yellow-600 font-medium">({ratingCount >= 1000 ? new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(ratingCount).toLowerCase() : ratingCount})</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between w-full mt-auto">
              <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap overflow-hidden">
                <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  ₹ {sellingPrice.toFixed(0)}
                </span>
                {marketValue > 0 && (
                  <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                    ₹ {marketValue.toFixed(0)}
                  </span>
                )}
                {discountVal > 0 && (
                  <span className="text-[10px] sm:text-xs font-black text-emerald-600">
                    {product['discount %'] || '0'}% OFF
                  </span>
                )}
              </div>
              <button 
                className={`p-1 flex items-center justify-center transition-all shrink-0 ml-1 active:scale-95 ${isInCart ? 'text-gray-400 cursor-default' : 'text-blue-600 hover:text-blue-700'}`}
                onClick={handleAddToCartClick}
                disabled={isInCart || isAddingToCart}
              >
                {isAddingToCart ? (
                  <MoreHorizontal size={16} className="animate-pulse" />
                ) : (
                  <ShoppingCart size={16} className={!isInCart ? "fill-blue-600" : ""} />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="p-1.5 sm:p-2 flex items-center gap-2">
        {/* Left: Product Image Box (Medium size) */}
        <div 
          onClick={() => onSelectImage(product)}
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-50 border border-slate-200/80 shrink-0 select-none group/img shadow-2xs cursor-pointer"
        >
          <img 
            src={mainImage} 
            alt={product['product name']} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Details Overlay on Hover */}
          {status && status.toLowerCase() !== 'inactive' && (
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold gap-0.5 backdrop-blur-2xs">
              <Eye size={12} />
            </div>
          )}

          {isCustomerView && isFlashSale && <FlashTimer durationStr={product['time duration']} createdAt={product.created_at} />}
          {images.length > 1 && (
            <div className="absolute bottom-0.5 right-0.5 bg-black/75 backdrop-blur-2xs text-white text-[8px] font-black px-1 py-px rounded shadow-2xs">
              {images.length} 📷
            </div>
          )}
        </div>

        {/* Right: Exact Specified Flow (Title -> Price Row in 1 Line -> Details/Edit/Stock Row) */}
        <div className="flex-1 flex flex-col justify-center min-w-0 gap-1 py-0.5">
          {/* 1. Product Name & Product Title Name (Small font size) */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors leading-tight">
                {product['product name']}
              </h3>
              {!isCustomerView && (
                <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded shadow-2xs border border-blue-100 shrink-0">
                  <Eye size={10} className="text-blue-500" />
                  <span className="text-[9px] font-black text-blue-700">{formatViewsCount(product.wives)}</span>
                </div>
              )}
            </div>
            {product['product title name'] && (
              <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium leading-tight">
                {product['product title name']}
              </p>
            )}
            {isCustomerView && avgRating > 0 && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className={`text-[10px] ${star <= avgRating ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                ))}
              </div>
            )}
          </div>

          {/* 2. Single Line: Selling Price + Price Info (Market MRP) + Discount % (Small font size) */}
          <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap overflow-hidden">
            <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              ₹ {sellingPrice.toFixed(0)}
            </span>
            {marketValue > 0 && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                ₹ {marketValue.toFixed(0)}
              </span>
            )}
            {discountVal > 0 && (
              <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-px rounded border border-emerald-200/80">
                {product['discount %']}% OFF
              </span>
            )}
          </div>

          {/* 3. Bottom Row: Details, Edit and Edit Stock Buttons all together in the same line */}
          {!isCustomerView && isInventoryMode && product['product code'] && (
            <div className="w-full flex items-center justify-between mt-1 px-1 py-1 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-[10px] font-bold text-slate-500">Product Code:</span>
                <span className="text-[11px] font-black text-slate-800 tracking-wide">{product['product code']}</span>
            </div>
          )}

          {!isCustomerView && ((!isInventoryMode && status) || showDelete) && (
            <div 
              className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 mt-1 w-full overflow-x-auto no-scrollbar pb-0.5"
              onClick={e => e.stopPropagation()}
            >
              {!isInventoryMode && status && (
                <>
                {/* Details Button */}
                <button
                  onClick={() => onSelectImage(product)}
                  className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer min-w-max px-2"
                  title="View Full Product Details"
                >
                  <Eye size={11} className="text-slate-500" />
                  <span>Details</span>
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => onEdit(product)}
                  className="flex-1 py-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-md text-[10px] font-bold flex justify-center items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer min-w-max px-2"
                  title={status === 'Draft' ? 'Resume Draft' : 'Edit Product'}
                >
                  <Edit3 size={11} />
                  <span>{status === 'Draft' ? 'Resume' : 'Edit'}</span>
                </button>

                {/* Edit Stock Button */}
                {isEditingStock ? (
                  <div className="flex-1 flex items-center justify-center gap-1 bg-amber-50/90 p-0.5 rounded-md border border-amber-300 shadow-inner animate-in fade-in zoom-in-95 duration-150 min-w-max px-1">
                    <span className="text-[9px] font-bold text-amber-900 pl-0.5">Stock:</span>
                    <input
                      type="number"
                      min="0"
                      value={stockInput}
                      onChange={e => setStockInput(e.target.value)}
                      className="w-8 px-1 py-px bg-white text-[10px] font-black text-center border border-amber-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-950"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveStock}
                      disabled={isSavingStock}
                      className="p-0.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-sm cursor-pointer transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save Stock"
                    >
                      <Check size={10} />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingStock(false);
                        setStockInput(product.available_stock || '0');
                      }}
                      className="p-0.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-sm cursor-pointer transition-all"
                      title="Cancel"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setStockInput(product.available_stock || '0');
                      setIsEditingStock(true);
                    }}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer border-2 bg-white min-w-max px-2 ${
                      stockNum === 0 
                        ? 'border-rose-400 text-rose-600 hover:bg-rose-50' 
                        : stockNum <= 5 
                        ? 'border-amber-400 text-amber-600 hover:bg-amber-50' 
                        : 'border-blue-400 text-blue-600 hover:bg-blue-50'
                    }`}
                    title="Click to Edit Stock"
                  >
                    <Box size={11} className={stockNum === 0 ? 'text-rose-500' : stockNum <= 5 ? 'text-amber-500' : 'text-blue-500'} />
                    <span>Stock: {stockNum}</span>
                    <Pencil size={9} className="opacity-70 ml-0.5" />
                  </button>
                )}
              </>
            )}

            {/* Delete Button (Inventory Mode) */}
            {showDelete && (
              <div className="ml-auto shrink-0 flex items-center justify-center min-w-[64px]">
                {isDeleting ? (
                  <button
                    disabled
                    className="px-2 py-1 w-full bg-rose-50 text-rose-600 border border-rose-200 rounded-md text-[10px] font-bold shadow-2xs flex items-center justify-center"
                  >
                    <span className="flex items-center">
                      Deleting
                      <span className="flex gap-0.5 items-center ml-0.5">
                        <span className="w-0.5 h-0.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-0.5 h-0.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-0.5 h-0.5 bg-current rounded-full animate-bounce"></span>
                      </span>
                    </span>
                  </button>
                ) : showConfirm ? (
                  <div className="flex items-center gap-1 bg-rose-100 p-0.5 rounded-md border border-rose-300 shadow-inner animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[9px] font-bold text-rose-900 pl-1">Sure?</span>
                    <button
                      onClick={handleConfirmYes}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[9px] font-bold rounded-sm cursor-pointer transition-all"
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleConfirmNo}
                      className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-95 text-[9px] font-bold rounded-sm cursor-pointer transition-all"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDeleteClick}
                    className="px-2 py-1 w-full bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200 rounded-md text-[10px] font-bold transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
                    title="Delete Product (Inventory Mode)"
                  >
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
