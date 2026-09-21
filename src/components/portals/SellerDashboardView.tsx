import { TermsAndConditionsModal } from "./TermsAndConditionsModal";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, PackageSearch } from 'lucide-react';
import { AnnouncementChatModal } from "./AnnouncementChatModal";
import { RoleChatModal } from "./RoleChatModal";

export const SellerDashboardView = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showRoleChatModal, setShowRoleChatModal] = useState(false);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [chatCount, setChatCount] = useState<number>(0);
  const [sellerData, setSellerData] = useState<any>(null);
  const [sellerClusterId, setSellerClusterId] = useState<string | null>(null);

  
  useEffect(() => {
    if (sellerData?.id) {
      supabase.from('announcement_and_update').select('*', {count: 'exact', head: true}).not('seller_update', 'is', null).neq('seller_update', '').then(({count}) => {
        if (count !== null) setUpdateCount(count);
      });
      supabase.from('chat_for_sellers').select('*', {count: 'exact', head: true}).eq('seller_id', sellerData.id).not('message', 'is', null).then(({count}) => {
        if (count !== null) setChatCount(count);
      });
    }
  }, [sellerData?.id]);
  useEffect(() => {
    const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
    if (localData) {
      const data = JSON.parse(localData);
      setSellerData(data);
      if (data?.registered_pincode) {
        supabase.from('added_pincode').select('"cluster id"').eq('added pincode', data.registered_pincode).single().then(({data}) => {
          if (data && data['cluster id']) setSellerClusterId(data['cluster id']);
        });
      }
    }
  }, []);
  const [readyToAcceptCount, setReadyToAcceptCount] = useState(0);
  const [readyToPickupCount, setReadyToPickupCount] = useState(0);
  const [outForPickupCount, setOutForPickupCount] = useState(0);
  const [failedPickupCount, setFailedPickupCount] = useState(0);
  const [pickedUpCount, setPickedUpCount] = useState(0);
  const [unableToCompleteCount, setUnableToCompleteCount] = useState(0);
  const [receivedAtHubCount, setReceivedAtHubCount] = useState(0);
  const [dispatchedCount, setDispatchedCount] = useState(0);
  const [shippedCount, setShippedCount] = useState(0);
  const [outForDeliveryCount, setOutForDeliveryCount] = useState(0);
  const [unableToCompleteDeliveryCount, setUnableToCompleteDeliveryCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [cancelledOrderCount, setCancelledOrderCount] = useState(0);
  const [returnProcessingCount, setReturnProcessingCount] = useState(0);
  const [outForReturnCount, setOutForReturnCount] = useState(0);
  const [returnedCount, setReturnedCount] = useState(0);

  useEffect(() => {
    
    const fetchCounts = async () => {
      try {
        let userId = null;
        
          const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
          if (savedAuth) userId = JSON.parse(savedAuth).id;
        
        
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) userId = user.id;
        }
        if (!userId) return;

        const { count: cRTA } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'ready to accept');
          
        if (cRTA !== null) setReadyToAcceptCount(cRTA);

        const { count: c1 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'ready to pickup')
          .in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
          
        if (c1 !== null) setReadyToPickupCount(c1);

        const { count: c2 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'out for pickup')
          .in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
          
        if (c2 !== null) setOutForPickupCount(c2);

        const { count: c3 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .in('shipment type', ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild'])
          .in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
          
        if (c3 !== null) setFailedPickupCount(c3);

        const { count: c4 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', '%picked up%');
          
        if (c4 !== null) setPickedUpCount(c4);

        const { count: c5 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .or('shipment type.ilike.rescheduled pickup,shipment type.ilike.not attanded pickup,shipment type.ilike.no responsed pickup,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule')
          .in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
          
        if (c5 !== null) setUnableToCompleteCount(c5);

        const { count: c6 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'received at hub')
          .in('shipment tag', ['Customer delivery', 'customer delivery']);
        
        if (c6 !== null) setReceivedAtHubCount(c6);

        const { count: c7 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'dispatched')
          .in('shipment tag', ['Customer delivery', 'customer delivery']);
        if (c7 !== null) setDispatchedCount(c7);

        const { count: c8 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'shipped')
          .in('shipment tag', ['Customer delivery', 'customer delivery']);
        if (c8 !== null) setShippedCount(c8);

        const { count: c9 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'out for delivery')
          .in('shipment tag', ['Customer delivery', 'customer delivery']);
        if (c9 !== null) setOutForDeliveryCount(c9);

        const { count: c10 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .or('shipment type.ilike.delivery rescheduled,shipment type.ilike.delivery not attanded,shipment type.ilike.delivery no responsed,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule')
          .in('shipment tag', ['Customer delivery', 'customer delivery']);
        if (c10 !== null) setUnableToCompleteDeliveryCount(c10);

        const { count: c11 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'delivered')
          .in('shipment tag', ['Customer delivery', 'customer delivery']);
        if (c11 !== null) setDeliveredCount(c11);

        const { count: c12 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .or('shipment type.ilike.faild delivery,shipment type.ilike.rejected by customer')
          .in('shipment tag', ['Customer delivery', 'customer delivery']);
        if (c12 !== null) setCancelledOrderCount(c12);

        const { count: cRP1 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .or('shipment type.ilike.ready to pickup,shipment type.ilike.out for pickup,shipment type.ilike.rescheduled pickup,shipment type.ilike.not attanded pickup,shipment type.ilike.no responsed pickup,shipment type.ilike.picked up,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule')
          .in('shipment tag', ['Customer pickup', 'customer pickup']);

        const { count: cRP2 } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .or('shipment type.ilike.received at hub,shipment type.ilike.shipped,shipment type.ilike.dispatched,shipment type.ilike.delivery rescheduled,shipment type.ilike.delivery not attanded,shipment type.ilike.delivery no responsed,shipment type.ilike.faild delivery,shipment type.ilike.rejected by customer,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule')
          .in('shipment tag', ['Seller delivery', 'seller delivery']);
          
        if (cRP1 !== null && cRP2 !== null) setReturnProcessingCount(cRP1 + cRP2);

        const { count: cOFR } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'out for delivery')
          .in('shipment tag', ['Seller delivery', 'seller delivery']);
        if (cOFR !== null) setOutForReturnCount(cOFR);

        const { count: cRET } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('selller id', userId)
          .ilike('shipment type', 'delivered')
          .in('shipment tag', ['Seller delivery', 'seller delivery']);
        if (cRET !== null) setReturnedCount(cRET);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCounts();
    // Realtime subscription
    const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
    const userObj = savedAuth ? JSON.parse(savedAuth) : null;
    if (userObj?.id) {
       const sub = supabase.channel('seller_dashboard_updates')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments', filter: `selller id=eq.${userObj.id}` }, fetchCounts)
         .subscribe();
       return () => { supabase.removeChannel(sub); };
    }
  }, []);

  return (
    <div className="w-full p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">All Orders</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white border border-amber-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <Package size={20} className="text-amber-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Ready to Accept</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{readyToAcceptCount}</span>
          </div>
          <div className="bg-white border border-orange-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <Package size={20} className="text-orange-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Ready to Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{readyToPickupCount}</span>
          </div>
          <div className="bg-white border border-purple-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <Package size={20} className="text-purple-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Out for Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{outForPickupCount}</span>
          </div>
          <div className="bg-white border border-emerald-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <Package size={20} className="text-emerald-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Picked Up</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{pickedUpCount}</span>
          </div>
          <div className="bg-white border border-red-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <Package size={20} className="text-red-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Failed Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{failedPickupCount}</span>
          </div>
          <div className="bg-white border border-blue-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
            <Package size={20} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Received at Hub</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{receivedAtHubCount}</span>
          </div>
          <div className="bg-white border border-purple-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-1">
            <Package size={20} className="text-purple-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Dispatched</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{dispatchedCount}</span>
          </div>
          <div className="bg-white border border-teal-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-1">
            <Package size={20} className="text-teal-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Shipped</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{shippedCount}</span>
          </div>
          <div className="bg-white border border-fuchsia-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-1">
            <Package size={20} className="text-fuchsia-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Out for Delivery</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{outForDeliveryCount}</span>
          </div>
          <div className="bg-white border border-rose-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
            <Package size={20} className="text-rose-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Unable to Complete Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{unableToCompleteCount}</span>
          </div>
          <div className="bg-white border border-red-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
            <Package size={20} className="text-red-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Unable to Complete Delivery</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{unableToCompleteDeliveryCount}</span>
          </div>
          <div className="bg-white border border-green-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-3">
            <Package size={20} className="text-green-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Delivered</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{deliveredCount}</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-3">
            <Package size={20} className="text-slate-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Cancelled Order</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{cancelledOrderCount}</span>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-2">
            <Package size={20} className="text-orange-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Return Processing</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{returnProcessingCount}</span>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-2">
            <Package size={20} className="text-purple-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Out for Return</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{outForReturnCount}</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-2">
            <Package size={20} className="text-green-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Returned</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{returnedCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setShowAnnouncementModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 relative">{updateCount > 0 && <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px]">{updateCount}</span>}
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            </div>
            <span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Announcement</span>
          </button>
          
          <button onClick={() => setShowRoleChatModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
            </div>
            <span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Chat an agent</span>
          </button>
          
          <button onClick={() => setShowTerms(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
            </div>
            <span className="text-[10px] font-bold text-slate-700 text-center w-full truncate">Term & condition</span>
          </button>
        </div>
      </div>
      <AnnouncementChatModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        updateType="seller_update"
        title="Suriyawan Shopping Updates"
        readOnly={true}
      />
      <RoleChatModal
        isOpen={showRoleChatModal}
        onClose={() => setShowRoleChatModal(false)}
        tableName="chat_for_sellers"
        title="Chat with Cluster Support"
        currentUserType="seller"
        currentUserId={sellerData?.id || ''}
        currentUserName={sellerData?.seller_name || 'Seller'}
        clusterId={sellerClusterId}
      />

      <TermsAndConditionsModal isOpen={showTerms} onClose={() => setShowTerms(false)} userType="seller" />
    </div>
  );
};
