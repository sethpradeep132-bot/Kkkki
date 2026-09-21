import { TermsAndConditionsModal } from "./TermsAndConditionsModal";
import { LogoutModal } from './LogoutModal';
import React, { useState, useEffect, useRef } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { Home, LayoutGrid, ShoppingCart, Layers, User, RefreshCw, Search, Menu, List, X, ArrowLeft, ArrowRight, Eye, CreditCard, ChevronRight, MapPin, Trash2, MoreHorizontal, ShoppingBag, Image, Gift, Tag, Zap } from 'lucide-react';
import { categoryData } from '../../categories';
import { getFastCategorySuggestions, type FlatCategoryItem } from './UploadProductForm';
import { AuthLogin } from './AuthLogin';
import { AnnouncementChatModal } from './AnnouncementChatModal';
import { RoleChatModal } from './RoleChatModal';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { supabase } from '../../lib/supabase';
import { buildShipmentStatus } from '../../utils/statusFormatter';
import { SupabaseProduct } from '../../types/product';
import { registerBackHandler } from '../../lib/backNavigation';





const getFirstImage = (imageStr: any) => {
 if (!imageStr) return 'https://via.placeholder.com/150';
 if (Array.isArray(imageStr)) {
 return imageStr.length > 0 ? imageStr[0] : 'https://via.placeholder.com/150';
 }
 if (typeof imageStr === 'string') {
 if (imageStr.trim().startsWith('[')) {
 try {
 const parsed = JSON.parse(imageStr);
 if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
 } catch(e) {}
 }
 if (imageStr.includes('|||')) {
 return imageStr.split('|||')[0];
 }
 return imageStr;
 }
 return 'https://via.placeholder.com/150';
};

const getShortStatus = (statusText: string) => {
 if (!statusText) return 'Pending';
 const rawParts = statusText.split('||').map(s => s.trim()).filter(Boolean);
 let parts = [];
 for (const p of rawParts) {
 parts.push(p);
 if (p.toLowerCase().includes('returned successfully')) break;
 }
 const latestStatus = parts[parts.length - 1] || statusText;
 const lower = latestStatus.toLowerCase();

 if (lower.includes('placed')) return 'Order Placed';
 if (lower.includes('accepted by seller')) return 'Order Accepted';
 if (lower.includes('return pickup has failed')) return 'Return Pickup Faild';
 if (lower.includes('cancelled') || lower.includes('rejected') || lower.includes('failed')) return 'Order Cancelled';
 if (lower.includes('picked up')) return 'Order Picked';
 if (lower.includes('received at hub')) return 'Received At Hub';
 if (lower.includes('dispacthed') || lower.includes('dispatched')) return 'Order Dispatched';
 if (lower.includes('shipped')) return 'Order Shipped';
 if (lower.includes('out for delivery')) return 'Out For Delivery';
 if (lower.includes('delivered')) return 'Delivered';
 if (lower.includes('return request')) return 'Return Requested';
 if (lower.includes('out for return')) return 'Out For Return';
 if (lower.includes('returned')) return 'Returned';
 if (lower.includes('cancel') || lower.includes('reject') || lower.includes('fail')) return 'Order Cancelled';
 if (lower.includes('pick')) return 'Order Picked';

 return latestStatus.length > 15 ? latestStatus.substring(0, 15) + '...' : latestStatus;
};

const getStatusColorClass = (status: string) => {
 if (['Order Cancelled', 'Return Pickup Faild', 'Returned'].includes(status)) return 'text-red-600 bg-red-50';
 if (['Order Placed', 'Order Picked', 'Delivered'].includes(status)) return 'text-emerald-600 bg-emerald-50';
 if (['Return Requested', 'Out For Return'].includes(status)) return 'text-orange-600 bg-orange-50';
 return 'text-blue-600 bg-blue-50';
};

const getColorClasses = (color: string) => {
 if (color === 'red') return {
 dot: 'bg-red-500 shadow-red-500/50',
 title: 'text-red-600',
 box: 'bg-red-50 border-red-100 text-red-600'
 };
 if (color === 'blue') return {
 dot: 'bg-blue-500 shadow-blue-500/50',
 title: 'text-blue-600',
 box: 'bg-blue-50 border-blue-100 text-slate-600'
 };
 if (color === 'orange') return {
 dot: 'bg-orange-500 shadow-orange-500/50',
 title: 'text-orange-600',
 box: 'bg-orange-50 border-orange-100 text-slate-600'
 };
 return {
 dot: 'bg-emerald-500 shadow-emerald-500/50',
 title: 'text-emerald-600',
 box: 'bg-emerald-50 border-emerald-100 text-slate-600'
 };
};


interface PortalProps {
 onBack: () => void;
}


const formatCartCount = (value: number): string => {
 if (isNaN(value) || value === 0) return '0';
 if (value >= 1000000) return (value / 1000000).toFixed(2) + 'm';
 if (value >= 1000) return (value / 1000).toFixed(2) + 'k';
 return value.toString();
};

const formatGiftCashAmount = (value: number): string => {
 if (isNaN(value) || value === 0) return '0.00';
 if (value >= 1000000) return (value / 1000000).toFixed(2) + 'm';
 if (value >= 1000) return (value / 1000).toFixed(2) + 'k';
 return value.toFixed(2);
};

const AccountView = ({ 
 onSubPageChange,
 onLogout,
 onShowTerms,
 onShowAnnouncement,
 onShowRoleChat,
 initialPage = 'main'
}: { 
 onSubPageChange?: (isSub: boolean) => void;
 onLogout?: () => void;
 onShowTerms?: () => void;
 onShowAnnouncement?: () => void;
 onShowRoleChat?: () => void;
 initialPage?: 'main' | 'orders' | 'order_details' | 'return_order' | 'bank' | 'personal' | 'addresses' | 'gift_cash';
}) => {
 const [customerData, setCustomerData] = useState<any>(null);





 const [activePage, setActivePage] = useState<'main' | 'personal' | 'bank' | 'addresses' | 'orders' | 'order_details' | 'return_order' | 'gift_cash'>(initialPage);

 useEffect(() => {
   if (initialPage !== 'main') {
     setActivePage(initialPage);
   }
 }, [initialPage]);

 const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
 const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
 const [selectedOrder, setSelectedOrder] = useState<any>(null);
 const [isCanceling, setIsCanceling] = useState(false);

 useEffect(() => {
   const scrollToTop = () => {
     const mainEl = document.querySelector('main');
     if (mainEl) {
       mainEl.scrollTop = 0;
     }
     window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
   };
   scrollToTop();
   const timer = setTimeout(scrollToTop, 50);
   return () => clearTimeout(timer);
 }, [activePage, selectedOrder?.id]);

 const [giftCashBalance, setGiftCashBalance] = useState<number>(0);
 const [giftCashHistory, setGiftCashHistory] = useState<any[]>([]);
 const [isLoadingGiftCash, setIsLoadingGiftCash] = useState(false);
 const [invoiceShipmentData, setInvoiceShipmentData] = useState<any>(null);
 const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [chatCount, setChatCount] = useState<number>(0);

  useEffect(() => {
    if (customerData?.id && customerData.id !== 'No Data Found') {
      supabase.from('announcement_and_update').select('*', {count: 'exact', head: true}).not('customer_update', 'is', null).neq('customer_update', '').then(({count}) => {
        if (count !== null) setUpdateCount(count);
      });
      supabase.from('chat_for_customers').select('*', {count: 'exact', head: true}).eq('customer_id', customerData.id).not('message', 'is', null).then(({count}) => {
        if (count !== null) setChatCount(count);
      });
    }
  }, [customerData?.id]);

 useEffect(() => {
 if (activePage === 'order_details' && selectedOrder && selectedOrder['order ID']) {
 setInvoiceShipmentData(null);
 const fetchData = async () => {
 let shipDataList = null;
 if (selectedOrder['order ID'] && selectedOrder['product id']) {
   const { data } = await supabase.from('accepted_shipments').select('*').eq('order ID', selectedOrder['order ID']).eq('product id', selectedOrder['product id']);
   shipDataList = data;
 }
 if (!shipDataList || shipDataList.length === 0) {
   const { data } = await supabase.from('accepted_shipments').select('*').eq('order ID', selectedOrder['order ID']);
   shipDataList = data;
 }
 let shipData = null;
 if (shipDataList && shipDataList.length > 0) {
 shipData = shipDataList.find(s => s['order status'] === selectedOrder['order status']);
 if (!shipData) shipData = shipDataList[0];
 }
 setInvoiceShipmentData(shipData || null);
 if (shipData && shipData['days'] !== undefined && shipData['days'] !== null) {
 setSelectedOrder((prev: any) => ({ ...prev, days: shipData['days'] }));
 }
 
 if (selectedOrder.id) {
 const { data: orderData } = await supabase.from('customer_orders').select('"order status", days').eq('id', selectedOrder.id).maybeSingle();
 if (orderData) {
 if (orderData['order status'] !== selectedOrder['order status'] || (orderData['days'] !== undefined && orderData['days'] !== selectedOrder['days'])) {
 setSelectedOrder((prev: any) => ({ ...prev, 'order status': orderData['order status'], ...(orderData['days'] !== undefined ? { days: orderData['days'] } : {}) }));
 setCustomerOrders((prev: any[]) => prev.map(o => o.id === selectedOrder.id ? { ...o, 'order status': orderData['order status'] } : o));
 }
 }
 }
 };
 fetchData();

 const channel = supabase
 .channel(`order_details_ship_${selectedOrder['order ID']}`)
 .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments', filter: `order ID=eq.${selectedOrder['order ID']}` }, (payload: any) => {
   if (payload.new && payload.new['days'] !== undefined && payload.new['days'] !== null) {
     setInvoiceShipmentData((prev: any) => ({ ...prev, ...payload.new }));
     setSelectedOrder((prev: any) => ({ ...prev, days: payload.new['days'] }));
   }
 })
 .subscribe();

 return () => {
   supabase.removeChannel(channel);
 };
 }
 }, [activePage, selectedOrder?.id, selectedOrder?.['order ID'], selectedOrder?.['product id']]);


 useEffect(() => {
 if (activePage === 'gift_cash' && customerData?.id && customerData.id !== 'No Data Found') {
 const fetchGiftData = async () => {
 setIsLoadingGiftCash(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 
 // Fetch balance
 const { data: gcData } = await supabase.from('gift_cash').select('"claimed gift cash"').eq('customer id', customerData.id).maybeSingle();
 if (gcData && gcData['claimed gift cash']) {
 setGiftCashBalance(parseFloat(gcData['claimed gift cash']) || 0);
 }
 
 // Fetch history from finished_customers_payable_amount
 const { data: histData } = await supabase.from('finished_customers_payable_amount')
 .select('*')
 .eq('customer id', customerData.id)
 .order('id', { ascending: false }) // Or just limit
 .limit(10);
 
 setGiftCashHistory(histData || []);
 } catch (e) {
 console.error(e);
 } finally {
 setIsLoadingGiftCash(false);
 }
 };
 fetchGiftData();
 }
 }, [activePage, customerData?.id]);

 const [isReturning, setIsReturning] = useState(false);
 const [returnReason, setReturnReason] = useState('');
 const [orderProductFeatures, setOrderProductFeatures] = useState<string[]>([]);
 const [ratingVal, setRatingVal] = useState(0);
 const [ratingDesc, setRatingDesc] = useState('');
 const [isSubmittingRating, setIsSubmittingRating] = useState(false);
 const [fetchedRating, setFetchedRating] = useState<any>(null);

 useEffect(() => {
 if (selectedOrder) {
 const fetchRating = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 let fName = selectedOrder['full name'];
 if (customerData && customerData['full name']) {
 fName = customerData['full name'];
 }
 const { data } = await supabase.from('product_rating')
 .select('*')
 .eq('product id', selectedOrder['product id'])
 .eq('full name', fName)
 .order('created_at', { ascending: false })
 .limit(1)
 .maybeSingle();
 
 if (data) {
 setFetchedRating(data);
 setRatingVal(Number(data['rating star']) || 0);
 setRatingDesc(data['rating discription'] || '');
 } else {
 setFetchedRating(null);
 setRatingVal(0);
 setRatingDesc('');
 }
 } catch(e) { console.error(e); }
 };
 fetchRating();
 }
 }, [selectedOrder, customerData]);

 useEffect(() => {
 if (selectedOrder && selectedOrder['product id']) {
 const fetchProduct = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data } = await supabase.from('products').select('"key features"').eq('id', selectedOrder['product id']).single();
 if (data && data['key features']) {
 setOrderProductFeatures(data['key features']);
 } else {
 setOrderProductFeatures([]);
 }
 } catch(e) {
 console.error(e);
 }
 };
 fetchProduct();
 } else {
 setOrderProductFeatures([]);
 }
 }, [selectedOrder?.id]);

 useEffect(() => {
 onSubPageChange?.(activePage !== 'main');
 }, [activePage, onSubPageChange]);

 useEffect(() => {
 const fetchAddresses = async () => {
 if (!customerData?.id) return;
 try {
 const { supabase } = await import('../../lib/supabase');
 
 const { data } = await supabase.from('customer_address')
 .select('*')
 .eq('customer id', customerData.id)
 .order('created_at', { ascending: false })
 .limit(2);
 
 if (data) {
 setCustomerAddresses(data);
 } else {
 setCustomerAddresses([]);
 }
 } catch (err) {
 console.error(err);
 }
 };
 if (activePage === 'addresses' || activePage === 'main') {
 fetchAddresses();
 }
 }, [customerData?.id, activePage]);

 useEffect(() => {
 const fetchCustomerData = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_customer') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 
 let customerRecord = null;
 if (userObj?.id) {
 const { data } = await supabase
 .from('customers')
 .select('*')
 .eq('id', userObj.id)
 .maybeSingle();
 customerRecord = data;
 } 
 if (!customerRecord && userObj?.email) {
 const { data } = await supabase
 .from('customers')
 .select('*')
 .eq('email_account', userObj.email)
 .maybeSingle();
 customerRecord = data;
 }
 if (!customerRecord) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase
 .from('customers')
 .select('*')
 .eq('id', user.id)
 .maybeSingle();
 customerRecord = data;
 }
 }
 if (!customerRecord) {
 localStorage.removeItem('portal_auth_customer');
 setCustomerData(null);
 return;
 }

 if (customerRecord) {
 setCustomerData(customerRecord);
 } else {
 // No customer found at all, set empty state
 setCustomerData({
 id: 'No Data Found',
 full_name: 'No User Found',
 mobile_number: 'N/A',
 email_account: 'N/A',
 full_address: 'N/A',
 pincode: 'N/A',
 bank_name: 'N/A',
 account_no: 'N/A',
 ifsc_code: 'N/A',
 upi_id: 'N/A'
 });
 }
 } catch (err) {
 console.error("Error fetching customer data:", err);
 setCustomerData({
 id: 'Error',
 full_name: 'Database Error',
 mobile_number: 'Please check connection',
 email_account: '',
 });
 }
 };
 fetchCustomerData();
 }, []);

 const getInitials = (name: string) => {
 if (!name || name === 'N/A' || name === 'Loading...' || name === 'No Data Found') return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
 };

 useEffect(() => {
 const fetchOrders = async () => {
 setIsOrdersLoading(true);
 if (customerData?.id && customerData.id !== 'No Data Found') {
 const { supabase } = await import('../../lib/supabase');
 const { data } = await supabase
 .from('customer_orders')
 .select('*')
 .eq('customer id', customerData.id)
 .order('created_at', { ascending: false });
 if (data) {
 setCustomerOrders(data);
 }
 }
 setIsOrdersLoading(false);
 };
 fetchOrders();
 }, [customerData?.id]);

 
 if (activePage === 'gift_cash') {
 return (
      <div className="w-full min-h-full bg-[#F8FAFC] text-slate-900 flex flex-col relative pb-24">
 <div className="flex items-center p-4 bg-white sticky top-0 z-20 shadow-sm">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-gray-50 rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-xl font-bold ml-3 text-gray-800">Gift Cash & Refund</h2>
 </div>
 <div className="p-4 flex-1 overflow-y-auto">
 {/* Available Balance Card */}
 <div className="bg-white rounded-3xl p-6 shadow-sm border border-yellow-100 mb-6 bg-gradient-to-br from-yellow-50 to-white">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
 <span className="text-xl">🎁</span>
 </div>
 <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Available Balance</h3>
 </div>
 <div className="mt-4">
 <span className="text-4xl font-black text-gray-900">₹{giftCashBalance.toFixed(2)}</span>
 </div>
 </div>

 {/* Transaction History Card */}
 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
 <div className="p-4 border-b border-gray-50 bg-gray-50/50 sticky top-0 z-10">
 <h3 className="text-sm font-bold text-gray-800">Transaction History</h3>
 <p className="text-[10px] text-gray-500">Latest 10 transactions</p>
 </div>
 <div className="p-4 overflow-y-auto flex-1">
 {giftCashHistory.length > 0 ? (
 <div className="space-y-4">
 {giftCashHistory.map((tx: any, idx: number) => (
 <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-gray-800">{tx.type || 'Refund / Gift'}</span>
 <span className="text-[10px] text-gray-500">{tx.date || 'Recent'}</span>
 </div>
 <span className="text-sm font-black text-emerald-600">+₹{parseFloat(tx['total amount'] || tx['total settled amount'] || 0).toFixed(2)}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-gray-400">
 <p className="text-xs font-medium">No transactions found</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 }

 if (activePage === 'personal') {
 return (
      <div className="w-full min-h-full bg-white flex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-gray-50 rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Personal details</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Customer ID</label>
 <p className="text-sm font-semibold text-gray-800 break-all">{customerData?.id || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.full_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.mobile_number || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Email Account</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.email_account || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Full Address</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.full_address || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Pincode</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.pincode || 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }

 if (activePage === 'bank') {
 return (
      <div className="w-full min-h-full bg-white flex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-gray-50 rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Bank details</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.bank_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Account No</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.account_no || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">IFSC Code</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.ifsc_code || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">UPI ID</label>
 <p className="text-sm font-semibold text-gray-800">{customerData?.upi_id || 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }


 if (activePage === 'orders') {
 return (
      <div className="w-full bg-white flex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-gray-50 rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">My Orders</h2>
 </div>
 <div className="space-y-4">
 {isOrdersLoading ? (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="text-gray-500 font-bold flex items-center gap-[2px] text-lg">
      <span>Loading</span>
      <div className="flex items-center space-x-1 ml-1">
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
) : customerOrders.length > 0 ? (
 customerOrders.map((order, idx) => (
 <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 relative">
 <div className="absolute top-4 right-4 z-10">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md w-fit ${getStatusColorClass(getShortStatus(order['order status'] || ''))}`}>
 {getShortStatus(order['order status'] || '')}
 </span>
 </div>
 <div className="flex items-start gap-4 pr-16">
 <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
 <img src={getFirstImage(order['product image'])} alt="product" className="w-full h-full object-cover" />
 </div>
 <div className="flex flex-col flex-1">
 <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{order['product name'] || 'Product'}</h3>
 <p className="text-xs text-gray-500 line-clamp-1 mb-1">{order['product tittle name'] || ''}</p>
 <p className="text-[10px] text-gray-400">
 {order['colour'] && order['colour'] !== 'N/A' && `Color: ${order['colour']}`}
 {order['colour'] && order['colour'] !== 'N/A' && order['size'] && order['size'] !== 'N/A' && ' • '}
 {order['size'] && order['size'] !== 'N/A' && `Size: ${order['size']}`}
 {((order['colour'] && order['colour'] !== 'N/A') || (order['size'] && order['size'] !== 'N/A')) && order['weight'] && order['weight'] !== 'N/A' && ' • '}
 {order['weight'] && order['weight'] !== 'N/A' && `Wt: ${order['weight']}`}
 </p>
 <p className="text-sm font-bold text-blue-600 mt-1">₹ {order['total amount']}</p>
 </div>
 </div>
 <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
 <span className="text-[10px] text-gray-400">Order ID: {order['order ID']}</span>
 <button 
 onClick={() => { 
   setSelectedOrder(order); 
   setActivePage('order_details'); 
   const mainEl = document.querySelector('main');
   if (mainEl) mainEl.scrollTop = 0;
   window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
 }}
 className="text-xs font-bold text-blue-600 hover:text-blue-800 tracking-wide"
 >
 Track All
 </button>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
 <ShoppingBag size={20} className="text-gray-400" />
 </div>
 <h3 className="font-bold text-gray-600 mb-1">No orders yet</h3>
 <p className="text-xs text-gray-500">Looks like you haven't placed an order.</p>
 </div>
 )}
 </div>
 </div>
 );
 }

 if (activePage === 'order_details' && selectedOrder) {
 const isCancelled = selectedOrder['order status']?.toLowerCase().includes('cancelled');
 
 const handleCancelOrder = async () => {
 
 
 
 setIsCanceling(true);
 const now = new Date();
 const formattedDate = now.toLocaleString('en-IN', {
 day: '2-digit',
 month: 'short',
 year: 'numeric',
 });
 const formattedTime = now.toLocaleString('en-IN', {
 hour: '2-digit',
 minute: '2-digit',
 hour12: true,
 });
 const existingStatus = selectedOrder['order status'] || '';
 const newCancelEntry = `Your order has been cancelled on ${formattedDate}, ${formattedTime}, Order ID: ${selectedOrder['order ID']}`;
 const cancelStatus = existingStatus ? existingStatus + ' || ' + newCancelEntry : newCancelEntry;

 try {
 // Delay for 3-dot animation visibility
 const { error: customerError } = await supabase.from('customer_orders').update({ 'order status': cancelStatus }).eq('id', selectedOrder.id);

 if (selectedOrder['order ID']) {
 const { data: shipDataList } = await supabase.from('accepted_shipments').select('*').eq('order ID', selectedOrder['order ID']).eq('product id', selectedOrder['product id']);
 let shipData = null;
 if (shipDataList && shipDataList.length > 0) {
 shipData = shipDataList.find(s => !s['shipment type']?.toLowerCase().includes('cancelled'));
 if (!shipData) shipData = shipDataList[0];
 }
 if (shipData) {
 // The user specifically requested to delete the raw data from accepted_shipments
 await supabase
 .from('accepted_shipments')
 .delete()
 .eq('id', shipData.id);
 }
 }

 if (!customerError) {
 setSelectedOrder({ ...selectedOrder, 'order status': cancelStatus });
 // also update the local customerOrders array so it reflects in the list immediately
 setCustomerOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, 'order status': cancelStatus } : o));
 } else {
 console.error('Failed to cancel order.');
 }
 } catch (err) {
 console.error(err);
 } finally {
 setIsCanceling(false);
 }
 };

 const currentStatusString = selectedOrder['order status'] || 'Pending';
 const rawParts = currentStatusString.split(/\|\||\n-----------------------------------\n|\n\n/).map(s => s.trim()).filter(Boolean);
 const validParts = rawParts.filter(part => {
 const lower = part.toLowerCase();
 if (lower.startsWith('[')) return false;
 if (lower.includes('created pickupsheet')) return false;
 if (lower.includes('hub:') && lower.includes('rider:')) return false;
 return true;
 });

 let finalValidParts: string[] = [];
 for (const part of validParts) {
 finalValidParts.push(part);
 if (part.toLowerCase().includes('returned successfully')) {
 break;
 }
 }

 const timelineSteps = finalValidParts.map((part, index) => {
 const lower = part.toLowerCase();
 let title = 'Order Update';
 let color = 'blue';
 if (lower.includes('placed')) { title = 'order placed'; color = 'emerald'; }
 else if (lower.includes('accepted by seller')) { title = 'order accepted'; color = 'blue'; }
 else if (lower.includes('return pickup has failed')) { title = 'return pickup faild'; color = 'red'; }
 else if (lower.includes('cancelled') || lower.includes('rejected') || lower.includes('failed')) { title = 'order cancelled'; color = 'red'; }
 else if (lower.includes('picked up')) { title = 'order picked'; color = 'emerald'; }
 else if (lower.includes('received at hub')) { title = 'received at hub'; color = 'blue'; }
 else if (lower.includes('dispacthed') || lower.includes('dispatched')) { title = 'order dispatched'; color = 'blue'; }
 else if (lower.includes('shipped')) { title = 'order shipped'; color = 'blue'; }
 else if (lower.includes('out for delivery')) { title = 'out for delivery'; color = 'blue'; }
 else if (lower.includes('delivered')) { title = 'delivered'; color = 'emerald'; }
 else if (lower.includes('return request')) { title = 'return requested'; color = 'orange'; }
 else if (lower.includes('out for return')) { title = 'out for return'; color = 'orange'; }
 else if (lower.includes('returned')) { title = 'returned'; color = 'red'; }
 else if (lower.includes('cancel') || lower.includes('reject') || lower.includes('fail')) { title = 'order cancelled'; color = 'red'; }
 else if (lower.includes('pick')) { title = 'order picked'; color = 'emerald'; }
 return { title, desc: part, color };
 });

 if (timelineSteps.length === 0) {
 timelineSteps.push({
 title: 'Order Status',
 desc: currentStatusString,
 color: 'blue'
 });
 }
 
 const lastTitle = timelineSteps[timelineSteps.length - 1].title;
 const isExactlyDelivered = lastTitle === 'delivered';
 const isExactlyReturnPickupFaild = lastTitle === 'return pickup faild';
 const isReturnedStatus = lastTitle === 'return requested' || currentStatusString.toLowerCase().includes('return requested');

 return (
      <div className="w-full bg-white flex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('orders')} className="p-2 -ml-2 bg-gray-50 rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Order Details</h2>
 </div>
 
 <div className="space-y-4">
 <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3">
 <div className="flex items-start gap-4">
 <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
 <img src={getFirstImage(selectedOrder['product image'])} alt="product" className="w-full h-full object-cover" />
 </div>
 <div className="flex flex-col flex-1">
 <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{selectedOrder['product name'] || 'Product'}</h3>
 <p className="text-xs text-gray-500 line-clamp-1 mb-1">{selectedOrder['product tittle name'] || ''}</p>
 <p className="text-[10px] text-gray-400">
 {selectedOrder['colour'] && selectedOrder['colour'] !== 'N/A' && `Color: ${selectedOrder['colour']}`}
 {selectedOrder['colour'] && selectedOrder['colour'] !== 'N/A' && selectedOrder['size'] && selectedOrder['size'] !== 'N/A' && ' • '}
 {selectedOrder['size'] && selectedOrder['size'] !== 'N/A' && `Size: ${selectedOrder['size']}`}
 {((selectedOrder['colour'] && selectedOrder['colour'] !== 'N/A') || (selectedOrder['size'] && selectedOrder['size'] !== 'N/A')) && selectedOrder['weight'] && selectedOrder['weight'] !== 'N/A' && ' • '}
 {selectedOrder['weight'] && selectedOrder['weight'] !== 'N/A' && `Wt: ${selectedOrder['weight']}`}
 </p>
 <p className="text-sm font-bold text-blue-600 mt-1">₹ {selectedOrder['total amount']}</p>
 </div>
 </div>
 <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
 <span className="text-[10px] text-gray-400">Order ID: {selectedOrder['order ID']}</span>
 </div>
 </div>

 <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Delivery Address</h3>
 <p className="text-sm font-bold text-slate-800">{selectedOrder['full name']} <span className="bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded ml-2 uppercase">{selectedOrder['address type'] || 'Home'}</span></p>
 <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedOrder['full address']}</p>
 <p className="text-[10px] text-slate-500 mt-1">Landmark: {selectedOrder['landmark'] || 'N/A'}</p>
 <p className="text-xs font-bold text-slate-700 mt-2">Phone: {selectedOrder['mobile number']} • Pin: {selectedOrder['pincode']}</p>
 </div>

 <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex justify-between items-center">
 <span>Order Summary Status</span>
 </h3>
 <div className="relative pl-6 flex flex-col gap-6">
 {/* Shining smooth line */}
 <div className={`absolute top-2 bottom-2 left-[5px] w-[2px] rounded-full overflow-hidden ${isCancelled ? 'bg-gradient-to-b from-red-400 to-red-100' : 'bg-gradient-to-b from-emerald-400 to-emerald-100'}`}>
 <div className="w-full h-1/3 bg-white/60 animate-shimmer"></div>
 </div>
 
 {(() => {
 return timelineSteps.map((step, index) => {
 const style = getColorClasses(step.color);
 return (
 <div className="relative z-10" key={index}>
 <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm z-20 ${style.dot}`}></div>
 <h4 className={`font-bold text-sm mb-1 ${style.title}`}>{step.title}</h4>
 <div className={`text-xs font-medium leading-relaxed p-3 rounded-lg border ${style.box}`}>
 {step.desc.replace(' To download your invoice, click here.', '')}
 {step.desc.includes('To download your invoice, click here.') && (selectedOrder || invoiceShipmentData) && (
 <span className="mt-1 block">
 To download your invoice, 
 <button 
 onClick={async () => {
 if (isDownloadingInvoice) return;
 setIsDownloadingInvoice(true);
 try {
 const jsPDFModule = await import('jspdf'); 
 const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
 const autoTableModule = await import('jspdf-autotable');
 const autoTable = autoTableModule.default;
 const { supabase } = await import('../../lib/supabase');
 
 const orderId = selectedOrder?.['order ID'] || invoiceShipmentData?.['order ID'] || selectedOrder?.order_id;
 let latestOrder: any = null;
 let latestShipment: any = null;
 if (orderId) {
 try {
 const { data: co } = await supabase
 .from('customer_orders')
 .select('*')
 .eq('order ID', orderId)
 .maybeSingle();
 if (co) latestOrder = co;
 } catch (e) {
 console.error('Error fetching latest order for invoice:', e);
 }

 try {
 const { data: ash } = await supabase
 .from('accepted_shipments')
 .select('*')
 .eq('order ID', orderId)
 .maybeSingle();
 if (ash) latestShipment = ash;
 } catch (e) {
 console.error('Error fetching latest shipment for invoice:', e);
 }
 }

 const invData = {
 ...(selectedOrder || {}),
 ...(invoiceShipmentData || {}),
 ...(latestOrder || {}),
 ...(latestShipment || {})
 };

 // Fetch admin registered details strictly from admins table
 let adminData: any = null;
 try {
 const { data: adm } = await supabase
 .from('admins')
 .select('*')
 .limit(1)
 .maybeSingle();
 if (adm) adminData = adm;
 } catch (e) {
 console.error('Error fetching admin data for invoice:', e);
 }

 const adminRegisteredAddress = String(adminData?.registered_full_address || adminData?.address || '').trim();
 const adminRegisteredPincode = String(adminData?.registered_pincode || adminData?.pincode || (adminRegisteredAddress.match(/\b\d{6}\b/) || [''])[0] || '').trim();

 // Fetch Seller details
 let seller: any = null;
 const sellerId = invData['selller id'] || invData['seller id'] || invData['seller_id'];
 if (sellerId) {
 try {
 const { data: s } = await supabase.from('sellers').select('*').eq('id', sellerId).maybeSingle();
 if (s) seller = s;
 } catch (e) {
 console.error('Error fetching seller for invoice:', e);
 }
 }

 // Fetch Hub details
 let hub: any = null;
 const hubId = invData['hub manager id'] || invData['hub_manager_id'];
 if (hubId) {
 try {
 const { data: h } = await supabase.from('hub_managers').select('*').eq('id', hubId).maybeSingle();
 if (h) hub = h;
 } catch (e) {
 console.error('Error fetching hub for invoice:', e);
 }
 }

 // Fetch Product details for HSN code, gross rate and GST rates if needed
 let productData: any = null;
 const prodId = invData['product id'] || invData['product_id'];
 if (prodId) {
 try {
 const { data: p } = await supabase.from('products').select('*').eq('id', prodId).maybeSingle();
 if (p) productData = p;
 } catch (e) {
 console.error('Error fetching product for invoice:', e);
 }
 }

                    const cleanStr = (val: any) => {
                      if (!val) return '';
                      return String(val)
                        .replace(/\s*[\(\[](?:seller|customer|seller address|customer address|home|work)[\)\]]/gi, '')
                        .trim();
                    };

                    const numberToWords = (num: number): string => {
                      const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                      const n = Math.floor(num);
                      if (n === 0) return 'Zero Rupees Only';
                      function inWords(val: number): string {
                        if (val < 20) return a[val];
                        if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
                        if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' and ' + inWords(val % 100) : '');
                        if (val < 100000) return inWords(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + inWords(val % 1000) : '');
                        if (val < 10000000) return inWords(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 !== 0 ? ' ' + inWords(val % 100000) : '');
                        return inWords(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 !== 0 ? ' ' + inWords(val % 10000000) : '');
                      }
                      return inWords(n) + ' Rupees Only';
                    };

                    const doc = new jsPDF('p', 'pt', 'a4');
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const m = 32;
                    const contentWidth = pageWidth - 2 * m;
                    const pageBottom = pageHeight - m;

                    const borderColor: [number, number, number] = [51, 65, 85];
                    const headerFill: [number, number, number] = [241, 245, 249];
                    const subFill: [number, number, number] = [248, 250, 252];

                    const drawLine = (x1: number, y1: number, x2: number, y2: number, w: number = 1.0) => {
                      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                      doc.setLineWidth(w);
                      doc.line(x1, y1, x2, y2);
                    };

                    const drawRect = (x: number, y: number, w: number, h: number, fill: number[] | null = null, stroke: boolean = true, lineW: number = 1.0) => {
                      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                      doc.setLineWidth(lineW);
                      if (fill) {
                        doc.setFillColor(fill[0], fill[1], fill[2]);
                        doc.rect(x, y, w, h, stroke ? 'FD' : 'F');
                      } else if (stroke) {
                        doc.rect(x, y, w, h, 'D');
                      }
                    };

                    // 1. TOP HEADER (y = m to 135)
                    const headerTop = m;
                    const headerBottom = 135;
                    drawRect(m, headerTop, contentWidth, headerBottom - headerTop, subFill, false);

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(18);
                    doc.setTextColor(15, 23, 42);
                    doc.text('SURIYAWAN SHOPPING', m + 10, headerTop + 24);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text('Official Retail & E-Commerce Network', m + 10, headerTop + 35);

                    doc.setFontSize(8);
                    doc.setTextColor(51, 65, 85);
                    const adminAddrToDisplay = cleanStr(adminRegisteredAddress) || 'Suriyawan Shopping Central Headquarters';
                    const adminAddrLines = doc.splitTextToSize(adminAddrToDisplay, 240);
                    doc.text(adminAddrLines, m + 10, headerTop + 47);
                    let curAdminY = headerTop + 47 + adminAddrLines.length * 9.5;

                    if (adminRegisteredPincode) {
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(30, 41, 59);
                      doc.text(`PIN: ${adminRegisteredPincode}`, m + 10, curAdminY);
                      curAdminY += 10;
                    }
                    if (adminData?.gstin && adminData.gstin !== 'N/A') {
                      doc.setFont('helvetica', 'normal');
                      doc.setTextColor(71, 85, 105);
                      doc.text(`GSTIN: ${adminData.gstin}`, m + 10, curAdminY);
                    }

                    // Header Right
                    const rightX = pageWidth - m - 10;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(15);
                    doc.setTextColor(15, 23, 42);
                    doc.text('TAX INVOICE', rightX, headerTop + 22, { align: 'right' });

                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 116, 139);
                    doc.text('(Original for Recipient / Customer Copy)', rightX, headerTop + 33, { align: 'right' });

                    const now = new Date();
                    const yy = String(now.getFullYear()).slice(-2);
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const dd = String(now.getDate()).padStart(2, '0');
                    const invDateString = `${yy}${mm}${dd}`;

                    let seqCount = 1;
                    if (invData['created_at']) {
                      const orderDate = new Date(invData['created_at']);
                      const startOfYear = new Date(orderDate.getFullYear(), 0, 1).toISOString();
                      const { count } = await supabase
                        .from('customer_orders')
                        .select('*', { count: 'exact', head: true })
                        .gte('created_at', startOfYear)
                        .lte('created_at', invData['created_at']);
                      if (count) seqCount = count;
                    }
                    const paddedSeq = String(seqCount).padStart(4, '0');
                    const invoiceNo = `INV-SS-${invDateString}-${paddedSeq}`;

                    const oDate = invData['created_at'] 
                      ? new Date(invData['created_at']).toLocaleDateString('en-GB') 
                      : `${dd}/${mm}/20${yy}`;

                    let rInfoY = headerTop + 48;
                    const headerKeyVals = [
                      ['Invoice No:', invoiceNo, true],
                      ['Invoice Date:', `${dd}/${mm}/20${yy}`, false],
                      ['Order ID:', String(invData['order ID'] || 'N/A'), true],
                      ['Order Date:', oDate, false]
                    ];

                    headerKeyVals.forEach(([k, v, isBold]) => {
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(8);
                      doc.setTextColor(71, 85, 105);
                      doc.text(k as string, rightX - 165, rInfoY);
                      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                      doc.setTextColor(15, 23, 42);
                      doc.text(v as string, rightX, rInfoY, { align: 'right' });
                      rInfoY += 12;
                    });

                    drawLine(m, headerBottom, pageWidth - m, headerBottom, 1.2);

                    // 2. 3-COLUMN ADDRESS SECTION (y = 135 to 248)
                    const addrTop = headerBottom;
                    const bannerH = 17;
                    const colW = contentWidth / 3;
                    const col1X = m;
                    const col2X = m + colW;
                    const col3X = m + colW * 2;
                    const addrBottom = 248;

                    drawRect(m, addrTop, contentWidth, bannerH, headerFill, true, 1.0);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(30, 41, 59);
                    doc.text('SOLD BY (SELLER)', col1X + 8, addrTop + 11.5);
                    doc.text('DISPATCH FROM (HUB)', col2X + 8, addrTop + 11.5);
                    doc.text('BILLED & SHIPPED TO', col3X + 8, addrTop + 11.5);

                    const innerAddrTop = addrTop + bannerH + 13;
                    const maxAddrLines = 3;

                    // Col 1: Seller
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(15, 23, 42);
                    const sellerShopName = cleanStr(seller?.shop_name) || 'Authorized Seller Store';
                    const sShopLines = doc.splitTextToSize(sellerShopName, colW - 16);
                    doc.text(sShopLines[0], col1X + 8, innerAddrTop);
                    let c1y = innerAddrTop + 10.5;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(51, 65, 85);
                    if (seller?.seller_name) {
                      const sName = cleanStr(seller.seller_name);
                      doc.text(doc.splitTextToSize(sName, colW - 16)[0], col1X + 8, c1y);
                      c1y += 9.5;
                    }
                    let sAddr = cleanStr(seller?.registered_full_address) || 'Seller Registered Address';
                    sAddr = sAddr.replace(/(?:contact|mob(?:ile)?|phone|ph|tel)?(?:\s*[:\-]\s*)?(?:\+?91[\-\s]*)?[6-9]\d{9}\b/gi, '').trim();
                    sAddr = sAddr.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
                    const sLines = doc.splitTextToSize(sAddr, colW - 16).slice(0, maxAddrLines);
                    doc.text(sLines, col1X + 8, c1y);
                    c1y += sLines.length * 9.5;
                    if (seller?.registered_pincode) {
                      doc.setFont('helvetica', 'bold');
                      doc.text(`PIN: ${seller.registered_pincode}`, col1X + 8, c1y);
                      c1y += 9.5;
                    }
                    if (seller?.gstin) {
                      doc.setFont('helvetica', 'normal');
                      doc.text(`GSTIN: ${seller.gstin}`, col1X + 8, c1y);
                    }

                    // Col 2: Hub
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(15, 23, 42);
                    const hubName = cleanStr(hub?.store_name) || invData['assignment hub name'] || 'Suriyawan Central Hub';
                    const hShopLines = doc.splitTextToSize(hubName, colW - 16);
                    doc.text(hShopLines[0], col2X + 8, innerAddrTop);
                    let c2y = innerAddrTop + 10.5;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(51, 65, 85);
                    let hAddr = cleanStr(hub?.registered_full_address) || 'Central Logistics Hub Station';
                    hAddr = hAddr.replace(/(?:contact|mob(?:ile)?|phone|ph|tel)?(?:\s*[:\-]\s*)?(?:\+?91[\-\s]*)?[6-9]\d{9}\b/gi, '').trim();
                    hAddr = hAddr.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
                    const hLines = doc.splitTextToSize(hAddr, colW - 16).slice(0, maxAddrLines);
                    doc.text(hLines, col2X + 8, c2y);
                    c2y += hLines.length * 9.5;
                    if (hub?.registered_pincode) {
                      doc.setFont('helvetica', 'bold');
                      doc.text(`PIN: ${hub.registered_pincode}`, col2X + 8, c2y);
                      c2y += 9.5;
                    }

                    // Col 3: Customer
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(15, 23, 42);
                    const custName = cleanStr(invData['full name']) || 'Valued Customer';
                    const cNameLines = doc.splitTextToSize(custName, colW - 16);
                    doc.text(cNameLines[0], col3X + 8, innerAddrTop);
                    let c3y = innerAddrTop + 10.5;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(51, 65, 85);
                    const cFullAddr = [cleanStr(invData['full address']), cleanStr(invData['landmark'])].filter(Boolean).join(', ');
                    const cLines = doc.splitTextToSize(cFullAddr || 'Customer Delivery Address', colW - 16).slice(0, maxAddrLines);
                    doc.text(cLines, col3X + 8, c3y);
                    c3y += cLines.length * 9.5;
                    if (invData['pincode']) {
                      doc.setFont('helvetica', 'bold');
                      doc.text(`PIN: ${invData['pincode']}`, col3X + 8, c3y);
                      c3y += 9.5;
                    }
                    if (invData['mobile number']) {
                      doc.setFont('helvetica', 'normal');
                      doc.text(`Mobile: +91 ${invData['mobile number']}`, col3X + 8, c3y);
                    }

                    drawLine(col2X, addrTop, col2X, addrBottom, 1.0);
                    drawLine(col3X, addrTop, col3X, addrBottom, 1.0);
                    drawLine(m, addrBottom, pageWidth - m, addrBottom, 1.2);

                    // 3. PRODUCT TABLE
                    const prodTitle = invData['product name'] || '';
                    const prodSub = invData['product tittle name'] || '';
                    const sku = invData['product SKU code'] || invData['product id'] || 'N/A';
                    let desc = invData['product discription'] || '';
                    if (desc.length > 90) desc = desc.substring(0, 90) + '...';
                    const colSize = [
                      invData['colour'] ? `Color: ${invData['colour']}` : null,
                      invData['size'] ? `Size: ${invData['size']}` : null
                    ].filter(Boolean).join(' | ');

                    const descParts = [
                      prodTitle,
                      prodSub && prodSub !== prodTitle ? prodSub : null,
                      `SKU: ${sku}`,
                      desc || null,
                      colSize || null
                    ].filter(Boolean).join('\n');

                    const qtyNum = Number(invData['total quantity'] || 1);
                    const sellingPriceNum = Number(invData['total selling price'] || invData['price info'] || 0);

                    let grossRateNum = 0;
                    if (invData['total gross rate'] && Number(invData['total gross rate']) > 0) {
                      grossRateNum = Number(invData['total gross rate']);
                    } else if (invData['gross rate'] && Number(invData['gross rate']) > 0) {
                      grossRateNum = Number(invData['gross rate']) * qtyNum;
                    } else if (productData?.['gross rate'] && Number(productData['gross rate']) > 0) {
                      grossRateNum = Number(productData['gross rate']) * qtyNum;
                    }

                    let cgstNum = Number(invData['total cgst'] || 0);
                    let sgstNum = Number(invData['total sgst'] || 0);

                    const gstPercent = Number(productData?.['gst rate %'] || productData?.['gst %'] || invData['gst rate %'] || invData['gst %'] || 0);
                    if (grossRateNum === 0 && sellingPriceNum > 0) {
                      if (gstPercent > 0) {
                        grossRateNum = sellingPriceNum / (1 + gstPercent / 100);
                      } else if (cgstNum > 0 || sgstNum > 0) {
                        grossRateNum = Math.max(0, sellingPriceNum - (cgstNum + sgstNum));
                      } else {
                        grossRateNum = sellingPriceNum;
                      }
                    }

                    if (cgstNum === 0 && sgstNum === 0 && sellingPriceNum > grossRateNum) {
                      const taxDiff = sellingPriceNum - grossRateNum;
                      cgstNum = taxDiff / 2;
                      sgstNum = taxDiff / 2;
                    }

                    const deliveryChargeNum = Number(invData['total delevery charge'] || 0);
                    const totalAmountNum = Number(invData['total amount'] || (sellingPriceNum + deliveryChargeNum));

                    autoTable(doc, {
                      startY: addrBottom,
                      head: [['#', 'Item Description', 'HSN Code', 'Qty', 'Gross Rate', 'CGST', 'SGST', 'Total (INR)']],
                      body: [
                        [
                          '1',
                          descParts,
                          invData['HSN code'] || productData?.['hsn code'] || '5407',
                          String(invData['total quantity'] || '1'),
                          `Rs. ${grossRateNum.toFixed(2)}`,
                          `Rs. ${cgstNum.toFixed(2)}`,
                          `Rs. ${sgstNum.toFixed(2)}`,
                          `Rs. ${sellingPriceNum.toFixed(2)}`
                        ]
                      ],
                      theme: 'grid',
                      headStyles: {
                        fillColor: headerFill,
                        textColor: [30, 41, 59],
                        fontStyle: 'bold',
                        lineWidth: 1.0,
                        lineColor: borderColor,
                        halign: 'center',
                        fontSize: 8,
                        cellPadding: 6
                      },
                      bodyStyles: {
                        textColor: [15, 23, 42],
                        lineWidth: 1.0,
                        lineColor: borderColor,
                        fontSize: 8,
                        cellPadding: 6
                      },
                      styles: { overflow: 'linebreak' },
                      columnStyles: {
                        0: { cellWidth: 24, halign: 'center' },
                        1: { cellWidth: 207.28 },
                        2: { cellWidth: 46, halign: 'center' },
                        3: { cellWidth: 30, halign: 'center' },
                        4: { cellWidth: 54, halign: 'right' },
                        5: { cellWidth: 50, halign: 'right' },
                        6: { cellWidth: 50, halign: 'right' },
                        7: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
                      },
                      margin: { left: m, right: m }
                    });

                    const tableFinalY = (doc as any).lastAutoTable.finalY;

                    // 4. BOTTOM SECTION: Logistics & Amount Breakdown
                    const splitX = 310;
                    const summaryHeight = 135;
                    const summaryBottom = tableFinalY + summaryHeight;

                    drawLine(m, tableFinalY, pageWidth - m, tableFinalY, 1.2);
                    drawRect(m, tableFinalY, splitX - m, 16, subFill, true, 1.0);
                    drawRect(splitX, tableFinalY, pageWidth - m - splitX, 16, subFill, true, 1.0);

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(30, 41, 59);
                    doc.text('LOGISTICS & SHIPMENT DETAILS', m + 8, tableFinalY + 11.5);
                    doc.text('PAYMENT & AMOUNT BREAKDOWN', splitX + 8, tableFinalY + 11.5);

                    // Left Column: Logistics
                    let lY = tableFinalY + 28;
                    const lKeyX = m + 8;
                    const lValX = m + 88;
                    const lValMaxW = splitX - lValX - 8;

                    const rawStatus = String(invData['order status'] || 'Delivered').trim();
                    let cleanStatus = 'Confirmed';
                    if (/delivered/i.test(rawStatus)) cleanStatus = 'Delivered';
                    else if (/out for delivery/i.test(rawStatus)) cleanStatus = 'Out for Delivery';
                    else if (/shipped|transit|dispatch/i.test(rawStatus)) cleanStatus = 'Shipped / In Transit';
                    else if (/cancel/i.test(rawStatus)) cleanStatus = 'Cancelled';
                    else if (/placed/i.test(rawStatus)) cleanStatus = 'Order Placed';

                    const logRows = [
                      ['Order Date:', oDate],
                      ['Payment Mode:', String(invData['payment method'] || 'Cash on Delivery')],
                      ['Courier AWB:', String(invData['awb number'] || 'Assigned on Dispatch')],
                      ['Tracking ID:', String(invData['tracking id number'] || 'Assigned on Dispatch')],
                      ['Order Status:', cleanStatus],
                      ['Delivery Hub:', cleanStr(hub?.store_name) || 'Central Logistics Hub']
                    ];

                    logRows.forEach(([k, v]) => {
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(7.5);
                      doc.setTextColor(100, 116, 139);
                      doc.text(k, lKeyX, lY);

                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(30, 41, 59);
                      const vWrapped = doc.splitTextToSize(v, lValMaxW);
                      doc.text(vWrapped[0], lValX, lY);
                      lY += 13;
                    });

                    // Right Column: Financial Breakdown
                    let rY = tableFinalY + 28;
                    const rx = splitX + 8;
                    const rValX = pageWidth - m - 8;

                    const finRows = [
                      ['Total Taxable / Gross Value', `Rs. ${grossRateNum.toFixed(2)}`],
                      ['CGST (Central Tax)', `Rs. ${cgstNum.toFixed(2)}`],
                      ['SGST (State Tax)', `Rs. ${sgstNum.toFixed(2)}`],
                      ['Delivery & Packaging Charge', `Rs. ${deliveryChargeNum.toFixed(2)}`]
                    ];

                    finRows.forEach(([label, val]) => {
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(8);
                      doc.setTextColor(71, 85, 105);
                      doc.text(label, rx, rY);
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(15, 23, 42);
                      doc.text(val, rValX, rY, { align: 'right' });
                      rY += 13.5;
                    });

                    // Grand Total Box in Right Column
                    const grandTotalTop = tableFinalY + 84;
                    const grandTotalH = summaryBottom - grandTotalTop;
                    drawRect(splitX, grandTotalTop, pageWidth - m - splitX, grandTotalH, headerFill, true, 1.0);

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10.5);
                    doc.setTextColor(15, 23, 42);
                    doc.text('Grand Total:', rx, grandTotalTop + 20);
                    doc.text(`Rs. ${totalAmountNum.toFixed(2)}`, rValX, grandTotalTop + 20, { align: 'right' });

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text('(Inclusive of all applicable taxes)', rx, grandTotalTop + 33);

                    drawLine(splitX, tableFinalY, splitX, summaryBottom, 1.0);
                    drawLine(m, summaryBottom, pageWidth - m, summaryBottom, 1.2);

                    // 5. AMOUNT IN WORDS & DECLARATIONS
                    const wordsH = 20;
                    drawRect(m, summaryBottom, contentWidth, wordsH, subFill, true, 1.0);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(30, 41, 59);
                    doc.text('Amount in Words:', m + 8, summaryBottom + 13);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(15, 23, 42);
                    const wordsStr = doc.splitTextToSize(numberToWords(totalAmountNum), contentWidth - 95)[0];
                    doc.text(wordsStr, m + 85, summaryBottom + 13);

                    const legalTop = summaryBottom + wordsH;
                    const footerH = 15;
                    const footerTop = pageBottom - footerH;
                    const legalBottom = footerTop;
                    const signSplitX = 390;

                    drawLine(signSplitX, legalTop, signSplitX, legalBottom, 1.0);

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(30, 41, 59);
                    doc.text('Terms & Conditions / Declarations:', m + 8, legalTop + 14);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(100, 116, 139);
                    const legalLines = [
                      '1. This is a computer-generated tax invoice issued under Section 31 of the CGST Act, 2017.',
                      '2. Tax is not payable on reverse charge basis. All taxes collected will be remitted to government authorities.',
                      '3. Goods once sold can be returned or replaced within 3 days as per Suriyawan Shopping Return Policy.',
                      '4. For dispute resolution or warranty support, contact customer support via your My Orders portal.'
                    ];
                    let lyTerms = legalTop + 26;
                    legalLines.forEach(line => {
                      doc.text(line, m + 8, lyTerms);
                      lyTerms += 11;
                    });

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(30, 41, 59);
                    doc.text('For SURIYAWAN SHOPPING', signSplitX + 10, legalTop + 14);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(100, 116, 139);
                    doc.text('(Authorized Signatory / Platform)', signSplitX + 10, legalTop + 24);

                    doc.setDrawColor(203, 213, 225);
                    doc.setFillColor(248, 250, 252);
                    doc.roundedRect(signSplitX + 10, legalTop + 32, pageWidth - m - signSplitX - 20, 28, 2, 2, "FD");
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.5);
                    doc.setTextColor(37, 99, 235);
                    doc.text('✓ DIGITALLY VERIFIED', signSplitX + 18, legalTop + 45);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text('Computer Generated Document', signSplitX + 18, legalTop + 54);

                    // 6. FOOTER BAR
                    drawRect(m, footerTop, contentWidth, footerH, headerFill, true, 1.0);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text('Thank you for shopping with Suriyawan Shopping! | www.suriyawanshopping.com', m + 10, footerTop + 10);
                    doc.text(`Page 1 of 1 | ${invoiceNo}`, pageWidth - m - 10, footerTop + 10, { align: 'right' });

                    // 7. OUTER ENCLOSING BORDER (Medium thickness 1.4pt, perfectly framing entire page)
                    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                    doc.setLineWidth(1.4);
                    doc.rect(m, m, contentWidth, pageBottom - m, "D");

                    doc.save(`Invoice_${invoiceNo}.pdf`);
 } catch (err) {
 console.error('Failed to generate PDF', err);
 } finally {
 setIsDownloadingInvoice(false);
 }
 }}
 className="text-blue-600 font-bold underline ml-1 cursor-pointer hover:text-blue-800"
 >
 {isDownloadingInvoice ? 'downloading...' : 'click here.'}
 </button>
 </span>
 )}
 </div>
 </div>
 );
 });
 })()}
 </div>
 </div>
 
 {(() => {
 if (isCancelled) return null;
 
 let featuresArray: any[] = [];
 if (Array.isArray(selectedOrder['key features'])) {
 featuresArray = selectedOrder['key features'];
 } else if (typeof selectedOrder['key features'] === 'string') {
 try {
 featuresArray = JSON.parse(selectedOrder['key features']);
 } catch(e) {
 featuresArray = selectedOrder['key features'].split('\n');
 }
 } else if (Array.isArray(orderProductFeatures) && orderProductFeatures.length > 0) {
 featuresArray = orderProductFeatures;
 }
 
 const lastFeature = featuresArray.length > 0 ? (featuresArray[featuresArray.length - 1] || '').toString().trim() : '';
 
 const rawDays = invoiceShipmentData?.['days'] !== undefined && invoiceShipmentData?.['days'] !== null && String(invoiceShipmentData?.['days']).trim() !== ''
   ? invoiceShipmentData['days']
   : selectedOrder['days'];
 const orderDaysStr = (rawDays !== undefined && rawDays !== null) ? String(rawDays).trim() : '';
 const orderDays = orderDaysStr ? parseInt(orderDaysStr, 10) : 0;
 const isWithinReturnWindow = !isNaN(orderDays) && orderDays <= 3;
 
 const isEligible = lastFeature.includes('Open Box Delivery with a 3-Day Return Policy') || lastFeature.includes('Subject to Return Eligibility');
 const isNotEligible = lastFeature.includes('Open Box Delivery with No Return Policy') || lastFeature.includes('Not Subject to Return Eligibility');
 
 const isBlue = (isExactlyDelivered || isExactlyReturnPickupFaild) && !isReturnedStatus && isEligible && isWithinReturnWindow;
 
 return (
 <button 
 disabled={!isBlue}
 className={`w-full py-3 border rounded-xl font-bold text-sm transition-all mt-2 mb-2 flex items-center justify-center h-[46px] ${isBlue ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 active:scale-95 cursor-pointer' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
 onClick={() => {
 if (!isBlue) return;
 if (isReturnedStatus) {
 alert("Return has already been requested for this order.");
 return;
 }
 if (!(isExactlyDelivered || isExactlyReturnPickupFaild)) {
 alert("Order must be delivered or return pickup failed before you can request a return.");
 return;
 }
 if (!isWithinReturnWindow) {
 alert("The 3-day return window for this order has expired.");
 return;
 }
 if (isNotEligible) {
 alert("This product is covered under our No Return Policy. If you experience any issue with the product, please contact the Hub from which your order was delivered for further assistance.");
 } else if (isEligible) {
 setActivePage('return_order');
 } else {
 alert("This order is not eligible for return.");
 }
 }}
 >
 Return Order
 </button>
 );
 })()}
 
 {(() => {
 if (isCancelled) return null;
 const statusStr = (selectedOrder['order status'] || '').toLowerCase();
 const disableCancel = statusStr.includes('accepted') || statusStr.includes('picked') || statusStr.includes('received') || statusStr.includes('dispatch') || statusStr.includes('dispacth') || statusStr.includes('ship') || statusStr.includes('out for') || statusStr.includes('deliver') || statusStr.includes('return');
 return (
 <button 
 className={`w-full py-3 rounded-xl font-bold text-sm transition-all mt-4 mb-4 flex items-center justify-center h-[46px] ${disableCancel ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95'}`}
 onClick={disableCancel ? undefined : handleCancelOrder}
 disabled={isCanceling || disableCancel}
 >
 {isCanceling ? (
 <div className="flex gap-1">
 <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
 <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
 <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
 </div>
 ) : (
 'Cancel Order'
 )}
 </button>
 );
 })()}
 
 {(() => {
 const hasRated = !!fetchedRating;
 const canRate = isExactlyDelivered && !hasRated;
 
 return (
 <div className={`mt-2 mb-4 p-4 border ${canRate ? 'border-black' : 'border-gray-200 opacity-60'} rounded-none flex flex-col items-center justify-center`}>
 <h3 className="font-bold text-sm mb-3 text-center">{hasRated ? 'Your Rating' : 'Rate your product'}</h3>
 {hasRated && fetchedRating['full name'] && (
 <p className="text-xs font-semibold text-gray-600 mb-2">{fetchedRating['full name']}</p>
 )}
 <div className="flex gap-2 mb-4">
 {[1, 2, 3, 4, 5].map(star => (
 <button 
 key={star}
 disabled={!canRate}
 onClick={() => setRatingVal(star)}
 className={`text-3xl ${star <= ratingVal ? 'text-black' : 'text-gray-300'}`}
 >
 ★
 </button>
 ))}
 </div>
 <textarea 
 disabled={!canRate}
 className={`w-full p-3 border rounded-none text-sm mb-3 resize-none outline-none ${canRate ? 'border-black focus:border-black' : 'border-gray-200 bg-gray-50'}`}
 rows={3}
 placeholder={hasRated ? "" : "Write your review here..."}
 value={ratingDesc}
 onChange={(e) => setRatingDesc(e.target.value)}
 />
 {!hasRated && (
 <button
 disabled={!canRate || isSubmittingRating || ratingVal === 0}
 onClick={async () => {
 setIsSubmittingRating(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 let fName = selectedOrder['full name'];
 if (customerData && customerData['full name']) {
 fName = customerData['full name'];
 }
 const payload = {
 'product id': selectedOrder['product id'],
 'full name': fName,
 'rating star': String(ratingVal),
 'rating discription': ratingDesc
 };
 const { data, error } = await supabase.from('product_rating').insert(payload).select().single();
 if (!error && data) {
 setFetchedRating(data);
 }
 } catch(err) {
 console.error(err);
 } finally {
 setIsSubmittingRating(false);
 }
 }}
 className={`w-full py-3 rounded-none font-bold text-sm transition-all flex items-center justify-center ${canRate && ratingVal > 0 ? 'bg-black text-white hover:bg-gray-800 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
 >
 {isSubmittingRating ? 'Submitting...' : 'Submit'}
 </button>
 )}
 </div>
 );
 })()}
 </div>
 </div>
 );
 }

 if (activePage === 'return_order' && selectedOrder) {
 const handleReturnOrder = async () => {
 if (returnReason !== 'specific_reason') {
 alert('Please select a valid reason to return.');
 return;
 }
 setIsReturning(true);
 const now = new Date();
 const formattedDate = now.toLocaleString('en-IN', {
 day: '2-digit',
 month: 'short',
 year: 'numeric',
 });
 const formattedTime = now.toLocaleString('en-IN', {
 hour: '2-digit',
 minute: '2-digit',
 hour12: true,
 });
 
 try {
 
 
 let pickupIdStr = '';
 let shipDataToUpdate = null;

 if (selectedOrder['order ID']) {
 const { data: shipData } = await supabase.from('accepted_shipments').select('*').eq('order ID', selectedOrder['order ID']).maybeSingle();
 if (shipData) {
 shipDataToUpdate = shipData;
 if (shipData['pickup ID']) {
 pickupIdStr = `, Pickup ID: ${shipData['pickup ID']}`;
 }
 }
 }

 const existingStatus = selectedOrder['order status'] || '';
 const newReturnEntry = `your return request has been submitted. on ${formattedDate}, ${formattedTime}${pickupIdStr}`;
 const returnStatus = existingStatus ? existingStatus + ' || ' + newReturnEntry : newReturnEntry;

 const { error: customerError } = await supabase.from('customer_orders').update({ 'order status': returnStatus }).eq('id', selectedOrder.id);
 
 if (shipDataToUpdate) {
 const payload: any = {
 'order status': returnStatus, 
 'shipment type': 'ready to pickup',
 'shipment tag': 'customer pickup'
 };
 payload['shipment status'] = await buildShipmentStatus('your return request has been submitted.', shipDataToUpdate, payload);
 await supabase
 .from('accepted_shipments')
 .update(payload)
 .eq('order ID', selectedOrder['order ID']);
 }
 
 if (!customerError) {
 alert("Your return request has been submitted successfully. Please wait for approval.");
 setSelectedOrder({ ...selectedOrder, 'order status': returnStatus });
 setCustomerOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, 'order status': returnStatus } : o));
 setActivePage('order_details');
 } else {
 console.error('Failed to request return.');
 }
 } catch (err) {
 console.error(err);
 } finally {
 setIsReturning(false);
 }
 };
 return (
      <div className="w-full bg-slate-50 flex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('order_details')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Return Request</h2>
 </div>

 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
 <h3 className="font-bold text-sm text-gray-800 mb-2">Note:- This order was delivered through Open Box Delivery.</h3>
 <p className="text-xs text-gray-600 leading-relaxed">
 The product was checked and accepted at the time of delivery. Therefore, issues such as damage, dirty/used condition, wrong product, missing product or visible defects identified after accepting the order are not eligible for return under this policy.
 </p>
 </div>

 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col gap-3">
 <label className="text-sm font-bold text-gray-800">Select Return Reason</label>
 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
 <input 
 type="radio" 
 name="returnReason" 
 value="specific_reason"
 checked={returnReason === 'specific_reason'}
 onChange={(e) => setReturnReason(e.target.value)}
 className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <span className="text-sm font-medium text-gray-700">Return for a Specific Reason — Subject to Approval</span>
 </label>
 </div>

 <div className="flex gap-3 mt-auto pt-4">
 <button 
 onClick={() => setActivePage('order_details')}
 className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300 active:scale-95 transition-all"
 >
 Cancel
 </button>
 <button 
 onClick={handleReturnOrder}
 disabled={isReturning || returnReason !== 'specific_reason'}
 className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:bg-blue-300 flex items-center justify-center h-[46px]"
 >
 {isReturning ? (
 <div className="flex gap-1">
 <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
 </div>
 ) : 'Request'}
 </button>
 </div>
 </div>
 );
 }

 if (activePage === 'addresses') {
 return (
      <div className="w-full min-h-full bg-white flex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-gray-50 rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Saved Addresses (Max 2)</h2>
 </div>
 <div className="space-y-4">
 {customerAddresses.length > 0 ? (
 customerAddresses.map((addr, idx) => (
 <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
 <div className="flex justify-between items-start mb-1">
 <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{addr.addressType || addr['address type'] || 'Home'}</span>
 </div>
 <h4 className="text-sm font-bold text-gray-800">{addr.fullName || addr['full name']}</h4>
 <p className="text-sm text-gray-600 leading-relaxed">{addr.fullAddress || addr['full address']}</p>
 {(addr.landmark || addr['landmark']) && <p className="text-[11px] text-gray-500">Landmark: {addr.landmark || addr['landmark']}</p>}
 <p className="text-sm font-semibold text-gray-800 mt-1">Phone: {addr.mobileNumber || addr['mobile number']} • Pin: {addr.pincode || addr['pincode']}</p>
 </div>
 ))
 ) : (
 <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
 <MapPin size={20} className="text-gray-400" />
 </div>
 <h3 className="font-bold text-gray-600 mb-1">No addresses saved</h3>
 <p className="text-xs text-gray-500">Addresses will appear here once saved.</p>
 </div>
 )}
 </div>
 </div>
 );
 }
 return (
      <div className="w-full min-h-full bg-white flex flex-col pt-4 px-4 pb-24">
 {/* Profile Card */}
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3.5 min-w-0 flex-1">
 <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
 {getInitials(customerData?.full_name)}
 </div>
 <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
 <h2 className="text-base font-bold text-gray-800 truncate">{customerData?.full_name || 'Loading...'}</h2>
 <p className="text-xs font-medium text-gray-500 truncate">{customerData?.email_account || 'Loading...'}</p>
 <p className="text-xs font-medium text-gray-500 truncate">{customerData?.mobile_number || 'Loading...'}</p>
 <p className="text-[9px] text-gray-400 mt-1 truncate">ID: {customerData?.id || '...'}</p>
 </div>
 </div>
 <button 
 onClick={() => setActivePage('personal')}
 className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all shrink-0 ml-1 shadow-sm border border-blue-100"
 title="View Personal Details"
 >
 <Eye size={17} />
 </button>
 </div>
 </div>

 {/* Bank & UPI Details Option */}
 <div className="mt-6">
 <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Settings & Preferences</h3>
 
 <button 
 onClick={() => setActivePage('gift_cash')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 mb-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
 <span className="text-lg">🎁</span>
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Gift Cash & Refund</span>
 <span className="text-[10px] text-gray-500">View your balance and history</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('orders')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 mb-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
 <ShoppingBag size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">My Orders</span>
 <span className="text-[10px] text-gray-500">View and track your orders</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('bank')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
 <CreditCard size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Bank & UPI details</span>
 <span className="text-[10px] text-gray-500">Manage your payment methods</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('addresses')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 mt-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
 <MapPin size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Saved Addresses (Max 2)</span>
 <span className="text-[10px] text-gray-500">Manage your delivery addresses</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => onShowAnnouncement?.()}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 mt-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
 </div>
 <div className="flex flex-col text-left">
 <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-800" onClick={() => onShowAnnouncement?.()}>Suriyawan shopping updates</span>{updateCount > 0 && <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{updateCount}</span>}</div>
 <span className="text-[10px] text-gray-500">Get latest announcements</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => onShowTerms?.()}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 mt-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Term & condition</span>
 <span className="text-[10px] text-gray-500">View our terms and conditions</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => onShowRoleChat?.()}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 mt-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
 </div>
 <div className="flex flex-col text-left">
 <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-800">Chat an agent</span></div>
 <span className="text-[10px] text-gray-500">Get help from our support</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={async () => {
 if (onLogout) { onLogout(); } else {
 try {
 const { supabase } = await import('../../lib/supabase');
 await supabase.auth.signOut();
 } catch (e) {
 console.error(e);
 }
 localStorage.removeItem('portal_auth_customer');
 window.location.reload();
 }
 }}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-100 flex items-center justify-between hover:bg-red-50 transition-colors mt-6 active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-red-600">Log Out</span>
 <span className="text-[10px] text-red-400">Sign out of your account</span>
 </div>
 </div>
 </button>
 </div>
 </div>
 );
};

const shuffleArray = (array) => {
 const newArr = [...array];
 for (let i = newArr.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
 }
 return newArr;
};

export const CustomerPortal: React.FC<PortalProps> = ({ onBack }) => {
  const [headerLogo, setHeaderLogo] = useState('');
  const [activePromoBanners, setActivePromoBanners] = useState<any[]>([]);
  const [activeWebPush, setActiveWebPush] = useState<any | null>(null);
  const lastPushTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    let interval: any;
    const evaluateBanners = () => {
      try {
        const stored = localStorage.getItem('ss_customer_additional_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
          
          if (parsed.promoBanners && Array.isArray(parsed.promoBanners)) {
            const now = new Date();
            // Local date string in YYYY-MM-DD
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayDateString = `${year}-${month}-${day}`;
            
            // Local day of week 0-6
            const todayDayNumber = now.getDay().toString();

            const active = parsed.promoBanners.filter((b: any) => {
              if (!b.isActive || !b.imageUrl) return false;
              if (b.scheduleType === 'date') {
                const start = b.startDate || b.targetDate;
                const end = b.endDate || b.targetDate;
                if (todayDateString >= start && todayDateString <= end) return true;
              }
              if (b.scheduleType === 'day' && b.targetDay === todayDayNumber) return true;
              return false;
            });
            setActivePromoBanners(active);
          } else {
             setActivePromoBanners([]);
          }
        }
      } catch (e) {}
    };

    evaluateBanners(); // Run immediately

    // Real-time sync every 1 minute
    interval = setInterval(() => {
      evaluateBanners();
    }, 60000);

    return () => clearInterval(interval);
  }, []);



  const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);
  const handleDeepRefresh = () => {
    setIsDeepRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

 console.log("CustomerPortal rendered");
 const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
 if (typeof window !== 'undefined') {
 return Boolean(localStorage.getItem('portal_auth_customer'));
 }
 return false;
 });

 const handleLogout = () => {
 setShowLogoutModal(true);
 };


 const [activeTab, setActiveTab] = useState('Home');
 const [accountInitialPage, setAccountInitialPage] = useState<'main' | 'orders' | 'order_details' | 'return_order' | 'bank' | 'personal' | 'addresses' | 'gift_cash'>('main');
 const [showTerms, setShowTerms] = useState(false);
 const scrollDir = useScrollDirection(); 
 const [showLogoutModal, setShowLogoutModal] = useState(false);
 const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
 const [showRoleChatModal, setShowRoleChatModal] = useState(false);


 const [hideNav, setHideNav] = useState(false);
 const [expandedSection, setExpandedSection] = useState<string | null>(null);
 const [loadingSection, setLoadingSection] = useState<string | null>(null);
 const [viewAllTitle, setViewAllTitle] = useState<string | null>(null);

 const [allProducts, setAllProducts] = useState<SupabaseProduct[]>([]);
 const [isProductsLoading, setIsProductsLoading] = useState(true);
 const [selectedProduct, setSelectedProduct] = useState<SupabaseProduct | null>(null);
 
 const handleCategoryClick = (categoryId: string) => {
 if (categoryId !== 'All') {
 setIsProductsLoading(true);
 }
 setActiveCategory(categoryId);
 if (categoryId !== 'All') {
 setTimeout(() => setIsProductsLoading(false), 500);
 } else {
 setIsProductsLoading(false);
 }
 };
 
 const handleFilterClick = (opt: string) => {
 setIsProductsLoading(true);
 setActiveFilterOption(opt);
 setTimeout(() => setIsProductsLoading(false), 500);
 };

 const handleSubCatClick = (subId: string) => {
 setIsProductsLoading(true);
 setShopSearchQuery('');
 setActiveSubCat(subId);
 setTimeout(() => setIsProductsLoading(false), 500);
 };
 
 const handleMidCatClick = (midId: string, firstSubId?: string) => {
 setIsProductsLoading(true);
 setShopSearchQuery('');
 setActiveMidCat(midId);
 if (firstSubId !== undefined) {
 setActiveSubCat(firstSubId);
 }
 setTimeout(() => setIsProductsLoading(false), 500);
 };

 const [cartItems, setCartItems] = useState<SupabaseProduct[]>([]);
 const [deletingCartItemId, setDeletingCartItemId] = useState<string | null>(null);
 const [userId, setUserId] = useState<string | null>(null);
 const [customerData, setCustomerData] = useState<any>(null);

  const promoSliderRef = React.useRef<HTMLDivElement>(null);
  const isPromoTouchedRef = React.useRef(false);

  React.useEffect(() => {
    let interval: any;
    interval = setInterval(() => {
      if (promoSliderRef.current && !isPromoTouchedRef.current && activePromoBanners.length > 1) {
        const el = promoSliderRef.current;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScroll - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [activePromoBanners.length]);

 const [customerClusterId, setCustomerClusterId] = useState<string | null>(null);
 const [giftCashValue, setGiftCashValue] = useState<number>(0);
 const [claimedGiftCash, setClaimedGiftCash] = useState<number>(0);
 const [isClaimingGiftCash, setIsClaimingGiftCash] = useState(false);

 const handleClaimGiftCash = async () => {
 if (!customerData?.id || giftCashValue <= 0) return;
 setIsClaimingGiftCash(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data: currentData } = await supabase.from('gift_cash').select('"claimed gift cash", "received gift cash"').eq('customer id', customerData.id).single();
 
 const currentClaimed = parseFloat(currentData?.['claimed gift cash'] || '0');
 const currentReceived = parseFloat(currentData?.['received gift cash'] || '0');
 
 const newClaimed = currentClaimed + currentReceived;
 
 await supabase.from('gift_cash').update({
 'claimed gift cash': newClaimed.toString(),
 'received gift cash': '0'
 }).eq('customer id', customerData.id);
 
 // wait a bit for "original time"
 
 
 setGiftCashValue(0);
 setClaimedGiftCash(newClaimed);
 
 } catch (e) {
 console.error('Error claiming gift cash:', e);
 } finally {
 setIsClaimingGiftCash(false);
 }
 };


 useEffect(() => {
 if (customerData?.pincode) {
 supabase.from('added_pincode').select('"cluster id"').eq('added pincode', customerData.pincode).single().then(({data}) => {
 if (data && data['cluster id']) setCustomerClusterId(data['cluster id']);
 });
 }
 }, [customerData?.pincode]);

 useEffect(() => {
 const fetchUserAndCart = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 let currentUserId = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_customer') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 if (userObj?.id) {
 currentUserId = userObj.id;
 } else {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) currentUserId = user.id;
 }

 if (currentUserId) {
 setUserId(currentUserId);
 try {
 const { data, error } = await supabase.from('carts').select('*').eq('customer_id', currentUserId);
 if (!error && data) {
 setCartItems(data);
 }
 } catch (e) {
 console.error("Could not fetch carts from DB:", e);
 }
 
 const { data: cData } = await supabase.from('customers').select('*').eq('id', currentUserId).maybeSingle();
 if (cData) setCustomerData(cData);

 const { data: gcData } = await supabase.from('gift_cash').select('"received gift cash", "claimed gift cash"').eq('customer id', currentUserId).maybeSingle();
 if (gcData) {
 if (gcData['received gift cash']) setGiftCashValue(parseFloat(gcData['received gift cash']) || 0);
 if (gcData['claimed gift cash']) setClaimedGiftCash(parseFloat(gcData['claimed gift cash']) || 0);
 }
 }
 } catch (e) {
 console.warn("Cart fetch warning:", e);
 }
 };
 if (isLoggedIn) {
 fetchUserAndCart();

 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_customer') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 const custId = userObj?.id;
 const custEmail = userObj?.email;

 let channel: any = null;
 let interval: any = null;

 if (custId || custEmail) {
 channel = supabase.channel(`customer_freeze_rt_${custId || custEmail}_${Math.random().toString(36).substring(7)}`)
 .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, (payload) => {
 if (payload?.new) {
 if (payload.new.id === custId || (custEmail && payload.new.registered_email === custEmail)) {
 setCustomerData((prev: any) => ({ ...(prev || {}), ...payload.new }));
 }
 }
 })
 .subscribe();

 interval = setInterval(async () => {
 try {
 const q = custId
 ? supabase.from('customers').select('*').eq('id', custId)
 : supabase.from('customers').select('*').eq('registered_email', custEmail);
 const { data } = await q.maybeSingle();
 if (data) {
 setCustomerData((prev: any) => ({ ...(prev || {}), ...data }));
 }
 } catch (e) {}
 }, 2500);
 }

 return () => {
 if (channel) supabase.removeChannel(channel);
 if (interval) clearInterval(interval);
 };
 }
 }, [isLoggedIn]);

 const handleRemoveFromCart = async (e: React.MouseEvent, itemId: string) => {
 e.stopPropagation();
 if (!userId) return;
 setDeletingCartItemId(itemId);
 
 try {
 const { error } = await supabase.from('carts').delete().eq('id', itemId).eq('customer_id', userId);
 if (!error) {
 setCartItems(prev => prev.filter(i => i.id !== itemId));
 } else {
 console.error("Supabase cart delete error:", error);
 }
 } catch (err) {
 console.error("Cart delete error:", err);
 } finally {
 setDeletingCartItemId(null);
 }
 };

 const handleAddToCart = async (product: SupabaseProduct) => {
 if (!userId) {
 alert("Please login to add to cart");
 return;
 }
 // Prevent duplicate
 if (cartItems.some(item => (item.product_id || item.id) === product.id)) return;
 
 try {
 const { id: _ignoreId, created_at: _ignoreCreatedAt, updated_at: _ignoreUpdatedAt, ...productFields } = product;
 const cartData = { ...productFields, product_id: product.id, customer_id: userId };
 
 const { data, error } = await supabase.from('carts').insert([cartData]).select('*').single();
 
 if (error) {
 console.error("Cart insert to DB failed:", error);
 alert("Failed to add to cart. Please try again.");
 } else if (data) {
 setCartItems(prev => [...prev, data]);
 }
 } catch(e) {
 console.error("Cart network error", e);
 alert("Network error while adding to cart. Please check your connection and try again.");
 }
 };
 
 const fetchProducts = async () => {
 setIsProductsLoading(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data } = await supabase.from('upload_products').select('*').order('created_at', { ascending: false });
 if (data) setAllProducts(shuffleArray(data));
 } catch (e) {
 console.error(e);
 } finally {
 setIsProductsLoading(false);
 }
 };

 // useEffect(() => {
 // if (allProducts.length > 0) {
 // setAllProducts(prev => shuffleArray(prev));
 // }
 // }, [activeTab]);

 useEffect(() => {
 fetchProducts();
 
 // Optional: Realtime subscription for upload_products
 let subscription = null;
 import('../../lib/supabase').then(({ supabase }) => {
 subscription = supabase
 .channel('public:upload_products')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'upload_products' }, payload => {
 fetchProducts();
 })
 .subscribe();
 });
 
 return () => {
 if (subscription) {
 import('../../lib/supabase').then(({ supabase }) => {
 supabase.removeChannel(subscription);
 });
 }
 };
 }, []);


 const [activeCategory, setActiveCategory] = useState('All');
 const [activeFilterOption, setActiveFilterOption] = useState('');
 const [activeServiceCat, setActiveServiceCat] = useState('Top Services');
 
 const [isCategoryBubbleOpen, setIsCategoryBubbleOpen] = useState(false);
 const [isShopSearchOpen, setIsShopSearchOpen] = useState(false);
 const [shopSearchQuery, setShopSearchQuery] = useState('');

 // Real fast category & product search across Main, Middle, Sub categories
 const deferredShopSearch = React.useDeferredValue(shopSearchQuery);
 const searchResults = React.useMemo(() => {
 if (!deferredShopSearch || deferredShopSearch.trim().length === 0) return [];
 
 const q = deferredShopSearch.toLowerCase().trim();
 
 return allProducts.filter((p: any) => {
 const fieldsToSearch = [
 p['product name'],
 p['product title name'],
 p['tags'],
 p['category tags'],
 p['key features'],
 p['main category'],
 p['middle category'],
 p['sub category']
 ];
 
 return fieldsToSearch.some(field => 
 field && String(field).toLowerCase().includes(q)
 );
 });
 }, [deferredShopSearch, allProducts]);

 
 useEffect(() => {
 const qRaw = deferredShopSearch.trim().toLowerCase();
 if (!qRaw) return;
 const filterKeywords = ['newest', 'latest', 'new', 'old', 'oldest', 'cheapest', 'cheap', 'lowest', 'highest', 'expensive', 'best'];
 const words = qRaw.split(/\s+/);
 const remainingWords = words.filter(w => !filterKeywords.includes(w));
 const q = remainingWords.join(' ');
 if (!q) return;

 const qNorm = q.replace(/(es|s)$/, '');
 
 // 1. Check if it matches a product name exactly or partially
 const matchedProduct = allProducts.find(p => {
 const pName = String(p['product name'] || p['product title name'] || '').trim().toLowerCase();
 const pNameNorm = pName.replace(/(es|s)$/, '');
 return pName.includes(q) || pNameNorm.includes(qNorm);
 });

 if (matchedProduct) {
 const pMain = String(matchedProduct['main category'] || '').trim();
 const pMid = String(matchedProduct['middle category'] || '').trim();
 const pSub = String(matchedProduct['sub category'] || '').trim();
 
 for (const main of categoryData) {
 if (main.name.toLowerCase() === pMain.toLowerCase() || main.id === pMain) {
 for (const mid of main.middle) {
 if (mid.name.toLowerCase() === pMid.toLowerCase() || mid.id === pMid) {
 for (const sub of mid.sub) {
 if (sub.name.toLowerCase() === pSub.toLowerCase() || sub.id === pSub) {
 if (activeMainCat !== main.id) setActiveMainCat(main.id);
 if (activeMidCat !== mid.id) setActiveMidCat(mid.id);
 if (activeSubCat !== sub.id) setActiveSubCat(sub.id);
 return; // Found and set!
 }
 }
 }
 }
 }
 }
 }

 // 2. If no product name matches, check category names
 for (const main of categoryData) {
 for (const mid of main.middle) {
 for (const sub of mid.sub) {
 const subName = sub.name.toLowerCase();
 const subNorm = subName.replace(/(es|s)$/, '');
 if (subName.includes(q) || subNorm.includes(qNorm)) {
 if (activeMainCat !== main.id) setActiveMainCat(main.id);
 if (activeMidCat !== mid.id) setActiveMidCat(mid.id);
 if (activeSubCat !== sub.id) setActiveSubCat(sub.id);
 return;
 }
 }
 }
 }
 }, [deferredShopSearch, allProducts]);

 // Shop Page State

 
 const [activeMainCat, setActiveMainCat] = useState(categoryData[0].id);

 const activeMainData = categoryData.find(c => c.id === activeMainCat) || categoryData[0];
 const [activeMidCat, setActiveMidCat] = useState(activeMainData.middle[0]?.id || '');

 const activeMidData = activeMainData.middle.find(m => m.id === activeMidCat) || activeMainData.middle[0];
 const [activeSubCat, setActiveSubCat] = useState<string>(activeMidData?.sub[0]?.id || '');

 // Auto-select most populated category when switching to Shop tab
 useEffect(() => {
 if (activeTab === 'Shop' && allProducts.length > 0) {
 const counts: Record<string, number> = {};
 allProducts.forEach(p => {
 const path = `${p['main category'] || ''}|||${p['middle category'] || ''}|||${p['sub category'] || ''}`;
 counts[path] = (counts[path] || 0) + 1;
 });
 let maxCount = -1;
 let bestPath = '';
 Object.entries(counts).forEach(([path, count]) => {
 if (count > maxCount && path !== '||||||') {
 maxCount = count;
 bestPath = path;
 }
 });
 
 if (bestPath) {
 const [main, mid, sub] = bestPath.split('|||');
 if (main) {
 const foundMain = categoryData.find(c => String(c.name).toLowerCase() === String(main).toLowerCase() || String(c.id).toLowerCase() === String(main).toLowerCase());
 if (foundMain) {
 setActiveMainCat(foundMain.id);
 if (mid) {
 const foundMid = foundMain.middle.find(m => String(m.name).toLowerCase() === String(mid).toLowerCase() || String(m.id).toLowerCase() === String(mid).toLowerCase());
 if (foundMid) {
 setActiveMidCat(foundMid.id);
 if (sub) {
 const foundSub = foundMid.sub.find(s => String(s.name).toLowerCase() === String(sub).toLowerCase() || String(s.id).toLowerCase() === String(sub).toLowerCase());
 if (foundSub) {
 setActiveSubCat(foundSub.id);
 } else {
 setActiveSubCat(foundMid.sub[0]?.id || '');
 }
 } else {
 setActiveSubCat(foundMid.sub[0]?.id || '');
 }
 }
 } else {
 setActiveMidCat(foundMain.middle[0]?.id || '');
 setActiveSubCat(foundMain.middle[0]?.sub[0]?.id || '');
 }
 }
 }
 }
 }
 }, [activeTab, allProducts, categoryData]);

 // Scroll active subcategory into view when it changes via search or click
 useEffect(() => {
 if (activeSubCat && activeTab === 'Shop') {
 const scrollIt = () => {
 // Do not scroll if search input is focused to prevent keyboard from hiding on mobile devices
 if (document.activeElement?.id === 'shop-page-search-input' || document.activeElement?.id === 'header-search-input') {
 return;
 }
 const el = document.getElementById(`shop-subcat-${activeSubCat}`);
 if (el) {
 el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
 }
 };
 
 // Try immediately, then a few times to ensure layout has settled
 scrollIt();
 setTimeout(scrollIt, 100);
 setTimeout(scrollIt, 300);
 }
 }, [activeSubCat, activeTab, activeMidCat, activeMainCat, deferredShopSearch]);

 // Handle device / browser back button within CustomerPortal cleanly
 useEffect(() => {
 return registerBackHandler(() => {
 if (selectedProduct) {
 setSelectedProduct(null);
 return true;
 }
 if (isShopSearchOpen) {
 setIsShopSearchOpen(false);
 setShopSearchQuery('');
 return true;
 }
 if (isCategoryBubbleOpen) {
 setIsCategoryBubbleOpen(false);
 return true;
 }
 if (showLogoutModal) {
 setShowLogoutModal(false);
 return true;
 }
 if (showAnnouncementModal) {
 setShowAnnouncementModal(false);
 return true;
 }
 if (showRoleChatModal) {
 setShowRoleChatModal(false);
 return true;
 }
 if (showTerms) {
 setShowTerms(false);
 return true;
 }
 if (accountInitialPage === 'return_order') {
 setAccountInitialPage('order_details');
 return true;
 }
 if (accountInitialPage === 'order_details') {
 setAccountInitialPage('orders');
 return true;
 }
 if (accountInitialPage !== 'main') {
 setAccountInitialPage('main');
 return true;
 }
 if (viewAllTitle) {
 setViewAllTitle(null);
 return true;
 }
 if (expandedSection) {
 setExpandedSection(null);
 return true;
 }
 if (activeTab !== 'Home') {
 setActiveTab('Home');
 return true;
 }
 return false;
 });
 }, [
 selectedProduct,
 isShopSearchOpen,
 isCategoryBubbleOpen,
 showLogoutModal,
 showAnnouncementModal,
 showRoleChatModal,
 showTerms,
 accountInitialPage,
 viewAllTitle,
 expandedSection,
 activeTab
 ]);

 const openShopSearch = () => {
 setIsShopSearchOpen(true);
 setTimeout(() => {
 document.getElementById('shop-page-search-input')?.focus();
 document.getElementById('header-search-input')?.focus();
 }, 100);
 };

 const closeShopSearch = () => {
 setIsShopSearchOpen(false);
 setShopSearchQuery('');
 };

 const openCategoryBubble = () => {
 setIsCategoryBubbleOpen(true);
 };

 const closeCategoryBubble = () => {
 setIsCategoryBubbleOpen(false);
 };

 const handleMainCatChange = (id: string) => {
 setIsProductsLoading(true);
 setShopSearchQuery('');
 setActiveMainCat(id);
 const main = categoryData.find(c => c.id === id);
 if (main && main.middle.length > 0) {
 setActiveMidCat(main.middle[0].id);
 setActiveSubCat(main.middle[0].sub[0]?.id || '');
 }
 setTimeout(() => setIsProductsLoading(false), 500);
 };

 const handleSelectProduct = (item: any) => {
 setSelectedProduct(item);
 };

 const closeProductModal = () => {
 setSelectedProduct(null);
 };

 const handlePushNotificationClick = async (pushData: any) => {
   setActiveWebPush(null);
   if (!pushData) return;

   if (pushData.full_product && pushData.full_product.id) {
     handleSelectProduct({ ...pushData.full_product, id: pushData.full_product.id });
     return;
   }

   const existing = allProducts.find(p => p.id === pushData.product_id || (pushData.product_code && p['product code'] === pushData.product_code));
   if (existing) {
     handleSelectProduct(existing);
     return;
   }

   try {
     const { data } = await supabase
       .from('upload_products')
       .select('*')
       .eq('id', pushData.product_id || '')
       .maybeSingle();

     if (data) {
       handleSelectProduct(data);
     }
   } catch (e) {
     console.error("Error opening pushed product:", e);
   }
 };

 const triggerPushNotificationUI = (payload: any) => {
   if (!payload) return;

   // Check if audience is targeted to specific customer unit accounts
   if (payload.audience_mode === 'unit' && Array.isArray(payload.target_customer_ids)) {
     let currentCustId = customerData?.id || userId;
     if (!currentCustId) {
       try {
         const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_customer') : null;
         const userObj = savedAuth ? JSON.parse(savedAuth) : null;
         currentCustId = userObj?.id || null;
       } catch (e) {}
     }
     if (!currentCustId || !payload.target_customer_ids.includes(currentCustId)) {
       return;
     }
   }

   if (payload.timestamp && lastPushTimestampRef.current === payload.timestamp) {
     return;
   }
   if (payload.timestamp) {
     lastPushTimestampRef.current = payload.timestamp;
   }

   setActiveWebPush(payload);

   setTimeout(() => {
     setActiveWebPush((current: any) => (current?.timestamp === payload.timestamp ? null : current));
   }, 15000);

   if (typeof window !== 'undefined' && 'Notification' in window) {
     if (Notification.permission === 'granted') {
       try {
         const notif = new Notification(payload.product_name || 'Product Update', {
           body: `${payload.product_title_name ? payload.product_title_name + ' | ' : ''}Code: ${payload.product_code || ''}`,
           icon: payload.product_image || undefined,
           tag: `push_${payload.product_id || Date.now()}`
         });
         notif.onclick = () => {
           window.focus();
           handlePushNotificationClick(payload);
           notif.close();
         };
       } catch (err) {
         console.warn('Browser Notification error:', err);
       }
     }
   }
 };

 useEffect(() => {
   if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
     try {
       Notification.requestPermission().catch(() => {});
     } catch (e) {}
   }

   const channel = supabase.channel(`customer_web_push_${Date.now()}`)
     .on('broadcast', { event: 'customer_web_push_notification' }, (event) => {
       if (event?.payload) {
         triggerPushNotificationUI(event.payload);
       }
     })
     .subscribe();

   const custTableChannel = supabase.channel(`customer_tbl_push_${Date.now()}`)
     .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, async () => {
       try {
         let currentCustId = customerData?.id || userId;
         if (!currentCustId) {
           try {
             const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_customer') : null;
             const userObj = savedAuth ? JSON.parse(savedAuth) : null;
             currentCustId = userObj?.id || '';
           } catch (e) {}
         }
         const res = await fetch(`/api/customer/latest-push-notification?customer_id=${encodeURIComponent(currentCustId || '')}`);
         const data = await res.json();
         if (data?.notification) {
           triggerPushNotificationUI(data.notification);
         }
       } catch (err) {}
     })
     .subscribe();

   return () => {
     supabase.removeChannel(channel);
     supabase.removeChannel(custTableChannel);
   };
 }, []);

 const handleSelectSearchResult = (item: any) => {
 handleSelectProduct(item);
 closeShopSearch();
 };

 const isShopPage = activeTab === 'Shop' || activeTab === 'Category';

 const tabs = [
 { id: 'Home', label: 'Home', icon: Home },
 { id: 'Shop', label: 'Shop', icon: LayoutGrid },
 isShopPage 
 ? { id: 'Category', label: 'Category', icon: List }
 : { id: 'Cart', label: 'Cart', icon: ShoppingCart },
 { id: 'Services', label: 'Services', icon: Layers },
 { id: 'Account', label: 'Account', icon: User },
 ];

 const handleTabClick = (id: string) => {
 if (id === 'Category') {
 if (isCategoryBubbleOpen) {
 closeCategoryBubble();
 } else {
 openCategoryBubble();
 }
 } else {
 setIsProductsLoading(true);
 setActiveTab(id);
 setIsCategoryBubbleOpen(false);
 setIsShopSearchOpen(false);
 
 if (id === 'Cart' && isLoggedIn && userId) {
 supabase.from('carts').select('*').eq('customer_id', userId)
 .then(({ data, error }) => {
 if (!error && data) {
 setCartItems(data);
 }
 }, err => console.warn(err));
 }
 
 // Shuffle products on every tab click
 setAllProducts(prev => {
 if (prev.length > 0) return shuffleArray(prev);
 return prev;
 });
 
 setTimeout(() => setIsProductsLoading(false), 500);
 }
 };

 const filterOptions = ["Newest", "Latest", "Cheapest", "Highest Price", "Best Rated", "Most Popular"];

 const categoryChips = [
 { id: 'All', label: 'All', baseColor: 'blue' },
 { id: 'Flash Sale', label: 'Flash Sale', baseColor: 'rose' },
 { id: 'Live Sale', label: 'Live Sale', baseColor: 'emerald' },
 { id: 'Trending', label: 'Trending', baseColor: 'purple' },
 { id: 'Best Seller', label: 'Best Seller', baseColor: 'indigo' },
 { id: 'Seasonal', label: 'Seasonal', baseColor: 'teal' },
 ];

 const getProcessedProducts = (title: string | null) => {
 let items = title ? allProducts.filter(p => p['choose title category'] === title) : allProducts;
 
 // Exclude service products from home page
 items = items.filter(p => !p['upload services']);
 
 if (activeCategory !== 'All') {
 items = items.filter(p => {
 const tags = Array.isArray(p['category tags']) ? p['category tags'] : (p['category tags'] ? [p['category tags']] : []);
 const prodType = p['product type chips'] || '';
 return tags.includes(activeCategory) || p['main category'] === activeCategory || p['sub category'] === activeCategory || prodType === activeCategory;
 });
 }

 if (activeFilterOption) {
 items = [...items].sort((a: any, b: any) => {
 const aPrice = parseFloat(String(a['selling price'] || '0').replace(/[^0-9.]/g, '')) || 0;
 const bPrice = parseFloat(String(b['selling price'] || '0').replace(/[^0-9.]/g, '')) || 0;
 const aDate = new Date(a.created_at || 0).getTime();
 const bDate = new Date(b.created_at || 0).getTime();
 
 switch(activeFilterOption) {
 case 'Newest':
 case 'Latest':
 return bDate - aDate;
 case 'Oldest':
 return aDate - bDate;
 case 'Cheapest':
 return aPrice - bPrice;
 case 'Highest Price':
 return bPrice - aPrice;
 default:
 return 0;
 }
 });
 }
 return items;
 };

 const isCustomerFrozen = customerData?.freeze === 'true' || customerData?.freeze === true || customerData?.freeze === 'frozen';

 if (!isLoggedIn) {
 return <AuthLogin portalName="Customer" onLoginSuccess={() => setIsLoggedIn(true)} onBack={onBack} />;
 }

 return (
 <div className={`fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden ${isCustomerFrozen ? 'select-none' : ''}`}>
 {/* Web Push Notification Banner for Customer */}
 {activeWebPush && (
   <div className="fixed top-2 left-2 right-2 max-w-md mx-auto z-[200] animate-in slide-in-from-top duration-300">
     <div 
       onClick={() => handlePushNotificationClick(activeWebPush)}
       className="bg-white border-2 border-black rounded-none p-2.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
     >
       <div className="w-12 h-12 border border-black rounded-none overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
         {activeWebPush.product_image ? (
           <img 
             src={activeWebPush.product_image} 
             alt="Product" 
             className="w-full h-full object-cover" 
             onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
           />
         ) : (
           <span className="text-[8px] font-bold text-gray-400 uppercase">Product</span>
         )}
       </div>

       <div className="flex-1 min-w-0 pr-1">
         <div className="flex items-center gap-1.5">
           <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-none">
             PUSH
           </span>
           <span className="text-xs font-black text-black uppercase truncate">
             {activeWebPush.product_name}
           </span>
         </div>
         {activeWebPush.product_title_name && (
           <div className="text-[11px] text-gray-700 truncate mt-0.5 font-medium">
             {activeWebPush.product_title_name}
           </div>
         )}
         <div className="text-[10px] text-black font-mono font-bold mt-0.5">
           <span className="text-gray-500 font-sans font-normal uppercase text-[8.5px] mr-1">Code:</span>
           {activeWebPush.product_code}
         </div>
       </div>

       <div className="flex items-center gap-1 shrink-0">
         <span className="bg-black text-white text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-none border border-black hover:bg-slate-800">
           VIEW
         </span>
         <button
           type="button"
           onClick={(e) => {
             e.stopPropagation();
             setActiveWebPush(null);
           }}
           className="p-1 border border-black rounded-none text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
           title="Dismiss"
         >
           <X size={14} />
         </button>
       </div>
     </div>
   </div>
 )}
 {isCustomerFrozen && (
 <div 
 className="fixed inset-0 z-[999999] cursor-not-allowed select-none bg-transparent" 
 style={{ touchAction: 'none' }}
 onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
 onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
 onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
 onKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
 />
 )}
 {!isShopPage && (
 <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm shrink-0">
 <div className="flex items-center justify-between relative w-full h-[60px] px-4">
 {isShopSearchOpen ? (
 <div className="flex w-full items-center gap-2 h-full animate-in fade-in zoom-in-95 duration-200">
 <div className="relative flex-1">
 <input
 id="header-search-input"
 type="text"
 value={shopSearchQuery}
 onChange={(e) => setShopSearchQuery(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.currentTarget.blur();
 }
 }}
 placeholder="Search products..."
 className="w-full h-10 pl-4 pr-10 bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium rounded-full border border-gray-800 focus:outline-none focus:border-black shadow-sm"
 />
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
 <Search size={18} className="text-black" />
 </div>
 {shopSearchQuery && (
 <button
 onClick={() => setShopSearchQuery('')}
 className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
 >
 <X size={14} />
 </button>
 )}
 </div>
 <button
 onClick={closeShopSearch}
 className="p-2 text-slate-600 hover:bg-gray-100 rounded-full transition-colors"
 >
 <X size={20} strokeWidth={2.5} />
 </button>
 </div>
 ) : (
        <>
          {/* Left Actions (Logo and Brand) */}
          <div className="flex items-center gap-3 text-slate-700 z-10 h-full cursor-pointer" onClick={onBack}>
            {headerLogo ? (
              <img src={headerLogo} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain rounded drop-shadow-sm" />
            ) : (
               <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">Logo</div>
            )}
            
            {/* Brand Name */}
            <div className="flex flex-col items-start justify-center select-none">
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">
                <span className="text-[#0038A8]">SURIYAWAN</span>
                <span className="text-[#FF5500]">SHOPPING</span>
              </h1>
              
              {/* Premium Member Glow */}
              <div className="relative group inline-flex overflow-hidden rounded-full mt-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                  <span>👑</span> Premium Member
                </span>
                {/* Smooth Shine Animation */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
              </div>
            </div>
          </div>

         {/* Right Actions (Refresh) */}
        <div className="flex items-center gap-1 text-slate-700 z-10">
          <button onClick={handleDeepRefresh} className="p-2 -mr-2 rounded-full hover:bg-gray-50 transition-colors active:bg-gray-100 cursor-pointer" title="Refresh Products">
            <RefreshCw size={20} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>
 </>
 )}
 </div>
 </header>
 )}
 <main className="flex-1 overflow-y-auto bg-white relative pb-24">
 {activeTab === 'Home' && (<>
 <div className="w-full pt-2 pb-2 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">
 
 {/* Filter Section */}
 <div className="w-full overflow-x-auto no-scrollbar">
 <div className="flex items-center justify-center w-max min-w-full gap-2 px-4 pb-1">
 <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap mr-1">Filters :-</span>
 {filterOptions.map(opt => {
 const isActive = activeFilterOption === opt;
 return (
 <button 
 key={opt}
 onClick={() => handleFilterClick(opt)}
 className={`whitespace-nowrap px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition-all duration-200 border ${
 isActive 
 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
 : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 shadow-sm'
 }`}
 >
 {opt}
 </button>
 )
 })}
 </div>
 </div>

 {/* Category Chips Section */}
 <div className="w-full overflow-x-auto no-scrollbar">
 <div className="flex items-center justify-center w-max min-w-full gap-2 px-4 pb-1">
 {categoryChips.map((chip) => {
 const isSelected = activeCategory === chip.id;
 let colorClasses = '';
 if (isSelected) {
 switch(chip.baseColor) {
 case 'blue': colorClasses = 'bg-blue-600 text-white border-blue-600 shadow-md'; break;
 case 'rose': colorClasses = 'bg-rose-500 text-white border-rose-500 shadow-md'; break;
 case 'emerald': colorClasses = 'bg-emerald-500 text-white border-emerald-500 shadow-md'; break;
 case 'purple': colorClasses = 'bg-purple-500 text-white border-purple-500 shadow-md'; break;
 case 'indigo': colorClasses = 'bg-indigo-500 text-white border-indigo-500 shadow-md'; break;
 case 'teal': colorClasses = 'bg-teal-500 text-white border-teal-500 shadow-md'; break;
 }
 } else {
 switch(chip.baseColor) {
 case 'blue': colorClasses = 'bg-blue-100 text-blue-700 border-blue-400 hover:bg-blue-200 shadow-sm'; break;
 case 'rose': colorClasses = 'bg-rose-100 text-rose-700 border-rose-400 hover:bg-rose-200 shadow-sm'; break;
 case 'emerald': colorClasses = 'bg-emerald-100 text-emerald-700 border-emerald-400 hover:bg-emerald-200 shadow-sm'; break;
 case 'purple': colorClasses = 'bg-purple-100 text-purple-700 border-purple-400 hover:bg-purple-200 shadow-sm'; break;
 case 'indigo': colorClasses = 'bg-indigo-100 text-indigo-700 border-indigo-400 hover:bg-indigo-200 shadow-sm'; break;
 case 'teal': colorClasses = 'bg-teal-100 text-teal-700 border-teal-400 hover:bg-teal-200 shadow-sm'; break;
 }
 }
 return (
 <button
 key={chip.id}
 onClick={() => handleCategoryClick(chip.id)}
 className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${colorClasses} ${isSelected && chip.id === 'Live Sale' ? 'animate-pulse' : ''}`}
 >
 {chip.label}
 </button>
 );
 })}
  </div>
 </div>

 </div>
        {/* Promotional Slider */}
 {activeCategory === 'All' && !viewAllTitle && activePromoBanners.length > 0 && (
   <div className="w-full px-2 mt-2 mb-1 relative">
     <div 
       ref={promoSliderRef}
       onTouchStart={() => { isPromoTouchedRef.current = true; }} onTouchEnd={() => { isPromoTouchedRef.current = false; }} onTouchCancel={() => { isPromoTouchedRef.current = false; }} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-xl shadow-sm border border-gray-100"
     >
       {activePromoBanners.map((banner, idx) => {
        const colorMap: Record<string, string> = {
          green: 'bg-green-400 shadow-[0_0_15px_4px_rgba(74,222,128,0.9)]',
          red: 'bg-red-400 shadow-[0_0_15px_4px_rgba(248,113,113,0.9)]',
          blue: 'bg-blue-400 shadow-[0_0_15px_4px_rgba(96,165,250,0.9)]',
          yellow: 'bg-yellow-300 shadow-[0_0_15px_4px_rgba(253,224,71,0.9)]',
          purple: 'bg-purple-400 shadow-[0_0_15px_4px_rgba(192,132,252,0.9)]',
          pink: 'bg-pink-400 shadow-[0_0_15px_4px_rgba(244,114,182,0.9)]',
          orange: 'bg-orange-400 shadow-[0_0_15px_4px_rgba(251,146,60,0.9)]',
        };
        const sigColor = banner.signalColor || (banner.showGreenSignal ? 'green' : 'none');
        const hasSignal = sigColor !== 'none' && colorMap[sigColor];

        return (
          <div key={banner.id || idx} className="w-full flex-shrink-0 snap-center relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 border border-gray-200 overflow-hidden rounded-2xl shadow-sm">
            <img src={banner.imageUrl} alt={`Promotion ${idx+1}`} className="w-full h-full object-cover" />
            {hasSignal && (
              <div className={`absolute top-3 right-3 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/20 ${sigColor === 'green' ? 'px-2.5 py-1.5 gap-2 rounded-full' : 'w-7 h-7 rounded-full'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${colorMap[sigColor]}`}></div>
                {sigColor === 'green' && (
                  <span className="text-[10px] font-black text-white tracking-widest uppercase drop-shadow-md leading-none mt-0.5">Live</span>
                )}
              </div>
            )}
          </div>
        );
      })}
     </div>
   </div>
 )}

 

 </>
)}
 {!isShopPage && activeTab !== 'Services' && activeTab !== 'Account' && activeTab !== 'Cart' && (
 <>
 {/* Home Products Rendering */}
 <div className={`w-full ${viewAllTitle ? '' : 'py-4'} ${activeCategory === 'Flash Sale' ? 'bg-red-500 min-h-full' : ''}`}>
 {viewAllTitle ? (
 <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
 <div className="flex items-center gap-3 p-3 bg-white sticky top-0 z-40 shadow-sm">
 <button onClick={() => setViewAllTitle(null)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"> <ArrowLeft size={20} className="text-slate-700" /> </button>
 <h2 className="font-black text-sm text-slate-800 uppercase tracking-tight">{viewAllTitle}</h2>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 p-0.5 pt-3">
 {getProcessedProducts(viewAllTitle).map(product => (
 <ProductCard 
 key={product.id} 
 product={product as any} 
 status="Active"
 isCustomerView={true}
 customerGiftCashBalance={claimedGiftCash}
 showGiftCashOption={activeTab === 'Services' && (activeServiceCat === 'Breakfast and Drink' || activeServiceCat === 'Suriyawan Shopping Special')}
 isInCart={cartItems.some(item => item.product_id === product.id)}
 onAddToCart={handleAddToCart}
 onSelectImage={() => handleSelectProduct({...product, id: product.product_id || product.id} as any)}
 />
 ))}
 </div>
 </div>
 ) : isProductsLoading ? (
 <div className="flex flex-col items-center justify-center py-20 opacity-80">
 
 <p className="text-sm font-bold text-slate-500 tracking-wide">Loading<span className="loading-ellipsis"></span></p>
 </div>
 ) : activeCategory !== 'All' || activeFilterOption ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 p-0.5">
 {getProcessedProducts(null).map(product => (
 <ProductCard 
 key={product.id} 
 product={product as any} 
 status="Active"
 isCustomerView={true}
 customerGiftCashBalance={claimedGiftCash}
 showGiftCashOption={activeTab === 'Services' && (activeServiceCat === 'Breakfast and Drink' || activeServiceCat === 'Suriyawan Shopping Special')}
 isInCart={cartItems.some(item => item.product_id === product.id)}
 onAddToCart={handleAddToCart}
 isFlashSale={activeCategory === 'Flash Sale'}
 isLiveSaleActive={activeCategory === 'Live Sale'}
 onSelectImage={() => handleSelectProduct({...product, id: product.product_id || product.id} as any)}
 />
 ))}
 </div>
 ) : isProductsLoading ? (
 <div className="flex flex-col items-center justify-center py-20 opacity-80">
 
 <p className="text-sm font-bold text-slate-500 tracking-wide">Loading<span className="loading-ellipsis"></span></p>
 </div>
 ) : (
 <div className="flex flex-col gap-6">
 {['Unique Collection', 'New Arrival', 'Recommend', 'Popular Choice'].map(title => {
 const items = getProcessedProducts(title);
 
 const displayItems = items.slice(0, 4);
 const isPopularChoice = title === 'Popular Choice';
 
 return (
 <div key={title} className="flex flex-col gap-3">
 <div className="flex items-center justify-between px-1">
 <h3 className="font-black text-sm text-gray-800 uppercase tracking-tight">{title}</h3>
 <button 
 onClick={() => {
 setViewAllTitle(title);
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }}
 className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 transition-colors flex items-center gap-1"
 >
 View All <span aria-hidden="true">&rarr;</span>
 </button>
 </div>
 
 {loadingSection === title ? (
 <div className="flex flex-col items-center justify-center py-10 opacity-80">
 
 <p className="text-xs font-bold text-slate-500 tracking-wide">Loading<span className="loading-ellipsis"></span></p>
 </div>
 ) : items.length === 0 ? (
 <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
 <p className="text-xs font-bold text-slate-400">No products yet</p>
 </div>
 ) : isPopularChoice ? (
 <div className="w-full bg-slate-100 border-y border-slate-200 py-3">
 <div className="flex overflow-x-auto gap-0.5 pb-2 no-scrollbar snap-x snap-mandatory px-0.5">
 {displayItems.map(product => (
 <div className="w-[130px] flex-shrink-0 snap-center" key={product.id}>
 <ProductCard 
 product={product as any} 
 status="Active" 
 isCustomerView={true}
 customerGiftCashBalance={claimedGiftCash}
 showGiftCashOption={activeTab === 'Services' && (activeServiceCat === 'Breakfast and Drink' || activeServiceCat === 'Suriyawan Shopping Special')}
 isHorizontalList={true}
 isInCart={cartItems.some(item => item.product_id === product.id)}
 onAddToCart={handleAddToCart}
 onSelectImage={() => handleSelectProduct({...product, id: product.product_id || product.id} as any)}
 />
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 p-0.5">
 {displayItems.map(product => (
 <ProductCard 
 key={product.id} 
 product={product as any} 
 status="Active"
 isCustomerView={true}
 customerGiftCashBalance={claimedGiftCash}
 showGiftCashOption={activeTab === 'Services' && (activeServiceCat === 'Breakfast and Drink' || activeServiceCat === 'Suriyawan Shopping Special')}
 isInCart={cartItems.some(item => item.product_id === product.id)}
 onAddToCart={handleAddToCart}
 onSelectImage={() => handleSelectProduct({...product, id: product.product_id || product.id} as any)}
 />
 ))}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 </>
 )}


 {activeTab === 'Account' && <AccountView initialPage={accountInitialPage} onSubPageChange={setHideNav} onLogout={handleLogout} onShowTerms={() => setShowTerms(true)} onShowAnnouncement={() => setShowAnnouncementModal(true)}
 onShowRoleChat={() => setShowRoleChatModal(true)} />}

 {activeTab === 'Cart' && (
 <div className="w-full px-2 py-4 flex flex-col gap-4 bg-slate-50 min-h-full pb-6">
 <h2 className="text-lg font-black text-slate-800">Your Cart ({cartItems.length})</h2>
 {cartItems.length === 0 ? (
 <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
 <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
 <ShoppingCart size={24} className="text-slate-400" />
 </div>
 <p className="text-sm font-bold text-slate-500">Your cart is empty</p>
 <button onClick={() => setActiveTab('Home')} className="mt-6 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-sm shadow-lg active:scale-95 transition-transform hover:shadow-xl">Start Shopping</button>
 </div>
 ) : (
 <div className="flex flex-col gap-3">
 {cartItems.map(item => (
 <div key={item.id} className="flex gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden" onClick={() => handleSelectProduct({...item, id: item.product_id || item.id} as any)}>
 <button 
 onClick={(e) => handleRemoveFromCart(e, item.id)} 
 className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors z-10"
 >
 {deletingCartItemId === item.id ? (
 <MoreHorizontal size={14} className="animate-pulse text-red-500" />
 ) : (
 <Trash2 size={14} className="text-red-500" />
 )}
 </button>
 <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
 <img src={getFirstImage(item['product images']) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'} alt={item['product name']} className="w-full h-full object-cover" />
 </div>
 <div className="flex flex-col flex-1 justify-between py-0.5">
 <div>
 <h3 className="text-sm font-black text-slate-800 line-clamp-1">{item['product name']}</h3>
 <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
 {item.color && item.color.length > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{item.color[0]?.name || item.color[0]}</span>}
 {item.size && item.size.length > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{item.size[0]}</span>}
 {item.weight && item.weight.length > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{item.weight[0]}</span>}
 </div>
 </div>
 <div className="flex items-end justify-between mt-2">
 <div className="flex flex-col">
 <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Price</span>
 <span className="text-sm font-black text-blue-600">₹{item['selling price']}</span>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Qty</span>
 <span className="text-sm font-black text-slate-800 px-3 py-0.5 bg-slate-100 rounded-lg">{item['minimum order quantity'] || 1}</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 
 {activeTab === 'Services' && (
 <div className="w-full flex flex-col items-center">
 <div className="w-full pt-3 pb-3 bg-white border-b border-gray-100 shadow-sm flex flex-col items-center gap-2 sticky top-0 z-40">
 <div className="w-full overflow-x-auto no-scrollbar">
 <div className="flex items-center justify-center w-max min-w-full gap-3 px-4 pb-1">
 {['Top Services', 'Breakfast and Drink', 'Suriyawan Shopping Special'].map((cat, i) => {
 const colors = [
 { active: 'bg-purple-500 text-white border-purple-500 shadow-md', inactive: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' },
 { active: 'bg-emerald-500 text-white border-emerald-500 shadow-md', inactive: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' },
 { active: 'bg-amber-500 text-white border-amber-500 shadow-md', inactive: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' }
 ];
 const isActive = activeServiceCat === cat;
 return (
 <button 
 key={cat}
 onClick={() => {
 setIsProductsLoading(true);
 setActiveServiceCat(cat);
 setTimeout(() => setIsProductsLoading(false), 500);
 }}
 className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-bold border transition-all duration-300 ${isActive ? colors[i].active : colors[i].inactive}`}
 >
 {cat === 'Breakfast and Drink' ? 'Breakfast & Drink' : cat}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 
 <div className="w-full py-4">
 {isProductsLoading ? (
 <div className="flex flex-col items-center justify-center py-20 opacity-80">
 
 <p className="text-sm font-bold text-slate-500 tracking-wide">Loading<span className="loading-ellipsis"></span></p>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 p-0.5">
 {allProducts
 .filter(p => p['upload services'] === activeServiceCat)
 .map(product => (
 <ProductCard 
 key={product.id} 
 product={product as any} 
 status="Active"
 isCustomerView={true}
 customerGiftCashBalance={claimedGiftCash}
 showGiftCashOption={activeTab === 'Services' && (activeServiceCat === 'Breakfast and Drink' || activeServiceCat === 'Suriyawan Shopping Special')}
 isInCart={cartItems.some(item => item.product_id === product.id)}
 onAddToCart={handleAddToCart}
 onSelectImage={() => handleSelectProduct({...product, id: product.product_id || product.id} as any)}
 />
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {isShopPage && (
 <div className="w-full min-h-full bg-white flex flex-col">
 <div className="sticky top-0 z-40 bg-white pt-2 flex flex-col">
 {isShopSearchOpen && (
 <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-2">
 <div className="relative w-full flex items-center gap-2">
 <div className="relative flex-1">
 <input
 id="shop-page-search-input"
 type="text"
 value={shopSearchQuery}
 onChange={(e) => setShopSearchQuery(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.currentTarget.blur();
 }
 }}
 placeholder="Search product..."
 className="w-full h-10 pl-4 pr-10 bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium rounded-full border border-gray-800 focus:outline-none focus:border-black shadow-sm transition-all"
 />
 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
 {shopSearchQuery && (
 <button onClick={() => setShopSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-700 pointer-events-auto">
 <X size={14} />
 </button>
 )}
 <Search size={18} className="text-black pointer-events-none" />
 </div>
 </div>
 <button onClick={closeShopSearch} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors shrink-0">
 <X size={20} />
 </button>
 </div>
 </div>
 )}
 {/* Top Middle Categories Circular Images */}
 <div className="w-full overflow-x-auto no-scrollbar pb-2 border-b border-gray-100">
 <div className="flex items-start gap-4 px-4 w-max">
 {activeMainData && activeMainData.middle.map(mid => {
 const isActive = activeMidCat === mid.id;
 return (
 <button
 key={mid.id}
 id={`shop-midcat-${mid.id}`}
 onClick={() => handleMidCatClick(mid.id, mid.sub[0]?.id)}
 className="flex flex-col items-center gap-1.5 group w-10"
 >
 <div className={`w-10 h-10 rounded-full overflow-hidden border-[2px] transition-all shadow-sm ${
 isActive ? 'border-orange-500 shadow-md ring-2 ring-orange-100' : 'border-gray-100 hover:border-gray-200'
 }`}>
 <img src={mid.image} alt={mid.name} className="w-full h-full object-cover" />
 </div>
 <span className={`text-[9px] font-bold text-center leading-tight line-clamp-2 ${isActive ? 'text-orange-600' : 'text-gray-600'}`}>
 {mid.name}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Sub Categories Oval Chips */}
 {activeMidData && activeMidData.sub.length > 0 && (
 <div className="w-full overflow-x-auto no-scrollbar py-2.5 border-b border-gray-50 bg-gray-50/30">
 <div className="flex items-center gap-2 px-4 w-max">
 {/* 🔍 Orange Search Chip - First item in row, exact same pill shape/size, eye-catching orange */}
 <button
 id="shop-subcat-search-chip"
 onClick={openShopSearch}
 className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:from-orange-700 active:to-amber-700 text-white font-bold text-[10px] border border-orange-500 shadow-sm shadow-orange-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 group ring-2 ring-orange-200/80"
 title="Search products and categories"
 >
 <Search size={11} strokeWidth={2.8} className="text-white group-hover:scale-110 transition-transform shrink-0" />
 <span className="tracking-wide">Search</span>
 </button>

 {/* Subcategories list */}
 {activeMidData.sub.map(sub => {
 const isSelected = activeSubCat === sub.id;
 return (
 <button
 key={sub.id}
 id={`shop-subcat-${sub.id}`}
 onClick={() => handleSubCatClick(sub.id)}
 className={`flex items-center justify-center px-4 py-1.5 rounded-full border transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
 isSelected
 ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
 : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
 }`}
 >
 <span className={`text-[10px] font-bold transition-colors whitespace-nowrap ${
 isSelected ? 'text-white' : 'text-gray-700'
 }`}>
 {sub.name}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 </div>
 {/* Shop Products Rendering */}
 <div className="flex-1 w-full p-0 bg-gray-50/50">
 {(() => {
 let shopProducts = allProducts.filter(p => !p['upload services']);
 let sortMode = '';
 const qRaw = deferredShopSearch.trim().toLowerCase();
 
 if (qRaw) {
 const filterKeywords = ['newest', 'latest', 'new', 'old', 'oldest', 'cheapest', 'cheap', 'lowest', 'highest', 'expensive', 'best'];
 const words = qRaw.split(/\s+/);
 const activeFilters = words.filter(w => filterKeywords.includes(w));
 const remainingWords = words.filter(w => !filterKeywords.includes(w));

 if (activeFilters.includes('newest') || activeFilters.includes('latest') || activeFilters.includes('new')) sortMode = 'newest';
 else if (activeFilters.includes('old') || activeFilters.includes('oldest')) sortMode = 'oldest';
 else if (activeFilters.includes('cheapest') || activeFilters.includes('cheap') || activeFilters.includes('lowest')) sortMode = 'cheapest';
 else if (activeFilters.includes('highest') || activeFilters.includes('expensive') || activeFilters.includes('best')) sortMode = 'expensive';

 const q = remainingWords.join(' ');
 
 if (q) {
 shopProducts = shopProducts.filter((p: any) => {
 const pName = String(p['product name'] || p['product title name'] || '').trim().toLowerCase();
 const pSub = String(p['sub category'] || '').trim().toLowerCase();
 const qNorm = q.replace(/(es|s)$/, '');
 const matchesName = pName.includes(q) || pName.includes(qNorm);
 const matchesCat = pSub.includes(q) || pSub.includes(qNorm);
 return matchesName || matchesCat;
 });
 }
 } else {
 const activeSubData = activeMidData?.sub.find(s => s.id === activeSubCat);
 shopProducts = shopProducts.filter((p: any) => {
 const pMain = String(p['main category'] || '').trim().toLowerCase();
 const pMid = String(p['middle category'] || '').trim().toLowerCase();
 const pSub = String(p['sub category'] || '').trim().toLowerCase();

 const mainMatches = activeMainData ? (pMain === String(activeMainData.name).trim().toLowerCase() || pMain === String(activeMainData.id).trim().toLowerCase()) : false;
 const midMatches = activeMidData ? (pMid === String(activeMidData.name).trim().toLowerCase() || pMid === String(activeMidData.id).trim().toLowerCase()) : false;
 const subMatches = activeSubData ? (pSub === String(activeSubData.name).trim().toLowerCase() || pSub === String(activeSubData.id).trim().toLowerCase()) : true;
 
 return mainMatches && midMatches && subMatches;
 });
 }

 if (sortMode) {
 shopProducts = [...shopProducts].sort((a: any, b: any) => {
 const aPrice = parseFloat(String(a['selling price'] || '0').replace(/[^0-9.]/g, '')) || 0;
 const bPrice = parseFloat(String(b['selling price'] || '0').replace(/[^0-9.]/g, '')) || 0;
 const aDate = new Date(a.created_at || 0).getTime();
 const bDate = new Date(b.created_at || 0).getTime();
 
 if (sortMode === 'newest') return bDate - aDate;
 if (sortMode === 'oldest') return aDate - bDate;
 if (sortMode === 'cheapest') return aPrice - bPrice;
 if (sortMode === 'expensive') return bPrice - aPrice;
 return 0;
 });
 }
 
 if (isProductsLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-20 opacity-80">
 <p className="text-sm font-bold text-slate-500 tracking-wide">Loading<span className="loading-ellipsis"></span></p>
 </div>
 );
 }

 return shopProducts.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 p-0.5">
 {shopProducts.map(product => (
 <ProductCard 
 key={product.id} 
 product={product as any} 
 status="Active"
 isCustomerView={true}
 customerGiftCashBalance={claimedGiftCash}
 showGiftCashOption={activeTab === 'Services' && (activeServiceCat === 'Breakfast and Drink' || activeServiceCat === 'Suriyawan Shopping Special')}
 isInCart={cartItems.some(item => item.product_id === product.id)}
 onAddToCart={handleAddToCart}
 onSelectImage={() => handleSelectProduct({...product, id: product.product_id || product.id} as any)}
 />
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
 <LayoutGrid size={24} className="text-gray-400" />
 </div>
 <p className="text-sm font-bold text-gray-700">No products found</p>
 <p className="text-xs text-gray-400 mt-1">Try selecting a different category</p>
 </div>
 );
 })()}
 </div>
 </div>
 )}

 </main>
 {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} portalName="Customer" />}

 {selectedProduct && (
 <ProductDetailModal
 product={selectedProduct}
 status="Active"
 isCustomerView={true}
 customerGiftCashBalance={claimedGiftCash}
 showGiftCashOption={activeTab === 'Services' && (activeServiceCat === 'Breakfast and Drink' || activeServiceCat === 'Suriyawan Shopping Special')}
 isTopService={activeTab === 'Services' && activeServiceCat === 'Top Services'}
 onClose={closeProductModal}
 isInCart={cartItems.some(item => item.product_id === selectedProduct.id)}
 onAddToCart={handleAddToCart}
 customerData={customerData}
 onSelectSimilarProduct={handleSelectProduct}
 onViewOrders={() => { 
 setAccountInitialPage('orders');
 setActiveTab('Account');
 }}
 />
 )}


 {/* Category Bubble Popup */}
 {isCategoryBubbleOpen && isShopPage && (
 <>
 <div className="fixed inset-0 bg-black/5 z-[80]" onClick={closeCategoryBubble} />
 <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 p-4 z-[90] animate-in fade-in slide-in-from-bottom-4 duration-300">
 <div className="flex items-center justify-between mb-3 px-1">
 <h3 className="font-bold text-sm text-gray-800">All Categories</h3>
 </div>
 <div className="grid grid-cols-4 gap-2">
 {categoryData.map(cat => (
 <button
 key={cat.id}
 onClick={() => {
 handleMainCatChange(cat.id);
 closeCategoryBubble();
 }}
 className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors aspect-square cursor-pointer ${
 activeMainCat === cat.id 
 ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-inner' 
 : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700 shadow-sm'
 }`}
 >
 <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 shadow-sm border border-black/5">
 <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
 </div>
 <span className="text-[8px] font-bold text-center leading-tight line-clamp-2">{cat.name}</span>
 </button>
 ))}
 </div>
 </div>
 </>
 )}

 
 {/* Bottom Navigation */}
 <div className={`fixed bottom-2 left-2 right-2 z-[100] max-w-md mx-auto transition-transform duration-300 ease-in-out ${hideNav ? 'hidden' : ''} ${scrollDir === 'down' ? 'translate-y-[150%]' : 'translate-y-0'}`}>
 <nav className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-[1.5rem] shadow-2xl flex justify-around items-center py-0.5 px-1">
 {tabs.map((tab) => {
 const isActive = activeTab === tab.id;
 const isCenterTab = tab.id === 'Category' || tab.id === 'Cart';

 if (isCenterTab) {
 return (
 <div key={tab.id} className="flex flex-col items-center -mt-5">
 <button
 onClick={() => handleTabClick(tab.id)}
 className={`w-12 h-12 rounded-full shadow-2xl border-[3px] border-white flex flex-col items-center justify-center transition-transform active:scale-95 ${
 isShopPage 
 ? 'bg-orange-500 text-white ring-2 ring-orange-100 shadow-[0_4px_15px_rgba(249,115,22,0.4)]' 
 : 'bg-blue-600 text-white ring-2 ring-blue-100 shadow-[0_4px_15px_rgba(37,99,235,0.4)]'
 }`}
 >
 <tab.icon size={20} strokeWidth={isShopPage ? 2.5 : 2} />
 <span className="text-[9px] font-black uppercase mt-0.5">{isShopPage ? 'Cat' : formatCartCount(cartItems.length)}</span>
 </button>
 
 <div className="mt-1 text-center w-16">
 <div className="text-amber-600 font-bold text-xs flex items-center justify-center gap-0.5">
 <span className="text-[9px] font-serif font-medium">₹</span>{formatGiftCashAmount(giftCashValue)}
 </div>
 <button 
 onClick={handleClaimGiftCash}
 disabled={isClaimingGiftCash || giftCashValue <= 0}
 className="mt-0.5 px-2 py-1 rounded-xl text-[7px] uppercase tracking-widest shadow-md w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-950 font-black active:scale-95 transition-transform flex items-center justify-center h-[18px]"
 >
 {isClaimingGiftCash ? (
 <span className="flex items-center justify-center gap-0.5">
 <span className="w-1 h-1 bg-yellow-950 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1 h-1 bg-yellow-950 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1 h-1 bg-yellow-950 rounded-full animate-bounce"></span>
 </span>
 ) : (
 'Claim'
 )}
 </button>
 </div>
 </div>
 );
 }

 return (
 <button
 key={tab.id}
 onClick={() => handleTabClick(tab.id)}
 className={`flex flex-col items-center gap-0.5 transition-colors ${
 isActive ? (tab.id === 'Shop' ? 'text-orange-500' : 'text-blue-600') : 'text-gray-400 hover:text-gray-600'
 }`}
 >
 <div className="p-1">
 <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
 </div>
 <span className="text-[8px] font-bold uppercase tracking-tighter">{tab.label}</span>
 </button>
 );
 })}
 </nav>
 </div>
 <AnnouncementChatModal
 isOpen={showAnnouncementModal}
 onClose={() => setShowAnnouncementModal(false)}
 updateType="customer_update"
 title="Suriyawan Shopping Updates"
 readOnly={true}
 />
 <RoleChatModal
 isOpen={showRoleChatModal}
 onClose={() => setShowRoleChatModal(false)}
 tableName="chat_for_customers"
 title="Chat with Cluster Support"
 currentUserType="customer"
 currentUserId={userId || ''}
 currentUserName={customerData?.full_name || 'Customer'}
 clusterId={customerClusterId}
 />

 <TermsAndConditionsModal isOpen={showTerms} onClose={() => setShowTerms(false)} userType="customer" />
 </div>
 );
};
