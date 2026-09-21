import { LogoutModal } from './LogoutModal';
import React, { useState, useEffect } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { LayoutDashboard, Package, Box, Wallet, User, Menu, RefreshCw, Bell, ArrowLeft, CreditCard, ChevronRight, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { UploadProductForm } from './UploadProductForm';
import { AuthLogin } from './AuthLogin';
import { SellerProductsView } from './SellerProductsView';
import { SellerPaymentsView } from './SellerPaymentsView';
import { SellerOrdersView } from './SellerOrdersView';
import { SellerDashboardView } from './SellerDashboardView';
import { SupabaseProduct } from '../../types/product';
import { registerBackHandler } from '../../lib/backNavigation';

interface PortalProps {
 onBack: () => void;
}

const hindiQuotes = [
 "हर ऑर्डर के साथ सपने पूरे होते हैं! लग जाओ काम पर सुरियावां शॉपिंग के शेर!",
 "ग्राहक का भरोसा, सुरियावां शॉपिंग की पहचान! आज के सेल्स टारगेट फोड़ दो!",
 "मेहनत का फल मीठा होता है, और ऑनलाइन सेलिंग में डबल! नए प्रोडक्ट्स डालो!",
 "रुकना मना है! आपके प्रोडक्ट्स में है वो बात जो बदलेगी मार्केट के हालात, सुरियावां शॉपिंग हीरो!",
 "आपका एक नया प्रोडक्ट, दस नए कस्टमर्स ला सकता है। जोश बरकरार रखो सुरियावां शॉपिंग के साथी!",
 "वक्त आ गया है अपने व्यापार को एक नई ऊंचाई देने का, हर कदम पर सुरियावां शॉपिंग आपके साथ है!",
 "आपकी मेहनत और आपके शानदार प्रोडक्ट्स ही आपको इस मार्केट का बेताज बादशाह बना सकते हैं!",
 "सफलता का रास्ता कभी आसान नहीं होता, लेकिन आपके जज्बे के आगे कोई मंजिल दूर नहीं है सुरियावां के रणबांकुरे!",
 "अपने सपनों को हकीकत में बदलने का यही सही वक्त है, एक नई शुरुआत करो और दुनिया पर छा जाओ!",
 "आपका हर एक प्रोडक्ट आपकी पहचान है, इसे इस तरह पेश करो कि हर ग्राहक सिर्फ आपको ही ढूंढे!",
 "रुकावटें तो हर रास्ते में आती हैं, पर सुरियावां शॉपिंग के असली सेलर वही हैं जो इन्हें पार कर आगे बढ़ें!",
 "आपका जुनून ही आपके व्यापार की सबसे बड़ी ताकत है, इसे हमेशा इसी तरह ज्वलंत और बेमिसाल बनाए रखो!",
 "कोई भी लक्ष्य इतना बड़ा नहीं जिसे आपकी लगन और सुरियावां शॉपिंग के इस प्लेटफ़ॉर्म से हासिल न किया जा सके!",
 "ग्राहक सिर्फ सामान नहीं, एक विश्वास खरीदता है; इस विश्वास को अपनी शानदार क्वालिटी से हमेशा बनाए रखना!",
 "जब सोच बड़ी होती है तो नतीजे भी हमेशा असाधारण आते हैं, सुरियावां शॉपिंग पर इतिहास रचने के लिए तैयार रहो!"
];


const SellerAccountView = ({ 
 onSubPageChange,
 onLogout 
}: { 
 onSubPageChange?: (isSub: boolean) => void;
 onLogout?: () => void;
}) => {
 const [sellerData, setSellerData] = useState<any>(null);
 const [activePage, setActivePage] = useState<'main' | 'business' | 'documents' | 'bank'>('main');

  const getInitials = (name: string) => {
    if (!name || name === 'N/A' || name === 'Loading...' || name === 'No Data Found') return 'SS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };
 useEffect(() => {
 onSubPageChange?.(activePage !== 'main');
 }, [activePage, onSubPageChange]);

 useEffect(() => {
 const fetchSellerData = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 
 let sellerRecord = null;
 if (userObj?.id) {
 const { data } = await supabase
 .from('sellers')
 .select('*')
 .eq('id', userObj.id)
 .maybeSingle();
 sellerRecord = data;
 }
 if (!sellerRecord && userObj?.email) {
 const { data } = await supabase
 .from('sellers')
 .select('*')
 .eq('registered_email', userObj.email)
 .maybeSingle();
 sellerRecord = data;
 }
 if (!sellerRecord) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase
 .from('sellers')
 .select('*')
 .eq('id', user.id)
 .maybeSingle();
 sellerRecord = data;
 }
 }
 if (!sellerRecord) {
 localStorage.removeItem('portal_auth_seller');
 setSellerData(null);
 return;
 }

 if (sellerRecord) {
 setSellerData(sellerRecord);
 } else {
 setSellerData({
 id: 'No Data Found',
 shop_name: 'No Shop Found',
 seller_name: 'N/A',
 registered_email: 'N/A',
 registered_mobile_number: 'N/A',
 registered_full_address: 'N/A',
 registered_pincode: 'N/A',
 trust_years_in_business: 'N/A',
 password: 'N/A',
 aadhaar_card: 'N/A',
 pan_card: 'N/A',
 gstin: 'N/A',
 shop_establishment: 'N/A',
 bank_name: 'N/A',
 account_no: 'N/A',
 ifsc_code: 'N/A',
 upi_id: 'N/A'
 });
 }
 } catch (err) {
 console.error("Error fetching seller data:", err);
 }
 };
 fetchSellerData();
 }, []);

 if (activePage === 'business') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Business & Personal details</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Seller ID</label>
 <p className="text-sm font-semibold text-gray-800 break-all">{sellerData?.id || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Shop Name</label>
 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
 <p className="text-sm font-bold text-gray-900">{sellerData?.shop_name || 'N/A'}</p>
 {sellerData?.trust_years_in_business && (
 <span className="inline-flex w-max items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300">
 {sellerData.trust_years_in_business}
 </span>
 )}
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Seller Name</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.seller_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Mobile Number</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.registered_mobile_number || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Email</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.registered_email || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Full Address</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.registered_full_address || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Pincode</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.registered_pincode || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Password</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.password ? '••••••••' : 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }

 if (activePage === 'documents') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Documents & KYC</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Aadhaar Card</label>
 <div className="flex items-center gap-2 mt-0.5">
 <p className="text-sm font-semibold text-gray-800">{sellerData?.aadhaar_card || 'N/A'}</p>
 {sellerData?.aadhaar_card && sellerData.aadhaar_card !== 'N/A' && (
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
 <CheckCircle2 size={10} /> Verified
 </span>
 )}
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">PAN Card</label>
 <div className="flex items-center gap-2 mt-0.5">
 <p className="text-sm font-semibold text-gray-800 uppercase">{sellerData?.pan_card || 'N/A'}</p>
 {sellerData?.pan_card && sellerData.pan_card !== 'N/A' && (
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
 <CheckCircle2 size={10} /> Verified
 </span>
 )}
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">GSTIN</label>
 <div className="flex items-center gap-2 mt-0.5">
 <p className="text-sm font-semibold text-gray-800 uppercase">{sellerData?.gstin || 'N/A'}</p>
 {sellerData?.gstin && sellerData.gstin !== 'N/A' && (
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
 <CheckCircle2 size={10} /> Verified
 </span>
 )}
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Shop Establishment</label>
 <div className="flex items-center gap-2 mt-0.5">
 <p className="text-sm font-semibold text-gray-800">{sellerData?.shop_establishment || 'N/A'}</p>
 {sellerData?.shop_establishment && sellerData.shop_establishment !== 'N/A' && (
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
 <CheckCircle2 size={10} /> Verified
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 }

 if (activePage === 'bank') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Bank & UPI details</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.bank_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Account No</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.account_no || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">IFSC Code</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{sellerData?.ifsc_code || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">UPI ID</label>
 <p className="text-sm font-semibold text-gray-800">{sellerData?.upi_id || 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }

 return (
      <div className="w-full min-h-full flex flex-col pt-4 px-4 pb-24">
 {/* Profile Card */}
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3.5 min-w-0 flex-1">
 <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-50 flex items-center justify-center font-bold text-xl shadow-inner shrink-0 border border-slate-100">
 <span className="text-blue-600 font-black">{getInitials(sellerData?.seller_name)}</span>
 </div>
 <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
 <h2 className="text-base font-bold text-gray-800 truncate">{sellerData?.shop_name || 'Loading...'}</h2>
 <p className="text-xs font-medium text-gray-600 truncate">{sellerData?.seller_name || 'Loading...'}</p>
 <p className="text-xs font-medium text-gray-500 truncate">{sellerData?.registered_email || 'Loading...'}</p>
 <p className="text-[9px] text-gray-400 mt-1 truncate">ID: {sellerData?.id || '...'}</p>
 </div>
 </div>
 <button 
 onClick={() => setActivePage('business')}
 className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 active:scale-95 transition-all shrink-0 ml-1 shadow-sm border border-orange-100"
 title="View Business & Personal details"
 >
 <Eye size={17} />
 </button>
 </div>
 </div>

 {/* Settings & Preferences */}
 <div className="mt-6 flex flex-col gap-3">
 <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">Settings & Preferences</h3>
 
 <button 
 onClick={() => setActivePage('documents')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
 <FileText size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Documents & KYC</span>
 <span className="text-[10px] text-gray-500">Aadhaar, PAN, GSTIN details</span>
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
 onClick={async () => {
 if (onLogout) { onLogout(); } else {
 try {
 const { supabase } = await import('../../lib/supabase');
 await supabase.auth.signOut();
 } catch (e) {
 console.error(e);
 }
 localStorage.removeItem('portal_auth_seller');
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
export const SellerPortal: React.FC<PortalProps> = ({ onBack }) => {
  const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);
  const handleDeepRefresh = () => {
    setIsDeepRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

 const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
 if (typeof window !== 'undefined') {
 return Boolean(localStorage.getItem('portal_auth_seller'));
 }
 return false;
 });

 useEffect(() => {
   if (!isLoggedIn) return;
   const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
   const userObj = savedAuth ? JSON.parse(savedAuth) : null;
   const sellerIdToTrack = userObj?.id;
   const sellerEmailToTrack = userObj?.email;
   if (!sellerIdToTrack && !sellerEmailToTrack) return;

   let channel: any = null;
   let interval: any = null;

   const performLogoutIfFrozen = (row: any) => {
     if (row && (row.freeze === 'true' || row.freeze === true || row.freeze === 'frozen')) {
       try {
         localStorage.removeItem('portal_auth_seller');
       } catch (e) {}
       setIsLoggedIn(false);
       import('../../lib/supabase').then(({ supabase }) => {
         supabase.auth.signOut().catch(() => {});
       });
     }
   };

   import('../../lib/supabase').then(({ supabase }) => {
     const query = sellerIdToTrack
       ? supabase.from('sellers').select('id, freeze').eq('id', sellerIdToTrack)
       : supabase.from('sellers').select('id, freeze').eq('registered_email', sellerEmailToTrack);

     query.maybeSingle().then(({ data }) => {
       if (data) performLogoutIfFrozen(data);
     });

     channel = supabase.channel(`seller_freeze_rt_${sellerIdToTrack || sellerEmailToTrack}_${Math.random().toString(36).substring(7)}`)
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sellers' }, (payload) => {
         if (payload?.new) {
           if (payload.new.id === sellerIdToTrack || (sellerEmailToTrack && payload.new.registered_email === sellerEmailToTrack)) {
             performLogoutIfFrozen(payload.new);
           }
         }
       })
       .subscribe();

     interval = setInterval(async () => {
       try {
         const q = sellerIdToTrack
           ? supabase.from('sellers').select('id, freeze').eq('id', sellerIdToTrack)
           : supabase.from('sellers').select('id, freeze').eq('registered_email', sellerEmailToTrack);
         const { data } = await q.maybeSingle();
         if (data) performLogoutIfFrozen(data);
       } catch (e) {}
     }, 2500);
   });

   return () => {
     if (channel) {
       import('../../lib/supabase').then(({ supabase }) => supabase.removeChannel(channel));
     }
     if (interval) clearInterval(interval);
   };
 }, [isLoggedIn]);

 const handleLogout = () => {
 setShowLogoutModal(true);
 };


 const [activeTab, setActiveTab] = useState('Products');
  const [headerLogo, setHeaderLogo] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ss_customer_additional_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
      }
    } catch (e) {}
  }, []);

 
 useEffect(() => {
 // Scroll to top when tab changes
 const mainContent = document.querySelector('main');
 if (mainContent) {
 mainContent.scrollTo({ top: 0, behavior: 'smooth' });
 }
 }, [activeTab]);

 const scrollDir = useScrollDirection(); 
 const [showLogoutModal, setShowLogoutModal] = useState(false);
 const [hideNav, setHideNav] = useState(false);
 const [quote, setQuote] = useState('');
 const [isUploadingProduct, setIsUploadingProduct] = useState(false);
 const [isGstVerified, setIsGstVerified] = useState(false);
 const [uploadServiceVisible, setUploadServiceVisible] = useState(false);
 const [notificationCount, setNotificationCount] = useState(0);
 const [notifications, setNotifications] = useState<any[]>([]);
 const [showNotifications, setShowNotifications] = useState(false);
 const [sellerId, setSellerId] = useState<string | null>(null);
 const [ordersKey, setOrdersKey] = useState(0);
 
 useEffect(() => {
 const fetchSellerData = async () => {
 if (isLoggedIn) {
 try {
 const { supabase } = await import('../../lib/supabase');
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 
 let sellerRecord = null;
 if (userObj?.id) {
 const { data } = await supabase.from('sellers').select('id, gstin, upload_service_visible').eq('id', userObj.id).maybeSingle();
 sellerRecord = data;
 }
 if (!sellerRecord && userObj?.email) {
 const { data } = await supabase.from('sellers').select('id, gstin, upload_service_visible').eq('registered_email', userObj.email).maybeSingle();
 sellerRecord = data;
 }
 if (!sellerRecord) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase.from('sellers').select('id, gstin, upload_service_visible').eq('id', user.id).maybeSingle();
 sellerRecord = data;
 }
 }

 if (sellerRecord) {
 if (sellerRecord.id) {
 setSellerId(sellerRecord.id);
 }
 if (sellerRecord.gstin && sellerRecord.gstin !== 'N/A') {
 setIsGstVerified(true);
 }
 if (sellerRecord.upload_service_visible === true) {
 setUploadServiceVisible(true);
 }
 }
 } catch (err) {
 console.error('Error fetching seller data', err);
 }
 }
 };
 fetchSellerData();
 }, [isLoggedIn]);
 const [editingProduct, setEditingProduct] = useState<SupabaseProduct | null>(null);
 const [editingMode, setEditingMode] = useState<'upload' | 'edit_active' | 'edit_draft' | 'edit_inactive'>('upload');

 useEffect(() => {
 setQuote(hindiQuotes[Math.floor(Math.random() * hindiQuotes.length)]);
 }, []);

  // Listen to back navigation cleanly
  useEffect(() => {
    return registerBackHandler(() => {
      if (showLogoutModal) {
        setShowLogoutModal(false);
        return true;
      }
      if (showNotifications) {
        setShowNotifications(false);
        return true;
      }
      if (isUploadingProduct || editingProduct) {
        setIsUploadingProduct(false);
        setEditingProduct(null);
        return true;
      }
      if (activeTab !== 'Dashboard') {
        setActiveTab('Dashboard');
        return true;
      }
      return false;
    });
  }, [showLogoutModal, showNotifications, isUploadingProduct, editingProduct, activeTab]);

  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
    }
  };

  const handleOpenUploadProduct = () => {
    setEditingProduct(null);
    setEditingMode('upload');
    setIsUploadingProduct(true);
  };

  const handleEditProduct = (product: SupabaseProduct, mode: 'edit_active' | 'edit_inactive' | 'edit_draft') => {
    setEditingProduct(product);
    setEditingMode(mode);
    setIsUploadingProduct(true);
  };

  const handleCloseUploadProduct = () => {
    setIsUploadingProduct(false);
    setEditingProduct(null);
  };

 if (isUploadingProduct) {
 return (
 <UploadProductForm 
 onBack={handleCloseUploadProduct} 
 initialProduct={editingProduct} 
 initialMode={editingMode}
 isGstVerified={isGstVerified}
 uploadServiceVisible={uploadServiceVisible}
 />
 );
 }

 const tabs = [
 { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
 { id: 'Orders', label: 'Orders', icon: Package },
 { id: 'Products', label: 'Products', icon: Box },
 { id: 'Payments', label: 'Payments', icon: Wallet },
 { id: 'Account', label: 'Account', icon: User },
 ];

 if (!isLoggedIn) {
 return <AuthLogin portalName="Seller" onLoginSuccess={() => setIsLoggedIn(true)} onBack={onBack} />;
 }

 return (
 <div className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden">
       <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center justify-between relative w-full h-[60px] px-4">
          
          {/* Left Actions (Logo and Brand) */}
          <div className="flex items-center gap-3 text-slate-700 z-10 h-full cursor-pointer" onClick={() => {
            if (activeTab !== 'Dashboard') {
              handleTabChange('Dashboard');
            } else {
              onBack();
            }
          }}>
            {headerLogo ? (
              <img src={headerLogo} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain rounded drop-shadow-sm" />
            ) : (
               <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs">Logo</div>
            )}
            
            {/* Brand Name */}
            <div className="flex flex-col items-start justify-center select-none">
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5 leading-none mt-1">
                <span className="text-orange-600">SURIYAWAN</span>
                <span className="text-black">SHOPPING</span>
                <span className="text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] ml-1">Seller</span>
              </h1>
              
              <div className="flex items-center gap-2 mt-1">
                {/* Premium Member Glow */}
                <div className="relative group inline-flex overflow-hidden rounded-full">
                  <span className="text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                    <span>👑</span> Premium Member
                  </span>
                  {/* Smooth Shine Animation */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
                </div>
                
                {/* Refresh Button - Moved here */}
                <button onClick={(e) => { e.stopPropagation(); handleDeepRefresh(); }} className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200" title="Refresh">
                  <RefreshCw size={14} className={`text-gray-500 ${isDeepRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

                    {/* Right Actions (Refresh & Bell) */}
          <div className="flex items-center gap-1 text-white z-10">

            <button onClick={() => setShowNotifications(true)} className="relative p-2 rounded-full hover:bg-white/20 transition-colors active:bg-white/30">
              <Bell size={22} className="text-white" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full border border-orange-500">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

 <main className="flex-1 overflow-y-auto scroll-smooth bg-[#FFFBF0] relative pb-24">
 {activeTab === 'Dashboard' && <SellerDashboardView />}
 {activeTab === 'Account' && <SellerAccountView onSubPageChange={setHideNav} onLogout={handleLogout} />}

 {activeTab === 'Orders' && <SellerOrdersView onBack={() => handleTabChange('Dashboard')} key={ordersKey} />}

 {activeTab === 'Payments' && <SellerPaymentsView />}
 {activeTab === 'Products' && (
 <div className="w-full min-h-full flex flex-col items-center pt-4 px-2 gap-3">
 {/* Motivational Quote - 1 Line */}
 <div className="w-full max-w-2xl px-1">
 <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white rounded-xl py-2 px-3 shadow-md shadow-orange-500/25 border border-amber-300/50 flex items-center gap-2 overflow-hidden select-none">
 <div className="flex-1 overflow-hidden relative h-6 flex items-center w-full">
 <div className="absolute whitespace-nowrap text-xs sm:text-sm font-bold text-white tracking-wide drop-shadow-xs animate-[slideLeft_10s_linear_infinite] will-change-transform">
 "{quote}"
 </div>
 </div>
 </div>
 </div>

 {/* Live Synchronized Products View */}
 <SellerProductsView 
 onOpenUpload={handleOpenUploadProduct} 
 onEditProduct={handleEditProduct} 
 />
 </div>
 )}
 </main>
 {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} portalName="Seller" />}
 {showNotifications && (
 <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
 <div className="flex items-center px-4 h-16 border-b border-gray-100 bg-white shadow-sm shrink-0">
 <button onClick={() => setShowNotifications(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
 <ArrowLeft size={24} className="text-gray-700" />
 </button>
 <h2 className="ml-2 text-lg font-bold text-gray-800">Notifications</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
 {notifications.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50">
 <Bell size={48} className="text-gray-400 mb-4" />
 <p className="text-gray-600 font-medium">No new notifications</p>
 </div>
 ) : (
 <div className="space-y-3">
 {notifications.map((notif) => (
 <div 
 key={notif.id}
 onClick={() => {
 setShowNotifications(false);
 handleTabChange('Orders');
 setOrdersKey(prev => prev + 1);
 }}
 className="bg-white p-3 rounded-xl shadow-sm border border-orange-100 flex gap-3 cursor-pointer hover:bg-orange-50/50 transition-colors active:scale-[0.98]"
 >
 <div className="w-12 h-12 rounded-lg bg-orange-100 overflow-hidden shrink-0 flex items-center justify-center">
 {notif['product image'] ? (
 <img src={notif['product image']} alt="Product" className="w-full h-full object-cover" />
 ) : (
 <Package size={20} className="text-orange-500" />
 )}
 </div>
 <div className="flex flex-col justify-center flex-1">
 <p className="text-xs font-bold text-orange-600 mb-0.5">New Order Received!</p>
 <p className="text-[11px] text-gray-700 font-medium line-clamp-1">{notif['product name'] || 'Product Order'}</p>
 <p className="text-[9px] text-gray-400 mt-1">Order ID: {notif['order ID']}</p>
 </div>
 <div className="shrink-0 text-[10px] text-gray-400 pt-1">
 {new Date(notif.created_at).toLocaleDateString('en-IN')}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}


 {/* Bottom Navigation */}
 <nav className={`fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)] pb-safe transition-transform duration-300 ease-in-out ${hideNav ? 'hidden' : ''} ${scrollDir === 'down' ? 'translate-y-full' : 'translate-y-0'}`}>
 <div className="flex justify-around items-center h-[72px] pb-2 pt-1 max-w-md mx-auto px-2">
 {tabs.map((tab) => {
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => handleTabChange(tab.id)}
 className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
 isActive ? 'text-orange-600' : 'text-gray-400 hover:text-black'
 }`}
 >
 <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
 <span className="text-[10px] font-semibold">{tab.label}</span>
 </button>
 )
 })}
 </div>
 </nav>
 </div>
 );
};
