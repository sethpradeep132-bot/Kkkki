import React, { useEffect, useState, useRef } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { supabase } from '../../lib/supabase';

// Added centralized update wrapper
import { syncShipmentStatusToCustomerOrder } from '../../utils/statusUpdater';
const updateAcceptedShipment = async (payload: any, id: string, fullShipmentData: any, sourcePortal: string = 'rider_tasks') => {
    if (sourcePortal === 'rider_tasks') {
        const sType = (fullShipmentData['shipment type'] || '').toLowerCase();
        const sTag = (fullShipmentData['shipment tag'] || '').toLowerCase();
        const isOutForDelivery = sType === 'out for delivery' && (sTag === 'customer delivery' || sTag === 'seller delivery');
        const isOutForPickup = sType === 'out for pickup' && (sTag === 'customer pickup' || sTag === 'seller pickup');
        
        if (payload['shipment type']) {
            const newType = (payload['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
            const preserveAttemptTypes = [
                'picked up', 'delivered', 
                'no responsed pickup', 'rescheduled pickup', 'not attanded pickup',
                'delivery no response', 'delivery no responsed', 'delivery reschduled', 'delivery not attended',
                'rescheduled delivery',
                'no response', 'not attend', 'reschedule'
            ];
            if ((isOutForDelivery || isOutForPickup) && !preserveAttemptTypes.includes(newType)) {
                payload['attempt'] = null;
            }
        }
    }
    
    if (payload['shipment type']) {
        const result = await syncShipmentStatusToCustomerOrder(
            id,
            payload['shipment type'] || fullShipmentData['shipment type'],
            payload['shipment tag'] || fullShipmentData['shipment tag'],
            fullShipmentData['order ID'],
            fullShipmentData['product id'],
            fullShipmentData['order status'] || '',
            payload['tracking id number'] || fullShipmentData['tracking id number'],
            payload['awb number'] || fullShipmentData['awb number'],
            payload['pickup ID'] || fullShipmentData['pickup ID'],
            sourcePortal,
            payload['pickup pin'] || fullShipmentData['pickup pin'] || ''
        );
        if (result.orderStatus) {
            payload['order status'] = result.orderStatus;
        }
    }
    const { data, error } = await supabase.from('accepted_shipments').update(payload).eq('id', id);
    if (!error) {
        await supabase.from('finished_shipments').update(payload).eq('id', id);
    }
    return { data, error };
};
import { buildShipmentStatus } from '../../utils/statusFormatter';

export const getNextAttempt = async (task: any, isDelivered: boolean) => {
    if (isDelivered) return null; // do not update
    
    const taskTypeLower = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
    const isPickup = taskTypeLower.includes('pickup');
    
    const idColumn = isPickup ? 'pickup ID' : 'awb number';
    const idValue = task[idColumn];
    
    if (!idValue) return (parseInt(task['attempt'] || '0') + 1).toString();
    
    const { data } = await supabase.from('accepted_shipments').select('attempt').eq(idColumn, idValue);
    let max = 0;
    if (data) {
        data.forEach((r: any) => {
            const a = parseInt(r.attempt || '0', 10);
            if (!isNaN(a) && a > max) max = a;
        });
    }
    
    const currentTaskAttempt = parseInt(task['attempt'] || '0', 10);
    // If another shipment of the same order already incremented the max attempt in this run,
    // we just use that max attempt. Otherwise, we increment the current task's attempt.
    const nextAttempt = Math.max(currentTaskAttempt + 1, max);
    
    return nextAttempt.toString();
};

import { ArrowLeft, MapPin, Camera, PenTool, CheckCircle2, Download, X, ArrowUpDown } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { Html5Qrcode } from 'html5-qrcode';
import { processShipmentsAddresses } from '../../utils/addressFormatter';
import { FiveDotLoader } from './FiveDotLoader';



const DraggableGroupItem = ({ group, isCompletedTab, setScanningGroup, getTagColor }: any) => {
    const controls = useDragControls();
    const totalQty = group.tasks.reduce((sum: number, t: any) => sum + parseInt(t['total quantity'] || t.quantity || '1', 10), 0);
    
    const innerContent = group.isCustomerTask ? (
        <div 
          onClick={() => !isCompletedTab && setScanningGroup(group)} 
          className={`bg-white border-[1.5px] border-black shadow-sm flex flex-col rounded-none relative overflow-hidden min-h-[124px] shrink-0 ${isCompletedTab ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50 cursor-pointer active:scale-[0.99] transition-all'}`}
        >
          <div className={`flex flex-col h-full ${!isCompletedTab ? 'p-2.5' : 'p-3 pl-4'}`}>
            <div className={`flex flex-nowrap items-center gap-1.5 overflow-hidden shrink-0 ${!isCompletedTab ? 'mb-1.5' : 'mb-2'}`}>
              <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0 max-w-[35%] min-w-0">
                {Array.from(group.orderIds || []).map((id: any) => (
                  <div key={id} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-none border border-slate-300 truncate shrink-0">
                    {id || 'C-TASK'}
                  </div>
                ))}
              </div>
              <div className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-none border border-slate-300 truncate shrink min-w-0">
                {group.firstTask['shipment type']}
              </div>
              <div className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-none border truncate shrink min-w-0 ${getTagColor(group.firstTask['shipment tag'])}`}>
                {group.firstTask['shipment tag']}
              </div>
              <div className="ml-auto bg-slate-50 text-slate-700 px-1.5 py-0.5 text-[9px] font-bold rounded-none border border-slate-200 shrink-0">
                Qty: {totalQty}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar">
              <h4 className="text-sm font-bold text-gray-800 leading-snug mb-1 shrink-0 line-clamp-1">
                {group.sellerName}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed pb-1 line-clamp-2">
                {group.address}
                {group.landmark ? `, ${group.landmark}` : ''}
                {group.pincode ? `, - ${group.pincode}` : ''}
              </p>
            </div>
            {!isCompletedTab && (
              <div className={`flex items-center gap-2 shrink-0 ${!isCompletedTab ? 'mt-1.5' : 'mt-2'}`}>
                <a
                   href={`tel:${group?.mobileNumber || group?.firstTask?.['mobile number'] || ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const dateStr = new Date().toLocaleString('en-IN');
                    group.tasks.forEach((task: any) => {
                        const currentDetails = task['call details'] || '';
                        const newAttempt = (currentDetails.match(/Call attempt/g) || []).length + 1;
                        const appendDetails = `\nCall attempt: ${newAttempt}, Call button clicked at ${dateStr}`;
                        const updatedDetails = (currentDetails + appendDetails).trim();
                        task['call details'] = updatedDetails;
                        import('../../lib/supabase').then(({supabase}) => supabase.from('accepted_shipments').update({'call details': updatedDetails}).eq('id', task.id).then());
                    });
                  }}
                  className="flex-1 py-1.5 bg-green-500 text-white font-bold text-xs uppercase border border-green-700 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Call
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://maps.google.com/?q=' + encodeURIComponent(`${group.address || ''} ${group.pincode || ''}`));
                  }}
                  className="flex-1 py-1.5 bg-yellow-400 text-black font-bold text-xs uppercase border border-yellow-600 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Map
                </button>
              </div>
            )}
          </div>
        </div>
    ) : (
        <div 
           onClick={() => !isCompletedTab && setScanningGroup(group)}
           className={`bg-white border-[1.5px] border-black shadow-sm flex flex-col rounded-none relative overflow-hidden min-h-[124px] shrink-0 ${isCompletedTab ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50 cursor-pointer active:scale-[0.99] transition-all'}`}
            >
              <div className={`flex flex-col h-full ${!isCompletedTab ? 'p-2.5' : 'p-3 pl-4'}`}>
            <div className={`flex flex-nowrap items-center gap-1.5 overflow-hidden shrink-0 ${!isCompletedTab ? 'mb-1.5' : 'mb-2'}`}>
              <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0 max-w-[35%] min-w-0">
                {Array.from(group.pickupIds || []).map((id: any) => (
                  <div key={id} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border border-slate-300 truncate shrink-0">
                    {id || group.sellerId}
                  </div>
                ))}
              </div>
              <div className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border border-slate-300 truncate shrink min-w-0">
                {group.firstTask['shipment type']}
              </div>
              <div className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border truncate shrink min-w-0 ${getTagColor(group.firstTask['shipment tag'])}`}>
                {group.firstTask['shipment tag']}
              </div>
              <div className="ml-auto bg-slate-50 text-slate-700 px-1.5 py-0.5 text-[9px] font-bold rounded-sm border border-slate-200 shrink-0">
                Qty: {totalQty}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar">
              <h4 className="text-sm font-bold text-gray-800 leading-snug mb-1 shrink-0 line-clamp-1">
                {group.shopName ? `${group.shopName} - ` : ''}{group.sellerName}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed pb-1 line-clamp-2">
                {group.address}
                {group.landmark ? `, ${group.landmark}` : ''}
                {group.pincode ? `, ${group.pincode}` : ''}
              </p>
            </div>
            {!isCompletedTab && (
              <div className={`flex items-center gap-2 shrink-0 ${!isCompletedTab ? 'mt-1.5' : 'mt-2'}`}>
                <a
                   href={`tel:${group?.mobileNumber || group?.firstTask?.['mobile number'] || ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const dateStr = new Date().toLocaleString('en-IN');
                    group.tasks.forEach((task: any) => {
                        const currentDetails = task['call details'] || '';
                        const newAttempt = (currentDetails.match(/Call attempt/g) || []).length + 1;
                        const appendDetails = `\nCall attempt: ${newAttempt}, Call button clicked at ${dateStr}`;
                        const updatedDetails = (currentDetails + appendDetails).trim();
                        task['call details'] = updatedDetails;
                        import('../../lib/supabase').then(({supabase}) => supabase.from('accepted_shipments').update({'call details': updatedDetails}).eq('id', task.id).then());
                    });
                  }}
                  className="flex-1 py-1.5 bg-green-500 text-white font-bold text-xs uppercase border border-green-700 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Call
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://maps.google.com/?q=' + encodeURIComponent(`${group.address || ''} ${group.pincode || ''}`));
                  }}
                  className="flex-1 py-1.5 bg-yellow-400 text-black font-bold text-xs uppercase border border-yellow-600 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Map
                </button>
              </div>
            )}
          </div>
        </div>
    );

    if (isCompletedTab) {
        return innerContent;
    }

    return (
        <Reorder.Item
            value={group}
            dragListener={false}
            dragControls={controls}
            onPointerDown={(e: any) => {
                const timer = setTimeout(() => {
                    controls.start(e);
                    if (navigator.vibrate) navigator.vibrate(50);
                }, 1000);
                (e.target as any)._dragTimer = timer;
            }}
            onPointerUp={(e: any) => clearTimeout((e.target as any)._dragTimer)}
            onPointerCancel={(e: any) => clearTimeout((e.target as any)._dragTimer)}
            onContextMenu={(e: any) => e.preventDefault()}
            style={{ touchAction: 'none' }}
        >
            {innerContent}
        </Reorder.Item>
    );
};


export const RiderTasksView = ({ onSubPageChange }: { onSubPageChange?: (hide: boolean) => void }) => {
  const [activeChip, setActiveChip] = useState('Pending');
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sellersInfo, setSellersInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [scanningGroup, setScanningGroup] = useState<any>(null);

  const [renderedGroups, setRenderedGroups] = useState<any[]>([]);

  const handleToggleSort = () => {
    setRenderedGroups(prev => {
      const reversed = [...prev].reverse();
      let riderId = null;
      try {
        const stored = localStorage.getItem('portal_auth_rider');
        if (stored) riderId = JSON.parse(stored).id;
      } catch (e) {}
      if (riderId && activeChip === 'Pending') {
        const newSort = reversed.map(g => g.hashKey);
        localStorage.setItem('rider_manual_sort_' + riderId, JSON.stringify(newSort));
      }
      return reversed;
    });
  };
  useEffect(() => {
      const isCompletedTab = activeChip === 'Failed/Completed';
      let filteredTasks = tasks;

      let groups: any = {};
      filteredTasks.forEach(task => {
          const sInfo = sellersInfo[task['selller id']] || {};
          const sType = task['shipment type'] || '';
          const sTag = task['shipment tag'] || '';
          const sTagLower = sTag.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
          const sTypeLower = sType.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
          
          const isSellerDelivery = sTagLower.includes('seller delivery') || sTagLower.includes('selller delivery');
          const isCustomerDelivery = sTagLower.includes('customer delivery') || (!isSellerDelivery && sTypeLower === 'out for delivery');
          
          const isCustomerPickup = sTagLower.includes('customer pickup');
          const isSellerPickup = sTagLower.includes('seller pickup') || sTagLower.includes('selller pickup') || (!isCustomerPickup && sTypeLower === 'out for pickup');

          let hashKey = isCompletedTab 
            ? (task.id || Math.random().toString())
            : `${task['full name'] || ''}|${task['mobile number'] || ''}|${task['full address'] || ''}|${task['pincode'] || ''}|${task['landmark'] || ''}|${task['address type'] || ''}|${task['product image'] || ''}|${task['product name'] || ''}|${task['product tittle name'] || ''}|${task['product discription'] || ''}|${task['key features'] || ''}|${task['total quantity'] || ''}|${task['size'] || ''}|${task['colour'] || ''}|${task['weight'] || ''}|${task['total price info'] || ''}|${task['total selling price'] || ''}|${task['total discount'] || ''}|${task['total delevery charge'] || ''}|${task['total amount'] || ''}|${task['payment method'] || ''}|${task['gift cash donation'] || ''}`;

          if (isCustomerDelivery || isCustomerPickup) {
            if (!groups[hashKey]) groups[hashKey] = {
              hashKey: hashKey,
              orderIds: new Set(),
              pickupIds: new Set(),
              isCustomerTask: true,
              tasks: [],
              sellerName: task['full name'] || 'Customer',
              address: task['full address'] || task.address || '',
              landmark: task.landmark || '',
              pincode: task.pincode || '',
              mobileNumber: task['mobile number'] || '',
              firstTask: task
            };
            groups[hashKey].orderIds.add(task['order ID'] || task['awb number']);
            if (isCustomerPickup) groups[hashKey].pickupIds.add(task['pickup ID'] || task['order ID'] || task['awb number']);
            groups[hashKey].tasks.push(task);
          } else {
            const sId = task['selller id'] || 'unknown';
            const sellerHashKey = isCompletedTab ? hashKey : `${sId}-${hashKey}`;
            if (!groups[sellerHashKey]) groups[sellerHashKey] = {
              hashKey: sellerHashKey,
              sellerId: sId,
              pickupIds: new Set(),
              tasks: [],
              shopName: sInfo.shop_name,
              sellerName: sInfo.seller_name,
              address: sInfo.registered_full_address || task['full address'] || task.address || '',
              landmark: task.landmark || '',
              pincode: sInfo.registered_pincode || task.pincode || '',
              mobileNumber: sInfo.registered_mobile_number || task['mobile number'] || '',
              firstTask: task
            };
            groups[sellerHashKey].pickupIds.add(task['pickup ID'] || 'unknown');
            groups[sellerHashKey].tasks.push(task);
          }
      });
      
      let groupArray = Object.values(groups);
      
      if (activeChip === 'Pending') {
          let riderId = null;
          try {
             const stored = localStorage.getItem('portal_auth_rider');
             if (stored) riderId = JSON.parse(stored).id;
          } catch(e) {}
          
          let selectedRoute: any = null;
          try {
             const stored = localStorage.getItem('rider_selected_route_' + riderId);
             if (stored) selectedRoute = JSON.parse(stored);
          } catch(e) {}
          
          let manualSort: string[] = [];
          try {
             const stored = localStorage.getItem('rider_manual_sort_' + riderId);
             if (stored) manualSort = JSON.parse(stored);
          } catch(e) {}
          
          const getVillageIndex = (group: any) => {
             if (!selectedRoute || !selectedRoute.villages) return 999999;
             const addressStr = `${group.address} ${group.landmark} ${group.pincode} ${group.firstTask?.['shipment tag']}`.toLowerCase();
             let bestIndex = 999999;
             selectedRoute.villages.forEach((village: string, idx: number) => {
                if (!village.trim()) return;
                const vLower = village.trim().toLowerCase();
                if (addressStr.includes(vLower)) {
                   if (idx < bestIndex) bestIndex = idx;
                }
             });
             return bestIndex;
          };

          groupArray.sort((a: any, b: any) => {
             const idxA = manualSort.indexOf(a.hashKey);
             const idxB = manualSort.indexOf(b.hashKey);
             const isAManual = idxA !== -1;
             const isBManual = idxB !== -1;
             
             if (isAManual && isBManual) return idxA - idxB;
             if (isAManual && !isBManual) return -1;
             if (!isAManual && isBManual) return 1;
             
             const vIdxA = getVillageIndex(a);
             const vIdxB = getVillageIndex(b);
             if (vIdxA !== vIdxB) return vIdxA - vIdxB;
             
             return (a.firstTask?.id || '').localeCompare(b.firstTask?.id || '');
          });
      }

      setRenderedGroups(groupArray);
  }, [tasks, activeChip, sellersInfo]);

  

  useEffect(() => {
    if (onSubPageChange) {
      onSubPageChange(!!selectedTask);
    }
  }, [selectedTask, onSubPageChange]);

  useEffect(() => {
    let ignore = false;
    let debounceTimer: any;
    let channel: any = null;

    const doFetch = async () => {
      if (!ignore) setLoading(true);
      try {
        let riderId = null;
        const stored = localStorage.getItem('portal_auth_rider');
        if (stored) riderId = JSON.parse(stored).id;
        if (!riderId) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) riderId = authData.user.id;
        }
        if (!riderId || ignore) return;

        // Fetch counts (parallel)
        const [pendRes, compRes] = await Promise.all([
          supabase.from('accepted_shipments').select('id, "shipment type", "shipment tag"').eq('Rider id', riderId).in('shipment type', [
            'out for pickup', 'out for delivery', 'picked up'
          ]),
          supabase.from('accepted_shipments').select('id, "shipment type", "shipment tag"').eq('Rider id', riderId).in('shipment type', [
            'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup',
            'delivered', 'delivery not attended', 'delivery no response', 'delivery no responsed', 'delivery reschduled', 'rejected by customer', 'faild delivery', 'return request', 'rescheduled delivery', 'cancelled',
            'no response', 'not attend', 'reschedule'
          ])
        ]);

        if (!ignore && pendRes.data) {
           const filteredPend = pendRes.data.filter(task => {
                 const stype = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
                 const stag = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
                 if (stype === 'picked up') {
                     return false;
                 }
                 return true;
           });
           setPendingCount(filteredPend.length);
        }
        if (!ignore && compRes.data) {
           const filteredComp = compRes.data.filter(task => {
                 const stype = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
                 const stag = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
                 const isDelivered = stype === 'delivered';
                 const isCustOrSellerDelv = stag.includes('seller delivery') || stag.includes('customer delivery');
                 if (isDelivered && isCustOrSellerDelv) {
                     return false;
                 }
                 if (stype === 'return pickup faild' && stag.includes('customer pickup')) {
                     return false;
                 }
                 return true;
           });
           setCompletedCount(filteredComp.length);
        }

        if (ignore) return;

        let query = supabase.from('accepted_shipments').select('*').eq('Rider id', riderId);
        
        if (activeChip === 'Pending') {
           query = query.in('shipment type', [
             'out for pickup', 'out for delivery', 
             ' out for pickup', ' out for delivery',
             'out for pickup ', 'out for delivery ',
             ' out for pickup ', ' out for delivery ',
             'picked up', ' picked up', 'picked up ', ' picked up '
           ]);
        } else if (activeChip === 'Failed/Completed') {
           query = query.in('shipment type', [
            'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup',
            'delivered', 'delivery not attended', 'delivery no response', 'delivery no responsed', 'delivery reschduled', 'rejected by customer', 'faild delivery', 'return request', 'rescheduled delivery', 'cancelled',
            'no response', 'not attend', 'reschedule'
          ]);
        } else {
           if (!ignore) setTasks([]);
           return;
        }

        const { data, error } = await query;
        if (ignore) return;

        if (!error && data) {
           let filteredData = data;
           if (activeChip === 'Pending') {
              filteredData = data.filter(task => {
                 const stype = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
                 const stag = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
                 if (stype === 'picked up') {
                     return false;
                 }
                 return true;
              });
           } else if (activeChip === 'Failed/Completed') {
              filteredData = data.filter(task => {
                 const stype = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
                 const stag = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
                 const isDelivered = stype === 'delivered';
                 const isCustOrSellerDelv = stag.includes('seller delivery') || stag.includes('customer delivery');
                 if (isDelivered && isCustOrSellerDelv) {
                     return false; // Exclude these
                 }
                 if (stype === 'return pickup faild' && stag.includes('customer pickup')) {
                     return false; // Exclude these
                 }
                 return true;
              });
           }
           let sortedData = [...filteredData];
           if (activeChip === 'Failed/Completed') {
              sortedData.sort((a, b) => {
                const typeA = (a['shipment type'] || '').toLowerCase();
                const typeB = (b['shipment type'] || '').toLowerCase();
                const getRank = (type: string) => {
                  if (['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer'].includes(type)) return 1;
                  if (['rescheduled pickup', 'not attanded pickup', 'no responsed pickup', 'delivery reschduled', 'delivery not attended', 'delivery no response', 'delivery no responsed', 'no response', 'not attend', 'reschedule'].includes(type)) return 2;
                  if (['picked up', 'delivered'].includes(type)) return 3;
                  return 4;
                };
                return getRank(typeA) - getRank(typeB);
              });
           }
           
           const processedData = await processShipmentsAddresses(sortedData);
           if (ignore) return;
           
           setTasks(processedData);
           
           const sellerIds = [...new Set(data.map(t => t['selller id']).filter(Boolean))];
           if (sellerIds.length > 0) {
             const { data: sellersData } = await supabase
               .from('sellers')
               .select('id, shop_name, seller_name, registered_full_address, registered_pincode, registered_mobile_number')
               .in('id', sellerIds);
             
             if (!ignore && sellersData) {
               const infoMap: Record<string, any> = {};
               sellersData.forEach(s => { infoMap[s.id] = s; });
               setSellersInfo(infoMap);
               
               // Force update tasks with seller details directly to ensure UI reflects it immediately
               const deeplyUpdatedTasks = processedData.map(t => {
                   const stag = (t['shipment tag'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
                   if (stag.includes('seller pickup') || stag.includes('selller pickup') || stag.includes('seller delivery') || stag.includes('selller delivery')) {
                       const sInfo = infoMap[t['selller id']];
                       if (sInfo) {
                           return {
                               ...t,
                               'full address': sInfo.registered_full_address || t['full address'] || '',
                               'pincode': sInfo.registered_pincode || t['pincode'] || '',
                               'address type': 'Seller Address'
                           };
                       }
                   }
                   return t;
               });
               setTasks(deeplyUpdatedTasks);
             }
           }
        } else {
           if (!ignore) setTasks([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const initRealtime = async () => {
      let riderId = null;
      try {
        const stored = localStorage.getItem('portal_auth_rider');
        if (stored) riderId = JSON.parse(stored).id;
      } catch (e) {}
      if (!riderId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) riderId = authData.user.id;
      }
      if (ignore) return;
      
      channel = supabase.channel('rider_tasks_changes_' + activeChip)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments', filter: riderId ? `Rider id=eq.${riderId}` : undefined }, payload => {
           clearTimeout(debounceTimer);
           debounceTimer = setTimeout(() => {
               if (!ignore) doFetch();
           }, 100);
        })
        .subscribe();
    };

    doFetch();
    initRealtime();
      
    return () => {
      ignore = true;
      clearTimeout(debounceTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeChip]);

  if (scanningGroup) {
    return <CustomerDeliveryScanView group={scanningGroup} onBack={() => setScanningGroup(null)} onStart={(s) => { setSelectedTask(s); setScanningGroup(null); }} sellersInfo={sellersInfo} />;
  }

  if (selectedTask) {
    return <TaskDetailView task={selectedTask} seller={sellersInfo[selectedTask['selller id']] || {}} onBack={() => setSelectedTask(null)} />;
  }

  return (
    <div className="w-full font-poppins">
      <div className="sticky top-0 z-30 bg-[#fafafa] pt-3 sm:pt-4 pb-2 px-3 sm:px-4 border-b border-transparent shadow-none">
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar min-w-0">
            {['Pending', 'Failed/Completed'].map(chip => (
              <button
                key={chip}
                onClick={() => { if (activeChip !== chip) { setActiveChip(chip); setTasks([]); } }}
                className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                  activeChip === chip
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-slate-600 border-black'
                }`}
              >
                {chip} ({chip === 'Pending' ? pendingCount : completedCount})
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleToggleSort}
            title="Sort Up/Down"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-white border border-black text-black hover:bg-slate-50 active:scale-90 transition-all cursor-pointer shrink-0 ml-auto focus:outline-none"
          >
            <ArrowUpDown size={17} className="text-black" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className={`px-4 pb-4 space-y-3 relative transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
        {(loading && tasks.length === 0) ? (
          <div className="flex justify-center py-10">
            <FiveDotLoader colorClass="bg-black" />
          </div>
        ) : tasks.length > 0 ? (
          (() => {
            const getTagColor = (tag: string) => {
              const t = (tag || '').toLowerCase();
              if (t.includes('customer pickup') || t.includes('customer delivery')) {
                return 'bg-blue-50 text-blue-700 border-blue-200';
              }
              if (t.includes('seller pickup') || t.includes('seller delivery')) {
                return 'bg-purple-50 text-purple-700 border-purple-200';
              }
              return 'bg-slate-100 text-slate-800 border-slate-300';
            };

            return renderedGroups.length === 0 ? (
               <div className="text-center py-10 text-slate-500 text-sm font-medium">No tasks found.</div>
            ) : activeChip === 'Pending' ? (
               <Reorder.Group axis="y" values={renderedGroups} onReorder={(newOrder) => {
                   setRenderedGroups(newOrder);
                   let riderId = null;
                   try {
                       const stored = localStorage.getItem('portal_auth_rider');
                       if (stored) riderId = JSON.parse(stored).id;
                   } catch(e) {}
                   if (riderId) {
                       const newSort = newOrder.map(g => g.hashKey);
                       localStorage.setItem('rider_manual_sort_' + riderId, JSON.stringify(newSort));
                   }
               }} className="flex flex-col gap-2 pb-[70px]">
                  {renderedGroups.map((group: any, i: number) => (
                     <DraggableGroupItem 
                        key={group.hashKey || i} 
                        group={group} 
                        isCompletedTab={false} 
                        setScanningGroup={setScanningGroup} 
                        getTagColor={getTagColor} 
                     />
                  ))}
               </Reorder.Group>
            ) : (
               <div className="flex flex-col gap-2 pb-[70px]">
                  {renderedGroups.map((group: any, i: number) => (
                     <DraggableGroupItem 
                        key={group.hashKey || i} 
                        group={group} 
                        isCompletedTab={true} 
                        setScanningGroup={setScanningGroup} 
                        getTagColor={getTagColor} 
                     />
                  ))}
               </div>
            );
          })()
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm font-medium">
            No tasks found.
          </div>
        )}
      </div>
    </div>
  );
};

export const generateUniqueAwb = async () => {
  const yearStr = new Date().getFullYear().toString().slice(-2);
  let length = 8;
  let awb = "";
  let isUnique = false;
  let attempts = 0;
  while (!isUnique) {
    awb = `SURI${yearStr}${Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, "0")}`;
    const { data: d1 } = await supabase.from("accepted_shipments").select("id").eq("awb number", awb).maybeSingle();
    const { data: d2 } = await supabase.from("customer_orders").select("id").eq("awb number", awb).maybeSingle();
    if (!d1 && !d2) {
      isUnique = true;
    } else {
      attempts++;
      if (attempts > 5) {
        length += 1;
        attempts = 0;
      }
    }
  }
  return awb;
};

export const TaskDetailView = ({ task, seller, onBack, isHubView, onLocalUpdate }: { task: any, seller: any, onBack: () => void, isHubView?: boolean, onLocalUpdate?: (result: any) => void }) => {
  const isCustomerDelivery = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim().includes('customer delivery') || (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim() === 'out for delivery';
  
  const [liveProductImages, setLiveProductImages] = useState<string[]>([]);
  const [liveCapturedImages, setLiveCapturedImages] = useState<string[]>([]);
  
  const productImages = liveProductImages.length > 0 ? liveProductImages : (task['product image'] || '').split('|||').filter(Boolean);
  const capturedImagesArr = liveCapturedImages.length > 0 ? liveCapturedImages : (task['captured images'] || '').split('|||').filter(Boolean);
  const displayImage = productImages.length > 0 ? productImages[0] : null;
  
  useEffect(() => {
    const fetchLiveImages = async () => {
      if (task?.id) {
        let query = supabase.from('accepted_shipments').select('"product image", "captured images"');
        
        const sTagLower = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
        const sTypeLower = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
        const isCustDelivery = sTagLower.includes('customer delivery') || sTypeLower === 'out for delivery';
        const isCustPickup = sTagLower.includes('customer pickup');
        
        if ((isCustDelivery || isCustPickup) && task['order ID']) {
            query = query.eq('order ID', task['order ID']);
        } else if (task['pickup ID']) {
            query = query.eq('pickup ID', task['pickup ID']);
        } else if (task['order ID']) {
            query = query.eq('order ID', task['order ID']);
        } else {
            query = query.eq('id', task.id);
        }

        const { data } = await query;
        
        if (data && data.length > 0) {
            let allProdImgs: string[] = [];
            let allCaptImgs: string[] = [];
            data.forEach((row: any) => {
                if (row['product image']) allProdImgs.push(...row['product image'].split('|||').filter(Boolean));
                if (row['captured images']) allCaptImgs.push(...row['captured images'].split('|||').filter(Boolean));
            });
            setLiveProductImages([...new Set(allProdImgs)]);
            setLiveCapturedImages([...new Set(allCaptImgs)]);
        }
      }
    };
    fetchLiveImages();
  }, [task]);


  const attemptStr = task['attempt'] || '0';
  let attemptCount = 0;
  if (typeof attemptStr === 'string' && attemptStr.includes('/')) {
    attemptCount = parseInt(attemptStr.split('/')[0], 10);
  } else {
    attemptCount = parseInt(attemptStr, 10);
  }
  if (isNaN(attemptCount)) attemptCount = 0;

  const taskTypeLower = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
  const isCustomerDeliveryTag = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim().includes('customer delivery') || taskTypeLower === 'out for delivery';
  
  const isHubDeliveryOver3OrFailed = isHubView && isCustomerDeliveryTag && (
    (attemptCount >= 3 && ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'rescheduled delivery', 'no response', 'not attend', 'reschedule'].includes(taskTypeLower)) ||
    ['faild delivery', 'rejected by customer'].includes(taskTypeLower)
  );
  
  const isHubDeliveryUnder3 = isHubView && isCustomerDeliveryTag && (
    attemptCount < 3 && ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'rescheduled delivery', 'no response', 'not attend', 'reschedule'].includes(taskTypeLower)
  );

  const isHubPickedUp = isHubView && (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim() === 'picked up';
  const isHubFailed = isHubView && ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild'].includes((task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim());
  const isHubOther = isHubView && ['rescheduled pickup', 'not attanded pickup', 'no responsed pickup', 'no response', 'not attend', 'reschedule'].includes((task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim());

  

  const [qcBrand, setQcBrand] = useState<'pass' | 'fail' | null>(null);
  const [qcCondition, setQcCondition] = useState<'pass' | 'fail' | null>(null);
  const [qcSame, setQcSame] = useState<'pass' | 'fail' | null>(null);
  
  const [awbScanInput, setAwbScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (!awbScanInput.trim()) {
      setScanMessage(null);
      return;
    }
    const val = awbScanInput.trim();
    const expected = (task['awb number'] || '').trim();
    if (val === expected) {
      setScanMessage({ type: 'success', text: 'Scanned successfully' });
    } else if (val.length >= expected.length || val.length >= 10) {
      setScanMessage({ type: 'error', text: 'Incorrect AWB number ID or barcode' });
    } else {
      setScanMessage(null);
    }
  }, [awbScanInput, task]);

  const isAwbScanned = isCustomerDelivery ? (awbScanInput.trim() === (task['awb number'] || '').trim() && awbScanInput.trim() !== '') : true;
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const html5QrCode = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setIsScannerOpen(true);
    setTimeout(async () => {
      try {
        html5QrCode.current = new Html5Qrcode('awb-reader');
        await html5QrCode.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 100 } },
          (decodedText) => {
            setAwbScanInput(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Ignore background scan errors
          }
        );
      } catch (err) {
        console.error('Failed to start scanner', err);
        alert('Failed to start scanner. Please ensure camera permissions are granted.');
        setIsScannerOpen(false);
      }
    }, 200);
  };

  const stopScanner = () => {
    if (html5QrCode.current) {
      try {
        html5QrCode.current.stop().then(() => {
          html5QrCode.current?.clear();
          setIsScannerOpen(false);
        }).catch(err => {
          console.warn('Error in stop promise:', err);
          setIsScannerOpen(false);
        });
      } catch (err) {
        console.warn('Scanner not running:', err);
        setIsScannerOpen(false);
      }
    } else {
      setIsScannerOpen(false);
    }
  };

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [showUnableOptions, setShowUnableOptions] = useState(false);
  const [unableReason, setUnableReason] = useState<string | null>(null);

  const [fullScreenImages, setFullScreenImages] = useState<string[] | null>(null);
  const [fullScreenIndex, setFullScreenIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [signatory, setSignatory] = useState<string>('');
  
  

  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e: any) => {
    isDrawing.current = true;
    draw(e);
  };
  
  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
      setSignatureData(canvas.toDataURL());
    }
  };
  
  const draw = (e: any) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
       e.preventDefault();
    } else {
       clientX = e.clientX;
       clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

    const isQcPass = qcBrand === 'pass' && qcCondition === 'pass' && qcSame === 'pass';
  const isQcFail = qcBrand === 'fail' || qcCondition === 'fail' || qcSame === 'fail';
  const isQcComplete = isQcPass || isQcFail;
  
  const shouldDisableCaptureImage = !isCustomerDelivery ? isQcPass : false;
  const isImageRequired = !isCustomerDelivery ? isQcFail : false;
  
  
  
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 800;
        let width = img.width;
        let height = img.height;
        if (Math.max(width, height) > MAX_DIMENSION) {
          const ratio = MAX_DIMENSION / Math.max(width, height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };


  const getSignatureWithText = () => {
     if (!canvasRef.current) return null;
     const finalCanvas = document.createElement('canvas');
     finalCanvas.width = canvasRef.current.width;
     finalCanvas.height = canvasRef.current.height + 40;
     const ctx = finalCanvas.getContext('2d');
     if(!ctx) return null;
     ctx.fillStyle = 'white';
     ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
     ctx.drawImage(canvasRef.current, 0, 0);
     ctx.fillStyle = 'black';
     ctx.font = 'bold 12px Arial';
     ctx.fillText(`${new Date().toLocaleString('en-IN')} - ${signatory}`, 10, finalCanvas.height - 15);
     return finalCanvas.toDataURL('image/jpeg', 0.8);
  };

  const isAllFilled = isAwbScanned && isQcComplete && (!isImageRequired || capturedImages.length > 0) && signatureData && signatory && (isCustomerDelivery ? true : (isQcFail ? true : pinInput.length > 0));

    const handleMarkAsDone = async () => {
    if (!isCustomerDelivery && isQcPass && pinInput !== task['pickup pin']) {
      setPinError(true);
      return;
    }
    if (!signatory) {
      alert("Please select Self, Customer, or Other for signature.");
      return;
    }
    setPinError(false);
    setLoading(true);

    try {
      const dateStr = new Date().toLocaleString('en-IN');
      let qty = parseInt(task['total quantity'] || task['quantity'] || '1', 10);
      if (isNaN(qty) || qty < 1) qty = 1;

      const sigBase64 = getSignatureWithText();
      let finalCapturedImages = '';
      if (capturedImages.length > 0) {
         const compressed = await Promise.all(capturedImages.map(img => compressImage(img)));
         finalCapturedImages = compressed.join('|||');
      }

      if (onLocalUpdate) {
          onLocalUpdate({ type: isQcPass ? 'pass' : 'fail', capturedImage: finalCapturedImages, sigBase64, signatory, dateStr });
          return;
      }

      // Just generate one AWB since each quantity unit is now its own separate task/row
      const awb = await generateUniqueAwb();


      const currentOrderStatus = task['order status'] || '';
      const currentShipmentStatus = task['shipment status'] || '';
      const currentCallDetails = task['call details'] || '';

      // Fetch latest order status from customer_orders to ensure we append perfectly without losing history
      let latestCoStatus = currentOrderStatus;
      if (task['order ID']) {
        const { data: coData } = await supabase.from('customer_orders').select('"order status"').eq('order ID', task['order ID']).maybeSingle();
        if (coData) latestCoStatus = coData['order status'] || '';
      }


      const actualCallCount = (currentCallDetails.match(/Call button clicked/g) || []).length;
      const newCallDetails = currentCallDetails + `\nCall attempt: ${actualCallCount}, Call duration: 00:00, Call recording - ${dateStr}`;

      let riderName = 'Unknown';
      let riderId = task['Rider id'] || '';
      if (riderId) {
         const { data: riderData } = await supabase.from('riders').select('rider_name').eq('id', riderId).maybeSingle();
         if (riderData && riderData.rider_name) riderName = riderData.rider_name;
      }

      if (isQcPass) {
         const orderUpdateLine = `Your order has been picked up successfully on ${dateStr} - Order ID: ${task['order ID']}`;
         const shipmentUpdateLine = `Order Picked up AWB Number: ${awb} by ${riderName} (ID: ${riderId}) on ${dateStr}`;

         const newOrderStatus = currentOrderStatus + (currentOrderStatus ? '\n' : '') + orderUpdateLine;
         const newShipmentStatus = currentShipmentStatus + (currentShipmentStatus ? '\n' : '') + shipmentUpdateLine;

         const normShipType = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
         const normShipTag = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
         const isEligibleResetAttempt = (
             (normShipType === 'out for pickup' && (normShipTag === 'seller pickup' || normShipTag === 'customer pickup')) ||
             (normShipType === 'out for delivery' && (normShipTag === 'seller delivery' || normShipTag === 'customer delivery'))
         );

         const payload: any = {
             'shipment type': isCustomerDelivery ? 'delivered' : 'picked up',
             'awb number': awb,
             'pickup pin': '',
             'call details': newCallDetails,
             'digital signature': sigBase64 ? (signatory ? `${sigBase64}|||Selected Option: ${signatory}` : sigBase64) : ''
         };

         if (isEligibleResetAttempt) {
             payload['attempt'] = null;
         }
         
         if ((task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim() === 'out for delivery' && (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim() === 'customer delivery') {
             let calculatedDays = 1;
             payload['days'] = calculatedDays;
             payload['created_at'] = new Date().toISOString();
             const orderId = task['order ID'] || task['order_id'];
             const sId = task['seller id'] || task['selller id'];
             const prodId = task['product id'];
             if (orderId) {
                 supabase.from('selller_income_estimate').select('id').eq('order id', orderId).maybeSingle().then(async ({ data: existingEst }) => {
                     if (existingEst) {
                         await supabase.from('selller_income_estimate').update({ days: calculatedDays, created_at: payload['created_at'] }).eq('id', existingEst.id);
                     } else {
                         try {
                             const sp = parseFloat(task['total selling price']) || parseFloat(task['total amount']) || 0;
                             const dc = parseFloat(task['total delevery charge']) || 0;
                             const gd = parseFloat(task['gift cash donation']) || 0;
                             const { data: adminData } = await supabase.from('seller_estimated_earning').select('*').limit(1).maybeSingle();
                             const adminCharges = adminData ? [
                                 { name: 'Referral Fee', value: adminData['Referral Fee'] || '0', isPercentage: true },
                                 { name: 'Closing Fee', value: adminData['Closing Fee'] || '0', isPercentage: false },
                                 { name: 'COD Fee', value: adminData['COD Fee'] || '0', isPercentage: false },
                                 { name: 'Shipping Fee', value: adminData['Shipping Fee'] || '0', isPercentage: false },
                                 { name: 'C-GST', value: adminData['C-GST'] || '0', isPercentage: true },
                                 { name: 'S-GST', value: adminData['S-GST'] || '0', isPercentage: true },
                                 { name: 'TDS charge', value: adminData['TDS charge'] || '0', isPercentage: true },
                                 { name: 'TCS charge', value: adminData['TCS charge'] || '0', isPercentage: true },
                             ] : [];
                             const totalSellerEarning = sp + dc;
                             let basePlatformEarning = 0;
                             const chargesWithBaseAmount = adminCharges.map(charge => {
                                 const isTax = charge.name.toUpperCase().includes('GST') || charge.name.toUpperCase().includes('TDS') || charge.name.toUpperCase().includes('TCS');
                                 const val = parseFloat(charge.value) || 0;
                                 let amount = 0;
                                 if (!isTax) {
                                     amount = charge.isPercentage ? (sp * val) / 100 : val;
                                     basePlatformEarning += amount;
                                 }
                                 return { ...charge, val, isTax, amount };
                             });
                             let platformTotal = 0;
                             chargesWithBaseAmount.forEach(charge => {
                                 let finalAmount = charge.amount;
                                 if (charge.isTax) {
                                     finalAmount = charge.isPercentage ? (basePlatformEarning * charge.val) / 100 : charge.val;
                                 }
                                 platformTotal += finalAmount;
                             });
                             const totalPlatformEstimate = platformTotal + gd;
                             const finalPayable = totalSellerEarning - totalPlatformEstimate;
                             await supabase.from('selller_income_estimate').insert([{
                                 "admin id": task['admin id'] || '',
                                 "seller id": sId || '',
                                 "order id": orderId,
                                 "product id": prodId || '',
                                 "awb number": task['awb number'] || '',
                                 "total earning amount": totalSellerEarning.toFixed(2),
                                 "total platform estimate": totalPlatformEstimate.toFixed(2),
                                 "final payable amount": finalPayable.toFixed(2),
                                 "payout status": "Pending",
                                 "days": calculatedDays,
                                 "created_at": payload['created_at']
                             }]);
                         } catch (e) {
                             console.error("Error inserting selller_income_estimate on delivery", e);
                         }
                     }
                 });
             }
         }
         
         payload['shipment status'] = await buildShipmentStatus(isCustomerDelivery ? 'Delivered' : 'Picked up', task, payload);
         if (isCustomerDelivery && payload['shipment type'] === 'delivered') {
         }
         if (finalCapturedImages) {
             payload['captured images'] = task['captured images'] ? task['captured images'] + '|||' + finalCapturedImages : finalCapturedImages;
         }

         await updateAcceptedShipment(payload, task.id, task);
         
         // Update exactly one corresponding row in customer_orders to avoid overwriting all split rows
         const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', task['order ID']);
         if (coRows && coRows.length > 0) {
            let targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
            if (!targetRow) targetRow = coRows[0];
            const currentCoStatus = targetRow['order status'] || '';
            if ((task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim() === 'out for delivery' && (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim() === 'customer delivery') {
                supabase.from('customer_orders').update({ days: 1, created_at: payload['created_at'] || new Date().toISOString() }).eq('id', targetRow.id).then();
            }
         }
         
      } else {
         const shipmentUpdateLine = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim().includes('seller pickup') 
            ? `QC Failed Pickup on ${dateStr} by Rider: ${riderName}` 
            : `Your order has been cancelled on ${dateStr} - Order ID: ${task['order ID']}`;
         const newShipmentStatus = currentShipmentStatus + (currentShipmentStatus ? '\n' : '') + shipmentUpdateLine;
            
         const currentAttempt = parseInt(task['attempt'] || '0');
         let newShipType = 'faild pickup';
         let newShipTag = task['shipment tag'];
         if (task['shipment type'] === 'out for pickup' && task['shipment tag'] === 'customer pickup') {
             newShipType = 'return pickup faild';
             newShipTag = 'customer pickup';
         }
         const payload: any = {
             'shipment type': newShipType,
             'shipment tag': newShipTag,
             'awb number': awb,
             'call details': newCallDetails,
             'digital signature': sigBase64 ? (signatory ? `${sigBase64}|||Selected Option: ${signatory}` : sigBase64) : ''
         };
         const normShipTypeFail = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
         const normShipTagFail = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
         const isEligibleResetAttemptFail = (
             (normShipTypeFail === 'out for pickup' && (normShipTagFail === 'seller pickup' || normShipTagFail === 'customer pickup')) ||
             (normShipTypeFail === 'out for delivery' && (normShipTagFail === 'seller delivery' || normShipTagFail === 'customer delivery'))
         );
         if (isEligibleResetAttemptFail) {
             payload['attempt'] = null;
         }
         payload['shipment status'] = await buildShipmentStatus('Failed pickup', task, payload);
         if (finalCapturedImages) {
             payload['captured images'] = task['captured images'] ? task['captured images'] + '|||' + finalCapturedImages : finalCapturedImages;
         }
         
         await updateAcceptedShipment(payload, task.id, task);
         
         // Update customer_orders
         const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', task['order ID']);
         if (coRows && coRows.length > 0) {
            let targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
            if (!targetRow) targetRow = coRows[0];
            const currentCoStatus = targetRow['order status'] || '';
            /* disabled customer_orders update */
         }
      }
      onBack();
    } catch(e) {
      console.error(e);
      alert('Failed to update task: ' + ((e as any).message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleUnableSubmit = async () => {
    if (!unableReason) return;

    if (onLocalUpdate) {
        onLocalUpdate({ type: 'unable', reason: unableReason });
        return;
    }

    setLoading(true);
    
    try {
      const rawReason = String(unableReason || '').trim().toLowerCase();
      let type = rawReason;
      if (rawReason === 'no response') type = 'no response';
      else if (rawReason === 'not attend') type = 'not attend';
      else if (rawReason === 'reschedule') type = 'reschedule';

      const statusPrefix = type;

      let riderName = 'Unknown';
      let riderId = task['Rider id'] || '';
      if (riderId) {
         const { data: riderData } = await supabase.from('riders').select('rider_name').eq('id', riderId).maybeSingle();
         if (riderData && riderData.rider_name) riderName = riderData.rider_name;
      }

      const dateStr = new Date().toLocaleString('en-IN');
      const isPickup = (task['shipment tag'] || '').toLowerCase().includes('pickup');
      const awb = isPickup ? (task['awb number'] || await generateUniqueAwb()) : task['awb number'];
      
      const currentCallDetails = task['call details'] || '';

      const actualCallCount = (currentCallDetails.match(/Call button clicked/g) || []).length;
      const newCallDetails = currentCallDetails + `\nCall attempt: ${actualCallCount}, Call duration: 00:00, Call recording - ${dateStr}`;
      const shipmentUpdateLine = `${statusPrefix} by ${riderName} (ID: ${riderId}) on ${dateStr}`;

      const payload: any = {
        'shipment type': type,
        'awb number': awb,
        'call details': newCallDetails
      };
      payload['shipment status'] = await buildShipmentStatus(shipmentUpdateLine, task, payload);

      await updateAcceptedShipment(payload, task.id, task);
      onBack();
    } catch(e) {
      console.error(e);
      alert('Failed to update task: ' + ((e as any).message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  const [scannedAwb, setScannedAwb] = useState('');
  const [awbVerified, setAwbVerified] = useState(false);
  const [isAwbVerified, setIsAwbVerified] = useState(false);
  const [awbError, setAwbError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dots, setDots] = useState('');
  const [customerOrderData, setCustomerOrderData] = useState<any>(task.customerOrder || null);

  useEffect(() => {
    let interval: any;
    if (isPrinting || isDownloading) {
      interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 400);
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [isPrinting, isDownloading]);

  useEffect(() => {
    const fetchCust = async () => {
      if (task.customerOrder) {
        setCustomerOrderData(task.customerOrder);
        return;
      }
      const ordId = task['order ID'] || task['order_id'] || task.order_id;
      if (ordId) {
        try {
          const { data: co } = await supabase
            .from('customer_orders')
            .select('id, "order ID", "full name", "full address", landmark, pincode, "mobile number"')
            .eq('order ID', ordId)
            .maybeSingle();
          if (co) setCustomerOrderData(co);
        } catch (err) {
          console.error('Error fetching customer details for label:', err);
        }
      }
    };
    fetchCust();
  }, [task]);

  const resolveCustomerDetails = async () => {
    if (customerOrderData?.['full name']) return customerOrderData;
    if (task.customerOrder?.['full name']) return task.customerOrder;
    const ordId = task['order ID'] || task['order_id'] || task.order_id;
    if (ordId) {
      try {
        const { data: co } = await supabase
          .from('customer_orders')
          .select('id, "order ID", "full name", "full address", landmark, pincode, "mobile number", "product tittle name", "product discription", "product name"')
          .eq('order ID', ordId)
          .maybeSingle();
        if (co) {
          if (!task['product tittle name'] && co['product tittle name']) task['product tittle name'] = co['product tittle name'];
          if (!task['product discription'] && co['product discription']) task['product discription'] = co['product discription'];
          if (!task['product name'] && co['product name']) task['product name'] = co['product name'];
          setCustomerOrderData(co);
          return co;
        }
      } catch (err) {
        console.error('Error fetching customer details:', err);
      }
    }
    if (task['product id'] && (!task['product tittle name'] || !task['product discription'])) {
      try {
        const { data: prod } = await supabase
          .from('upload_products')
          .select('"product title name", "product tittle name", "product description", "product discription", "product name"')
          .eq('id', task['product id'])
          .maybeSingle();
        if (prod) {
          if (!task['product tittle name']) task['product tittle name'] = prod['product tittle name'] || prod['product title name'];
          if (!task['product discription']) task['product discription'] = prod['product discription'] || prod['product description'];
          if (!task['product name'] && prod['product name']) task['product name'] = prod['product name'];
        }
      } catch (e) {}
    }
    return null;
  };
  
  const generateAwbPdfDoc = (custData?: any) => {
    // Standard landscape thermal shipping label: 6" x 4" (150mm x 100mm)
    const width = 432;
    const height = 288;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [width, height]
    });
    
    // Outer border with 3pt margin and medium thickness border lines
    const m = 3;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2.0);
    doc.rect(m, m, width - 2 * m, height - 2 * m);

    const midX = 216;
    const topSplitY = 112;
    const policyY = 224;

    // Horizontal line for bottom policy section
    doc.line(m, policyY, width - m, policyY);

    // Vertical center line in top section
    doc.line(midX, m, midX, policyY);

    // Left Column horizontal split (TO vs Product Details)
    doc.line(m, topSplitY, midX, topSplitY);

    // Right Column horizontal split (Barcode vs Order Details Table)
    doc.line(midX, topSplitY, width - m, topSplitY);

    // Order Details Table horizontal split lines (3 rows)
    const rowHeight = (policyY - topSplitY) / 3;
    doc.line(midX, topSplitY + rowHeight, width - m, topSplitY + rowHeight);
    doc.line(midX, topSplitY + rowHeight * 2, width - m, topSplitY + rowHeight * 2);

    // Vertical line in Order Details Table (labels vs values)
    const tableLabelColWidth = 74;
    const tableSplitX = midX + tableLabelColWidth;
    doc.line(tableSplitX, topSplitY, tableSplitX, policyY);

    // Clean address / name values - strictly remove any bracketed or parenthesized seller/customer
    const cleanStr = (val: any) => {
      if (!val) return '';
      return String(val)
        .replace(/\s*[\(\[](?:seller|customer|seller address|customer address|home|work)[\)\]]/gi, '')
        .trim();
    };

    const maskStr = (str: any) => {
      if (!str) return '';
      const s = String(str).trim();
      if (s.length <= 4) return s;
      return 'X'.repeat(s.length - 4) + s.slice(-4);
    };

    const activeCust = custData || customerOrderData || task.customerOrder;

    const rawName = activeCust?.['full name'] || task.customerName || (task.isCustomerTask ? task['full name'] : '') || task['customer name'] || 'Customer';
    const custName = cleanStr(rawName) || 'Customer Name';

    const rawAddr = activeCust?.['full address'] || task.customerAddress || (task.isCustomerTask ? task['full address'] : '') || task['customer address'] || '';
    const cleanAddr = cleanStr(rawAddr);

    const rawLandmark = activeCust?.landmark || task.customerLandmark || (task.isCustomerTask ? task.landmark : '') || '';
    const cleanLandmark = cleanStr(rawLandmark);

    const rawPin = activeCust?.pincode || task.customerPincode || (task.isCustomerTask ? task.pincode : '') || '';
    const cleanPin = cleanStr(rawPin);

    const rawMobile = activeCust?.['mobile number'] || task.customerMobile || (task.isCustomerTask ? task['mobile number'] : '') || '';
    const cleanMobile = String(rawMobile || '').trim();

    // Left Top: TO
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text("TO:", 14, 21);

    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(custName.substring(0, 30), 14, 35);

    let addressStr = [cleanAddr, cleanLandmark].filter(Boolean).join(', ');
    addressStr = cleanStr(addressStr);
    const addressLines = doc.splitTextToSize(addressStr || 'Address not available', 188);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const displayAddrLines = addressLines.slice(0, 3);
    if (addressLines.length > 3) displayAddrLines[2] += '...';
    doc.text(displayAddrLines, 14, 48);

    const endAddrY = 48 + displayAddrLines.length * 10.5;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`PIN: ${cleanPin || 'N/A'}`, 14, Math.min(endAddrY + 3, 93));
    if (cleanMobile) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Mobile: ${maskStr(cleanMobile)}`, 14, Math.min(endAddrY + 15, 106));
    }

    // Left Bottom: PRODUCT DETAILS
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text("PRODUCT DETAILS:", 14, 127);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const titleVal = task['product tittle name'] || task['product title name'] || custData?.['product tittle name'] || custData?.['product title name'] || task['title'] || '';
    const baseName = task['product name'] || task['product_name'] || custData?.['product name'] || '';
    let prodName = baseName;
    if (titleVal) {
      prodName = baseName && baseName !== titleVal ? `${baseName} - ${titleVal}` : titleVal;
    }
    if (!prodName) prodName = titleVal || 'Product Name';
    
    let nameLines = doc.splitTextToSize(prodName, 188);
    if (nameLines.length > 2) {
      nameLines = nameLines.slice(0, 2);
      nameLines[1] += '...';
    }
    doc.text(nameLines, 14, 140);

    let descY = 140 + nameLines.length * 11.5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    let descStr = task['product discription'] || task['product description'] || custData?.['product discription'] || custData?.['product description'] || task['description'] || 'No description available.';
    let descLines = doc.splitTextToSize(descStr, 188);
    if (descLines.length > 2) {
      descLines = descLines.slice(0, 2);
      descLines[1] += '...';
    }
    doc.text(descLines, 14, descY);

    let qtyY = Math.min(descY + descLines.length * 10 + 6, 218);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Qty: ${task['quantity'] || 1}`, 14, qtyY);

    // Right Top: Barcode
    const awbStr = String(task['awb number'] || 'AWB-UNKNOWN');
    const rightColCenter = midX + (width - m - midX) / 2;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`AWB ${awbStr}`, rightColCenter, 23, { align: 'center' });

    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, awbStr, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: 80,
        width: 3.0
      });
      const barcodeData = canvas.toDataURL('image/jpeg', 1.0);
      const bcWidth = 188;
      const bcHeight = 48;
      const bcX = rightColCenter - bcWidth / 2;
      doc.addImage(barcodeData, 'JPEG', bcX, 29, bcWidth, bcHeight);
    } catch(e) {
      console.error("Barcode gen error", e);
    }

    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.text(awbStr, rightColCenter, 92, { align: 'center' });

    // Right Bottom: Order Details Table
    const drawCell = (text: any, x: number, y: number, cellWidth: number, cellHeight: number, font: string, size: number) => {
      doc.setFont('helvetica', font);
      doc.setFontSize(size);
      doc.setTextColor(0, 0, 0);
      let txt = String(text || '');
      let ty = y + cellHeight / 2 + size * 0.35;
      doc.text(txt, x + 6, ty);
    };

    const valColWidth = (width - m) - tableSplitX;
    drawCell('Tracking ID', midX, topSplitY, tableLabelColWidth, rowHeight, 'bold', 10);
    drawCell(String(task['tracking id number'] || 'N/A'), tableSplitX, topSplitY, valColWidth, rowHeight, 'bold', 10.5);

    drawCell('Order ID', midX, topSplitY + rowHeight, tableLabelColWidth, rowHeight, 'bold', 10);
    drawCell(maskStr(task['order ID'] || 'N/A'), tableSplitX, topSplitY + rowHeight, valColWidth, rowHeight, 'bold', 10.5);

    drawCell('Payment Mode', midX, topSplitY + rowHeight * 2, tableLabelColWidth, rowHeight, 'bold', 10);
    drawCell(String(task['payment method'] || 'N/A'), tableSplitX, topSplitY + rowHeight * 2, valColWidth, rowHeight, 'bold', 10.5);

    // Bottom Box: Open Box Delivery Policy (Centered) & Thank you line (Centered)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("OPEN BOX DELIVERY POLICY :-", width / 2, 241, { align: 'center' });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const policyText = "This product is under Open Box Delivery policy. Please open and check the product in front of the delivery agent. If the product is damaged or incorrect, please refuse to accept and initiate return. No return or replacement will be accepted once signed.";
    const policyLines = doc.splitTextToSize(policyText, width - 24);
    doc.text(policyLines, width / 2, 251, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("Thank you for shopping with Suriyawan Shopping. We truly appreciate your visit!", width / 2, 276, { align: 'center' });

    return doc;
  };

  const handlePrintAwb = () => {
    setIsPrinting(true);
    setTimeout(async () => {
      try {
        const custData = await resolveCustomerDetails();
        const doc = generateAwbPdfDoc(custData);
        doc.autoPrint();
        window.open(URL.createObjectURL(doc.output('blob')), '_blank');
        setIsPrinting(false);
      } catch (e) {
        console.error(e);
        alert("Failed to generate PDF");
        setIsPrinting(false);
      }
    }, 300);
  };

  const getHubManagerDetails = async () => {
      let hId = null;
      const stored = localStorage.getItem("portal_auth_hub");
      if (stored) hId = JSON.parse(stored).id;
      if (!hId) {
         const { data: authData } = await supabase.auth.getUser();
         if (authData?.user) hId = authData.user.id;
      }
      let infoStr = "Unknown Hub";
      let hubNameFromPincode = "";
      let myClusterId = null;
      if (hId) {
         const { data } = await supabase.from("hub_managers").select("id, hub_name, registered_pincode, cluster_id").eq("id", hId).maybeSingle();
         if (data) {
           infoStr = `${data.id} || ${data.hub_name || ""} || ${data.registered_pincode || ""}`;
           myClusterId = data.cluster_id || null;
         }
         const { data: pData } = await supabase.from("added_pincode").select('"hub name"').eq("hub manager id", hId).limit(1).maybeSingle();
         if (pData && pData["hub name"]) hubNameFromPincode = pData["hub name"];
      }
      return { hId, infoStr, hubNameFromPincode, myClusterId };
  };

  const getHubManagerInfo = async () => {
      let hId = null;
      const stored = localStorage.getItem('portal_auth_hub');
      if (stored) hId = JSON.parse(stored).id;
      if (!hId) {
         const { data: authData } = await supabase.auth.getUser();
         if (authData?.user) hId = authData.user.id;
      }
      if (hId) {
         const { data } = await supabase.from('hub_managers').select('id, hub_name, registered_pincode').eq('id', hId).maybeSingle();
         if (data) return `${data.id} || ${data.hub_name || ''} || ${data.registered_pincode || ''}`;
      }
      return 'Unknown Hub';
  };

  const handleHubReceive = async () => {
    setLoadingAction('receive');
    setLoading(true);
    try {
      const dateStr = new Date().toLocaleString('en-IN');
      const { hId, infoStr: hubInfo, hubNameFromPincode, myClusterId } = await getHubManagerDetails();
      
      const orderUpdateLine = `Your order has been received at hub on ${dateStr} - AWB: ${task['awb number'] || 'N/A'}`;
      const shipmentUpdateLine = `Received at Hub on ${dateStr} by ${hubInfo} - AWB: ${task['awb number'] || 'N/A'}`;
      
      const currentCoStatus = task['order status'] || '';
      const currentShipmentStatus = task['shipment status'] || '';
      
      // Update customer_orders
      const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', task['order ID']);
      if (coRows && coRows.length > 0) {
         let targetRow = coRows.find(r => r['awb number'] === task['awb number']);
         if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
         if (!targetRow) targetRow = coRows[0];
         /* disabled customer_orders update */
      }
      
      const updatePayload: any = {
          'shipment type': 'received at hub',
      };
      updatePayload['shipment status'] = await buildShipmentStatus('Received at hub', task, updatePayload);
      if (hubNameFromPincode) updatePayload['assignment hub name'] = hubNameFromPincode;

      const currentTagLower = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
      const currentTypeLower = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();

      if (isHubDeliveryOver3OrFailed) {
         updatePayload['shipment tag'] = 'seller delivery';
         updatePayload['runsheet id'] = null;
      } else if (currentTypeLower === 'picked up' && currentTagLower === 'customer pickup') {
         updatePayload['shipment tag'] = 'seller delivery';
         updatePayload['runsheet id'] = null;
         updatePayload['pickupsheet id'] = null;
      } else {
         updatePayload['shipment tag'] = 'customer delivery';
         updatePayload['pickupsheet id'] = null;
      }
      
      // Update accepted_shipments
      await updateAcceptedShipment(updatePayload, task.id, task, isHubView ? 'hub_shipments' : 'rider_tasks');
      
      alert('Shipment Received at Hub successfully!');
      onBack();
    } catch(err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const handleHubFail = async () => {
    setLoadingAction('fail');
    setLoading(true);
    try {
      const dateStr = new Date().toLocaleString('en-IN');
      const { hId, infoStr: hubInfo, hubNameFromPincode, myClusterId } = await getHubManagerDetails();
      
      const isSellerPickup = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim().includes('seller pickup');
      const orderUpdateLine = isSellerPickup ? `` : `Your order has been cancelled on ${dateStr} - Order ID: ${task['order ID']}`;
      const shipmentUpdateLine = `QC Failed Pickup on ${dateStr} by ${hubInfo}`;
      
      const currentCoStatus = task['order status'] || '';
      const currentShipmentStatus = task['shipment status'] || '';
      
      // Update customer_orders (order status only)
      const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', task['order ID']);
      if (coRows && coRows.length > 0) {
         let targetRow = coRows.find(r => r['awb number'] === task['awb number']);
         if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
         if (!targetRow) targetRow = coRows[0];
         /* disabled customer_orders update */
      }
      
      let newShipType = 'qc faild pickup';
      let newShipTag = task['shipment tag'];
      const typeLower1 = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
      const tagLower1 = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
      if (['out for pickup', 'faild pickup', 'failed pickup'].includes(typeLower1) && tagLower1 === 'customer pickup') {
          newShipType = 'return pickup faild';
          newShipTag = 'customer pickup';
      }
      const updatePayload: any = {
          'shipment type': newShipType,
          'shipment tag': newShipTag,
          'pickupsheet id': null,
      };
      updatePayload['shipment status'] = await buildShipmentStatus('QC Failed Pickup', task, updatePayload);
      if (hubNameFromPincode) updatePayload['assignment hub name'] = hubNameFromPincode;

      // Update accepted_shipments
      await updateAcceptedShipment(updatePayload, task.id, task, isHubView ? 'hub_shipments' : 'rider_tasks');
      
      alert('Shipment marked as QC Failed!');
      onBack();
    } catch(err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const handleHubReattempt = async () => {
    setLoadingAction('reattempt');
    setLoading(true);
    try {
      const dateStr = new Date().toLocaleString('en-IN');
      const { hId, infoStr: hubInfo, hubNameFromPincode, myClusterId } = await getHubManagerDetails();
      
      let shipmentUpdateLine = `Failed Pickup Re-attempted on ${dateStr} by ${hubInfo}`;
      if (isHubDeliveryOver3OrFailed) {
         shipmentUpdateLine = `delivery re-attampted on ${dateStr} by ${hubInfo}`;
      }

      const currentShipmentStatus = task['shipment status'] || '';
      
      // Update customer_orders to clear rider and hub manager
      const { data: coRows } = await supabase.from('customer_orders').select('id, "awb number"').eq('order ID', task['order ID']);
      if (coRows && coRows.length > 0) {
         let targetRow = coRows.find(r => r['awb number'] === task['awb number']);
         if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
         if (!targetRow) targetRow = coRows[0];
         /* disabled customer_orders update */
      }
      
      const payload: any = {
          'shipment type': isHubDeliveryOver3OrFailed ? 'shipped' : 'ready to pickup',
      };
      payload['shipment status'] = await buildShipmentStatus('Re-attempted', task, payload);
      if (hubNameFromPincode) payload['assignment hub name'] = hubNameFromPincode;

      if (isHubDeliveryOver3OrFailed) {
         payload['runsheet id'] = null;
      } else {
         payload['pickupsheet id'] = null;
      }

      // Update accepted_shipments
      await updateAcceptedShipment(payload, task.id, task, isHubView ? 'hub_shipments' : 'rider_tasks');
      
      alert('Shipment queued for re-attempt!');
      onBack();
    } catch(err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const handleHubDone = async () => {
    setLoadingAction('done');
    setLoading(true);
    try {
      const dateStr = new Date().toLocaleString('en-IN');
      const originalType = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
      
      const currentShipmentStatus = task['shipment status'] || '';
      const currentAttempt = parseInt(task['attempt'] || '1');
      
      const { hId, infoStr: hubInfo, hubNameFromPincode, myClusterId } = await getHubManagerDetails();

      if (currentAttempt >= 3) {
          const isSellerPickup = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim().includes('seller pickup');
          const cancelUpdateLine = isSellerPickup ? `` : `Your order has been cancelled on ${dateStr} - Order ID: ${task['order ID']}`;
          
          // Update customer_orders
          const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', task['order ID']);
          if (coRows && coRows.length > 0) {
             let targetRow = coRows.find(r => r['awb number'] === task['awb number']);
             if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
             if (!targetRow) targetRow = coRows[0];
             
             const existingCoStatus = targetRow['order status'] || '';
             /* disabled customer_orders update */
          }
          
          let newShipType = 'pickup attempt faild';
          let newShipTag = task['shipment tag'];
          
          if (isHubDeliveryOver3OrFailed) {
              newShipType = 'delivery attempt faild';
          }
          const updatePayload: any = {
             'shipment type': newShipType,
             'shipment tag': newShipTag,
             'pickupsheet id': null,
          };
          updatePayload['shipment status'] = await buildShipmentStatus(`Pickup attempt faild on ${dateStr} by ${hubInfo}`, task, updatePayload);
          if (hubNameFromPincode) updatePayload['assignment hub name'] = hubNameFromPincode;

          // Update accepted_shipments
          await updateAcceptedShipment(updatePayload, task.id, task, isHubView ? 'hub_shipments' : 'rider_tasks');
          
          alert('Max attempts reached. Order cancelled!');
      } else {
          const shipmentUpdateLine = `${originalType} on ${dateStr}`;
          
          const isCustomerDelivery = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim().includes('customer delivery') || originalType === 'out for delivery';
          
          const payload: any = {
              'shipment type': isCustomerDelivery ? 'shipped' : 'ready to pickup',
          };
          payload['shipment status'] = await buildShipmentStatus(`${originalType} reset`, task, payload);
          if (hubNameFromPincode) payload['assignment hub name'] = hubNameFromPincode;

          if (isCustomerDelivery) {
              payload['runsheet id'] = null;
          } else {
              payload['pickupsheet id'] = null;
          }

          // Update customer_orders to clear rider
          const { data: coRows } = await supabase.from('customer_orders').select('id, "awb number"').eq('order ID', task['order ID']);
          if (coRows && coRows.length > 0) {
             let targetRow = coRows.find(r => r['awb number'] === task['awb number']);
             if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
             if (!targetRow) targetRow = coRows[0];
             /* disabled customer_orders update */
          }
          
          // Update accepted_shipments
          await updateAcceptedShipment(payload, task.id, task, isHubView ? 'hub_shipments' : 'rider_tasks');
          
          alert('Shipment updated successfully!');
      }
      onBack();
    } catch(err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const handleDownloadAwb = () => {
     setIsDownloading(true);
     setTimeout(async () => {
       try {
         const custData = await resolveCustomerDetails();
         const doc = generateAwbPdfDoc(custData);
         doc.save(`Shipping_Label_${task['awb number'] || 'LABEL'}.pdf`);
       } catch (err) {}
       setIsDownloading(false);
     }, 1000);
  };

  

  

  if (isHubView) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#fafafa] flex flex-col font-poppins text-black h-[100dvh]">
        <div className="flex items-center p-3 h-14 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
          <button onClick={onBack} className="p-2 -ml-2 bg-transparent text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-sm font-bold ml-2">Shipment Details</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
          
          
             <div className="bg-white border border-slate-200 p-3 rounded-none shadow-sm flex flex-col gap-3">
               <div className="flex flex-col min-w-0">
                 {task['pickup ID'] && (
                   <div className="mb-1">
                     <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PICKUP ID</span>
                     <span className="block text-xs font-bold text-slate-800 bg-gray-100 px-2 py-1 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">{task['pickup ID']}</span>
                   </div>
                 )}
                 <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{task['product name']}</h3>
                 <p className="text-[10px] font-semibold text-slate-600 mt-1 line-clamp-1">{task['product tittle name']}</p>
                 <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{task['product discription']}</p>
                 <div className="mt-1.5 flex gap-2">
                   <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 font-bold">Qty: {task['total quantity'] || 1}</span>
                 </div>
               </div>
               <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                 {productImages.map((img, idx) => (
                   <div 
                     key={idx}
                     className="aspect-square bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden cursor-pointer"
                     onClick={() => { setFullScreenImages(productImages); setFullScreenIndex(idx); }}
                   >
                     <img src={img} alt={`Product ${idx+1}`} className="w-full h-full object-contain" />
                   </div>
                 ))}
                 {productImages.length === 0 && (
                    <div className="aspect-square bg-slate-100 flex items-center justify-center border border-slate-200 col-span-1">
                      <span className="text-[10px] text-slate-400">No Image</span>
                    </div>
                 )}
               </div>
             </div>
          
          <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm space-y-4">
             {capturedImagesArr.length > 0 && (
               <div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Captured Images</h3>
                 <div className="flex gap-2 overflow-x-auto">
                   {capturedImagesArr.map((src, i) => (
                     <img key={i} src={src} alt="Captured" className="w-16 h-16 object-contain border border-slate-300" onClick={() => { setFullScreenImages(capturedImagesArr); setFullScreenIndex(i); }} />
                   ))}
                 </div>
               </div>
             )}
             
             <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                 <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase">Shipment Type</h3>
                   <p className="text-sm font-bold text-slate-800 uppercase mt-1">{task['shipment type']}</p>
                 </div>
                 <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase">Attempt</h3>
                   <p className="text-sm font-bold text-slate-800 mt-1">{parseInt(task['attempt'] || '1')} / 3</p>
                 </div>
             </div>
             <div>
               <h3 className="text-xs font-bold text-slate-500 uppercase">Call Details</h3>
               <p className="text-xs font-semibold text-slate-700 mt-1 whitespace-pre-wrap">{task['call details'] || 'No call details'}</p>
             </div>
          </div>

          {isHubDeliveryOver3OrFailed && (
             <div className="flex gap-3 mt-1">
                <button onClick={handleHubDone} disabled={loading} className="flex-1 py-3 text-sm font-bold text-purple-600 border-[1.5px] border-purple-600 rounded-md bg-white hover:bg-purple-50 disabled:opacity-50">{loading && loadingAction === 'done' ? 'Saving...' : 'Done'}</button>
                <button onClick={onBack} disabled={loading} className="flex-1 py-3 text-sm font-bold text-gray-500 border-[1.5px] border-gray-500 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Cancel</button>
             </div>
          )}
          {isHubPickedUp && (
            <>
            <div className="bg-white p-4 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase mb-4 text-slate-800">Quality Check</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">1. Brand Name</span>
                  <div className="flex gap-2">
                    <button onClick={() => setQcBrand('pass')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcBrand === 'pass' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}>Pass</button>
                    <button onClick={() => setQcBrand('fail')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcBrand === 'fail' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300'}`}>Fail</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">2. Old / Damage / Dirty</span>
                  <div className="flex gap-2">
                    <button onClick={() => setQcCondition('pass')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcCondition === 'pass' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}>Pass</button>
                    <button onClick={() => setQcCondition('fail')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcCondition === 'fail' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300'}`}>Fail</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">3. Same Product</span>
                  <div className="flex gap-2">
                    <button onClick={() => setQcSame('pass')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcSame === 'pass' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}>Pass</button>
                    <button onClick={() => setQcSame('fail')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcSame === 'fail' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300'}`}>Fail</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-5">
                   <button onClick={handlePrintAwb} disabled={isPrinting} className="py-3 text-[13px] font-bold text-blue-600 border-[1.5px] border-blue-600 rounded-none bg-white hover:bg-blue-50 uppercase min-w-0 break-words whitespace-normal text-center flex flex-row items-center justify-center gap-2">
                      {isPrinting ? `Printing${dots}` : 'Print'}
                   </button>
                   <button onClick={handleDownloadAwb} disabled={isDownloading} className="py-3 text-[13px] font-bold text-purple-600 border-[1.5px] border-purple-600 rounded-none bg-white hover:bg-purple-50 uppercase min-w-0 break-words whitespace-normal text-center flex flex-row items-center justify-center gap-2">
                      {isDownloading ? `Downloading${dots}` : (
                         <>
                            <span>AWB & Label</span>
                            <Download size={18} className="text-purple-600" />
                         </>
                      )}
                   </button>
                </div>
                <div className="flex gap-4 h-[50px]">
                   <input 
                      type="text" 
                      placeholder="Scan AWB" 
                      value={scannedAwb}
                      onChange={(e) => {
                         setScannedAwb(e.target.value);
                         if (e.target.value.trim() === task['awb number']) {
                            setIsAwbVerified(true);
                            setAwbError('');
                         } else {
                            setIsAwbVerified(false);
                         }
                      }}
                      className="flex-1 min-w-0 border-[1.5px] border-black rounded-none px-4 text-sm font-bold outline-none"
                   />
                   <button 
                      onClick={() => {
                          if (scannedAwb.trim() === task['awb number']) {
                             setIsAwbVerified(true);
                             setAwbError('');
                          } else {
                             setAwbError('invalid awb number or barcode');
                             setIsAwbVerified(false);
                          }
                      }}
                      className={`px-8 shrink-0 text-sm font-bold border-[1.5px] rounded-none transition-colors ${isAwbVerified ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-400 text-gray-600'}`}>
                      Verify
                   </button>
                </div>
                {awbError && <p className="text-red-500 text-xs font-bold">{awbError}</p>}
            </div>
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
          {isHubPickedUp && (
             <div className="flex gap-3 mt-1">
                <button onClick={handleHubReceive} disabled={!isAwbVerified || loading} className={`flex-1 py-3 text-sm font-bold border rounded-none ${isAwbVerified && !loading ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700' : 'text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed'}`}>{loading && loadingAction === 'receive' ? 'Saving...' : 'Receive'}</button>
                <button onClick={onBack} className="flex-1 py-3 text-sm font-bold text-red-600 border border-red-600 rounded-none bg-white hover:bg-red-50">Cancel</button>
             </div>
          )}
          {isHubFailed && (
             <div className="flex gap-3">
                <button onClick={handleHubFail} disabled={loading} className="flex-1 py-3 text-sm font-bold text-red-600 border border-red-600 rounded-none bg-white hover:bg-red-50 disabled:opacity-50">{loading && loadingAction === 'fail' ? 'Saving...' : 'Fail'}</button>
                <button onClick={handleHubReattempt} disabled={loading} className="flex-1 py-3 text-sm font-bold text-yellow-600 border border-yellow-600 rounded-none bg-white hover:bg-yellow-50 disabled:opacity-50">{loading && loadingAction === 'reattempt' ? 'Saving...' : 'Re-attempt'}</button>
             </div>
          )}
          {isHubOther && (
             <div className="flex gap-3">
                <button onClick={handleHubDone} disabled={loading} className="flex-1 py-3 text-sm font-bold text-blue-600 border border-blue-600 rounded-none bg-white hover:bg-blue-50 disabled:opacity-50">{loading && loadingAction === 'done' ? 'Saving...' : 'Done'}</button>
                <button onClick={onBack} disabled={parseInt(task['attempt'] || '1') >= 3 || loading} className={`flex-1 py-3 text-sm font-bold text-gray-600 border border-gray-600 rounded-none bg-white ${parseInt(task['attempt'] || '1') >= 3 ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-400' : 'hover:bg-gray-50'}`}>Cancel</button>
             </div>
          )}
          {isHubDeliveryOver3OrFailed && (
             <div className="flex gap-3 mt-1">
                <button onClick={handleHubReceive} disabled={!isAwbVerified || loading} className={`flex-1 py-3 text-sm font-bold border-[1.5px] rounded-md ${isAwbVerified && !loading ? 'text-purple-600 border-purple-600 bg-white hover:bg-purple-50' : 'text-gray-400 border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'}`}>{loading && loadingAction === 'receive' ? 'Saving...' : 'Receive'}</button>
                <button onClick={handleHubReattempt} disabled={!isAwbVerified || loading} className={`flex-1 py-3 text-sm font-bold border-[1.5px] rounded-md ${isAwbVerified && !loading ? 'text-yellow-600 border-yellow-500 bg-white hover:bg-yellow-50' : 'text-gray-400 border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'}`}>{loading && loadingAction === 'reattempt' ? 'Saving...' : 'Re-attempt'}</button>
             </div>
          )}
          {isHubDeliveryUnder3 && (
             <div className="flex gap-3 mt-1">
                <button onClick={handleHubDone} disabled={loading} className="flex-1 py-3 text-sm font-bold text-purple-600 border-[1.5px] border-purple-600 rounded-md bg-white hover:bg-purple-50 disabled:opacity-50">{loading && loadingAction === 'done' ? 'Saving...' : 'Done'}</button>
                <button onClick={onBack} disabled={loading} className="flex-1 py-3 text-sm font-bold text-gray-500 border-[1.5px] border-gray-500 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Cancel</button>
             </div>
          )}
        </div>
        
        {fullScreenImages && fullScreenImages.length > 0 && (
          <div 
            className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center overflow-hidden" 
            onClick={() => setFullScreenImages(null)}
            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
            onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
            onTouchEnd={() => {
              if (!touchStart || !touchEnd) return;
              const distance = touchStart - touchEnd;
              if (distance > 50 && fullScreenIndex < fullScreenImages.length - 1) {
                setFullScreenIndex(prev => prev + 1);
              } else if (distance < -50 && fullScreenIndex > 0) {
                setFullScreenIndex(prev => prev - 1);
              }
              setTouchStart(null);
              setTouchEnd(null);
            }}
          >
            <button className="absolute top-4 right-4 text-white p-2 font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl z-10">&times;</button>
            <div className="text-white absolute top-4 left-4 font-bold bg-black/50 px-3 py-1 rounded-full z-10 text-sm">
              {fullScreenIndex + 1} / {fullScreenImages.length}
            </div>
            
            {fullScreenIndex > 0 && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setFullScreenIndex(prev => prev - 1); }}
                 className="absolute left-2 top-1/2 -translate-y-1/2 text-white p-2 font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center z-10"
               >
                 &lt;
               </button>
            )}
            
            <img src={fullScreenImages[fullScreenIndex]} alt="Full Screen" className="w-full h-auto max-h-[90vh] object-contain shrink-0 transition-opacity duration-300" />
            
            {fullScreenIndex < fullScreenImages.length - 1 && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setFullScreenIndex(prev => prev + 1); }}
                 className="absolute right-2 top-1/2 -translate-y-1/2 text-white p-2 font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center z-10"
               >
                 &gt;
               </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#fafafa] flex flex-col font-poppins text-black h-[100dvh]">
      <div className="flex items-center p-3 h-14 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
        <button onClick={onBack} className="p-2 -ml-2 bg-transparent text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-sm font-bold ml-2">Task Details</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        
        {/* Product Details */}
        <div>
          <div className="bg-white border border-slate-200 p-3 rounded-none shadow-sm flex flex-col gap-3">
            <div className="flex flex-col min-w-0">
              {isCustomerDelivery ? (
                <>
                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">ORDER ID</span>
                    <span className="block text-xs font-bold text-slate-800 bg-gray-100 px-2 py-1 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">{task['order ID']}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">AWB NUMBER</span>
                    <span className="block text-xs font-bold text-slate-800 bg-gray-100 px-2 py-1 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">{task['awb number']}</span>
                  </div>
                  {!((task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim().includes('seller delivery') || (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim().includes('pickup') || (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim().includes('pickup')) && (
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount</span>
                      <span className="block text-xs font-bold text-slate-800 bg-gray-100 px-2 py-1 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">₹{(task['payment method'] || '').toLowerCase() === 'prepaid' ? 0 : (task['total amount'] || 0)}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {task['pickup ID'] && (
                    <div className="mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PICKUP ID</span>
                      <span className="block text-xs font-bold text-slate-800 bg-gray-100 px-2 py-1 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">{task['pickup ID']}</span>
                    </div>
                  )}
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{task['product name']}</h3>
                  <p className="text-[10px] font-semibold text-slate-600 mt-1 line-clamp-1">{task['product tittle name']}</p>
                  <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{task['product discription']}</p>
                  <div className="mt-1.5 flex gap-2">
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 font-bold">Qty: {task['total quantity'] || 1}</span>
                  </div>
                </>
              )}
            </div>
            
            {!isCustomerDelivery && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {productImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className="aspect-square bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden cursor-pointer"
                    onClick={() => { setFullScreenImages(productImages); setFullScreenIndex(idx); }}
                  >
                    <img src={img} alt={`Product ${idx+1}`} className="w-full h-full object-contain" />
                  </div>
                ))}
                {productImages.length === 0 && (
                  <div className="aspect-square bg-slate-100 flex items-center justify-center border border-slate-200 col-span-1">
                    <span className="text-[10px] text-slate-400">No Image</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {capturedImagesArr.length > 0 && (
            <div className="bg-white border border-slate-200 p-3 rounded-none shadow-sm flex flex-col gap-3 mt-4">
               <h3 className="text-xs font-bold text-slate-500 uppercase">Previously Captured Images</h3>
               <div className="flex gap-2 overflow-x-auto">
                 {capturedImagesArr.map((src, i) => (
                   <img key={i} src={src} alt="Captured" className="w-16 h-16 object-contain border border-slate-300" onClick={() => { setFullScreenImages(capturedImagesArr); setFullScreenIndex(i); }} />
                 ))}
               </div>
            </div>
          )}
          {/* Action Buttons below Product Details */}
          {isCustomerDelivery ? (
            <div className="flex flex-col gap-1 w-full mt-2">
              <div className="flex gap-2 w-full items-center">
                <button 
                  onClick={startScanner}
                  disabled={isAwbScanned && awbScanInput !== ''}
                  className={`w-24 shrink-0 py-2 text-xs font-bold border rounded-none flex items-center justify-center uppercase ${isAwbScanned && awbScanInput !== '' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-black text-black bg-white active:bg-gray-100'}`}
                >
                  {isAwbScanned && awbScanInput !== '' ? 'Scanned' : 'Scan'}
                </button>
                <input
                  type="text"
                  placeholder="Enter AWB Number"
                  value={awbScanInput}
                  onChange={(e) => setAwbScanInput(e.target.value)}
                  className={`w-32 sm:w-40 shrink-0 py-2 px-3 text-xs font-bold border rounded-none focus:outline-none ${isAwbScanned && awbScanInput !== '' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-400 bg-white'}`}
                />
                {scanMessage && (
                  <div className={`text-[10px] sm:text-xs font-bold leading-tight break-words ${scanMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {scanMessage.text}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Quality Check */}
        <div className="bg-white p-4 border border-slate-200">
          <h3 className="text-xs font-bold uppercase mb-4 text-slate-800">Quality Check</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">1. Brand Name</span>
              <div className="flex gap-2">
                <button onClick={() => setQcBrand('pass')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcBrand === 'pass' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}>Pass</button>
                <button onClick={() => setQcBrand('fail')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcBrand === 'fail' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300'}`}>Fail</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">2. Old / Damage / Dirty</span>
              <div className="flex gap-2">
                <button onClick={() => setQcCondition('pass')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcCondition === 'pass' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}>Pass</button>
                <button onClick={() => setQcCondition('fail')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcCondition === 'fail' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300'}`}>Fail</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">3. Same Product</span>
              <div className="flex gap-2">
                <button onClick={() => setQcSame('pass')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcSame === 'pass' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}>Pass</button>
                <button onClick={() => setQcSame('fail')} className={`px-4 py-1 text-xs font-bold border rounded-sm ${qcSame === 'fail' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300'}`}>Fail</button>
              </div>
            </div>
          </div>
        </div>

        {/* Capture Image */}
        <div className={`flex flex-col gap-1 ${shouldDisableCaptureImage ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Capture 2-3 images {shouldDisableCaptureImage && '(Not Required)'}</label>
          <label className={`w-full py-3 flex items-center justify-center gap-2 border border-black text-black font-bold text-sm ${shouldDisableCaptureImage ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-slate-50'} rounded-none`}>
            <Camera size={18} />
            Capture Image
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" disabled={shouldDisableCaptureImage} onChange={(e) => { 
               if (e.target.files) { 
                 const newFiles = Array.from(e.target.files as FileList);
                 newFiles.forEach(file => {
                   const reader = new FileReader();
                   reader.onload = (ev) => {
                     if (ev.target?.result) {
                        setCapturedImages(prev => {
                           if (prev.length >= 4) return prev;
                           return [...prev, ev.target.result as string];
                        });
                     }
                   }
                   reader.readAsDataURL(file);
                 });
               }
            }} />
          </label>
          {capturedImages.length > 0 && (
             <div className="flex gap-2 overflow-x-auto mt-2">
               {capturedImages.map((src, i) => <img key={i} src={src} className="w-12 h-12 border border-slate-300 object-cover rounded-sm" onClick={() => { setFullScreenImages(capturedImages); setFullScreenIndex(i); }} />)}
             </div>
          )}
        </div>

        {/* Pickup Pin */}
        {(!(!isCustomerDelivery && isQcFail)) && (
          <div>
            <label className="text-xs font-bold uppercase mb-1 block">
              {isCustomerDelivery 
                ? 'Enter Cancellation Code' 
                : 'Enter Pickup Pin'}
            </label>
            <input 
              type="text" 
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.toUpperCase()); setPinError(false); }}
              placeholder={isCustomerDelivery 
                ? "Enter Cancellation Code" 
                : "Enter 8-digit PIN"}
              disabled={isCustomerDelivery ? unableReason !== 'Reject by customer' : false}
              className={`w-full p-3 border rounded-none text-sm font-bold tracking-widest ${(isCustomerDelivery && unableReason !== 'Reject by customer') ? 'bg-gray-100 border-gray-300 text-gray-400' : pinError ? 'border-red-500 bg-red-50' : 'border-black'}`}
            />
            {pinError && <p className="text-red-500 text-[10px] font-medium mt-1">
              {isCustomerDelivery 
                ? 'incorrect cancellation code' 
                : 'incorrect pickup pin'}
            </p>}
          </div>
        )}

        
                {/* Digital Signature */}
        <div className="border border-black p-0 bg-white h-32 relative w-full">
          {!signatureData && <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none"><PenTool size={24} className="mb-2 opacity-50" /><span className="text-xs font-bold">Digital Signature</span></div>}
          <canvas 
             ref={canvasRef}
             onMouseDown={startDrawing}
             onMouseUp={stopDrawing}
             onMouseOut={stopDrawing}
             onMouseMove={draw}
             onTouchStart={startDrawing}
             onTouchEnd={stopDrawing}
             onTouchMove={draw}
             className="w-full h-full cursor-crosshair relative z-10 touch-none"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 md:gap-3 text-xs font-bold items-center border border-black p-2 bg-white">
           <span className="text-slate-600">Select:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
             <input type="radio" name="signatory" value="Self" onChange={() => setSignatory('Self')} className="accent-black" /> Self
           </label>
           <label className="flex items-center gap-1 cursor-pointer">
             <input type="radio" name="signatory" value="Seller" onChange={() => setSignatory('Seller')} className="accent-black" /> Seller
           </label>
           <label className="flex items-center gap-1 cursor-pointer">
             <input type="radio" name="signatory" value="Customer" onChange={() => setSignatory('Customer')} className="accent-black" /> Customer
           </label>
           <label className="flex items-center gap-1 cursor-pointer">
             <input type="radio" name="signatory" value="Other" onChange={() => setSignatory('Other')} className="accent-black" /> Other
           </label>
        </div>

        {/* Unable Options */}
        {showUnableOptions && (
          <div className="p-4 border border-red-200 bg-red-50 space-y-3">
            <h4 className="text-xs font-bold text-red-800 uppercase">Reason for Unable to Complete</h4>
            {['no response', 'not attend', 'reschedule'].map((reason) => (
              <div 
                key={reason} 
                onClick={() => setUnableReason(unableReason === reason ? '' : reason)}
                className="flex items-center gap-3 p-3 border border-black bg-white cursor-pointer rounded-none"
              >
                <div className={`w-4 h-4 rounded-full border border-black flex items-center justify-center shrink-0 ${unableReason === reason ? 'bg-white' : ''}`}>
                  {unableReason === reason && <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>}
                </div>
                <span className="text-xs font-bold">{reason}</span>
              </div>
            ))}
          </div>
        )}

        

        {/* BOTTOM ACTIONS (Shifted below signature instead of fixed) */}
        <div className="flex flex-col gap-3 mt-4 mb-8">
          {showUnableOptions ? (
            <button 
              onClick={handleUnableSubmit}
              disabled={!unableReason || loading}
              className={`w-full h-[48px] min-h-[48px] max-h-[48px] rounded-none font-bold text-sm transition-all border flex items-center justify-center shrink-0 box-border ${unableReason ? 'bg-red-600 text-white border-red-600' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
            >
              {loading ? 'Processing...' : 'Mark Done'}
            </button>
          ) : (
            <>
              <button 
                onClick={handleMarkAsDone}
                disabled={!isAllFilled || loading}
                className={`w-full h-[48px] min-h-[48px] max-h-[48px] rounded-none font-bold text-sm flex items-center justify-center gap-2 transition-colors border shrink-0 box-border ${isAllFilled ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700' : 'border-gray-300 bg-gray-100 text-gray-400'}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-1.5 h-4">
                    {[0, 150, 300, 450, 600].map((delay, index) => (
                      <div
                        key={index}
                        className="w-2 h-2 rounded-full animate-bounce bg-white"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <CheckCircle2 size={18} />
                )}
                <span>{loading ? 'Processing...' : 'Mark as Done'}</span>
              </button>
              
              <button 
                onClick={() => setShowUnableOptions(true)}
                className="w-full h-[44px] min-h-[44px] max-h-[44px] rounded-none border border-red-600 text-red-600 font-bold text-sm bg-white hover:bg-red-50 flex items-center justify-center shrink-0 box-border"
              >
                Unable to Complete
              </button>
            </>
          )}
        </div>
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col">
          <div className="p-4 bg-black flex justify-between items-center text-white">
            <span className="font-bold text-lg">Scan AWB Barcode</span>
            <button onClick={stopScanner} className="p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden bg-black">
            <div id="awb-reader" className="w-full max-w-sm mx-auto bg-black" />
          </div>
        </div>
      )}

      {fullScreenImages && fullScreenImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center overflow-hidden" 
          onClick={() => setFullScreenImages(null)}
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={() => {
            if (!touchStart || !touchEnd) return;
            const distance = touchStart - touchEnd;
            if (distance > 50 && fullScreenIndex < fullScreenImages.length - 1) {
              setFullScreenIndex(prev => prev + 1);
            } else if (distance < -50 && fullScreenIndex > 0) {
              setFullScreenIndex(prev => prev - 1);
            }
            setTouchStart(null);
            setTouchEnd(null);
          }}
        >
          <button className="absolute top-4 right-4 text-white p-2 font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl z-10">&times;</button>
          <div className="text-white absolute top-4 left-4 font-bold bg-black/50 px-3 py-1 rounded-full z-10 text-sm">
            {fullScreenIndex + 1} / {fullScreenImages.length}
          </div>
          
          {fullScreenIndex > 0 && (
             <button 
               onClick={(e) => { e.stopPropagation(); setFullScreenIndex(prev => prev - 1); }}
               className="absolute left-2 top-1/2 -translate-y-1/2 text-white p-2 font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center z-10"
             >
               &lt;
             </button>
          )}
          
          <img src={fullScreenImages[fullScreenIndex]} alt="Full Screen" className="w-full h-auto max-h-[90vh] object-contain shrink-0 transition-opacity duration-300" />
          
          {fullScreenIndex < fullScreenImages.length - 1 && (
             <button 
               onClick={(e) => { e.stopPropagation(); setFullScreenIndex(prev => prev + 1); }}
               className="absolute right-2 top-1/2 -translate-y-1/2 text-white p-2 font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center z-10"
             >
               &gt;
             </button>
          )}
        </div>
      )}
          
    </div>
  );
};



export const CustomerDeliveryScanView = ({ group, onBack, onStart, sellersInfo }: { group: any, onBack: () => void, onStart: (task: any) => void, sellersInfo?: any }) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentTimer, setPaymentTimer] = useState(300);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);



  const startPaymentTimer = () => {
     setPaymentTimer(300);
     if (timerIntervalId) clearInterval(timerIntervalId);
     const id = setInterval(() => {
        setPaymentTimer(prev => {
           if (prev <= 1) {
              clearInterval(id);
              setShowQRModal(false);
              return 0;
           }
           return prev - 1;
        });
     }, 1000);
     setTimerIntervalId(id);
  };

  useEffect(() => {
     return () => {
        if (timerIntervalId) clearInterval(timerIntervalId);
     };
  }, [timerIntervalId]);

  const [awbList, setAwbList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [localUpdates, setLocalUpdates] = useState<Record<string, any>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState('Cash Payment');
  const [isVisualOnlinePaymentEnabled, setIsVisualOnlinePaymentEnabled] = useState(false);

  const isPickupGroup = group.firstTask ? (group.firstTask['shipment type']?.toLowerCase().replace(/\s+/g, ' ').includes('pickup') || group.firstTask['shipment tag']?.toLowerCase().replace(/\s+/g, ' ').includes('pickup')) : !!group.pickupIds;
  const isSellerDeliveryGroup = group.firstTask ? group.firstTask['shipment tag']?.toLowerCase().replace(/\s+/g, ' ').includes('seller delivery') : !!group.isSellerDelivery;

  useEffect(() => {
    const fetchAwbs = async () => {
      setLoading(true);
      const taskIds = group.tasks?.map((t: any) => t.id) || [];
      if (taskIds.length === 0) { setLoading(false); return; }
      
      const { data } = await supabase
        .from('accepted_shipments')
        .select('*')
        .in('id', taskIds);
      
      if (data) {
        setAwbList(data);
      }
      
      const saved = localStorage.getItem('rider_visual_online_payment');
      setIsVisualOnlinePaymentEnabled(saved ? JSON.parse(saved) : false);
      
      setLoading(false);
    };
    fetchAwbs();
  }, [group]);

  // Calculate total amount conditionally based on the column and seller delivery flag
  const totalAmount = isSellerDeliveryGroup ? 0 : awbList.reduce((sum, item) => {
    const isPrepaid = (item['payment method'] || '').toLowerCase() === 'prepaid';
    return sum + (isPrepaid ? 0 : (Number(item['total amount']) || 0));
  }, 0);
  
  const hasAnyDelivered = awbList.some(task => localUpdates[task.id]?.type === 'pass');
  const isPaymentValid = !hasAnyDelivered || (selectedPaymentType === 'Online Payment' ? paymentSuccess : true);
  const isAllBoxesFilled = awbList.length > 0 && awbList.every(task => localUpdates[task.id]) && isPaymentValid;

  useEffect(() => {
    let channel: any;
    if (showQRModal) {
      channel = supabase.channel('riders_setting_updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'riders_setting' },
          (payload: any) => {
             if (payload.new && payload.new.attendence) {
                setQrCodeUrl(payload.new.attendence);
             }
             if (payload.new && payload.new['text setting']) {
                const status = payload.new['text setting'].toLowerCase();
                if (status === 'success' || status === 'successful') {
                   setPaymentStatus('success');
                   setPaymentSuccess(true);
                   if (timerIntervalId) clearInterval(timerIntervalId);
                   setTimeout(() => {
                       setShowQRModal(false);
                       handleFinish();
                   }, 1000);
                } else if (status === 'failed' || status === 'fail') {
                   setPaymentStatus('failed');
                   setPaymentSuccess(false);
                } else {
                   setPaymentStatus('pending');
                }
             }
          }
        )
        .subscribe();
    }
    return () => {
       if (channel) {
          supabase.removeChannel(channel);
       }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRModal, timerIntervalId, localUpdates]);

  const handleTakePayment = async () => {
     try {
        const { data: settingData } = await supabase.from('riders_setting').select('attendence, "text setting"').limit(1).maybeSingle();
        let qrUrl = settingData?.attendence || '';
        
        // Ensure some fallback if not set to avoid broken image, but user says it comes from db
        if (!qrUrl) {
            qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=pending';
        }
        
        setQrCodeUrl(qrUrl);
        setShowQRModal(true);
        setPaymentSuccess(false);
        setPaymentStatus('pending');
        startPaymentTimer();
     } catch(e) {
        alert("Could not load payment QR");
     }
  };

  const handleCheckPayment = async () => {
     setCheckingPayment(true);
     try {
        const { data: settingData } = await supabase.from('riders_setting').select('"text setting"').limit(1).maybeSingle();
        const statusText = settingData?.['text setting']?.toLowerCase() || '';
        
        if (statusText === 'success' || statusText === 'successful') {
           setPaymentStatus('success');
           setPaymentSuccess(true);
           if (timerIntervalId) clearInterval(timerIntervalId);
           setTimeout(() => {
               setShowQRModal(false);
               handleFinish();
           }, 1000);
        } else if (statusText === 'failed' || statusText === 'fail') {
           setPaymentStatus('failed');
           setPaymentSuccess(false);
           alert("Payment Failed. Please try again.");
           if (timerIntervalId) clearInterval(timerIntervalId);
           setShowQRModal(false);
        } else {
           alert("Payment is still pending.");
           setPaymentStatus('pending');
        }
     } catch (e) {
        alert("Error checking payment status.");
     } finally {
        setCheckingPayment(false);
     }
  };
  
  const handleCloseQRModal = () => {
     if (timerIntervalId) clearInterval(timerIntervalId);
     setShowQRModal(false);
     if (paymentStatus !== 'success') {
         setPaymentSuccess(false);
     }
  };

  const handleFinish = async () => {
     if (!isAllBoxesFilled) {
         return;
     }
     setIsFinishing(true);
     try {
         for (const task of awbList) {
             const update = localUpdates[task.id];
             if (!update) continue;
             
             let riderName = 'Unknown';
             let riderId = task['Rider id'] || '';
             if (riderId) {
                const { data: riderData } = await supabase.from('riders').select('rider_name').eq('id', riderId).maybeSingle();
                if (riderData && riderData.rider_name) riderName = riderData.rider_name;
             }
             let hubName = 'Unknown';
             let hubManager = 'Unknown';
             let hubId = task['hub manager id'] || '';
             if (hubId) {
                const { data: hubData } = await supabase.from('hub_managers').select('hub_name, manager_name').eq('id', hubId).maybeSingle();
                if (hubData) {
                   if (hubData.hub_name) hubName = hubData.hub_name;
                   if (hubData.manager_name) hubManager = hubData.manager_name;
                }
             }
             
             const currentOrderStatus = task['order status'] || '';
             const currentShipmentStatus = task['shipment status'] || '';
             const currentCallDetails = task['call details'] || '';
             
             if (update.type === 'pass' || update.type === 'fail') {
                 const awb = isPickupGroup ? await generateUniqueAwb() : task['awb number'];
                 const actualCallCount = (currentCallDetails.match(/Call button clicked/g) || []).length;
                 const newCallDetails = currentCallDetails + `\nCall attempt: ${actualCallCount}, Call duration: 00:00, Call recording - ${update.dateStr}`;
                 
                 if (update.type === 'pass') {
                     const orderUpdateLine = isPickupGroup 
                        ? `Your order has been picked up successfully on ${update.dateStr} - Order ID: ${task['order ID']}`
                        : `Your order has been delivered successfully on ${update.dateStr} - Order ID: ${task['order ID']}`;
                     
                     const shipmentUpdateLine = isPickupGroup
                        ? `Order Picked up AWB Number: ${awb} by ${riderName} (ID: ${riderId}) on ${update.dateStr}`
                        : `Order delivered on ${update.dateStr} by Rider: ${riderName}, Hub: ${hubName} (Hub Manager: ${hubManager})`;
                        
                     const newOrderStatus = currentOrderStatus + (currentOrderStatus ? '\n' : '') + orderUpdateLine;
                     const newShipmentStatus = currentShipmentStatus + (currentShipmentStatus ? '\n' : '') + shipmentUpdateLine;
                     const normShipType = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
                     const normShipTag = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
                     const isEligibleResetAttempt = (
                         (normShipType === 'out for pickup' && (normShipTag === 'seller pickup' || normShipTag === 'customer pickup')) ||
                         (normShipType === 'out for delivery' && (normShipTag === 'seller delivery' || normShipTag === 'customer delivery'))
                     );

                     const payload: any = {
                         'shipment type': isPickupGroup ? 'picked up' : 'delivered',
                         'awb number': awb,
                         'pickup pin': '',
                         'call details': newCallDetails,
                         'digital signature': update.sigBase64 ? (update.signatory ? `${update.sigBase64}|||Selected Option: ${update.signatory}` : update.sigBase64) : ''
                     };

                     if (isEligibleResetAttempt) {
                         payload['attempt'] = null;
                     }
                     
                     if ((task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim() === 'out for delivery' && (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim() === 'customer delivery') {
                         let calculatedDays = 1;
                         payload['days'] = calculatedDays;
                         payload['created_at'] = new Date().toISOString();
                         const orderId = task['order ID'] || task['order_id'];
                         const sId = task['seller id'] || task['selller id'];
                         const prodId = task['product id'];
                         if (orderId) {
                             supabase.from('selller_income_estimate').select('id').eq('order id', orderId).maybeSingle().then(async ({ data: existingEst }) => {
                                 if (existingEst) {
                                     await supabase.from('selller_income_estimate').update({ days: calculatedDays, created_at: payload['created_at'] }).eq('id', existingEst.id);
                                 } else {
                                     try {
                                         const sp = parseFloat(task['total selling price']) || parseFloat(task['total amount']) || 0;
                                         const dc = parseFloat(task['total delevery charge']) || 0;
                                         const gd = parseFloat(task['gift cash donation']) || 0;
                                         const { data: adminData } = await supabase.from('seller_estimated_earning').select('*').limit(1).maybeSingle();
                                         const adminCharges = adminData ? [
                                             { name: 'Referral Fee', value: adminData['Referral Fee'] || '0', isPercentage: true },
                                             { name: 'Closing Fee', value: adminData['Closing Fee'] || '0', isPercentage: false },
                                             { name: 'COD Fee', value: adminData['COD Fee'] || '0', isPercentage: false },
                                             { name: 'Shipping Fee', value: adminData['Shipping Fee'] || '0', isPercentage: false },
                                             { name: 'C-GST', value: adminData['C-GST'] || '0', isPercentage: true },
                                             { name: 'S-GST', value: adminData['S-GST'] || '0', isPercentage: true },
                                             { name: 'TDS charge', value: adminData['TDS charge'] || '0', isPercentage: true },
                                             { name: 'TCS charge', value: adminData['TCS charge'] || '0', isPercentage: true },
                                         ] : [];
                                         const totalSellerEarning = sp + dc;
                                         let basePlatformEarning = 0;
                                         const chargesWithBaseAmount = adminCharges.map(charge => {
                                             const isTax = charge.name.toUpperCase().includes('GST') || charge.name.toUpperCase().includes('TDS') || charge.name.toUpperCase().includes('TCS');
                                             const val = parseFloat(charge.value) || 0;
                                             let amount = 0;
                                             if (!isTax) {
                                                 amount = charge.isPercentage ? (sp * val) / 100 : val;
                                                 basePlatformEarning += amount;
                                             }
                                             return { ...charge, val, isTax, amount };
                                         });
                                         let platformTotal = 0;
                                         chargesWithBaseAmount.forEach(charge => {
                                             let finalAmount = charge.amount;
                                             if (charge.isTax) {
                                                 finalAmount = charge.isPercentage ? (basePlatformEarning * charge.val) / 100 : charge.val;
                                             }
                                             platformTotal += finalAmount;
                                         });
                                         const totalPlatformEstimate = platformTotal + gd;
                                         const finalPayable = totalSellerEarning - totalPlatformEstimate;
                                         await supabase.from('selller_income_estimate').insert([{
                                             "admin id": task['admin id'] || '',
                                             "seller id": sId || '',
                                             "order id": orderId,
                                             "product id": prodId || '',
                                             "awb number": task['awb number'] || '',
                                             "total earning amount": totalSellerEarning.toFixed(2),
                                             "total platform estimate": totalPlatformEstimate.toFixed(2),
                                             "final payable amount": finalPayable.toFixed(2),
                                             "payout status": "Pending",
                                             "days": calculatedDays,
                                             "created_at": payload['created_at']
                                         }]);
                                     } catch (e) {
                                         console.error("Error inserting selller_income_estimate on delivery", e);
                                     }
                                 }
                             });
                         }
                     }
                     
                     payload['shipment status'] = await buildShipmentStatus(shipmentUpdateLine, task, payload);
                     if (payload['shipment type'] === 'delivered' && (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim() === 'customer delivery') {
                     }
                     if (update.capturedImage) {
                         payload['captured images'] = task['captured images'] ? task['captured images'] + '|||' + update.capturedImage : update.capturedImage;
                     }
                     if (!isPickupGroup) {
                         payload['payment type'] = selectedPaymentType.toLowerCase();
                         payload['payment method'] = selectedPaymentType.toLowerCase();
                     }
                     await updateAcceptedShipment(payload, task.id, task);
                     
                     const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', task['order ID']);
                     if (coRows && coRows.length > 0) {
                        let targetRow = coRows.find(r => r['awb number'] === task['awb number']);
                        if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
                        if (!targetRow) targetRow = coRows[0];
                        const currentCoStatus = targetRow['order status'] || '';
                        
                        const coPayload: any = { 
                           'process type': 'order updated', 
                           'awb number': awb 
                        };
                        if (!isPickupGroup) {
                           coPayload['payment method'] = selectedPaymentType.toLowerCase();
                        }
                        if (payload['shipment type'] === 'delivered' && (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim() === 'customer delivery') {
                           coPayload['days'] = 1;
                           coPayload['created_at'] = payload['created_at'] || new Date().toISOString();
                        }
                        await supabase.from('customer_orders').update(coPayload).eq('id', targetRow.id);
                     }
                 } else {
                     const orderUpdateLine = isPickupGroup
                        ? `` // Intentionally left blank for seller pickups
                        : `Your order has been cancelled on ${update.dateStr}`;
                     
                     const shipmentUpdateLine = isPickupGroup
                        ? `QC Failed Pickup on ${update.dateStr} by Rider: ${riderName}`
                        : `Failed delivery on ${update.dateStr} by Rider: ${riderName}, Hub: ${hubName} (Hub Manager: ${hubManager})`;
                     
                     const newOrderStatus = currentOrderStatus + (currentOrderStatus ? '\n' : '') + orderUpdateLine;
                     const newShipmentStatus = currentShipmentStatus + (currentShipmentStatus ? '\n' : '') + shipmentUpdateLine;
                     
                     const currentAttempt = parseInt(task['attempt'] || '0');
                     let newShipType = isPickupGroup ? 'faild pickup' : 'faild delivery';
                     let newShipTag = task['shipment tag'];
                     if (task['shipment type'] === 'out for pickup' && task['shipment tag'] === 'customer pickup') {
                         newShipType = 'return pickup faild';
                         newShipTag = 'customer pickup';
                     }
                     const payload: any = {
                         'shipment type': newShipType,
                         'shipment tag': newShipTag,
                         'awb number': awb,
                         'call details': newCallDetails,
                         'digital signature': update.sigBase64 ? (update.signatory ? `${update.sigBase64}|||Selected Option: ${update.signatory}` : update.sigBase64) : ''
                     };
                     const normShipTypeFail = (task['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
                     const normShipTagFail = (task['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
                     const isEligibleResetAttemptFail = (
                         (normShipTypeFail === 'out for pickup' && (normShipTagFail === 'seller pickup' || normShipTagFail === 'customer pickup')) ||
                         (normShipTypeFail === 'out for delivery' && (normShipTagFail === 'seller delivery' || normShipTagFail === 'customer delivery'))
                     );
                     if (isEligibleResetAttemptFail) {
                         payload['attempt'] = null;
                     }
                     payload['shipment status'] = await buildShipmentStatus(shipmentUpdateLine, task, payload);
                     if (update.capturedImage) {
                         payload['captured images'] = task['captured images'] ? task['captured images'] + '|||' + update.capturedImage : update.capturedImage;
                     }
                     await updateAcceptedShipment(payload, task.id, task);
                     
                     const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', task['order ID']);
                     if (coRows && coRows.length > 0) {
                        let targetRow = coRows.find(r => r['awb number'] === task['awb number']);
                        if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
                        if (!targetRow) targetRow = coRows[0];
                        const currentCoStatus = targetRow['order status'] || '';
                        /* disabled customer_orders update */
                     }
                 }
             } else if (update.type === 'unable') {
                 const rawReason = String(update.reason || '').trim().toLowerCase();
                 let type = rawReason;
                 if (rawReason === 'no response') type = 'no response';
                 else if (rawReason === 'not attend') type = 'not attend';
                 else if (rawReason === 'reschedule') type = 'reschedule';
                 
                 const statusPrefix = type;
                 const dateStr = new Date().toLocaleString('en-IN');
                 
                 const awb = isPickupGroup ? (task['awb number'] || await generateUniqueAwb()) : task['awb number'];
                 const actualCallCount = (currentCallDetails.match(/Call button clicked/g) || []).length;
                 const newCallDetails = currentCallDetails + `\nCall attempt: ${actualCallCount}, Call duration: 00:00, Call recording - ${dateStr}`;
                 
                 const shipmentUpdateLine = isPickupGroup 
                    ? `${statusPrefix} by ${riderName} (ID: ${riderId}) on ${dateStr}`
                    : `${statusPrefix} on ${dateStr} by Rider: ${riderName}, Hub: ${hubName} (Hub Manager: ${hubManager})`;
                    
                 const payload: any = {
                   'shipment type': type,
                   'awb number': awb,
                   'call details': newCallDetails
                 };
                 payload['shipment status'] = await buildShipmentStatus(shipmentUpdateLine, task, payload);
                 await updateAcceptedShipment(payload, task.id, task);
             }
         }
         
         if (!isPickupGroup) {
             const passedTasks = awbList.filter(t => localUpdates[t.id]?.type === 'pass');
             if (passedTasks.length > 0) {
                 const firstTask = passedTasks[0];
                 const dateStr = new Date().toLocaleString('en-IN');
                 let rName = 'Unknown';
                 const rId = firstTask['Rider id'] || '';
                 if (rId) {
                     const { data: rData } = await supabase.from('riders').select('rider_name').eq('id', rId).maybeSingle();
                     if (rData && rData.rider_name) rName = rData.rider_name;
                 }
                 
                 const paymentStatusLines = passedTasks.map(t => {
                     const amt = Number(t['total amount']) || 0;
                     return `AWB: ${t['awb number']}, Order ID: ${t['order ID']}, Date: ${dateStr}, Rider: ${rName} (ID: ${rId}), Amount: ₹${amt}`;
                 });
                 const paymentStatusStr = paymentStatusLines.join('\n');
                 
                 const pwrPayload: any = {
                     'rider id': rId
                 };
                 
                 if (selectedPaymentType === 'Cash Payment') {
                     pwrPayload['cash payment status'] = paymentStatusStr;
                     pwrPayload['total cash payment'] = String(totalAmount);
                     const { error: cwrInsErr } = await supabase.from('cash_with_riders').insert(pwrPayload);
                     if (cwrInsErr && cwrInsErr.code !== '42703') console.error("Error inserting cash_with_riders:", cwrInsErr);
                 } else {
                     pwrPayload['online payment status'] = paymentStatusStr;
                     pwrPayload['total online payment'] = String(totalAmount);
                     const { error: cwrInsErr } = await supabase.from('cash_with_riders').insert(pwrPayload);
                     if (cwrInsErr && cwrInsErr.code !== '42703') console.error("Error inserting cash_with_riders:", cwrInsErr);
                 }
                 
             }
         }
         
         onBack();
     } catch(e) {
         console.error(e);
         alert("Error saving: " + ((e as any).message || JSON.stringify(e)));
     } finally {
         setIsFinishing(false);
     }
  };

  if (selectedTask) {
     return <TaskDetailView 
         task={selectedTask} 
         seller={isPickupGroup ? (sellersInfo ? sellersInfo[selectedTask['selller id']] : {}) : {}} 
         onBack={() => setSelectedTask(null)}
         isHubView={false}
         onLocalUpdate={(result) => {
             setLocalUpdates(prev => ({ ...prev, [selectedTask.id]: result }));
             setSelectedTask(null);
         }}
     />;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#fafafa] flex flex-col font-poppins text-black h-[100dvh]">
      <div className="flex items-center p-3 h-14 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
        <button onClick={onBack} className="p-2 -ml-2 bg-transparent text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-sm font-bold ml-2">Shipment Overview</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header Details */}
        <div className="bg-white border border-black p-4 shadow-sm flex flex-col gap-2 rounded-none">
          <h4 className="text-base font-bold text-slate-800">
            {group.shopName ? `${group.shopName} - ` : ''}{group.sellerName}
          </h4>
          <p className="text-sm text-gray-800 font-medium leading-relaxed">
            {group.address || 'Unknown Address'}
            {group.landmark ? `, ${group.landmark}` : ''}
            {group.pincode ? `, ${group.pincode}` : ''}
          </p>
        </div>
        
        {/* Order / Pickup ID and QTY */}
        <div className="flex items-center gap-2 w-full">
          <div className="bg-black text-white px-4 py-2.5 text-sm font-bold rounded-none flex gap-2 overflow-x-auto no-scrollbar flex-1 uppercase tracking-wider">
            {Array.from(isPickupGroup ? (group.pickupIds || []) : (group.orderIds || [])).map((id: any) => (
              <span key={id} className="shrink-0">{isPickupGroup ? 'Pickup ID:' : 'Order ID:'} {id}</span>
            ))}
          </div>
          <div className="bg-white border border-black text-black px-4 py-2.5 text-sm font-bold rounded-none shrink-0 whitespace-nowrap uppercase tracking-wider ml-auto">
            QTY: {awbList.reduce((sum, item) => sum + (parseInt(item['total quantity'] || item.quantity || '1', 10)), 0)}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <FiveDotLoader colorClass="bg-black" />
          </div>
        ) : awbList.length > 0 ? (
          <div className="space-y-4">
            {awbList.map((s, idx) => (
              <div key={s.id || idx} className="flex flex-col gap-2">
                <div className="flex items-stretch gap-2 h-10">
                  <div className="border border-black px-3 flex items-center justify-center text-sm font-bold text-black rounded-none flex-1 truncate bg-white">
                    {isPickupGroup ? (s['pickup ID'] || s['order ID'] || s['awb number'] || `Pickup ${idx+1}`) : s['awb number']}
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={localUpdates[s.id] ? (localUpdates[s.id].type === 'pass' ? 'PASS' : localUpdates[s.id].type === 'fail' ? 'FAIL' : localUpdates[s.id].reason) : ''}
                    className="border border-black px-2 w-24 text-sm font-bold rounded-none focus:outline-none bg-white"
                  />
                  <button 
                    onClick={() => setSelectedTask(s)}
                    className="border border-black bg-black text-white px-4 text-sm font-bold uppercase rounded-none shrink-0 active:scale-95 transition-all"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm font-medium border border-black p-4 rounded-none">
            No pending shipments found.
          </div>
        )}
        
        {/* Payment Type Section */}
        {!isPickupGroup && !isSellerDeliveryGroup && awbList.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-300 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase text-slate-800">Payment Type</span>
              <span className="text-base font-bold text-black">₹{totalAmount}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <label className={`flex items-center gap-3 p-3 border rounded-none transition-all ${paymentSuccess && selectedPaymentType === 'Online Payment' ? 'opacity-50 pointer-events-none bg-gray-100' : 'cursor-pointer active:scale-[0.99] bg-white'} ${selectedPaymentType === 'Cash Payment' ? 'border-black' : 'border-gray-200'}`}>
                <input type="radio" name="paymentType" value="Cash Payment" checked={selectedPaymentType === 'Cash Payment'} onChange={(e) => !paymentSuccess && setSelectedPaymentType(e.target.value)} disabled={paymentSuccess && selectedPaymentType === 'Online Payment'} className="w-4 h-4 accent-black" />
                <span className="text-sm font-bold">Cash Payment</span>
              </label>

              {isVisualOnlinePaymentEnabled && group.firstTask && (group.firstTask['shipment type'] || '').trim().toLowerCase() === 'out for delivery' && (group.firstTask['shipment tag'] || '').trim().toLowerCase() === 'customer delivery' && (
                <div className="flex flex-col gap-3 animate-in fade-in">
                  {paymentSuccess && selectedPaymentType === 'Online Payment' ? (
                     <div className="flex items-center justify-between p-3 border border-green-500 bg-green-50 rounded-none animate-in fade-in">
                        <span className="text-sm font-bold text-green-700 flex gap-3 items-center">
                           <CheckCircle2 className="w-4 h-4" />
                           Online Payment
                        </span>
                        <span className="text-sm font-bold text-green-700">Payment Successful</span>
                     </div>
                  ) : (
                     <label className={`flex items-center gap-3 p-3 border rounded-none bg-white cursor-pointer active:scale-[0.99] transition-all ${selectedPaymentType === 'Online Payment' ? 'border-black' : 'border-gray-200'}`}>
                       <input type="radio" name="paymentType" value="Online Payment" checked={selectedPaymentType === 'Online Payment'} onChange={(e) => setSelectedPaymentType(e.target.value)} className="w-4 h-4 accent-black" />
                       <span className="text-sm font-bold">Online Payment</span>
                     </label>
                  )}
                  
                  {selectedPaymentType === 'Online Payment' && !paymentSuccess && (
                    <button 
                      onClick={handleTakePayment}
                      type="button"
                      className="w-full p-3 text-sm font-bold rounded-none transition-all active:scale-[0.99] text-white bg-black hover:bg-gray-900 border border-black animate-in fade-in flex items-center justify-center gap-3"
                    >
                      Take Payment
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <div className="flex gap-3">
          <button 
            onClick={onBack} 
            className="flex-1 py-3.5 text-sm font-bold text-gray-600 border border-gray-400 rounded-none bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleFinish}
            disabled={isFinishing || !isAllBoxesFilled}
            className={`flex-1 py-3.5 text-sm font-bold rounded-none transition-colors ${isAllBoxesFilled ? 'text-blue-600 border border-blue-600 bg-white hover:bg-blue-50' : 'text-gray-400 border border-gray-300 bg-gray-100 cursor-not-allowed disabled:opacity-50'}`}
          >
            {isFinishing ? 'Processing...' : 'Done'}
          </button>
        </div>
      </div>
      
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-sm rounded-none border border-black flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
               <h3 className="font-bold text-slate-800">Scan to Pay</h3>
               <button onClick={handleCloseQRModal} className="p-1 hover:bg-gray-200 rounded-none transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
               </button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center gap-6">
               <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-500">Amount to pay</p>
                  <p className="text-3xl font-bold text-black">₹{totalAmount}</p>
               </div>
               
               <div className="p-2 border-2 border-black bg-white rounded-none">
                  {qrCodeUrl ? (
                     <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48 object-contain" />
                  ) : (
                     <div className="w-48 h-48 bg-gray-100 flex items-center justify-center animate-pulse">
                        <span className="text-xs font-bold text-gray-400">Loading QR...</span>
                     </div>
                  )}
               </div>
               
               <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-none border border-red-200">
                  <span>Expires in:</span>
                  <span className="tabular-nums">{Math.floor(paymentTimer / 60)}:{(paymentTimer % 60).toString().padStart(2, '0')}</span>
               </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
               <button 
                  onClick={handleCheckPayment}
                  disabled={checkingPayment || paymentStatus === 'success'}
                  className="w-full py-3 text-sm font-bold text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
               >
                  {checkingPayment ? 'Checking...' : paymentStatus === 'success' ? 'Payment Successful' : 'Check Payment'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
