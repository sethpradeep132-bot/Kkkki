import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Box, Plus, CheckCircle2, PackageCheck, ArrowLeft } from 'lucide-react';
import { SupabaseProduct } from '../../types/product';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';

interface SellerProductsViewProps {
 onOpenUpload: () => void;
 onEditProduct: (product: SupabaseProduct, mode: 'edit_active' | 'edit_inactive' | 'edit_draft') => void;
}

export const SellerProductsView: React.FC<SellerProductsViewProps> = ({
 onOpenUpload,
 onEditProduct,
}) => {
 // viewMode can be 'standard' (3 tabs: Active, Inactive, Draft) or 'inventory' (2 chips: Active/Inactive, Draft)
 const [viewMode, setViewMode] = useState<'standard' | 'inventory'>('standard');
 
 // Standard mode tab selection
 const [activeStatus, setActiveStatus] = useState<'Active' | 'Inactive' | 'Draft'>('Active');
 
 // Inventory mode chip selection: 'all_active_inactive' or 'draft'
 const [inventoryChip, setInventoryChip] = useState<'active_inactive' | 'draft'>('active_inactive');

 const [products, setProducts] = useState<SupabaseProduct[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedProduct, setSelectedProduct] = useState<SupabaseProduct | null>(null);
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const [counts, setCounts] = useState<{ active: number; inactive: number; draft: number }>({
 active: 0,
 inactive: 0,
 draft: 0,
 });

 const showToast = (msg: string) => {
 setToastMessage(msg);
 setTimeout(() => {
 setToastMessage(null);
 }, 4000);
 };

 const fetchCounts = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 
 let finalSellerId = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 
 if (userObj?.id) {
 const { data } = await supabase.from('sellers').select('id').eq('id', userObj.id).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 if (!finalSellerId && userObj?.email) {
 const { data } = await supabase.from('sellers').select('id').eq('registered_email', userObj.email).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 if (!finalSellerId) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase.from('sellers').select('id').eq('id', user.id).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 }

 let activeQuery = supabase.from('upload_products').select('id', { count: 'exact', head: true });
 let inactiveQuery = supabase.from('inactive_products').select('id', { count: 'exact', head: true });
 let draftQuery = supabase.from('save_in_draft').select('id', { count: 'exact', head: true });

 if (finalSellerId) {
 activeQuery = activeQuery.eq('seller_id', finalSellerId);
 inactiveQuery = inactiveQuery.eq('seller_id', finalSellerId);
 draftQuery = draftQuery.eq('seller_id', finalSellerId);
 }

 const [resActive, resInactive, resDraft] = await Promise.all([
 activeQuery,
 inactiveQuery,
 draftQuery
 ]);

 setCounts({
 active: resActive.count || 0,
 inactive: resInactive.count || 0,
 draft: resDraft.count || 0,
 });
 } catch (err) {
 console.error('Error fetching counts:', err);
 }
 };

 const fetchProducts = useCallback(async () => {
 setLoading(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 
 let finalSellerId = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 
 if (userObj?.id) {
 const { data } = await supabase.from('sellers').select('id').eq('id', userObj.id).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 if (!finalSellerId && userObj?.email) {
 const { data } = await supabase.from('sellers').select('id').eq('registered_email', userObj.email).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 if (!finalSellerId) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase.from('sellers').select('id').eq('id', user.id).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 }

 if (viewMode === 'inventory') {
 if (inventoryChip === 'active_inactive') {
 // Fetch both upload_products (Active) and inactive_products (Inactive)
 let activeQuery = supabase.from('upload_products').select('*').order('created_at', { ascending: false });
 let inactiveQuery = supabase.from('inactive_products').select('*').order('created_at', { ascending: false });

 if (finalSellerId) {
 activeQuery = activeQuery.eq('seller_id', finalSellerId);
 inactiveQuery = inactiveQuery.eq('seller_id', finalSellerId);
 }

 const [activeRes, inactiveRes] = await Promise.all([activeQuery, inactiveQuery]);
 const activeList = (activeRes.data || []).map((p: any) => ({ ...p, _status: 'Active' as const }));
 const inactiveList = (inactiveRes.data || []).map((p: any) => ({ ...p, _status: 'Inactive' as const }));

 setProducts([...activeList, ...inactiveList]);
 } else {
 // Fetch Draft products
 let draftQuery = supabase.from('save_in_draft').select('*').order('created_at', { ascending: false });
 if (finalSellerId) {
 draftQuery = draftQuery.eq('seller_id', finalSellerId);
 }
 const { data } = await draftQuery;
 setProducts((data || []).map((p: any) => ({ ...p, _status: 'Draft' as const })));
 }
 } else {
 // Standard view: Active, Inactive, or Draft
 const tableName = activeStatus === 'Active' 
 ? 'upload_products' 
 : activeStatus === 'Inactive' 
 ? 'inactive_products' 
 : 'save_in_draft';

 let query = supabase.from(tableName).select('*').order('created_at', { ascending: false });
 if (finalSellerId) {
 query = query.eq('seller_id', finalSellerId);
 }

 const { data, error } = await query;
 if (error) {
 console.error(`Error loading from ${tableName}:`, error);
 setProducts([]);
 } else {
 setProducts((data || []).map((p: any) => ({ ...p, _status: activeStatus })));
 }
 }
 fetchCounts();
 } catch (err) {
 console.error('Error in fetchProducts:', err);
 } finally {
 setLoading(false);
 }
 }, [viewMode, activeStatus, inventoryChip]);

 useEffect(() => {
 fetchProducts();
 }, [fetchProducts]);

 // Handle Real-Time Stock Update with Auto-Sync between Active & Inactive
 const handleUpdateStock = async (productId: string, newStock: string) => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const targetProduct = products.find(p => p.id === productId);
 if (!targetProduct) return;

 const currentStatus = (targetProduct as any)._status || activeStatus;
 const stockNum = parseInt(newStock || '0', 10);
 const cleanStock = Math.max(0, isNaN(stockNum) ? 0 : stockNum).toString();

 if (currentStatus === 'Active') {
 if (cleanStock === '0') {
 const { _status, ...productData } = targetProduct as any;
 // Move from upload_products -> inactive_products
 const { error: insertErr } = await supabase.from('inactive_products').insert([{
 ...productData,
 available_stock: '0',
 updated_at: new Date().toISOString()
 }]);
 if (!insertErr) {
 await supabase.from('upload_products').delete().eq('id', productId);
 await supabase.from('carts').delete().eq('product_id', productId);
 showToast('Stock set to 0. Product moved to Inactive.');
 }
 } else {
 // Update within upload_products
 const { error } = await supabase.from('upload_products').update({
 available_stock: cleanStock,
 updated_at: new Date().toISOString()
 }).eq('id', productId);
 
 await supabase.from('carts').update({ available_stock: cleanStock, updated_at: new Date().toISOString() }).eq('product_id', productId);
 
 if (error) throw error;
 showToast(`Stock updated to ${cleanStock} units.`);
 }
 } else if (currentStatus === 'Inactive') {
 if (cleanStock !== '0') {
 const { _status, ...productData } = targetProduct as any;
 // Move from inactive_products -> upload_products
 const { error: insertErr } = await supabase.from('upload_products').insert([{
 ...productData,
 available_stock: cleanStock,
 updated_at: new Date().toISOString()
 }]);
 if (!insertErr) {
 await supabase.from('inactive_products').delete().eq('id', productId);
 showToast(`Stock updated to ${cleanStock}. Product moved to Active!`);
 }
 } else {
 // Update within inactive_products
 const { error } = await supabase.from('inactive_products').update({
 available_stock: '0',
 updated_at: new Date().toISOString()
 }).eq('id', productId);
 if (error) throw error;
 showToast('Stock remains 0 (Inactive).');
 }
 } else if (currentStatus === 'Draft') {
 const { error } = await supabase.from('save_in_draft').update({
 available_stock: cleanStock,
 updated_at: new Date().toISOString()
 }).eq('id', productId);
 if (error) throw error;
 showToast(`Draft stock updated to ${cleanStock}.`);
 }

 await fetchProducts();
 await fetchCounts();
 } catch (err: any) {
 console.error('Error updating stock:', err);
 alert('Failed to update stock: ' + err.message);
 }
 };

 // Handle Delete Product
 const handleDeleteProduct = async (productId: string, explicitStatus?: string) => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const targetProduct = products.find(p => p.id === productId);
 const targetStatus = explicitStatus || (targetProduct as any)?._status || activeStatus;

 console.log('handleDeleteProduct called for:', productId);
 console.log('Found product:', targetProduct);
 console.log('Evaluated targetStatus:', targetStatus);

 const tableName = targetStatus === 'Active' 
 ? 'upload_products' 
 : targetStatus === 'Inactive' 
 ? 'inactive_products' 
 : 'save_in_draft';

 console.log('Attempting to delete from table:', tableName);

 const { data, error } = await supabase.from(tableName).delete().eq('id', productId).select();
 if (error) throw error;
 
 // Cascade delete to carts
 try { 
 await supabase.from('carts').delete().eq('product_id', productId);
 } catch(e) {}
 
 if (!data || data.length === 0) {
 throw new Error(`Failed to delete: Product not found in ${tableName} or permission denied.`);
 }

 setProducts(prev => prev.filter(p => p.id !== productId));
 if (selectedProduct?.id === productId) {
 setSelectedProduct(null);
 }
 fetchCounts();
 showToast('Product deleted successfully.');
 } catch (err: any) {
 alert('Error deleting product: ' + err.message);
 console.error(err);
 }
 };

 // Filtered Products
 const filteredProducts = products.filter(p => {
 if (!searchQuery.trim()) return true;
 const q = searchQuery.toLowerCase();
 const name = (p['product name'] || '').toLowerCase();
 const title = (p['product title name'] || '').toLowerCase();
 const sku = (p['product_sku_code'] || '').toLowerCase();
 const tags = (p.tags || []).join(' ').toLowerCase();
 const catTags = (p['category tags'] || []).join(' ').toLowerCase();
 const mainCat = (p['main category'] || '').toLowerCase();
 const pStatus = ((p as any)?._status || activeStatus || '').toLowerCase();
 return name.includes(q) || title.includes(q) || sku.includes(q) || tags.includes(q) || catTags.includes(q) || mainCat.includes(q) || pStatus.includes(q);
 });

 if (viewMode === 'inventory') {
 return (
 <div className="fixed inset-0 z-[400] bg-[#F8FAFC] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
 {/* Toast Notification */}
 {toastMessage && (
 <div className="fixed top-6 z-[450] left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200 max-w-[90vw]">
 <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
 <span className="truncate">{toastMessage}</span>
 </div>
 )}

 {/* Full screen header */}
 <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => { setViewMode('standard'); setSearchQuery(''); }}
 className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
 <PackageCheck size={20} className="text-blue-600" />
 Inventory Management
 </h2>
 </div>
 <div className="shrink-0 bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1.5 rounded-md border border-blue-200 flex items-center gap-1">
 <span>TOTAL</span>
 <span className="bg-white px-1.5 py-0.5 rounded-sm text-blue-900 border border-blue-200">{filteredProducts.length}</span>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto w-full flex flex-col items-center p-4 relative">
 {/* Search Box & Controls for Inventory */}
 <div className="w-full max-w-7xl bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs mb-4 shrink-0">
 <div className="relative border-b border-slate-100 flex items-center pr-3">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
 <Search size={16} />
 </div>
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Search products by name, SKU, category, tags..."
 className="flex-1 w-full pl-10 pr-2 py-3 bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
 />
 {searchQuery && (
 <button 
 onClick={() => setSearchQuery('')}
 className="pr-3 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 Clear
 </button>
 )}
 </div>
 
 <div className="flex items-center justify-around w-full bg-blue-50/60 p-1.5 gap-2 border-b border-blue-100/50">
 <button
 onClick={() => {
 setInventoryChip('active_inactive');
 setSearchQuery('');
 }}
 className={`flex-1 py-2 px-2 text-xs font-black transition-all rounded-xl flex items-center justify-center gap-2 border cursor-pointer ${
 inventoryChip === 'active_inactive'
 ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
 : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100/50'
 }`}
 >
 <span>Active / Inactive</span>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
 inventoryChip === 'active_inactive' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
 }`}>
 {counts.active + counts.inactive}
 </span>
 </button>

 <button
 onClick={() => {
 setInventoryChip('draft');
 setSearchQuery('');
 }}
 className={`flex-1 py-2 px-2 text-xs font-black transition-all rounded-xl flex items-center justify-center gap-2 border cursor-pointer ${
 inventoryChip === 'draft'
 ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
 : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100/50'
 }`}
 >
 <span>Draft</span>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
 inventoryChip === 'draft' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-800'
 }`}>
 {counts.draft}
 </span>
 </button>
 </div>
 </div>

 <div className="w-full max-w-7xl gap-3 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
 {loading ? (
 <div className="w-full col-span-full py-16 flex flex-col items-center justify-center gap-3">
 <div className="flex gap-1.5">
 <div className="w-2 h-2 rounded-full bg-orange-500 animate-[bounce_1s_infinite_-0.3s]"></div>
 <div className="w-2 h-2 rounded-full bg-orange-500 animate-[bounce_1s_infinite_-0.15s]"></div>
 <div className="w-2 h-2 rounded-full bg-orange-500 animate-[bounce_1s_infinite]"></div>
 </div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading inventory...</p>
 </div>
 ) : filteredProducts.length > 0 ? (
 filteredProducts.map(product => {
 const productStatus = (product as any)._status || activeStatus;
 return (
 <ProductCard
 key={product.id}
 product={product}
 status={productStatus}
 showDelete={(productStatus === 'Inactive' || productStatus === 'Draft')}
 isInventoryMode={true}
 onSelectImage={prod => setSelectedProduct(prod)}
 onUpdateStock={handleUpdateStock}
 onEdit={prod => {
 const mode = productStatus === 'Active' 
 ? 'edit_active' 
 : productStatus === 'Inactive' 
 ? 'edit_inactive' 
 : 'edit_draft';
 onEditProduct(prod, mode);
 }}
 onDelete={handleDeleteProduct}
 />
 );
 })
 ) : (
 <div className="w-full col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-8 flex flex-col items-center justify-center text-center gap-3 shadow-2xs">
 <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
 <Box size={28} />
 </div>
 <div>
 <h4 className="text-sm font-bold text-slate-800">
 {searchQuery ? 'No matching products found' : 'No Inventory Found'}
 </h4>
 <p className="text-xs text-slate-500 mt-1 max-w-xs">
 {searchQuery
 ? 'Try searching with different keywords or clear your query.'
 : 'Your inventory currently has no products in this section.'}
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 
 {selectedProduct && (
 <ProductDetailModal
 product={selectedProduct}
 status={(selectedProduct as any)._status || activeStatus}
 onClose={() => setSelectedProduct(null)}
 onUpdateStock={handleUpdateStock}
 onEditInForm={prod => {
 const currentStat = (prod as any)._status || activeStatus;
 const mode = currentStat === 'Active' 
 ? 'edit_active' 
 : currentStat === 'Inactive' 
 ? 'edit_inactive' 
 : 'edit_draft';
 onEditProduct(prod, mode);
 }}
 onDelete={handleDeleteProduct}
 />
 )}
 </div>
 );
 }

 return (
 <div className="w-full flex flex-col items-center pt-1 px-1 sm:px-2 gap-3 mx-auto max-w-2xl">
 {toastMessage && (
 <div className="fixed top-20 z-[350] left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200 max-w-[90vw]">
 <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
 <span className="truncate">{toastMessage}</span>
 </div>
 )}

 {/* Top Two Chip Buttons: Inventory & Upload Products */}
 <div className="flex items-center justify-between w-full px-1 max-w-md">
 <button 
 onClick={() => {
 setViewMode(prev => (prev === 'inventory' ? 'standard' : 'inventory'));
 setSearchQuery('');
 }}
 className={`flex-1 max-w-[48%] py-2.5 px-1 rounded-sm text-white font-bold text-[11px] uppercase tracking-wider shadow-sm active:scale-95 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
 viewMode === 'inventory' ? 'bg-blue-700 ring-2 ring-blue-300 shadow-md' : 'bg-blue-600 hover:bg-blue-700'
 }`}
 >
 <PackageCheck size={14} />
 <span>Inventory {viewMode === 'inventory' ? '✓' : ''}</span>
 </button>

 <button 
 onClick={onOpenUpload}
 className="flex-1 max-w-[48%] py-2.5 px-1 rounded-sm bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] uppercase tracking-wider shadow-sm active:scale-95 transition-transform whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
 >
 <Plus size={14} />
 <span>Upload Products</span>
 </button>
 </div>

 {/* Search Box & Controls */}
 <div className="w-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs mt-0.5">
 {/* Search Input Bar */}
 <div className="relative border-b border-slate-100 flex items-center pr-3">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
 <Search size={16} />
 </div>
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Search products by name, SKU, category, tags..."
 className="flex-1 w-full pl-10 pr-2 py-3 bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
 />
 {searchQuery && (
 <button 
 onClick={() => setSearchQuery('')}
 className="pr-3 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 Clear
 </button>
 )}
 
 </div>
 
 {/* Standard Mode: Exact 3 tabs with real-time counters */}
 <div className="flex items-center justify-around w-full bg-slate-100/60 p-1.5 gap-1 border-t border-slate-100">
 {[
 { id: 'Active' as const, label: 'Active', count: counts.active, activeClass: 'text-emerald-700 bg-white border-emerald-200' },
 { id: 'Inactive' as const, label: 'Inactive', count: counts.inactive, activeClass: 'text-red-700 bg-white border-red-200' },
 { id: 'Draft' as const, label: 'Draft', count: counts.draft, activeClass: 'text-indigo-700 bg-white border-indigo-200' },
 ].map(tab => {
 const isActive = activeStatus === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => {
 setActiveStatus(tab.id);
 setSearchQuery('');
 }}
 className={`flex-1 py-2 px-1 text-[11px] font-extrabold transition-all rounded-xl flex items-center justify-center gap-1.5 border cursor-pointer ${
 isActive
 ? `${tab.activeClass} shadow-xs font-black`
 : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/50'
 }`}
 >
 <span>{tab.label}</span>
 <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
 isActive
 ? tab.id === 'Active' 
 ? 'bg-emerald-100 text-emerald-800 font-black' 
 : tab.id === 'Inactive' 
 ? 'bg-red-100 text-red-800 font-black' 
 : 'bg-indigo-100 text-indigo-800 font-black'
 : 'bg-slate-200/80 text-slate-600 font-bold'
 }`}>
 {tab.count}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Product List in VIP Compact Layout */}
 <div className="w-full gap-3 pb-8 flex flex-col">
 {loading ? (
 <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
 <div className="flex gap-1.5">
 <div className="w-2 h-2 rounded-full bg-orange-500 animate-[bounce_1s_infinite_-0.3s]"></div>
 <div className="w-2 h-2 rounded-full bg-orange-500 animate-[bounce_1s_infinite_-0.15s]"></div>
 <div className="w-2 h-2 rounded-full bg-orange-500 animate-[bounce_1s_infinite]"></div>
 </div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading products...</p>
 </div>
 ) : filteredProducts.length > 0 ? (
 filteredProducts.map(product => {
 const productStatus = (product as any)._status || activeStatus;
 return (
 <ProductCard
 key={product.id}
 product={product}
 status={productStatus}
 showDelete={false}
 isInventoryMode={false}
 onSelectImage={prod => setSelectedProduct(prod)}
 onUpdateStock={handleUpdateStock}
 onEdit={prod => {
 const mode = productStatus === 'Active' 
 ? 'edit_active' 
 : productStatus === 'Inactive' 
 ? 'edit_inactive' 
 : 'edit_draft';
 onEditProduct(prod, mode);
 }}
 onDelete={handleDeleteProduct}
 />
 );
 })
 ) : (
 <div className="w-full bg-white rounded-2xl border border-dashed border-slate-300 p-8 flex flex-col items-center justify-center text-center gap-3 shadow-2xs">
 <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
 <Box size={28} />
 </div>
 <div>
 <h4 className="text-sm font-bold text-slate-800">
 {searchQuery ? 'No matching products found' : 'No Products Found'}
 </h4>
 <p className="text-xs text-slate-500 mt-1 max-w-xs">
 {searchQuery
 ? 'Try searching with different keywords or clear your query.'
 : activeStatus === 'Active'
 ? 'Publish your first product to start receiving customer orders.'
 : activeStatus === 'Inactive'
 ? 'No out-of-stock products currently in inactive state.'
 : 'You do not have any saved draft products.'}
 </p>
 </div>
 {!searchQuery && (
 <button
 onClick={onOpenUpload}
 className="mt-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
 >
 <Plus size={14} />
 <span>Upload New Product</span>
 </button>
 )}
 </div>
 )}
 </div>

 {/* Full Screen Product Detail Inspection Page */}
 {selectedProduct && (
 <ProductDetailModal
 product={selectedProduct}
 status={(selectedProduct as any)._status || activeStatus}
 onClose={() => setSelectedProduct(null)}
 onUpdateStock={handleUpdateStock}
 onEditInForm={prod => {
 const currentStat = (prod as any)._status || activeStatus;
 const mode = currentStat === 'Active' 
 ? 'edit_active' 
 : currentStat === 'Inactive' 
 ? 'edit_inactive' 
 : 'edit_draft';
 onEditProduct(prod, mode);
 }}
 onDelete={handleDeleteProduct}
 />
 )}

 </div>
 );
};
