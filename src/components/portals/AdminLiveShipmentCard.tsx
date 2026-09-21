import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PackageSearch, Activity } from 'lucide-react';

export const AdminLiveShipmentCard = ({ clusterId }: { clusterId?: string }) => {
  const [readyToPickupCount, setReadyToPickupCount] = useState(0);
  const [outForPickupCount, setOutForPickupCount] = useState(0);
  const [failedPickupCount, setFailedPickupCount] = useState(0);
  const [pickedUpCount, setPickedUpCount] = useState(0);
  const [unableToCompleteCount, setUnableToCompleteCount] = useState(0);
  const [receivedAtHubCount, setReceivedAtHubCount] = useState(0);
  const [dispatchedCount, setDispatchedCount] = useState(0);
  const [readyToDeliveryCount, setReadyToDeliveryCount] = useState(0);
  const [outForDeliveryCount, setOutForDeliveryCount] = useState(0);
  const [unableToCompleteDeliveryCount, setUnableToCompleteDeliveryCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [failedDeliveryCount, setFailedDeliveryCount] = useState(0);
  const [cancelledOrderCount, setCancelledOrderCount] = useState(0);

  useEffect(() => {
                    const fetchCounts = async () => {
      try {
        // --- COMPLEX LOGIC FOR 'READY TO PICKUP' ---
        let sellerIds: string[] | null = null;
        if (clusterId) {
          const { data: pincodesData } = await supabase
            .from('added_pincode')
            .select('"added pincode"')
            .eq('cluster id', clusterId);
            
          if (pincodesData && pincodesData.length > 0) {
            const validPincodes = pincodesData.map(p => p['added pincode']).filter(Boolean);
            if (validPincodes.length > 0) {
              const { data: sellersData } = await supabase
                .from('sellers')
                .select('id')
                .in('registered_pincode', validPincodes);
              if (sellersData && sellersData.length > 0) {
                sellerIds = sellersData.map(s => s.id);
              } else {
                sellerIds = [];
              }
            } else {
              sellerIds = [];
            }
          } else {
            sellerIds = [];
          }
        }

        const getReadyToPickupCount = async () => {
          if (sellerIds !== null && sellerIds.length === 0) return 0;
          
          if (sellerIds === null) {
            // Global count (Admin)
            const { count } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).ilike('shipment type', '%ready to pickup%');
            return count || 0;
          } else {
            // Cluster specific count using selller id
            let totalCount = 0;
            const batchSize = 100;
            for (let i = 0; i < sellerIds.length; i += batchSize) {
              const batch = sellerIds.slice(i, i + batchSize);
              const { count } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).in('selller id', batch).ilike('shipment type', '%ready to pickup%');
              if (count) totalCount += count;
            }
            return totalCount;
          }
        };

        // --- DIRECT CLUSTER ID LOGIC FOR ALL OTHER CHIPS ---
        const getCountWithDirectCluster = async (matchType: string, isLike = false) => {
          let query = supabase.from('accepted_shipments').select('*', { count: 'exact', head: true });
          
          if (clusterId) {
            query = query.eq('cluster id', clusterId);
          }

          if (isLike) {
            query = query.ilike('shipment type', matchType);
          } else {
            query = query.or(matchType);
          }
          
          const { count, error } = await query;
          if (error) console.error("Error fetching count:", error);
          return count || 0;
        };

        const getCountIlike = (matchType: string) => getCountWithDirectCluster(matchType, true);

        // 1. Ready to pickup uses complex seller ID logic
        setReadyToPickupCount(await getReadyToPickupCount());
        
        // 2. All others use direct cluster ID logic
        setOutForPickupCount(await getCountIlike('%out for pickup%'));
        setFailedPickupCount(await getCountWithDirectCluster('shipment type.ilike.faild pickup,shipment type.ilike.failed pickup,shipment type.ilike.qc faild pickup,shipment type.ilike.pickup attempt faild,shipment type.ilike.return pickup faild', false));
        setPickedUpCount(await getCountIlike('picked up'));
        
        const c5 = await getCountWithDirectCluster('shipment type.ilike.%reschduled pickup%,shipment type.ilike.%rescheduled pickup%,shipment type.ilike.%not attended pickup%,shipment type.ilike.%not attanded pickup%,shipment type.ilike.%no responsed picckup%,shipment type.ilike.%no responsed pickup%,shipment type.ilike.%no response%,shipment type.ilike.%not attend%,shipment type.ilike.%reschedule%', false);
        setUnableToCompleteCount(c5);
        
        setReceivedAtHubCount(await getCountIlike('%received at hub%'));
        setDispatchedCount(await getCountIlike('%dispatched%'));
        setReadyToDeliveryCount(await getCountIlike('Shipped'));
        setOutForDeliveryCount(await getCountIlike('%out for delivery%'));
        
        const c10 = await getCountWithDirectCluster('shipment type.ilike.%delivery reschduled%,shipment type.ilike.%delivery not attended%,shipment type.ilike.%delivery no responsed%,shipment type.ilike.%no response%,shipment type.ilike.%not attend%,shipment type.ilike.%reschedule%', false);
        setUnableToCompleteDeliveryCount(c10);
        
        setDeliveredCount(await getCountIlike('delivered'));
        setFailedDeliveryCount(await getCountIlike('faild delivery'));
        setCancelledOrderCount(await getCountIlike('rejected by customer'));

      } catch (err) {
        console.error(err);
      }
    };

    fetchCounts();
    const sub = supabase.channel('admin_dashboard_updates_' + Math.random().toString(36).substring(7))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments' }, fetchCounts)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [clusterId]);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
            <Activity size={14} strokeWidth={2.4} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Live Shipment Data & Shipment Activity
            </h2>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white border border-emerald-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <PackageSearch size={20} className="text-emerald-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Ready to Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{readyToPickupCount}</span>
          </div>
          <div className="bg-white border border-blue-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <PackageSearch size={20} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Out for Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{outForPickupCount}</span>
          </div>
          <div className="bg-white border border-indigo-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <PackageSearch size={20} className="text-indigo-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Picked Up</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{pickedUpCount}</span>
          </div>
          <div className="bg-white border border-red-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
            <PackageSearch size={20} className="text-red-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Failed Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{failedPickupCount}</span>
          </div>
          <div className="bg-white border border-cyan-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
            <PackageSearch size={20} className="text-cyan-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Received at Hub</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{receivedAtHubCount}</span>
          </div>
          <div className="bg-white border border-purple-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-1">
            <PackageSearch size={20} className="text-purple-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Dispatched</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{dispatchedCount}</span>
          </div>
          <div className="bg-white border border-teal-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-1">
            <PackageSearch size={20} className="text-teal-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Ready to delivery</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{readyToDeliveryCount}</span>
          </div>
          <div className="bg-white border border-fuchsia-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-1">
            <PackageSearch size={20} className="text-fuchsia-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Out for Delivery</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{outForDeliveryCount}</span>
          </div>
          <div className="bg-white border border-rose-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
            <PackageSearch size={20} className="text-rose-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Unable to Complete Pickup</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{unableToCompleteCount}</span>
          </div>
          <div className="bg-white border border-red-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
            <PackageSearch size={20} className="text-red-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Unable to Complete Delivery</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{unableToCompleteDeliveryCount}</span>
          </div>
          <div className="bg-white border border-red-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
            <PackageSearch size={20} className="text-red-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Failed Delivery</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{failedDeliveryCount}</span>
          </div>
          <div className="bg-white border border-green-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-3">
            <PackageSearch size={20} className="text-green-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Delivered</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{deliveredCount}</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-3">
            <PackageSearch size={20} className="text-slate-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Cancelled Order</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{cancelledOrderCount}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
