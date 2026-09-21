import React, { useState, useEffect } from 'react';
import { ChevronDown, X, ArrowLeft, ChevronLeft, ChevronRight, Truck, Gift, Store, ShieldCheck, Check, Star, Banknote, RotateCcw, Handshake, Headphones, UserPlus, Heart, ShoppingBag, Minus, Plus, Edit, MoreHorizontal, Eye } from 'lucide-react';
import { SupabaseProduct } from '../../types/product';
import { categoryData } from '../../categories';
import { supabase } from '../../lib/supabase';
import { getTagColor } from '../../utils/tagColors';
import { ProductCard } from './ProductCard';

interface ProductDetailModalProps {
 isInCart?: boolean;
 onAddToCart?: (product: SupabaseProduct) => void;
 isCustomerView?: boolean;
 isTopService?: boolean;
 product: SupabaseProduct;
 status: 'Active' | 'Inactive' | 'Draft';
 onClose: () => void;
 onUpdateStock?: (productId: string, newStock: string) => Promise<void>;
 onEditInForm?: (product: SupabaseProduct) => void;
 onDelete?: (productId: string, status?: string) => Promise<void>;
 customerData?: any;
 onSelectSimilarProduct?: (product: SupabaseProduct) => void;
 customerGiftCashBalance?: number;
 showGiftCashOption?: boolean;
 onViewOrders?: () => void;
}

type Address = {
 id: string;
 fullName: string;
 mobileNumber: string;
 fullAddress: string;
 pincode: string;
 landmark: string;
 addressType: 'Home' | 'Office' | 'Other';
};


const formatViewsCount = (value: any): string => {
 if (!value) return '0';
 const num = parseInt(value?.toString() || '0', 10);
 if (isNaN(num)) return '0';
 if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
 if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
 return num.toString();
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
 product,
 status,
 isCustomerView = false,
 isTopService = false,
 onClose, isInCart, onAddToCart, customerData, onSelectSimilarProduct
, showGiftCashOption = false, customerGiftCashBalance = 0, onViewOrders}) => {
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);
 const [contactLink, setContactLink] = useState('');
 useEffect(() => {
 if (isTopService) {
 supabase.from('contact_link').select('*').limit(1).maybeSingle().then(({ data }) => {
 if (data && data.contact_link) {
 setContactLink(data.contact_link);
 }
 });
 }
 }, [isTopService]);
 const [selectedImgIndex, setSelectedImgIndex] = useState(0);
 const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'pricing' | 'specs' | 'features' | 'earning'>('overview');
 const [selectedSize, setSelectedSize] = useState<string>('');
 const [selectedColor, setSelectedColor] = useState<string>('');
 const [selectedWeight, setSelectedWeight] = useState<string>('');
 const [missingSelections, setMissingSelections] = useState<string[]>([]);
 const [adminCharges, setAdminCharges] = useState<{ id: string; name: string; value: string; isPercentage: boolean }[]>([]);
 const [sellerInfo, setSellerInfo] = useState<{ shop_name?: string; trust_years_in_business?: string; seller_name?: string } | null>(null);
 const [showSellerProfile, setShowSellerProfile] = useState(false);
 const [quantity, setQuantity] = useState<number>(parseInt(product['minimum order quantity']?.toString() || '1') || 1);
 const [checkoutStep, setCheckoutStep] = useState<'details' | 'address_selection' | 'add_address' | 'order_summary' | 'success'>('details');
 const [successOrderInfo, setSuccessOrderInfo] = useState<{ id: string; date: string } | null>(null);
 const [isAddingToCart, setIsAddingToCart] = useState(false);
 

 const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
 const [newAddress, setNewAddress] = useState<Partial<Address>>({ addressType: 'Home' });
 const [isSavingAddress, setIsSavingAddress] = useState(false);
 const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
 const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
 const prevCheckoutStepRef = React.useRef(checkoutStep);
 const [relatedProducts, setRelatedProducts] = useState<SupabaseProduct[]>([]);
 const [productRatings, setProductRatings] = useState<any[]>([]);
 const [avgRating, setAvgRating] = useState<number>(0);

 useEffect(() => {
 if (product.id) {
 const fetchRatings = async () => {
 try {
 const { data } = await supabase.from('product_rating').select('*').eq('product id', product.id).order('created_at', { ascending: false });
 if (data && data.length > 0) {
 setProductRatings(data);
 let sum = 0;
 let count = 0;
 data.forEach(r => {
 const s = Number(r['rating star']);
 if (s > 0) { sum += s; count++; }
 });
 if (count > 0) {
 setAvgRating(Math.round(sum / count));
 }
 } else {
 setProductRatings([]);
 setAvgRating(0);
 }
 } catch(e) {}
 };
 fetchRatings();
 }
 }, [product.id]);

 useEffect(() => {
 setSelectedColor('');
 setSelectedSize('');
 setSelectedWeight('');
 setMissingSelections([]);
 setQuantity(parseInt(product['minimum order quantity']?.toString() || '1') || 1);
 }, [product]);

 useEffect(() => {
 if (missingSelections.length > 0) {
 const available = [];
 if (product.color && product.color.length > 0) available.push('Color');
 if (product.size && product.size.length > 0) available.push('Size');
 if (product.weight && product.weight.length > 0) available.push('Weight');

 const missing = [];
 if (available.includes('Color') && !selectedColor) missing.push('Color');
 if (available.includes('Size') && !selectedSize) missing.push('Size');
 if (available.includes('Weight') && !selectedWeight) missing.push('Weight');

 if (available.length >= 3 && (available.length - missing.length) >= 2) {
 setMissingSelections([]);
 } else {
 if (missing.length !== missingSelections.length || !missing.every(m => missingSelections.includes(m))) {
 setMissingSelections(missing);
 }
 }
 }
 }, [selectedColor, selectedSize, selectedWeight, product, missingSelections]);


 useEffect(() => {
 // Increment view count when product modal opens
 if (!product || !product.id) return;
 
 const incrementViews = async () => {
 try {
 // Fetch current views first to increment safely
 const { data: currentData } = await supabase
 .from('upload_products')
 .select('wives')
 .eq('id', product.id)
 .maybeSingle();
 
 let currentViews = 0;
 if (currentData && currentData.wives !== null && currentData.wives !== undefined) {
 currentViews = parseInt(String(currentData.wives), 10) || 0;
 } else if (product.wives !== null && product.wives !== undefined) {
 currentViews = parseInt(String(product.wives), 10) || 0;
 }
 
 const newViews = String(currentViews + 1);
 setLocalViews(currentViews + 1);
 
 await supabase.from('upload_products').update({ wives: newViews }).eq('id', product.id);
 } catch (err) {
 console.error("Failed to increment views:", err);
 }
 };
 
 incrementViews();
 }, [product.id]);

 useEffect(() => {
 if (!isCustomerView) return;
 const fetchRelated = async () => {
 try {
 const { data } = await supabase.from('upload_products').select('*').order('created_at', { ascending: false });
 if (data) {
 let others = data.filter(p => p.id !== product.id && p.id !== (product as any).product_id);
 
 const pUploadService = product['upload services'] || '';
 const serviceCategories = ['Top Services', 'Breakfast and Drink', 'Suriyawan Shopping Special'];
 
 if (serviceCategories.includes(pUploadService)) {
 // If current product is a specific service, only show products from THIS EXACT service
 others = others.filter(p => p['upload services'] === pUploadService);
 } else {
 // If current product is a normal product, DO NOT show products from the service categories
 others = others.filter(p => !serviceCategories.includes(p['upload services'] || ''));
 }
 
 const pName = (product['product name'] || '').trim().toLowerCase();
 const pSubCat = (product['sub category'] || '').trim().toLowerCase();
 const pSellerId = product.seller_id;
 
 const sameName = others.filter(p => (p['product name'] || '').trim().toLowerCase() === pName);
 const sameCat = others.filter(p => (p['product name'] || '').trim().toLowerCase() !== pName && (p['sub category'] || '').trim().toLowerCase() === pSubCat);
 const sameSeller = others.filter(p => (p['product name'] || '').trim().toLowerCase() !== pName && (p['sub category'] || '').trim().toLowerCase() !== pSubCat && p.seller_id === pSellerId && pSellerId);
 
 const rest = others.filter(p => (p['product name'] || '').trim().toLowerCase() !== pName && (p['sub category'] || '').trim().toLowerCase() !== pSubCat && p.seller_id !== pSellerId);

 setRelatedProducts([...sameName, ...sameCat, ...sameSeller, ...rest]);
 }
 } catch (err) {
 console.error("Failed to fetch related products", err);
 }
 };
 fetchRelated();
 }, [product, isCustomerView]);

 useEffect(() => {
 const prevStep = prevCheckoutStepRef.current;
 prevCheckoutStepRef.current = checkoutStep;

 // Only prefill when FIRST navigating into 'add_address' from another step and not editing an existing address
 if (checkoutStep === 'add_address' && prevStep !== 'add_address' && !editingAddressId) {
 setNewAddress({
 fullName: customerData?.full_name || '',
 mobileNumber: customerData?.mobile_number || '',
 fullAddress: customerData?.full_address || '',
 pincode: customerData?.pincode || '',
 landmark: '',
 addressType: 'Home'
 });
 }
 }, [checkoutStep, editingAddressId]);

 useEffect(() => {
 const fetchAddresses = async () => {
 // Ensure we only fetch for the specific logged-in customer
 if (!customerData?.id) {
 setSavedAddresses([]);
 return;
 }
 try {
 const { data } = await supabase.from('customer_address')
 .select('*')
 .eq('customer id', customerData.id)
 .order('created_at', { ascending: false })
 .limit(2);
 
 if (data && data.length > 0) {
 const mapped = data.map((d: any) => ({
 id: d.id,
 fullName: d['full name'],
 mobileNumber: d['mobile number'],
 fullAddress: d['full address'],
 pincode: d.pincode,
 landmark: d.landmark,
 addressType: d['address type']
 }));
 setSavedAddresses(mapped);
 // Auto-select first address if none selected
 if (!selectedAddressId && mapped.length > 0) {
 setSelectedAddressId(mapped[0].id);
 }
 } else {
 setSavedAddresses([]);
 }
 } catch (err) {
 console.error("Failed to fetch customer addresses", err);
 }
 };
 if (checkoutStep === 'address_selection') {
 fetchAddresses();
 }
 }, [customerData?.id, checkoutStep]);

 useEffect(() => {
 const fetchSeller = async () => {
 if (product.seller_id) {
 const { data } = await supabase.from('sellers').select('shop_name, trust_years_in_business, seller_name').eq('id', product.seller_id).maybeSingle();
 if (data) {
 setSellerInfo(data);
 }
 }
 };
 fetchSeller();
 }, [product.seller_id]);

 useEffect(() => {
 try {
 const saved = localStorage.getItem('ss_admin_earning_charges');
 if (saved) {
 setAdminCharges(JSON.parse(saved));
 } else {
 setAdminCharges([
 { id: '1', name: 'Referral Fee', value: '0', isPercentage: true },
 { id: '2', name: 'Closing Fee', value: '0', isPercentage: false },
 { id: '3', name: 'COD Fee', value: '0', isPercentage: false },
 { id: '4', name: 'Shipping Fee', value: '0', isPercentage: false },
 { id: '5', name: 'C-GST', value: '0', isPercentage: true },
 { id: '6', name: 'S-GST', value: '0', isPercentage: true },
 { id: '7', name: 'TDS charge', value: '0', isPercentage: true },
 { id: '8', name: 'TCS charge', value: '0', isPercentage: true },
 ]);
 }
 } catch {}
 }, []);

 const calculateEarnings = () => {
 const sp = parseAmt(product['selling price']);
 const dc = parseAmt(product['delivery charge']) || 0;
 const gd = parseAmt(product['gift cash donation']) || 0;
 
 const sellerGstPercent = (parseAmt(product['gst rate %']) || parseAmt(product['gst %']));
 const halfGstPercent = sellerGstPercent / 2;
 let grossRateNum = 0;
 let totalGstAmount = 0;
 if (sp > 0) {
 grossRateNum = sp / (1 + (sellerGstPercent / 100));
 totalGstAmount = sp - grossRateNum;
 }
 const sellerCgstAmount = totalGstAmount / 2;
 const sellerSgstAmount = totalGstAmount / 2;
 const totalSellerEarning = sp + dc;
 
 // First, calculate base platform earning (excluding taxes)
 let basePlatformEarning = 0;
 
 const chargesWithBaseAmount = adminCharges.map(charge => {
 const isTax = charge.name.toUpperCase().includes('GST') || 
 charge.name.toUpperCase().includes('TDS') || 
 charge.name.toUpperCase().includes('TCS');
 
 const val = parseFloat(charge.value) || 0;
 let amount = 0;
 
 if (!isTax) {
 if (charge.isPercentage) {
 amount = (sp * val) / 100;
 } else {
 amount = val;
 }
 basePlatformEarning += amount;
 }
 
 return { ...charge, val, isTax, amount };
 });

 let platformTotal = 0;
 const calculatedCharges = chargesWithBaseAmount.map(charge => {
 let finalAmount = charge.amount;
 if (charge.isTax) {
 if (charge.isPercentage) {
 finalAmount = (basePlatformEarning * charge.val) / 100;
 } else {
 finalAmount = charge.val;
 }
 }
 
 if (sp <= 0) {
 finalAmount = 0;
 }
 
 platformTotal += finalAmount;
 return { ...charge, amount: finalAmount };
 });
 
 const finalNetEarning = sp > 0 ? totalSellerEarning - platformTotal - gd : 0;
 const totalPlatformEarning = platformTotal + gd;

 return {
 sellingPrice: sp,
 grossRateNum,
 halfGstPercent,
 sellerCgstAmount,
 sellerSgstAmount,
 deliveryCharge: dc,
 totalSellerEarning,
 calculatedCharges,
 giftDonation: gd,
 platformTotal,
 finalEarning: finalNetEarning,
 };
 };

 const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

 let parsedImages = product['product images'];
 if (typeof parsedImages === 'string') {
 try {
 parsedImages = JSON.parse(parsedImages);
 } catch(e) {}
 }
 const images = (Array.isArray(parsedImages) && parsedImages.length > 0)
 ? parsedImages
 : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];

 const mainCategoryObj = categoryData.find(c => c.id === product['main category']);
 const mainCategoryName = mainCategoryObj?.name || product['main category'] || 'General';
 const middleCategoryObj = mainCategoryObj?.middle?.find(m => m.id === product['middle category']);
 const middleCategoryName = middleCategoryObj?.name || product['middle category'] || '';
 const subCategoryObj = middleCategoryObj?.sub?.find(s => s.id === product['sub category']);
 const subCategoryName = subCategoryObj?.name || product['sub category'] || '';

 const colors = product.color || [];
 const sizes = product.size || [];
 const weights = product.weight || [];
 const keyFeatures = product['key features'] || [];
 const tags = product.tags || [];
 const categoryTags = product['category tags'] || [];
 const stockCount = parseInt(product.available_stock || '0', 10);
 const parseAmt = (val: any) => parseFloat(String(val || '0').replace(/[^0-9.]/g, '')) || 0;
 
 const discountVal = parseAmt(product['discount %']);
 const sellingPrice = parseAmt(product['selling price']);
 const marketValue = parseAmt(product['price info']);

 const [localViews, setLocalViews] = useState<number>(parseInt(String(product.wives || 0), 10));

 const mainScrollRef = React.useRef<HTMLElement>(null);
 useEffect(() => {
 if (mainScrollRef.current) {
 mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
 }
 }, [product.id]);

 const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
 const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'GiftCash'>('COD');

 const handleConfirmOrder = async () => {
 if (!customerData?.id) {
 alert("Customer not found! Please login again.");
 return;
 }
 const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);
 if (!selectedAddress) {
 alert("Please select a delivery address");
 return;
 }
 
 try {
 const sp = parseAmt(product['selling price']);
 const priceInfo = parseAmt(product['price info']);
 const qty = quantity;
 const totalPrice = sp * qty;
 const totalPriceInfo = priceInfo * qty;
 const discount = Math.max(0, totalPriceInfo - totalPrice);
 const delChargeType = product['delivery charge type']?.toString()?.toLowerCase() || 'per_order';
 const baseDelCharge = parseAmt(product['delivery charge']);
 const totalDelCharge = delChargeType === 'per_quantity' ? (baseDelCharge * qty) : baseDelCharge;
 const finalAmount = totalPrice + totalDelCharge;

 if (selectedPaymentMethod === 'GiftCash' && finalAmount > (customerGiftCashBalance || 0)) {
 alert("Insufficient Gift Cash Balance");
 return;
 }

 setIsConfirmingOrder(true);

 const generateUniqueOrderId = async () => {
 // Instant unique ID generation without slow DB checks
 const timestamp = Date.now().toString().slice(-6);
 const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
 return 'ORD' + timestamp + randomStr;
 };

 const itemPrice = sp;
 const itemPriceInfo = priceInfo;
 const itemDiscount = Math.max(0, itemPriceInfo - itemPrice);
 const itemDelCharge = delChargeType === 'per_quantity' ? baseDelCharge : (baseDelCharge / qty);
 const itemFinalAmount = itemPrice + itemDelCharge;
 const itemGd = parseAmt(product['gift cash donation']) || 0;
 
 const sellerGstPercent = parseAmt(product['gst rate %']) || parseAmt(product['gst %']) || 0;
 let itemGrossRate = 0;
 let itemGstAmount = 0;
 if (sp > 0) {
 itemGrossRate = sp / (1 + (sellerGstPercent / 100));
 itemGstAmount = sp - itemGrossRate;
 }
 const itemCgst = itemGstAmount / 2;
 const itemSgst = itemGstAmount / 2;

 const now = new Date();
 const formattedDateTime = now.toLocaleString('en-IN', {
 day: '2-digit', month: 'short', year: 'numeric',
 hour: '2-digit', minute: '2-digit', hour12: true
 });

 let adminId = '';
 let clusterId = null;
 let hubManagerId = null;

 // Run network requests in parallel for maximum speed
 const fetchAdminId = async () => {
 try {
 const { data: adminData } = await supabase.from('admins').select('id').limit(1).maybeSingle();
 if (adminData) adminId = adminData.id;
 } catch (e) {
 console.error("Could not fetch admin ID:", e);
 }
 };

 const fetchClusterDetails = async () => {
 try {
 if (product.seller_id) {
 const { data: sellerData } = await supabase.from('sellers').select('registered_pincode').eq('id', product.seller_id).maybeSingle();
 if (sellerData && sellerData.registered_pincode) {
 const { data: pincodeData } = await supabase.from('added_pincode').select('"hub manager id"').eq('added pincode', sellerData.registered_pincode.toString()).limit(1).maybeSingle();
 if (pincodeData && pincodeData['hub manager id']) {
 hubManagerId = pincodeData['hub manager id'];
 const { data: hmData } = await supabase.from('hub_managers').select('cluster_id').eq('id', hubManagerId).limit(1).maybeSingle();
 if (hmData && hmData.cluster_id) {
 clusterId = hmData.cluster_id;
 }
 }
 }
 }
 } catch (e) {
 console.error("Could not fetch cluster ID:", e);
 }
 };

 await Promise.all([fetchAdminId(), fetchClusterDetails()]);

 const customerOrdersPayloads = [];
 const customerOrdersRetryPayloads = [];
 const shipmentPayloads = [];
 
 let firstOrderId = null;

 for (let i = 0; i < qty; i++) {
 const uniqueOrderId = await generateUniqueOrderId();
 if (!firstOrderId) firstOrderId = uniqueOrderId;
 const statusText = `Your order has been placed successfully on ${formattedDateTime}, Order ID: ${uniqueOrderId}`;

 const basePayload = {
 "admin id": adminId || null,
 // "cluster id" should not be set during customer order placement
 // "hub manager id" should not be set during customer order placement
 "selller id": product.seller_id,
 "customer id": customerData.id,
 "product id": product.id,
 "full name": selectedAddress.fullName || selectedAddress['full name'],
 "mobile number": selectedAddress.mobileNumber || selectedAddress['mobile number'],
 "full address": selectedAddress.fullAddress || selectedAddress['full address'],
 "pincode": selectedAddress.pincode || selectedAddress['pincode'],
 "landmark": selectedAddress.landmark || selectedAddress['landmark'],
 "address type": selectedAddress.addressType || selectedAddress['address type'],
 "product image": images[0] || '',
 "product name": product['product name'] || '',
 "product tittle name": product['product title name'] || '',
 "product discription": product['product description'] || '',
 "key features": product['key features'] || [],
 "total quantity": "1",
 "size": selectedSize || 'N/A',
 "colour": selectedColor || 'N/A',
 "weight": selectedWeight || 'N/A',
 "total price info": itemPriceInfo.toFixed(2),
 "total selling price": itemPrice.toFixed(2),
 "total discount": itemDiscount.toFixed(2),
 "total delevery charge": itemDelCharge.toFixed(2),
 "total amount": itemFinalAmount.toFixed(2),
 "payment method": selectedPaymentMethod === 'GiftCash' ? "Prepaid" : "Cash on Delivery",
 "order ID": uniqueOrderId,
 "order status": statusText
 };

 const custOrderPayload = {
 ...basePayload,
 "gift cash donation": itemGd.toFixed(2)
 };

 const shipPayload = {
 ...basePayload,
 "gift cash donation": itemGd.toFixed(2),
 "total gross rate": itemGrossRate.toFixed(2),
 "total cgst": itemCgst.toFixed(2),
 "total sgst": itemSgst.toFixed(2),
 "shipment status": statusText,
 "shipment type": "ready to accept",
 "product SKU code": product['product_sku_code'] || '',
 "HSN code": product['hsn code'] || '',
 };

 customerOrdersPayloads.push(custOrderPayload);
 customerOrdersRetryPayloads.push(basePayload);
 shipmentPayloads.push(shipPayload);
 }

 const chunkSize = 2;
 for (let i = 0; i < customerOrdersPayloads.length; i += chunkSize) {
 const chunk = customerOrdersPayloads.slice(i, i + chunkSize);
 const { error: error1 } = await supabase.from('customer_orders').insert(chunk);
 
 if (error1) {
 if (error1.code === 'PGRST204') {
 const retryChunk = customerOrdersRetryPayloads.slice(i, i + chunkSize);
 const { error: retryError } = await supabase.from('customer_orders').insert(retryChunk);
 if (retryError) {
 console.error("Order insertion retry failed:", retryError);
 throw retryError;
 }
 } else {
 console.error("Order insertion failed:", error1);
 throw error1;
 }
 }
 }
 
 for (let i = 0; i < shipmentPayloads.length; i += chunkSize) {
 const chunk = shipmentPayloads.slice(i, i + chunkSize);
 const { error: error2 } = await supabase.from('accepted_shipments').insert(chunk);
 if (error2) {
 console.error("Shipment insertion failed:", error2);
 throw error2;
 }
 }

 if (selectedPaymentMethod === 'GiftCash') {
   try {
     const { data: gcData } = await supabase
       .from('gift_cash')
       .select('"claimed gift cash", "used gift cash"')
       .eq('customer id', customerData.id)
       .maybeSingle();

     if (gcData) {
       const currentClaimed = parseFloat(gcData['claimed gift cash'] || '0') || 0;
       const currentUsed = parseFloat(gcData['used gift cash'] || '0') || 0;
       
       const newClaimed = Math.max(0, currentClaimed - finalAmount);
       const newUsed = currentUsed + finalAmount;

       await supabase
         .from('gift_cash')
         .update({
           'claimed gift cash': newClaimed.toString(),
           'used gift cash': newUsed.toString()
         })
         .eq('customer id', customerData.id);
     }
   } catch (gcErr) {
     console.error("Gift cash update error:", gcErr);
   }
 }

 setSuccessOrderInfo({ id: firstOrderId, date: formattedDateTime });
 setCheckoutStep('success');
 } catch (err) {
 console.error("Order confirmation failed:", err);
 alert('Failed to place order. Please try again.');
 } finally {
 setIsConfirmingOrder(false);
 }
 };

 if (showSellerProfile) {
 const shopName = sellerInfo?.shop_name || sellerInfo?.seller_name || product['seller name'] || 'Suriyawan Shopping Shop';
 const trustYears = sellerInfo?.trust_years_in_business || '5';

 return (
 <div className="fixed inset-0 z-[400] bg-white overflow-y-auto no-scrollbar pb-6 animate-in slide-in-from-bottom duration-300">
 {/* Header */}
 <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between p-4">
 <button onClick={() => setShowSellerProfile(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
 <ArrowLeft size={20} />
 </button>
 </div>

 {/* Hero Section */}
 <div className="relative w-full overflow-hidden flex flex-col items-center pt-10 pb-12">
 {/* Diamond Premium Background Pattern */}
 <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 -z-10"></div>
 <div className="absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(circle,_rgba(255,255,255,0.9)_0%,_transparent_70%)] blur-2xl -z-10"></div>
 <div className="absolute bottom-0 left-0 w-72 h-72 bg-[radial-gradient(circle,_rgba(165,243,252,0.4)_0%,_transparent_70%)] blur-2xl -z-10"></div>
 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] opacity-70 -z-10"></div>
 
 <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-slate-100 via-white to-blue-50 text-indigo-900 flex items-center justify-center text-5xl font-serif font-black shadow-[0_0_40px_rgba(165,243,252,0.6)] mb-5 border-[4px] border-white ring-4 ring-blue-100/50 relative z-10 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent transform -skew-x-12 translate-x-full"></div>
 {shopName.substring(0,2).toUpperCase()}
 </div>

 <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 mb-3 ring-1 ring-white/60">
 <Store size={12} fill="currentColor" />
 PREMIUM MEMBER
 </div>

 <h2 className="text-3xl font-serif font-bold text-slate-800 text-center px-4 leading-tight mb-4 tracking-wide shadow-white drop-shadow-md">
 {shopName}
 </h2>

 <div className="bg-white/60 border border-white backdrop-blur-md text-indigo-800 text-xs font-bold px-5 py-2 rounded-full uppercase tracking-[0.15em] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
 {trustYears} YEARS OF EXCELLENCE
 </div>
 </div>
 
 {/* About Section */}
 <div className="px-4 py-4 bg-white min-h-[300px]">
 <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Store size={20} className="text-[#FF5500]" />
 <h3 className="text-sm font-extrabold text-slate-900 font-devanagari">हमारे बारे में</h3>
 </div>
 <div className="bg-gradient-to-r from-orange-100 via-white to-green-100 border border-slate-200 rounded text-[10px] font-black px-2 py-1 flex items-center gap-1.5 text-slate-800">
 <img src="https://flagcdn.com/w20/in.png" alt="India Flag" className="w-4 h-3 object-cover rounded-[1px]" />
 PROUDLY INDIAN
 </div>
 </div>

 <p className="text-[13px] font-devanagari font-medium text-slate-700 leading-relaxed text-justify">
 सुरियांवां शॉपिंग (Suriyawan Shopping) पर <span className="font-extrabold text-slate-900">{shopName}</span> आपका हार्दिक स्वागत करता है! हम पिछले <span className="font-extrabold text-[#FF5500]">{trustYears} वर्षों</span> से आपकी सेवा में बेहतरीन और उच्च गुणवत्ता वाले उत्पाद पूरी जिम्मेदारी के साथ उपलब्ध करा रहे हैं। हमारा लक्ष्य सिर्फ सामान बेचना नहीं है, बल्कि एक ऐसा मजबूत भरोसा कायम करना है जिस पर आप हमेशा आंख मूंदकर विश्वास कर सकें। आप निश्चिंत होकर हमारे असली और शानदार प्रोडक्ट्स की खरीदारी करें और एक बेजोड़ अनुभव का आनंद लें। आपके भरोसे और अटूट प्यार के लिए बहुत-बहुत धन्यवाद!
 </p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-xs flex flex-col w-full h-full overflow-hidden animate-in fade-in duration-200">
 <div className="bg-[#f8fafc] w-full min-h-full flex flex-col overflow-hidden">
 
 {/* Full Screen Header */}
 {!isCustomerView && (
 <header className="sticky top-0 z-30 bg-orange-600 text-white px-3 sm:px-6 py-3 flex items-center justify-between shadow-md border-b border-orange-700 shrink-0">
 <div className="flex items-center gap-2 sm:gap-3 overflow-hidden flex-1 mr-2">
 {/* Status Tag placed in top-left header */}
 <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 border border-white/20 shrink-0 ${
 status === 'Active' 
 ? 'bg-emerald-500 text-white' 
 : status === 'Inactive' 
 ? 'bg-rose-500 text-white' 
 : 'bg-indigo-500 text-white'
 }`}>
 <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
 <span>{status === 'Active' ? 'Active' : status === 'Inactive' ? 'Inactive' : 'Draft'}</span>
 </span>
 <div className="flex flex-col min-w-0">
 <h1 className="text-sm sm:text-base font-bold truncate text-white leading-tight">
 {product['product name'] || 'Product Details'}
 </h1>
 <span className="text-[11px] font-mono text-orange-100 truncate">
 SKU: {product['product_sku_code'] || 'NO-SKU'}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button 
 onClick={onClose} 
 className="p-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer flex items-center justify-center"
 title="Close details"
 >
 <X size={20} />
 </button>
 </div>
 </header>
 )}

 {/* Scrollable Page Body */}
 
 {isCustomerView ? (
 <>
 {/* CUSTOMER PREMIUM VIEW */}
 {checkoutStep === 'details' && (
 <>
 <main ref={mainScrollRef} className="flex-1 overflow-y-auto bg-slate-50 relative w-full max-w-lg mx-auto pb-24">
 {/* Main Image */}
 <div className="relative w-full bg-white shadow-sm mb-2">
 
 <div 
 id="customer-product-img-slider"
 className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
 onScroll={(e) => {
 const el = e.currentTarget;
 const index = Math.round(el.scrollLeft / el.clientWidth);
 if (index !== selectedImgIndex) setSelectedImgIndex(index);
 }}
 >
 {images.map((img, idx) => (
 <div key={idx} className="w-full flex-shrink-0 snap-center relative">
 <img 
 src={img} 
 alt={product['product name'] || 'Product Image'} 
 className="w-full aspect-[4/5] object-cover cursor-zoom-in"
 onClick={() => setFullScreenImage(img)}
 />
 </div>
 ))}
 </div>

 {/* Tag Badge on Image */}
 <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start z-10">
 {categoryTags && categoryTags.length > 0 && categoryTags.map((tag, idx) => {
 const colorClass = getTagColor(tag);
 return (
 <div key={`ct-${idx}`} className={`${colorClass} font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg max-w-[200px] truncate`}>
 {tag}
 </div>
 );
 })}
 {tags && tags.length > 0 && tags.map((tag, idx) => {
 const colorClass = getTagColor(tag);
 return (
 <div key={`t-${idx}`} className={`${colorClass} font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg max-w-[200px] truncate`}>
 {tag}
 </div>
 );
 })}
 </div>
 
 {/* Image Pagination Dots */}
 {images.length > 1 && (
 <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
 {images.map((_, idx) => (
 <div 
 key={idx} 
 className={`w-1.5 h-1.5 rounded-full transition-all ${idx === selectedImgIndex ? 'bg-orange-500 w-3' : 'bg-gray-300'}`} 
 />
 ))}
 </div>
 )}
 </div>
 
 {/* Thumbnails if multiple */}
 {images.length > 1 && (
 <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar bg-white">
 {images.map((img, idx) => (
 <button
 key={idx}
 onClick={(e) => { e.stopPropagation(); setSelectedImgIndex(idx); document.getElementById('customer-product-img-slider')?.scrollTo({ left: idx * (document.getElementById('customer-product-img-slider')?.clientWidth || 0), behavior: 'smooth' }); }}
 className={`w-16 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-all ${selectedImgIndex === idx ? 'border-orange-500 shadow-md ring-2 ring-orange-100' : 'border-gray-100 hover:border-gray-300'}`}
 >
 <img src={img} alt="thumb" className="w-full h-full object-cover" />
 </button>
 ))}
 </div>
 )}

 <div className="px-4 py-4 bg-white shadow-sm flex flex-col gap-4">
 
 {/* Name, Title, Pricing Row */}
 <div className="flex justify-between items-start gap-4">
 <div className="flex flex-col flex-1">
 <div className="flex flex-wrap items-baseline gap-1.5">
 <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
 {product['product name'] || 'Unnamed Product'}
 </h1>
 {product['product title name'] && (
 <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
 {product['product title name']}
 </span>
 )}
 </div>
 <div className="flex items-center gap-2 mt-1">
 <p className="text-[10px] text-slate-400 font-medium">Inclusive of all taxes</p>
 <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded shadow-2xs border border-blue-100 shrink-0">
 <Eye size={10} className="text-blue-500" />
 <span className="text-[9px] font-black text-blue-700">{formatViewsCount(localViews)}</span>
 </div>
 </div>
 </div>
 <div className="flex flex-col items-end shrink-0">
 <div className="flex items-center gap-2">
 {marketValue > 0 && (
 <span className="text-sm text-slate-400 line-through font-semibold">
 ₹ {marketValue.toFixed(0)}
 </span>
 )}
 <span className="text-xl font-extrabold text-slate-900 tracking-tighter">
 ₹ {sellingPrice.toFixed(0)}
 </span>
 </div>
 {discountVal > 0 && (
 <span className="text-xs font-black text-green-600 mt-0.5">{discountVal}% OFF</span>
 )}
 </div>
 </div>

 
 
 {/* Beautiful Hindi Quote */}
 <div className="py-2.5 border-y border-orange-100 bg-gradient-to-r from-orange-50 to-white text-center mt-2 rounded-xl">
 <p className="text-[12px] font-medium text-orange-800 italic font-devanagari px-4 leading-snug">
 "Swadeshi apnayein, apna aane wala kal thos aur sundar banayein. Har kharid par bharosa aur pramanta ka wada."
 </p>
 </div>
 
 {/* Variants Selection (Color, Size, Weight) */}
 {((product['color'] && product['color'].length > 0) || (product['size'] && product['size'].length > 0) || (product['weight'] && product['weight'].length > 0)) && (
 <div className="flex flex-col gap-4 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
 {product['color'] && product['color'].length > 0 && (
 <div className="flex flex-col gap-2">
 <span className={`text-[11px] font-bold uppercase tracking-wider ${missingSelections.includes('Color') ? 'text-red-500 animate-bounce' : 'text-slate-600'}`}>Color Varieties {missingSelections.includes('Color') && '(Required)'}</span>
 <div className={`flex flex-wrap gap-2 p-1 rounded-xl transition-colors ${missingSelections.includes('Color') ? 'bg-red-50 ring-2 ring-red-400/50' : ''}`}>
 {product['color'].map((colorItem: any, idx: number) => (
 <button 
 key={idx}
 onClick={() => setSelectedColor(colorItem.name)}
 className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${selectedColor === colorItem.name ? 'border-slate-900 bg-slate-50 shadow-md ring-1 ring-slate-900' : 'border-slate-200 bg-white hover:border-slate-400'}`}
 >
 {colorItem.hex ? (
 <div className="w-10 h-10 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: colorItem.hex }}></div>
 ) : (
 <div className="w-10 h-10 rounded-lg border border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">?</div>
 )}
 <span className={`text-[11px] font-bold text-center w-full max-w-[70px] truncate ${selectedColor === colorItem.name ? 'text-slate-900' : 'text-slate-600'}`}>
 {colorItem.name}
 </span>
 </button>
 ))}
 </div>
 </div>
 )}
 
 {product['size'] && product['size'].length > 0 && (
 <div className="flex flex-col gap-2">
 <span className={`text-[11px] font-bold uppercase tracking-wider ${missingSelections.includes('Size') ? 'text-red-500 animate-bounce' : 'text-slate-600'}`}>Size Varieties {missingSelections.includes('Size') && '(Required)'}</span>
 <div className={`flex flex-wrap gap-2 p-1 rounded-xl transition-colors ${missingSelections.includes('Size') ? 'bg-red-50 ring-2 ring-red-400/50' : ''}`}>
 {product['size'].map((size: string, idx: number) => (
 <button 
 key={idx}
 onClick={() => setSelectedSize(size)}
 className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${selectedSize === size ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
 >
 {size}
 </button>
 ))}
 </div>
 </div>
 )}

 {product['weight'] && product['weight'].length > 0 && (
 <div className="flex flex-col gap-2">
 <span className={`text-[11px] font-bold uppercase tracking-wider ${missingSelections.includes('Weight') ? 'text-red-500 animate-bounce' : 'text-slate-600'}`}>Weight / Volume Varieties {missingSelections.includes('Weight') && '(Required)'}</span>
 <div className={`flex flex-wrap gap-2 p-1 rounded-xl transition-colors ${missingSelections.includes('Weight') ? 'bg-red-50 ring-2 ring-red-400/50' : ''}`}>
 {product['weight'].map((weight: string, idx: number) => (
 <button 
 key={idx}
 onClick={() => setSelectedWeight(weight)}
 className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${selectedWeight === weight ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
 >
 {weight}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Quantity Selector */}
 {isCustomerView && (
 <div className="flex flex-col gap-2 mt-3 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
 <h3 className="font-extrabold text-slate-900 text-[13px] flex items-center gap-1.5">
 <ShoppingBag size={14} className="text-blue-600" />
 Select Quantity
 </h3>
 <div className="flex items-center justify-between gap-2">
 <div className="flex flex-col">
 <span className="text-[11px] font-bold text-slate-700 leading-tight">Choose your required quantity</span>
 </div>
 <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm shrink-0">
 <button 
 onClick={() => setQuantity(q => Math.max(parseInt(product['minimum order quantity']?.toString() || '1') || 1, q - 1))}
 className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600 font-bold transition-colors active:bg-slate-100"
 >
 <Minus size={14} />
 </button>
 <div className="px-2.5 py-1.5 text-xs font-extrabold text-slate-800 border-x border-slate-200 min-w-[2rem] text-center">
 {quantity}
 </div>
 <button 
 onClick={() => setQuantity(q => q + 1)}
 className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-600 font-bold transition-colors active:bg-slate-100"
 >
 <Plus size={14} />
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Key Features */}
 {product['key features'] && product['key features'].length > 0 && (
 <div className="flex flex-col gap-3 mt-2">
 <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
 <ShieldCheck size={16} className="text-emerald-500" />
 Key Features
 </h3>
 <ul className="flex flex-col gap-2">
 {product['key features'].map((feature: string, idx: number) => (
 <li key={idx} className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></span>
 <span className="text-xs text-slate-600 font-medium leading-relaxed">{feature}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>

 <div className="w-full h-2 bg-slate-100"></div>

 {/* Delivery & Services */}
 {!isTopService && (
 <div className="px-4 py-5 bg-white flex flex-col shadow-sm">
 <h3 className="font-extrabold text-slate-800 text-sm tracking-widest mb-4 uppercase">DELIVERY & SERVICES</h3>
 
 <div className="flex items-start gap-3 mb-4">
 <Truck size={24} className="text-blue-500 shrink-0 mt-0.5" />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-900">Standard Delivery by Aug 21</span>
 <span className="text-xs text-slate-500 mt-0.5">Free delivery, no extra money to pay</span>
 </div>
 </div>

 <div className="flex items-start gap-3 mb-5">
 <Banknote size={24} className="text-emerald-500 shrink-0 mt-0.5" />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-900">Cash on Delivery (COD) ONLY</span>
 <span className="text-xs text-slate-500 mt-0.5">No online payment required. Pay when you buy.</span>
 </div>
 </div>

 <div className="p-3 border border-slate-100 bg-slate-50/70 rounded-2xl flex items-center justify-between">
 <div className="flex flex-col">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">SOLD BY</span>
 <span className="text-sm font-extrabold text-[#00227A]">
 {sellerInfo?.shop_name || sellerInfo?.seller_name || product['seller name'] || 'Unknown Seller'}
 </span>
 </div>
 <button 
 onClick={() => setShowSellerProfile(true)}
 className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
 >
 View Shop
 </button>
 </div>
 </div>
 )}
 
 <div className="w-full h-2 bg-slate-100"></div>

 {/* Description */}
 {product['product description'] && (
 <div className="px-4 py-5 bg-white shadow-sm flex flex-col gap-3">
 <h3 className="font-extrabold text-slate-800 text-sm tracking-widest uppercase">PRODUCT DESCRIPTION</h3>
 <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">
 {product['product description']}
 </p>
 </div>
 )}

 <div className="w-full h-2 bg-slate-100"></div>

 {/* Ratings & Reviews */}
 <div className="px-4 py-8 bg-white flex flex-col min-h-[220px]">
 <div className="w-full flex justify-between items-center mb-6">
 <h3 className="font-extrabold text-slate-800 text-sm tracking-widest uppercase">RATINGS & REVIEWS</h3>
 {avgRating > 0 && (
 <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
 <span className="text-xs font-black text-yellow-700">{avgRating.toFixed(1)}</span>
 <Star size={12} className="fill-yellow-500 text-yellow-500" />
 <span className="text-[10px] font-semibold text-yellow-600">({productRatings.length >= 1000 ? new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(productRatings.length).toLowerCase() : productRatings.length} {productRatings.length === 1 ? 'Rating' : 'Ratings'})</span>
 </div>
 )}
 </div>
 
 {productRatings.length > 0 ? (
 <div className="flex flex-col gap-3">
 {productRatings.map((rating, idx) => (
 <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-bold text-slate-800">{rating['full name'] || 'Customer'}</span>
 <div className="flex items-center gap-0.5">
 {[1,2,3,4,5].map(star => (
 <span key={star} className={`text-[10px] ${star <= Number(rating['rating star']) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
 ))}
 </div>
 </div>
 {rating['rating discription'] && (
 <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{rating['rating discription']}</p>
 )}
 <span className="text-[9px] text-slate-400 mt-2 block">{new Date(rating.created_at).toLocaleDateString()}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center my-6">
 <Star size={44} className="text-slate-300 mb-3 stroke-[1.5]" />
 <span className="text-sm font-bold text-slate-700">No Ratings Yet</span>
 <span className="text-[11px] text-slate-400 mt-1">Be the first to review this product!</span>
 </div>
 )}
 </div>

 <div className="w-full h-2 bg-slate-50"></div>

 {/* Three Features */}
 {!isTopService && (
 <div className="px-2 py-6 bg-white grid grid-cols-3 gap-2 divide-x divide-slate-100 border-b border-slate-100">
 <div className="flex flex-col items-center justify-start text-center px-1">
 <RotateCcw size={18} className="text-blue-500 mb-2 stroke-2" />
 <span className="text-[10px] font-bold text-slate-900 leading-tight">Same Time<br/>Return</span>
 </div>
 <div className="flex flex-col items-center justify-start text-center px-1">
 <Handshake size={18} className="text-orange-500 mb-2 stroke-2" />
 <span className="text-[10px] font-bold text-slate-900 leading-tight">100% Buyer<br/>Protection</span>
 </div>
 <div className="flex flex-col items-center justify-start text-center px-1">
 <Headphones size={18} className="text-emerald-500 mb-2 stroke-2" />
 <span className="text-[10px] font-bold text-slate-900 leading-tight">24/7 Priority<br/>Support</span>
 </div>
 </div>
 )}

 {/* Related Products Section */}
 {isCustomerView && relatedProducts.length > 0 && (
 <div className="bg-slate-50 py-6 flex flex-col w-full">
 <div className="px-4 mb-3 flex items-center justify-between">
 <h3 className="font-extrabold text-slate-800 text-sm tracking-widest uppercase">Related Products</h3>
 </div>
 
 {/* First Line: Horizontal Scroll inside Gray Border Strip */}
 <div className="w-full bg-slate-100 border-y-2 border-slate-200 py-0.5 mb-2 mt-1">
 <div className="w-full overflow-x-auto no-scrollbar px-0.5 snap-x snap-mandatory">
 <div className="flex items-stretch gap-0.5 w-max">
 {relatedProducts.slice(0, 10).map(p => (
 <div key={`hz-${p.id}`} className="w-[140px] flex-shrink-0 snap-center">
 <ProductCard 
 product={p} 
 status="Active" 
 isCustomerView={true} 
 isHorizontalList={true}
 isInCart={false} 
 onAddToCart={onAddToCart}
 onSelectImage={(prod) => {
 if (onSelectSimilarProduct) onSelectSimilarProduct(prod);
 }}
 />
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Grid: Vertical style below */}
 <div className="p-0.5 mt-0.5 grid grid-cols-2 sm:grid-cols-3 gap-0.5">
 {relatedProducts.map(p => (
 <ProductCard 
 key={`vt-${p.id}`}
 product={p} 
 status="Active" 
 isCustomerView={true} 
 isInCart={false} 
 onAddToCart={onAddToCart}
 onSelectImage={(prod) => {
 if (onSelectSimilarProduct) onSelectSimilarProduct(prod);
 }}
 />
 ))}
 </div>
 </div>
 )}
</main>
 
 <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2 sticky bottom-0 z-10 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] max-w-lg mx-auto w-full">
 {missingSelections.length > 0 && !isTopService && (
 <div className="bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-lg border border-red-200 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 text-center">
 ⚠️ Please select {((product.color && product.color.length > 0 ? 1 : 0) + (product.size && product.size.length > 0 ? 1 : 0) + (product.weight && product.weight.length > 0 ? 1 : 0)) >= 3 ? `at least 2 options (${missingSelections.join(', ')})` : missingSelections.join(', ')} before proceeding.
 </div>
 )}
 <div className="flex items-center gap-2 w-full">
 {isTopService ? (
 <>
 <a href={`tel:${product['mobile number'] || ''}`} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95 text-center flex items-center justify-center gap-2">
 📞 Call
 </a>
 <button 
 onClick={() => { 
 const baseLink = contactLink || (product['mobile number'] ? `https://wa.me/91${product['mobile number'].toString().replace(/\D/g, '').slice(-10)}` : '');
 if (baseLink) {
 window.open(baseLink, '_blank');
 } else {
 alert('Contact information is currently unavailable for this service.');
 }
 }} 
 className="flex-1 py-3 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl font-bold text-sm transition-all active:scale-95 text-center flex items-center justify-center gap-2"
 >
 💬 Inform
 </button>
 </>
 ) : (
 <>
 <button 
 className={`flex-1 py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center active:scale-95 ${isInCart ? 'bg-slate-300 text-slate-500 cursor-default' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
 onClick={async () => {
 const available = [];
 if (product.color && product.color.length > 0) available.push('Color');
 if (product.size && product.size.length > 0) available.push('Size');
 if (product.weight && product.weight.length > 0) available.push('Weight');
 
 const missing = [];
 if (available.includes('Color') && !selectedColor) missing.push('Color');
 if (available.includes('Size') && !selectedSize) missing.push('Size');
 if (available.includes('Weight') && !selectedWeight) missing.push('Weight');
 
 if (available.length >= 3 && (available.length - missing.length) >= 2) {
 missing.length = 0; // Clear missing if 2 are already selected
 }
 
 if (missing.length > 0) {
 setMissingSelections(missing);
 return;
 }
 
 setMissingSelections([]);
 if (!isInCart && onAddToCart) {
 setIsAddingToCart(true);
 await onAddToCart({ ...product, "minimum order quantity": quantity, "color": selectedColor ? [{name: selectedColor}] : product.color, "size": selectedSize ? [selectedSize] : product.size, "weight": selectedWeight ? [selectedWeight] : product.weight });
 setIsAddingToCart(false);
 }
 }}
 disabled={isInCart || isAddingToCart}
 >
 {isAddingToCart ? (
 <MoreHorizontal size={20} className="animate-pulse" />
 ) : (
 isInCart ? 'Added' : 'Add to Cart'
 )}
 </button>
 <button 
 onClick={() => {
 const available = [];
 if (product.color && product.color.length > 0) available.push('Color');
 if (product.size && product.size.length > 0) available.push('Size');
 if (product.weight && product.weight.length > 0) available.push('Weight');
 
 const missing = [];
 if (available.includes('Color') && !selectedColor) missing.push('Color');
 if (available.includes('Size') && !selectedSize) missing.push('Size');
 if (available.includes('Weight') && !selectedWeight) missing.push('Weight');
 
 if (available.length >= 3 && (available.length - missing.length) >= 2) {
 missing.length = 0; // Clear missing if 2 are already selected
 }
 
 if (missing.length > 0) {
 setMissingSelections(missing);
 return;
 }
 
 setMissingSelections([]);
 setCheckoutStep('address_selection');
 }}
 className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-extrabold text-sm transition-all active:scale-95 shadow-lg shadow-orange-500/30">
 Buy Now
 </button>
 </>
 )}
 </div>
 </div>
 </>
 )}

 {checkoutStep === 'address_selection' && (
 <div className="flex-1 overflow-y-auto bg-slate-50 relative w-full max-w-lg mx-auto flex flex-col">
 <div className="sticky top-0 z-50 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button onClick={() => setCheckoutStep('details')} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
 <ArrowLeft size={18} />
 </button>
 <h2 className="font-bold text-slate-900">Select Delivery Address</h2>
 </div>
 </div>
 
 <div className="p-4 space-y-4 flex-1">
 {savedAddresses.length > 0 ? (
 savedAddresses.map((addr, idx) => {
 const isSelected = selectedAddressId === addr.id;
 return (
 <div 
 key={idx} 
 onClick={() => setSelectedAddressId(addr.id)}
 className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer relative overflow-hidden transition-colors ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
 >
 <button 
 onClick={(e) => {
 e.stopPropagation();
 setEditingAddressId(addr.id);
 setNewAddress(addr);
 setCheckoutStep('add_address');
 }}
 className={`absolute top-0 right-0 w-10 h-10 rounded-bl-3xl flex items-center justify-center pl-2 pb-2 transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-blue-100 hover:text-blue-600'}`}
 >
 <Edit size={16} />
 </button>
 <div className="flex items-center gap-2 mb-2">
 <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{addr.addressType}</span>
 <h3 className="font-bold text-slate-800 text-sm">{addr.fullName}</h3>
 </div>
 <p className="text-sm text-slate-600 leading-relaxed mb-1">{addr.fullAddress}</p>
 {addr.landmark && <p className="text-xs text-slate-500 mb-1">Landmark: {addr.landmark}</p>}
 <p className="text-sm font-semibold text-slate-800">Phone: {addr.mobileNumber} • Pin: {addr.pincode}</p>
 </div>
 );
 })
 ) : (
 <div className="text-center py-10">
 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
 <Store size={28} className="text-blue-500" />
 </div>
 <h3 className="font-bold text-slate-800 mb-1">No saved addresses</h3>
 <p className="text-sm text-slate-500">Please add an address to continue</p>
 </div>
 )}

 {savedAddresses.length < 2 && (
 <button 
 onClick={() => { 
 setEditingAddressId(null);
 setNewAddress({ 
 addressType: 'Home', 
 fullName: customerData?.full_name || '', 
 mobileNumber: customerData?.mobile_number || '',
 fullAddress: customerData?.full_address || '',
 pincode: customerData?.pincode || '',
 landmark: ''
 }); 
 setCheckoutStep('add_address'); 
 }}
 className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-blue-600 font-bold hover:bg-blue-50 transition-colors"
 >
 <Plus size={18} />
 Add New Address
 </button>
 )}
 </div>

 <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
 <button 
 disabled={!selectedAddressId}
 onClick={() => setCheckoutStep('order_summary')}
 className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg flex justify-center items-center ${selectedAddressId ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
 >
 Continue
 </button>
 </div>
 </div>
 )}

 {checkoutStep === 'add_address' && (
 <div className="flex-1 overflow-y-auto bg-slate-50 relative w-full max-w-lg mx-auto flex flex-col">
 <div className="sticky top-0 z-50 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button 
 type="button"
 onClick={() => { 
 setEditingAddressId(null); 
 setCheckoutStep('address_selection'); 
 }} 
 className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="font-bold text-slate-900">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h2>
 </div>
 </div>
 
 <div className="p-4 space-y-4 flex-1">
 <div className="space-y-3">
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
 <input 
 type="text" 
 value={newAddress.fullName || ''} 
 onChange={(e) => {
 const val = e.target.value;
 setNewAddress(prev => ({ ...prev, fullName: val }));
 }} 
 className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" 
 placeholder="Enter your full name" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
 <input 
 type="tel" 
 maxLength={10} 
 pattern="[0-9]*" 
 value={newAddress.mobileNumber || ''} 
 onChange={(e) => {
 const val = e.target.value.replace(/\D/g, '');
 setNewAddress(prev => ({ ...prev, mobileNumber: val }));
 }} 
 className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" 
 placeholder="10-digit mobile number" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1">Full Address</label>
 <textarea 
 value={newAddress.fullAddress || ''} 
 onChange={(e) => {
 const val = e.target.value;
 setNewAddress(prev => ({ ...prev, fullAddress: val }));
 }} 
 rows={3} 
 className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow resize-none" 
 placeholder="House/Flat No., Area, City, State" 
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
 <input 
 type="text" 
 maxLength={6} 
 pattern="[0-9]*" 
 value={newAddress.pincode || ''} 
 onChange={(e) => {
 const val = e.target.value.replace(/\D/g, '');
 setNewAddress(prev => ({ ...prev, pincode: val }));
 }} 
 className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" 
 placeholder="6 digits" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1">Landmark (Optional)</label>
 <input 
 type="text" 
 value={newAddress.landmark || ''} 
 onChange={(e) => {
 const val = e.target.value;
 setNewAddress(prev => ({ ...prev, landmark: val }));
 }} 
 className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" 
 placeholder="E.g. Near park" 
 />
 </div>
 </div>
 
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-2 mt-2">Address Type</label>
 <div className="flex gap-2">
 {['Home', 'Office', 'Other'].map(type => (
 <button
 key={type}
 type="button"
 onClick={() => setNewAddress(prev => ({ ...prev, addressType: type as any }))}
 className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${newAddress.addressType === type ? 'bg-blue-100 text-blue-700 border-blue-500 ring-1 ring-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
 >
 {type}
 </button>
 ))}
 </div>
 </div>

 <div className="pt-4">
 <button 
 onClick={async () => {
 const isFormValid = newAddress.fullName && newAddress.mobileNumber?.length === 10 && newAddress.fullAddress && newAddress.pincode?.length === 6;
 if (!isFormValid) return;
 
 setIsSavingAddress(true);
 try {
 let data, error;
 const payload = {
 "customer id": customerData?.id,
 "full name": newAddress.fullName,
 "mobile number": newAddress.mobileNumber,
 "full address": newAddress.fullAddress,
 "pincode": newAddress.pincode,
 "landmark": newAddress.landmark || '',
 "address type": newAddress.addressType
 };

 if (editingAddressId) {
 const res = await supabase.from('customer_address').update(payload).eq('id', editingAddressId).select().single();
 data = res.data;
 error = res.error;
 } else {
 const res = await supabase.from('customer_address').insert([payload]).select().single();
 data = res.data;
 error = res.error;
 }
 
 if (error) {
 console.error("Error saving address:", error);
 alert("Failed to save address.");
 } else {
 const addr = { 
 ...newAddress, 
 id: data?.id || Date.now().toString() 
 } as Address;
 
 let updated;
 if (editingAddressId) {
 updated = savedAddresses.map(a => a.id === editingAddressId ? addr : a);
 } else {
 updated = [...savedAddresses, addr];
 }
 setSavedAddresses(updated);
 setSelectedAddressId(addr.id);
 
 setNewAddress({ addressType: 'Home' });
 setEditingAddressId(null);
 setCheckoutStep('address_selection');
 }
 } catch (err) {
 console.error(err);
 } finally {
 setIsSavingAddress(false);
 }
 }}
 disabled={isSavingAddress || !newAddress.fullName || !newAddress.mobileNumber || newAddress.mobileNumber.length !== 10 || !newAddress.fullAddress || !newAddress.pincode || newAddress.pincode.length !== 6}
 className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all flex justify-center items-center ${(isSavingAddress || !newAddress.fullName || !newAddress.mobileNumber || newAddress.mobileNumber.length !== 10 || !newAddress.fullAddress || !newAddress.pincode || newAddress.pincode.length !== 6) ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-lg shadow-blue-500/30'}`}
 >
 {isSavingAddress ? (
 <div className="flex items-center gap-1.5 text-white">
 <span>Saving</span>
 <div className="flex space-x-1 mt-1">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
 </div>
 </div>
 ) : 'Save Address'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 {checkoutStep === 'order_summary' && (() => {
 const selAddr = savedAddresses.find(a => a.id === selectedAddressId);
 
 const parseAmt = (val: any) => parseFloat(String(val || '0').replace(/[^0-9.]/g, '')) || 0;
 
 const sp = parseAmt(product['selling price']);
 const priceInfo = parseAmt(product['price info']);
 const qty = quantity;
 const totalPrice = sp * qty;
 const totalPriceInfo = priceInfo * qty;
 const discount = Math.max(0, totalPriceInfo - totalPrice);
 
 const delChargeType = product['delivery charge type']?.toString()?.toLowerCase() || 'per_order';
 const baseDelCharge = parseAmt(product['delivery charge']);
 const totalDelCharge = delChargeType === 'per_quantity' ? (baseDelCharge * qty) : baseDelCharge;
 
 const finalAmount = totalPrice + totalDelCharge;

 return (
 <div className="flex-1 overflow-y-auto bg-slate-50 relative w-full max-w-lg mx-auto flex flex-col">
 <div className="sticky top-0 z-50 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button onClick={() => setCheckoutStep('address_selection')} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
 <ArrowLeft size={18} />
 </button>
 <h2 className="font-bold text-slate-900">Order Summary</h2>
 </div>
 </div>
 
 <div className="p-4 space-y-4 flex-1">
 {/* Product Details */}
 <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3">
 <div className="flex gap-4 items-start">
 <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
 <img src={images[0] || ''} alt={product['product name']?.toString()} className="w-full h-full object-cover" />
 </div>
 <div className="flex-1 flex flex-col min-w-0">
 <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{product['product name']?.toString()}</h4>
 <p className="text-xs text-slate-500 truncate mt-0.5">{product['product title name']?.toString()}</p>
 {(selectedColor || selectedSize || selectedWeight) && (
 <div className="flex flex-wrap gap-1.5 mt-1.5">
 {selectedColor && <span className="bg-slate-50 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium border border-slate-200/60">{selectedColor}</span>}
 {selectedSize && <span className="bg-slate-50 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium border border-slate-200/60">{selectedSize}</span>}
 {selectedWeight && <span className="bg-slate-50 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium border border-slate-200/60">{selectedWeight}</span>}
 </div>
 )}
 <p className="text-sm font-bold text-blue-600 mt-2">Qty: {qty}</p>
 </div>
 </div>
 {product['product description'] && (
 <div className="pt-3 border-t border-slate-100">
 <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Description</h5>
 <p className="text-xs text-slate-600 leading-relaxed">{product['product description']?.toString()}</p>
 </div>
 )}
 </div>

 {/* Delivery Address */}
 {selAddr && (
 <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Address</h3>
 <div className="flex items-center gap-2 mb-1">
 <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{selAddr.addressType || selAddr['address type']}</span>
 <h4 className="font-bold text-slate-800 text-sm">{selAddr.fullName || selAddr['full name']}</h4>
 </div>
 <p className="text-sm text-slate-600 leading-relaxed mb-1">{selAddr.fullAddress || selAddr['full address']}</p>
 {(selAddr.landmark || selAddr['landmark']) && <p className="text-xs text-slate-500 mb-1">Landmark: {selAddr.landmark || selAddr['landmark']}</p>}
 <p className="text-sm font-semibold text-slate-800">Phone: {selAddr.mobileNumber || selAddr['mobile number']} • Pin: {selAddr.pincode || selAddr['pincode']}</p>
 </div>
 )}

 {/* Payment Details */}
 <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Price Details</h3>
 <div className="flex justify-between items-center text-sm font-medium text-slate-600">
 <span>Total Price Info ({qty} item{qty > 1 ? 's' : ''})</span>
 <span>₹ {totalPriceInfo.toFixed(2)}</span>
 </div>
 <div className="flex justify-between items-center text-sm font-medium text-slate-600">
 <span>Total Selling Price</span>
 <span>₹ {totalPrice.toFixed(2)}</span>
 </div>
 {discount > 0 && (
 <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
 <span>Total Discount</span>
 <span>- ₹ {discount.toFixed(2)}</span>
 </div>
 )}
 <div className="flex justify-between items-center text-sm font-medium text-slate-600">
 <span>Total Delivery Charge <span className="text-[10px] text-slate-400">({delChargeType === 'per_quantity' ? 'Per Quantity' : 'Per Order'})</span></span>
 <span>+ ₹ {totalDelCharge.toFixed(2)}</span>
 </div>
 <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center text-base font-black text-slate-800">
 <span>Total Amount</span>
 <span>₹ {finalAmount.toFixed(2)}</span>
 </div>
 </div>


 {/* Gift Cash Option */}
 {showGiftCashOption && (
 <div 
 onClick={() => setSelectedPaymentMethod('GiftCash')}
 className={`bg-white rounded-xl p-4 shadow-sm border mb-4 bg-gradient-to-br from-yellow-50 to-white cursor-pointer transition-all ${selectedPaymentMethod === 'GiftCash' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-yellow-200'}`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shadow-sm">
 <span className="text-xl">🎁</span>
 </div>
 <div className="flex flex-col">
 <span className="font-bold text-slate-800 text-sm">Gift Cash Balance</span>
 <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Available Claimed Cash</span>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-lg font-black text-amber-600">₹ {customerGiftCashBalance.toFixed(2)}</span>
 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'GiftCash' ? 'border-yellow-500 bg-yellow-500' : 'border-slate-300'}`}>
 {selectedPaymentMethod === 'GiftCash' && <div className="w-2 h-2 rounded-full bg-white"></div>}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Choose Payment Method */}
 <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Choose Payment Method</h3>
 <div 
 onClick={() => setSelectedPaymentMethod('COD')}
 className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'COD' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
 >
 <div className="flex items-center gap-3">
 <Banknote size={20} className="text-blue-600" />
 <span className="font-bold text-slate-800 text-sm">Cash on Delivery</span>
 </div>
 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'COD' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
 {selectedPaymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-white"></div>}
 </div>
 </div>
 </div>

 <div className="pt-2 pb-6">
 <button 
 onClick={handleConfirmOrder}
 disabled={isConfirmingOrder}
 className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-sm transition-all shadow-lg active:scale-95 shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
 >
 {isConfirmingOrder ? 'Confirming...' : 'Confirm Order'}
 </button>
 </div>
 </div>
 </div>
 );
 })()}

 {checkoutStep === 'success' && successOrderInfo && (
 <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-16 w-full max-w-lg mx-auto flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 pt-10 sm:pt-6 text-center animate-in fade-in zoom-in duration-300 scale-95 origin-top sm:origin-center">
 <div className="relative w-20 h-20 mb-6 mx-auto shrink-0 aspect-square">
 <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
 <div className="absolute inset-[-8px] bg-emerald-100 rounded-full animate-pulse opacity-60"></div>
 <div className="relative w-full h-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.8)] border-[3px] border-white z-10">
 <Check size={36} className="stroke-[4] drop-shadow-md" />
 </div>
 </div>
 <h2 className="text-xl font-black text-slate-800 mb-1">Order Successfully Placed!</h2>
 <p className="text-slate-500 text-xs font-medium mb-4">Thank you for your purchase.</p>

 <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 w-full mb-4">
 <div className="flex flex-col gap-2 text-left">
 <div>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Order ID</p>
 <p className="text-xs font-bold text-slate-800">{successOrderInfo.id}</p>
 </div>
 <div>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</p>
 <p className="text-xs font-bold text-slate-800">{successOrderInfo.date}</p>
 </div>
 </div>
 </div>

 <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl w-full text-left mb-6">
 <div className="flex items-center gap-1.5 mb-1.5">
 <ShieldCheck size={16} className="text-blue-600" />
 <h3 className="font-bold text-blue-800 text-xs">Open Box Delivery</h3>
 </div>
 <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
 Please inspect your package at the time of delivery. If the product is damaged, cut, dirty, or different from what you ordered, you can refuse the delivery right there. This ensures a safe and secure shopping experience!
 </p>
 </div>

 <div className="w-full flex flex-col gap-3">
 <button 
 onClick={() => { onViewOrders?.(); onClose(); }} 
 className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-sm transition-all shadow-lg active:scale-95 shadow-blue-500/30"
 >
 Track Order
 </button>
 <button 
 onClick={() => onClose()} 
 className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-extrabold text-sm transition-all active:scale-95"
 >
 Continue Shopping
 </button>
 </div>
 </div>
 )}
 </>
 ) : (
 <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 max-w-4xl w-full mx-auto pb-24">

 {/* 1. Image Gallery Section */}
 <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center">
 <div 
 className="relative w-full aspect-16/10 max-h-96 bg-slate-100/80 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 cursor-zoom-in"
 onClick={() => setFullScreenImage(images[selectedImgIndex])}
 >
 <img 
 src={images[selectedImgIndex]} 
 alt={product['product name']} 
 className="w-full h-full object-contain transition-all duration-300"
 style={{ imageRendering: 'high-quality' }}
 />
 {images.length > 1 && (
 <>
 <button 
 onClick={(e) => {
 e.stopPropagation();
 setSelectedImgIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
 }}
 className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md cursor-pointer"
 >
 <ChevronLeft size={20} />
 </button>
 <button 
 onClick={(e) => {
 e.stopPropagation();
 setSelectedImgIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
 }}
 className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md cursor-pointer"
 >
 <ChevronRight size={20} />
 </button>
 </>
 )}
 <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-full">
 {selectedImgIndex + 1} / {images.length}
 </div>
 </div>

 {/* Thumbnails */}
 {images.length > 1 && (
 <div className="flex gap-2.5 mt-3 overflow-x-auto w-full pb-1 justify-center">
 {images.map((img, idx) => (
 <button
 key={idx}
 onClick={() => setSelectedImgIndex(idx)}
 className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
 selectedImgIndex === idx ? 'border-orange-500 scale-105 shadow-md ring-2 ring-orange-200' : 'border-slate-200 opacity-60 hover:opacity-100'
 }`}
 >
 <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
 </button>
 ))}
 </div>
 )}
 </div>

 {/* 2. Tab Buttons for Details */}
 <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar w-full">
 {[
 { id: 'overview', label: 'Overview' },
 { id: 'pricing', label: 'Pricing & Fees' },
 { id: 'specs', label: 'Specs & Variants' },
 { id: 'features', label: 'Features & Desc' },
 { id: 'earning', label: 'Estimated Earning' },
 ].map(t => (
 <button
 key={t.id}
 onClick={() => setActiveDetailTab(t.id as any)}
 className={`flex-none px-3 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
 activeDetailTab === t.id
 ? 'bg-white text-orange-600 shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>

 {/* Tab 1: Overview - All details including SKU Code in proper boxes */}
 {activeDetailTab === 'overview' && (
 <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product SKU Code</label>
 <p className="text-xs font-mono font-bold text-orange-700 mt-1">
 {product['product_sku_code'] || 'N/A'}
 </p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Name</label>
 <p className="text-sm font-bold text-slate-900 mt-0.5">{product['product name']}</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Title Name</label>
 <p className="text-sm font-semibold text-slate-800 mt-0.5">{product['product title name'] || 'N/A'}</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Hierarchy</label>
 <p className="text-xs font-semibold text-slate-700 mt-0.5">
 {mainCategoryName} {middleCategoryName && `› ${middleCategoryName}`} {subCategoryName && `› ${subCategoryName}`}
 </p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Stock</label>
 <p className="text-sm font-bold text-slate-900 mt-0.5">
 {stockCount === 0 ? 'Out of Stock (0)' : `${stockCount} Units`}
 </p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upload Service</label>
 <p className="text-xs font-semibold text-slate-800 mt-0.5">{product['upload services'] || 'General Delivery'}</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</label>
 <p className="text-xs font-semibold text-slate-800 mt-0.5">{product['mobile number'] || 'N/A'}</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Home Feed Chips</label>
 <p className="text-xs font-semibold text-slate-800 mt-0.5">{product['product type chips'] || 'Regular'}</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Duration</label>
 <p className="text-xs font-semibold text-slate-800 mt-0.5">{product['Time Duration'] || 'Standard'}</p>
 </div>
 </div>

 {/* Tags */}
 {tags.length > 0 && (
 <div className="pt-3 border-t border-slate-100">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Professional Tags</label>
 <div className="flex flex-wrap gap-1.5">
 {tags.map((t, idx) => (
 <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
 #{t}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Category Tags */}
 {categoryTags.length > 0 && (
 <div className="pt-3 border-t border-slate-100">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Category Tags</label>
 <div className="flex flex-wrap gap-1.5">
 {categoryTags.map((ct, idx) => (
 <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
 {ct}
 </span>
 ))}
 </div>
 </div>
 )}
 
 {productRatings.length > 0 && (
 <div className="pt-4 border-t border-slate-100 mt-4">
 <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
 <Star size={16} className="text-yellow-500 fill-yellow-500" />
 Customer Reviews
 </h3>
 <div className="space-y-3">
 {productRatings.map((rating, idx) => {
 const stars = Number(rating['rating star']) || 0;
 return (
 <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
 <div className="flex items-center justify-between mb-1">
 <span className="font-bold text-xs text-slate-800">{rating['full name'] || 'Anonymous'}</span>
 <div className="flex gap-0.5">
 {[1, 2, 3, 4, 5].map(s => (
 <Star key={s} size={10} className={s <= stars ? "text-yellow-500 fill-yellow-500" : "text-slate-300"} />
 ))}
 </div>
 </div>
 {rating['rating discription'] && (
 <p className="text-xs text-slate-600 mt-1">{rating['rating discription']}</p>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 </div>
 )}

 {/* Tab 2: Price & Earnings */}
 {activeDetailTab === 'pricing' && (
 <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <span className="text-[10px] font-bold text-slate-500 uppercase block">Selling Price</span>
 <span className="text-lg font-black text-slate-900">₹ {sellingPrice.toFixed(2)}</span>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <span className="text-[10px] font-bold text-slate-500 uppercase block">Market MRP (Price Info)</span>
 <span className="text-lg font-bold text-slate-500 line-through">₹ {marketValue.toFixed(2)}</span>
 </div>
 <div className="bg-green-50 p-3 rounded-xl border border-green-200">
 <span className="text-[10px] font-bold text-green-700 uppercase block">Discount</span>
 <span className="text-lg font-black text-green-700">
 {product['discount %'] || '0'}% OFF
 </span>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <span className="text-[10px] font-bold text-slate-500 uppercase block">Gross Rate</span>
 <span className="text-sm font-bold text-slate-800">₹ {parseAmt(product['gross rate']).toFixed(2)}</span>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <span className="text-[10px] font-bold text-slate-500 uppercase block">GST Rate</span>
 <span className="text-sm font-bold text-slate-800">{product['gst rate %'] || product['gst %'] || '0'}%</span>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
 <span className="text-[10px] font-bold text-slate-500 uppercase block">HSN Code</span>
 <span className="text-sm font-mono font-bold text-slate-800">{product['hsn code'] || 'N/A'}</span>
 </div>
 </div>

 <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-blue-900 block flex items-center gap-1.5">
 <Truck size={15} /> Delivery Charge
 </span>
 <span className="text-xs text-blue-700 font-medium capitalize mt-0.5">
 {product['delivery charge type'] === 'per_order' ? 'Per Order' : product['delivery charge type'] === 'per_quantity' ? 'Per Quantity' : 'Standard'}
 </span>
 </div>
 <span className="text-base font-black text-blue-900">₹ {parseAmt(product['delivery charge']).toFixed(2)}</span>
 </div>

 <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
 <Gift size={15} /> Gift Cash Donation
 </span>
 <span className="text-[11px] text-emerald-700 font-medium">Education & Welfare support</span>
 </div>
 <span className="text-sm font-black text-emerald-900">₹ {parseAmt(product['gift cash donation']).toFixed(2)}</span>
 </div>

 
 <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
 <span className="text-xs font-bold text-slate-700">Minimum Order Quantity</span>
 <span className="text-sm font-black text-slate-900">{product['minimum order quantity'] || 1} Units</span>
 </div>
 

 </div>
 )}

 {/* Tab 3: Specs & Variants */}
 {activeDetailTab === 'specs' && (
 <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
 {/* Colors */}
 <div>
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
 Color Varieties ({colors.length})
 </label>
 {colors.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5.5">
 {colors.map((c, idx) => (
 <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
 <div className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs shrink-0" style={{ backgroundColor: c.hex }} />
 <div className="truncate text-xs">
 <p className="font-bold text-slate-800 truncate">{c.name}</p>
 <p className="text-[10px] font-mono text-slate-400">{c.hex}</p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-slate-400 italic">No color varieties specified</p>
 )}
 </div>

 {/* Sizes */}
 <div className="pt-3 border-t border-slate-100">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
 Sizes ({sizes.length})
 </label>
 {sizes.length > 0 ? (
 <div className="flex flex-wrap gap-2">
 {sizes.map((s, idx) => (
 <span key={idx} className="px-3.5 py-1.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200">
 {s}
 </span>
 ))}
 </div>
 ) : (
 <p className="text-xs text-slate-400 italic">No sizes specified</p>
 )}
 </div>

 {/* Weights */}
 <div className="pt-3 border-t border-slate-100">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
 Weight Options ({weights.length})
 </label>
 {weights.length > 0 ? (
 <div className="flex flex-wrap gap-2">
 {weights.map((w, idx) => (
 <span key={idx} className="px-3.5 py-1.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200">
 {w}
 </span>
 ))}
 </div>
 ) : (
 <p className="text-xs text-slate-400 italic">No weights specified</p>
 )}
 </div>
 </div>
 )}

 {/* Tab 4: Features & Desc */}
 {activeDetailTab === 'features' && (
 <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
 <div>
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
 Key Highlights & Features
 </label>
 {keyFeatures.length > 0 ? (
 <ul className="space-y-2">
 {keyFeatures.map((feat, idx) => (
 <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
 <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
 <span className="leading-relaxed font-medium">{feat}</span>
 </li>
 ))}
 </ul>
 ) : (
 <p className="text-xs text-slate-400 italic">No key features specified</p>
 )}
 </div>

 <div className="pt-3 border-t border-slate-100">
 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
 Detailed Product Description
 </label>
 <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
 {product['product description'] || 'No description available.'}
 </div>
 </div>

 {/* Record Dates */}
 <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
 <div>
 <span className="font-bold block text-slate-400 uppercase text-[10px]">Created Date</span>
 <span>{product.created_at ? new Date(product.created_at).toLocaleString() : 'N/A'}</span>
 </div>
 <div>
 <span className="font-bold block text-slate-400 uppercase text-[10px]">Last Updated</span>
 <span>{product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}</span>
 </div>
 </div>
 </div>
 )}

 {/* Tab 5: Earning */}
 {activeDetailTab === 'earning' && (
 <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
 {/* Estimated Chart */}
 {(() => {
 const earnings = calculateEarnings();
 return (
 <div className=" bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
 <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Seller Estimated Earning (Applied Details)</h3>
 </div>
 <div className="p-4 space-y-2">
 <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
 <span>Selling Price</span>
 <span>₹ {earnings.sellingPrice.toFixed(2)}</span>
 </div>
 <div className="pl-4 border-l-2 border-slate-100 flex flex-col gap-1.5 my-1.5">
 <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
 <span>Gross Rate</span>
 <span>₹ {earnings.grossRateNum.toFixed(2)}</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
 <span>C-GST ({earnings.halfGstPercent}%)</span>
 <span>₹ {earnings.sellerCgstAmount.toFixed(2)}</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
 <span>S-GST ({earnings.halfGstPercent}%)</span>
 <span>₹ {earnings.sellerSgstAmount.toFixed(2)}</span>
 </div>
 </div>
 <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
 <span>Delivery Charge</span>
 <span>+ ₹ {earnings.deliveryCharge.toFixed(2)}</span>
 </div>
 <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-800">
 <span>Total Earning Amount</span>
 <span>₹ {earnings.totalSellerEarning.toFixed(2)}</span>
 </div>

 <div className="pt-3 mt-3 border-t border-slate-200">
 <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Platform Estimated Earning</h4>
 {earnings.calculatedCharges.map(charge => (
 <div key={charge.id} className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1.5">
 <span>{charge.name}</span>
 <span className="text-red-500">- ₹ {charge.amount.toFixed(2)}</span>
 </div>
 ))}
 </div>

 <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-600">
 <span>Gift Cash Donation</span>
 <span className="text-red-500">- ₹ {earnings.giftDonation.toFixed(2)}</span>
 </div>
 
 <div className="pt-3 mt-3 border-t-2 border-slate-200 flex justify-between items-center text-sm font-black text-emerald-700">
 <span>Final Seller Earning</span>
 <span>₹ {earnings.finalEarning.toFixed(2)}</span>
 </div>
 </div>
 </div>
 );
 })()}
 </div>
 )}

 </main>
 )}
 </div>
 {/* Full Screen Image Viewer */}
 {fullScreenImage && (
 <div 
 className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black/98 flex items-center justify-center animate-in zoom-in duration-200"
 onClick={() => setFullScreenImage(null)}
 >
 <div className="relative w-full h-full flex items-center justify-center p-0 m-0">
 <img 
 src={fullScreenImage} 
 alt="Full Screen View" 
 className="w-full h-full max-w-[100vw] max-h-[100dvh] object-contain select-none pointer-events-none"
 style={{ imageRendering: 'high-quality', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }}
 />
 </div>
 </div>
 )}
 </div>
 );
};
