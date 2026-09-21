import { CustomSelect } from "./CustomSelect";
import { TermsAndConditionsModal } from "./TermsAndConditionsModal";
import { AnnouncementChatModal } from "./AnnouncementChatModal";
import { RoleChatModal } from "./RoleChatModal";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Added centralized update wrapper
import { syncShipmentStatusToCustomerOrder } from '../../utils/statusUpdater';
const updateAcceptedShipment = async (payload: any, id: string, fullShipmentData: any) => {
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
            '',
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
import { FileText, Package, Activity } from 'lucide-react';

export const RiderDashboardView = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showRoleChatModal, setShowRoleChatModal] = useState(false);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [chatCount, setChatCount] = useState<number>(0);
  const [riderData, setRiderData] = useState<any>(null);
  const [riderClusterId, setRiderClusterId] = useState<string | null>(null);

  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [isSavingSelectedRoute, setIsSavingSelectedRoute] = useState(false);
  const [routeSaved, setRouteSaved] = useState(true);
  const [longPressedRouteId, setLongPressedRouteId] = useState<string | null>(null);
  const [isDeletingRoute, setIsDeletingRoute] = useState(false);
  
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteVillages, setNewRouteVillages] = useState<string[]>(['']);
  
  const [riderRoutes, setRiderRoutes] = useState<any[]>([]);
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  const fetchRiderRoutes = async (rId: string) => {
     try {
        const { data } = await supabase.from('riders_route').select('*').eq('rider id', rId).order('created_at', { ascending: true });
        if (data) {
           setRiderRoutes(data.map(d => {
              let parsedVillages = [];
              try { parsedVillages = JSON.parse(d['route details'] || '[]'); } catch (e) {}
              return { id: d.id, name: d['route name'], villages: parsedVillages };
           }));
        }
     } catch (e) {}
  };

  const handleSaveRoute = async () => {
     if (!newRouteName.trim()) { alert("Please enter route name"); return; }
     const filteredVillages = newRouteVillages.filter(v => v.trim());
     if (filteredVillages.length === 0) { alert("Please enter at least one village"); return; }

     setIsSavingRoute(true);

     let rId = riderData?.id;
     if (!rId) {
        try {
           const stored = localStorage.getItem('portal_auth_rider');
           if (stored) rId = JSON.parse(stored).id;
        } catch (e) {}
     }
     if (!rId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) rId = authData.user.id;
     }

     if (!rId) {
        alert("Rider not found");
        setIsSavingRoute(false);
        return;
     }

     const { error } = await supabase.from('riders_route').insert([{
        "rider id": rId,
        "route name": newRouteName.trim(),
        "route details": JSON.stringify(filteredVillages)
     }]);

     if (!error) {
        await fetchRiderRoutes(rId);
        setShowCreateRoute(false);
        setNewRouteName('');
        setNewRouteVillages(['']);
     } else {
        alert("Error saving route");
     }
     setIsSavingRoute(false);
  };

  const handleDeleteRoute = async () => {
     if (!longPressedRouteId) return;
     
     setIsDeletingRoute(true);
     const { error } = await supabase.from('riders_route').delete().eq('id', longPressedRouteId);
     
     if (!error) {
         setRiderRoutes(prev => prev.filter(r => r.id !== longPressedRouteId));
         setLongPressedRouteId(null);
         if (selectedRouteId === longPressedRouteId) {
            setSelectedRouteId('');
         }
     }
     setIsDeletingRoute(false);
  };
  
  useEffect(() => {
    if (riderData?.id) {
      supabase.from('announcement_and_update').select('*', {count: 'exact', head: true}).not('rider_update', 'is', null).neq('rider_update', '').then(({count}) => {
        if (count !== null) setUpdateCount(count);
      });
      supabase.from('chat_for_riders').select('*', {count: 'exact', head: true}).eq('rider_id', riderData.id).not('message', 'is', null).then(({count}) => {
        if (count !== null) setChatCount(count);
      });
    }
  }, [riderData?.id]);
  useEffect(() => {
    let rId = null;
    const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_rider') : null;
    if (localData) {
      const data = JSON.parse(localData);
      setRiderData(data);
      rId = data.id;
      if (data?.registered_pincode) {
        supabase.from('added_pincode').select('"cluster id"').eq('added pincode', data.registered_pincode).single().then(({data}) => {
          if (data && data['cluster id']) setRiderClusterId(data['cluster id']);
        });
      }
    }
    
    if (rId) {
       fetchRiderRoutes(rId);
    } else {
       supabase.auth.getUser().then(({ data }) => {
          if (data?.user) fetchRiderRoutes(data.user.id);
       });
    }
  }, []);
  const [pickupsheets, setPickupsheets] = useState<any[]>([]);
  const [allPicDlvCount, setAllPicDlvCount] = useState(0);
  const [pickupCount, setPickupCount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [totalCashCollected, setTotalCashCollected] = useState(0);
  const [dynamicEarning, setDynamicEarning] = useState(0);
  const [isMultipleQtyHalfRate, setIsMultipleQtyHalfRate] = useState(false);
  const [isPerformanceBasedRate, setIsPerformanceBasedRate] = useState(false);
  const [todayWork, setTodayWork] = useState({ totalOrder: 0, totalPickup: 0, totalDelivery: 0, earning: 0, cashCollected: 0, baseEarning: 0, extraQtyEarning: 0 });

  useEffect(() => {
    let currentRiderId = null;
    let ignore = false;
    let debounceTimer: any;
    let channel: any = null;

    const fetchPickupsheets = async () => {
      let riderId = null;
      try {
        const stored = localStorage.getItem('portal_auth_rider');
        if (stored) {
          riderId = JSON.parse(stored).id;
        }
      } catch (e) {}

      if (!riderId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) riderId = authData.user.id;
      }

      if (riderId && !ignore) {
        const { data: liveCheck } = await supabase.from('rider_live_work_flow').select('id').eq('rider_id', riderId).maybeSingle();

        // Fetch all Pic & Dlv count
        const { count: allPicCount } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact', head: true })
          .eq('Rider id', riderId)
          .not('shipment type', 'in', '("ready to pickup","shipped","received at hub","dispatched")');
        
        if (ignore) return;

        // Fetch Picked up count and data
        const { count: pickedCount, data: pickedData } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact' })
          .eq('Rider id', riderId)
          .ilike('shipment type', '%picked up%');
        
        if (ignore) return;

        // Fetch delivered count and data
        const { count: delCount, data: delData } = await supabase
          .from('accepted_shipments')
          .select('*', { count: 'exact' })
          .eq('Rider id', riderId)
          .ilike('shipment type', '%delivered%');

        if (ignore) return;

        // Calculate Today's Work logic
        let pickupRate = 0;
        let deliveryRate = 0;
        
        let globalMultipleQtyHalfRate = false;
        let globalPerformanceBasedRate = false;
        try {
            // First get the rider's cluster_id
            const { data: riderInfo } = await supabase.from('riders').select('cluster_id').eq('id', riderId).limit(1).maybeSingle();
            const riderClusterId = riderInfo?.cluster_id;

            let foundClusterSetting = false;

            if (riderClusterId) {
                const { data: clusterData } = await supabase.from('rider_rate_setting_with_cluster').select('*').eq('cluster id', riderClusterId).limit(1).maybeSingle();
                if (clusterData) {
                    globalMultipleQtyHalfRate = clusterData['multiple quantity half rate'] || false;
                    globalPerformanceBasedRate = clusterData['performance based proportional rate'] || false;
                    foundClusterSetting = true;
                }
            }

            if (!foundClusterSetting) {
                const { data: globalSettingData } = await supabase.from('rider_rate_setting').select('*').limit(1).maybeSingle();
                if (globalSettingData) {
                    globalMultipleQtyHalfRate = globalSettingData['multiple quantity half rate'] || false;
                    globalPerformanceBasedRate = globalSettingData['performance based proportional rate'] || false;
                }
            }
            
            const { data: globalData } = await supabase.from('active_service_rate').select('*').limit(1).maybeSingle();
            const { data: specificData } = await supabase.from('rider_service_rates').select('*').eq('rider_id', riderId).limit(1).maybeSingle();
            
            pickupRate = Number(specificData ? (specificData.pickup_rate || 0) : (globalData?.pickup_rate || 0));
            deliveryRate = Number(specificData ? (specificData.delivery_rate || 0) : (globalData?.delivery_rate || 0));
            
            setIsMultipleQtyHalfRate(globalMultipleQtyHalfRate);
            setIsPerformanceBasedRate(globalPerformanceBasedRate);
        } catch(e) {}

        if (ignore) return;
        
        let totalPickupEarning = 0;
        if (pickedData) {
            if (globalMultipleQtyHalfRate) {
                const groupedPickups = {};
                pickedData.forEach(ship => {
                    const pId = ship['pickup ID'] || ship.id;
                    if (!groupedPickups[pId]) groupedPickups[pId] = [];
                    groupedPickups[pId].push(ship);
                });
                
                Object.values(groupedPickups).forEach((ships: any) => {
                    totalPickupEarning += pickupRate;
                    if (ships.length > 1) {
                        totalPickupEarning += pickupRate * 0.5 * (ships.length - 1);
                    }
                });
            } else {
                totalPickupEarning = pickedData.length * pickupRate;
            }
        }

        let totalDeliveryEarning = 0;
        if (delData) {
            if (globalMultipleQtyHalfRate) {
                const groupedDeliveries: any = {};
                delData.forEach(ship => {
                    const oId = ship['order ID'] || ship.id;
                    if (!groupedDeliveries[oId]) groupedDeliveries[oId] = [];
                    groupedDeliveries[oId].push(ship);
                });
                
                Object.values(groupedDeliveries).forEach((ships: any) => {
                    totalDeliveryEarning += deliveryRate;
                    if (ships.length > 1) {
                        totalDeliveryEarning += deliveryRate * 0.5 * (ships.length - 1);
                    }
                });
            } else {
                totalDeliveryEarning = delData.length * deliveryRate;
            }
        }
        
        const dateKey = new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
        const storageKey = 'rider_' + riderId + '_work_' + dateKey;
        
        let stats = {
          totalOrder: 0, totalPickup: 0, totalDelivery: 0, earning: 0, cashCollected: 0,
          lastActiveCount: 0, seenPickedIds: [], seenDeliveredIds: [],
          seenPickupGroups: {}, seenDeliveryGroups: {},
          baseEarning: 0, extraQtyEarning: 0
        };
        try {
           const storedStr = localStorage.getItem(storageKey);
           if (storedStr) {
             const parsed = JSON.parse(storedStr);
             stats = { ...stats, ...parsed };
             stats.earning = Number(stats.earning) || 0;
             stats.baseEarning = Number(stats.baseEarning) || 0;
             stats.extraQtyEarning = Number(stats.extraQtyEarning) || 0;
             stats.seenPickupGroups = parsed.seenPickupGroups || {};
             stats.seenDeliveryGroups = parsed.seenDeliveryGroups || {};
             
             if (parsed.earning && !parsed.baseEarning) {
               stats.baseEarning = Number(parsed.earning);
             }
           }
        } catch(e) {}

        if (!liveCheck) {
            stats = {
              totalOrder: 0, totalPickup: 0, totalDelivery: 0, earning: 0, cashCollected: 0,
              lastActiveCount: 0, seenPickedIds: [], seenDeliveredIds: [],
              seenPickupGroups: {}, seenDeliveryGroups: {},
              baseEarning: 0, extraQtyEarning: 0
            };
            try { localStorage.removeItem(storageKey); } catch(e) {}
            if (!ignore) {
                setTodayWork(stats);
                setAllPicDlvCount(0);
                setPickupCount(0);
                setDeliveryCount(0);
                setTotalCashCollected(0);
                setDynamicEarning(0);
            }
        } else {
            if (allPicCount !== null) {
                if (allPicCount > stats.lastActiveCount) {
                    stats.totalOrder += (allPicCount - stats.lastActiveCount);
                }
                stats.lastActiveCount = allPicCount;
            }

            const getShipmentHash = (ship: any) => {
                return [
                    ship['full name'], ship['mobile number'], ship['full address'], ship['pincode'],
                    ship['landmark'], ship['address type'], ship['product image'], ship['product name'],
                    ship['product tittle name'], ship['product discription'], ship['key features'],
                    ship['total quantity'], ship['size'], ship['colour'], ship['weight'], ship['total price info'],
                    ship['total selling price'], ship['total discount'], ship['total delevery charge'],
                    ship['total amount'], ship['payment method'], ship['gift cash donation']
                ].map(v => String(v || '').trim().toLowerCase()).join('||');
            };

            if (pickedData) {
                for (let ship of pickedData) {
                    if (!stats.seenPickedIds.includes(ship.id)) {
                        stats.seenPickedIds.push(ship.id);
                        stats.totalPickup += 1;
                        const qtyStr = ship['total quantity'] || '1';
                        const qty = parseInt(qtyStr) || 1;
                        
                        const pId = getShipmentHash(ship);
                        const currentCount = stats.seenPickupGroups[pId] || 0;
                        stats.seenPickupGroups[pId] = currentCount + qty;
                    }
                }
            }

            if (delData) {
                for (let ship of delData) {
                    if (!stats.seenDeliveredIds.includes(ship.id)) {
                        stats.seenDeliveredIds.push(ship.id);
                        stats.totalDelivery += 1;
                        const paymentType = (ship['payment type'] || ship['payment method'] || '').toLowerCase();
                        if (paymentType === 'cash payment' || paymentType === 'cod') {
                            stats.cashCollected += parseFloat(ship['total amount'] || '0') || 0;
                        }
                        const qtyStr = ship['total quantity'] || '1';
                        const qty = parseInt(qtyStr) || 1;
                        
                        const oId = getShipmentHash(ship);
                        const currentCount = stats.seenDeliveryGroups[oId] || 0;
                        stats.seenDeliveryGroups[oId] = currentCount + qty;
                    }
                }
            }

            let computedEarning = 0;
            let computedBaseEarning = 0;
            let computedExtraQtyEarning = 0;

            if (globalMultipleQtyHalfRate) {
                const pickupGroupsCount = Object.keys(stats.seenPickupGroups || {}).length;
                const totalPickupQty = Number(Object.values(stats.seenPickupGroups || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0));
                
                const deliveryGroupsCount = Object.keys(stats.seenDeliveryGroups || {}).length;
                const totalDeliveryQty = Number(Object.values(stats.seenDeliveryGroups || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0));

                computedBaseEarning += (pickupGroupsCount * pickupRate) + (deliveryGroupsCount * deliveryRate);
                computedExtraQtyEarning += (pickupRate * 0.5 * Math.max(0, totalPickupQty - pickupGroupsCount)) + (deliveryRate * 0.5 * Math.max(0, totalDeliveryQty - deliveryGroupsCount));
                computedEarning = computedBaseEarning + computedExtraQtyEarning;
            } else {
                computedBaseEarning = (stats.totalPickup * pickupRate) + (stats.totalDelivery * deliveryRate);
                computedExtraQtyEarning = 0;
                computedEarning = computedBaseEarning;
            }

            stats.earning = computedEarning;
            stats.baseEarning = computedBaseEarning;
            stats.extraQtyEarning = computedExtraQtyEarning;

            localStorage.setItem(storageKey, JSON.stringify(stats));
            
            if (ignore) return;
            
            setTodayWork(stats);
            setAllPicDlvCount(stats.totalOrder);
            setPickupCount(stats.totalPickup);
            setDeliveryCount(stats.totalDelivery);
            setTotalCashCollected(stats.cashCollected);
            setDynamicEarning(stats.earning);
        }

        // Find pickupsheets and runsheets assigned to this rider
        const { data } = await supabase
          .from('accepted_shipments')
          .select('*')
          .eq('Rider id', riderId)
          .or('"pickupsheet id".not.is.null,"runsheet id".not.is.null');
          
        if (ignore) return;
          
        if (data) {
          const sheetsMap: Record<string, any> = {};
          data.forEach(s => {
            if (s['pickupsheet id'] && (s['shipment type'] || '').toLowerCase().includes('ready to pickup')) {
              if (!sheetsMap[s['pickupsheet id']]) {
                sheetsMap[s['pickupsheet id']] = {
                  pickupId: s['pickupsheet id'],
                  type: 'pickupsheet',
                  shipments: [],
                  date: s.updated_at || s.created_at
                };
              }
              sheetsMap[s['pickupsheet id']].shipments.push(s);
            }
            if (s['runsheet id'] && (s['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim() === 'shipped') {
              if (!sheetsMap[s['runsheet id']]) {
                sheetsMap[s['runsheet id']] = {
                  pickupId: s['runsheet id'],
                  type: 'runsheet',
                  shipments: [],
                  date: s.updated_at || s.created_at
                };
              }
              sheetsMap[s['runsheet id']].shipments.push(s);
            }
          });
          setPickupsheets(Object.values(sheetsMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      }
    };

    // We wait for initial fetch to complete to get the riderId, then subscribe
    const setupRealtime = async () => {
        let riderId = null;
        try {
          const stored = localStorage.getItem('portal_auth_rider');
          if (stored) riderId = JSON.parse(stored).id;
        } catch (e) {}
        if (!riderId) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) riderId = authData.user.id;
        }
        if (!riderId || ignore) return;
        
        channel = supabase.channel('rider_pickups_changes_v2_' + Math.random().toString(36).substring(7))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments', filter: `Rider id=eq.${riderId}` }, payload => {
             clearTimeout(debounceTimer);
             debounceTimer = setTimeout(() => {
                 if (!ignore) fetchPickupsheets();
             }, 100);
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rider_live_work_flow', filter: `rider_id=eq.${riderId}` }, payload => {
             clearTimeout(debounceTimer);
             debounceTimer = setTimeout(() => {
                 if (!ignore) fetchPickupsheets();
             }, 100);
          })
          .subscribe();
    };

    fetchPickupsheets().then(() => {
        if (!ignore) setupRealtime();
    });
      
    return () => {
      ignore = true;
      clearTimeout(debounceTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const [acceptingMap, setAcceptingMap] = useState<Record<string, boolean>>({});
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);

  const handleAccept = async (pickupId: string, type: 'pickupsheet' | 'runsheet' = 'pickupsheet') => {
    if (acceptingMap[pickupId]) return;
    setAcceptingMap(prev => ({ ...prev, [pickupId]: true }));
    
    try {
      let riderId = null;
      try {
        const stored = localStorage.getItem('portal_auth_rider');
        if (stored) riderId = JSON.parse(stored).id;
      } catch (e) {}
      if (!riderId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) riderId = authData.user.id;
      }
      
      if (riderId) {
        const { data: existingLive } = await supabase.from('rider_live_work_flow').select('id').eq('rider_id', riderId);
        if (!existingLive || existingLive.length === 0) {
          await supabase.from('rider_live_work_flow').insert([{
            rider_id: riderId,
            'All Pic & Dlv': '0',
            'Pickup': '0',
            'Delivery': '0',
            'Total Cash': '0',
            "Today's Earning": '0',
            'Performance': '0'
          }]);
        }

        if (type === 'pickupsheet') {
          const { data } = await supabase
            .from('accepted_shipments')
            .select('*')
            .eq('Rider id', riderId)
            .eq('pickupsheet id', pickupId)
            .ilike('shipment type', '%ready to pickup%');
            
          if (data && data.length > 0) {
            const generatePin = async () => {
              let isUnique = false;
              let newPin = '';
              while (!isUnique) {
                newPin = '';
                const chars = '0123456789';
                for (let i = 0; i < 6; i++) newPin += chars[Math.floor(Math.random() * chars.length)];
                const { data: checkData } = await supabase.from('accepted_shipments').select('"pickup pin"').eq('pickup pin', newPin);
                if (!checkData || checkData.length === 0) isUnique = true;
              }
              return newPin;
            };
            const generatePickupId = async () => {
              let length = 10;
              let isUnique = false;
              let newId = '';
              while (!isUnique) {
                newId = 'PIC';
                const chars = '0123456789';
                for (let i = 0; i < length; i++) newId += chars[Math.floor(Math.random() * chars.length)];
                const { data: checkData } = await supabase.from('accepted_shipments').select('"pickup ID"').eq('pickup ID', newId);
                if (!checkData || checkData.length === 0) isUnique = true;
                else length++;
              }
              return newId;
            };
            
            let riderInfoStr = '';
            const { data: riderData } = await supabase.from('riders').select('id, rider_name, registered_pincode').eq('id', riderId).maybeSingle();
            if (riderData) riderInfoStr = `Rider: ${riderData.rider_name || 'N/A'} (ID: ${riderData.id}, Pin: ${riderData.registered_pincode || 'N/A'})`;
            
            const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            for (const ship of data) {
               const pickupPin = await generatePin();
               const generatedPickupId = await generatePickupId();
               const newStatusEntry = `[accepted pickupsheet - ${formattedDate}] ${riderInfoStr}`;
               const currentOrderStatus = ship['order status'] || '';
               const updatedOrderStatus = currentOrderStatus ? currentOrderStatus + '\n\n' + newStatusEntry : newStatusEntry;
               
               const currentAttemptStr = (ship["attempt"] || "").toString().trim();
              const currentAttempt = currentAttemptStr ? parseInt(currentAttemptStr, 10) : 0;
              const newAttempt = (isNaN(currentAttempt) ? 0 : currentAttempt) + 1;
               const payload: any = {
                 "attempt": newAttempt.toString(),
                 'shipment type': 'out for pickup',
                 'pickup pin': pickupPin,
                 'pickup ID': generatedPickupId,
                 'updated_at': new Date().toISOString(),
                 'hub manager id': ship['hub manager id'],
                 'Rider id': riderId
               };
               
               // But wait, they are already assigned in accepted_shipments, otherwise rider couldn't accept them.
               // Let's ensure they get synced to customer_orders via syncShipmentStatusToCustomerOrder if needed.
               // Actually the prompt says: "Rider portal me accept ka button dabakar runsheet ya pickupsheet accept karne par hi supabase me sirf accepted shipments table aur customer orders table yani sirf inhi dono table me hub manager id ke sahi cullom me hub manager ki id aur rider id ke sahi cullom me rider ki id update hokar show karna chahiye"

               // To do this, let's fetch the hub_manager_id from rider's cluster if not present, but ship['hub manager id'] should already have it, or rider's registered pincode can be used.
               let finalHubManagerId = ship['hub manager id'];
               if (!finalHubManagerId && riderData?.registered_pincode) {
                   const { data: hmData } = await supabase.from('added_pincode').select('"hub manager id"').eq('added pincode', riderData.registered_pincode).maybeSingle();
                   if (hmData) finalHubManagerId = hmData['hub manager id'];
               }

               if (finalHubManagerId) payload['hub manager id'] = finalHubManagerId;
               if (riderId) payload['Rider id'] = riderId;
               
               payload['shipment status'] = await buildShipmentStatus('Accepted pickupsheet', ship, payload);
               await updateAcceptedShipment(payload, ship.id, ship);
               
               if (ship['order ID']) {
                  const { data: coRows } = await supabase.from('customer_orders').select('id, "awb number"').eq('order ID', ship['order ID']);
                  if (coRows && coRows.length > 0) {
                      let targetRow = coRows.find(r => r['awb number'] === ship['awb number']);
                      if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
                      if (!targetRow) targetRow = coRows[0];
                      
                      const updateCo: any = {};
                      if (finalHubManagerId) updateCo['hub manager id'] = finalHubManagerId;
                      if (riderId) updateCo['Rider id'] = riderId;
                      if (Object.keys(updateCo).length > 0) {
                          await supabase.from('customer_orders').update(updateCo).eq('id', targetRow.id);
                      }
                  }
               }
            }

            const paymentStatusLines = data.map((ship: any) => {
               return `AWB: ${ship['awb number'] || 'N/A'}, Order ID: ${ship['order ID'] || 'N/A'}, Date: ${formattedDate}, Rider: ${riderData?.rider_name || 'Unknown'} (ID: ${riderId}), Amount: ₹0`;
            });
            const paymentStatusStr = paymentStatusLines.join('\n');
            const cwrPayload = {
               'rider id': riderId,
               'cash payment status': paymentStatusStr,
               'total cash payment': '0',
               'online payment status': paymentStatusStr,
               'total online payment': '0'
            };
            await supabase.from('cash_with_riders').insert(cwrPayload);
            const opPayload = {
               'rider id': riderId,
               'online payment status': paymentStatusStr,
               'total online payment': '0'
            };
            await supabase.from('online_payments').insert(opPayload);

            setPickupsheets(prev => prev.filter(sheet => sheet.pickupId !== pickupId));
          }
        } else if (type === 'runsheet') {
          const { data } = await supabase
            .from('accepted_shipments')
            .select('*')
            .eq('Rider id', riderId)
            .eq('runsheet id', pickupId)
            .ilike('shipment type', '%shipped%');
            
          if (data && data.length > 0) {
            let riderName = 'N/A';
            let riderMobile = 'N/A';
            const { data: riderData } = await supabase.from('riders').select('rider_name, registered_mobile_number, registered_pincode').eq('id', riderId).maybeSingle();
            if (riderData) {
              riderName = riderData.rider_name || 'N/A';
              riderMobile = riderData.registered_mobile_number || 'N/A';
            }
            
            const hubManagerIds = Array.from(new Set(data.map(s => s['hub manager id']).filter(Boolean)));
            const hubManagerNames: Record<string, string> = {};
            for (const hmId of hubManagerIds) {
              const { data: hubData } = await supabase.from('hub_managers').select('hub_name').eq('id', hmId).maybeSingle();
              if (hubData) {
                hubManagerNames[hmId as string] = hubData.hub_name || 'N/A';
              }
            }
            
            const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            for (const ship of data) {
              const hmId = ship['hub manager id'];
              const hmName = hmId ? (hubManagerNames[hmId] || 'N/A') : 'N/A';
              
              const currentOrderStatus = ship['order status'] || '';
              const outForDeliveryMsg = `[Out for delivery - ${formattedDate}] Your order is out for delivery with our rider. (Rider: ${riderName}, Contact: ${riderMobile})`;
              const updatedOrderStatus = currentOrderStatus ? currentOrderStatus + ' || ' + outForDeliveryMsg : outForDeliveryMsg;
              
              const currentAttemptStr = (ship["attempt"] || "").toString().trim();
              const currentAttempt = currentAttemptStr ? parseInt(currentAttemptStr, 10) : 0;
              const newAttempt = (isNaN(currentAttempt) ? 0 : currentAttempt) + 1;
              const payload: any = {
                 "attempt": newAttempt.toString(),
                'shipment type': 'out for delivery',
                'updated_at': new Date().toISOString()
              };

              let finalHubManagerId = ship['hub manager id'];
              if (!finalHubManagerId && riderData?.registered_pincode) {
                   const { data: hmData } = await supabase.from('added_pincode').select('"hub manager id"').eq('added pincode', riderData.registered_pincode).maybeSingle();
                   if (hmData) finalHubManagerId = hmData['hub manager id'];
              }

              if (finalHubManagerId) payload['hub manager id'] = finalHubManagerId;
              if (riderId) payload['Rider id'] = riderId;

              payload['shipment status'] = await buildShipmentStatus('Out for delivery', ship, payload);
              
              await updateAcceptedShipment(payload, ship.id, ship);
              
              if (ship['order ID']) {
                  const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', ship['order ID']);
                  if (coRows && coRows.length > 0) {
                     let targetRow = coRows.find(r => r['awb number'] === ship['awb number']);
                     if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
                     if (!targetRow) targetRow = coRows[0];
                     
                     const existingCoStatus = targetRow['order status'] || '';
                     const finalCoStatus = existingCoStatus ? existingCoStatus + ' || ' + outForDeliveryMsg : outForDeliveryMsg;
                     
                     const updateCo: any = {};
                     if (finalHubManagerId) updateCo['hub manager id'] = finalHubManagerId;
                     if (riderId) updateCo['Rider id'] = riderId;
                     if (Object.keys(updateCo).length > 0) {
                         await supabase.from('customer_orders').update(updateCo).eq('id', targetRow.id);
                     }
                  }
              }
            }

            const paymentStatusLines = data.map((ship: any) => {
               return `AWB: ${ship['awb number'] || 'N/A'}, Order ID: ${ship['order ID'] || 'N/A'}, Date: ${formattedDate}, Rider: ${riderName} (ID: ${riderId}), Amount: ₹0`;
            });
            const paymentStatusStr = paymentStatusLines.join('\n');
            const cwrPayload = {
               'rider id': riderId,
               'cash payment status': paymentStatusStr,
               'total cash payment': '0',
               'online payment status': paymentStatusStr,
               'total online payment': '0'
            };
            await supabase.from('cash_with_riders').insert(cwrPayload);
            const opPayload = {
               'rider id': riderId,
               'online payment status': paymentStatusStr,
               'total online payment': '0'
            };
            await supabase.from('online_payments').insert(opPayload);

            setPickupsheets(prev => prev.filter(sheet => sheet.pickupId !== pickupId));
          }
        }
      }
    } finally {
      setAcceptingMap(prev => ({ ...prev, [pickupId]: false }));
    }
  };

  

  let displayEarning = dynamicEarning;
  let targetEarning = todayWork.earning;

  const performanceRaw = allPicDlvCount > 0 ? Math.min(100, ((pickupCount + deliveryCount) / allPicDlvCount) * 100) : 0;
  
  if (isPerformanceBasedRate) {
    if (performanceRaw <= 60) {
      displayEarning = displayEarning * (11 / 15);
      targetEarning = targetEarning * (11 / 15);
    } else {
      displayEarning = displayEarning * (11 / 15 + (4 / 15) * ((performanceRaw - 60) / 40));
      targetEarning = targetEarning * (11 / 15 + (4 / 15) * ((performanceRaw - 60) / 40));
    }
  }

  useEffect(() => {
    let riderId = null;
    try {
      const stored = localStorage.getItem('portal_auth_rider');
      if (stored) riderId = JSON.parse(stored).id;
    } catch (e) {}
    const updateWF = async () => {
      if (!riderId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) riderId = authData.user.id;
      }
      
      if (!riderId) return;
      
      // Fetch the actual cluster_id for this rider
      const { data: riderData } = await supabase.from('riders').select('cluster_id').eq('id', riderId).limit(1).maybeSingle();
      
      const finalEarning = Math.round(targetEarning);
      const payload: any = {
        rider_id: riderId,
        'All Pic & Dlv': allPicDlvCount,
        'Pickup': pickupCount,
        'Delivery': deliveryCount,
        'Total Cash': totalCashCollected,
        "Today's Earning": finalEarning,
        'Performance': Number(performanceRaw.toFixed(2))
      };
      
      const { data: existingRows, error: existingErr } = await supabase.from('rider_live_work_flow').select('id').eq('rider_id', riderId);
      if (existingErr) {
         if (existingErr.message && existingErr.message.includes('Failed to fetch')) {
            // Silently ignore network aborts
         } else {
            console.error("Error fetching existing live work flow:", existingErr);
         }
      }
      
      if (existingRows && existingRows.length > 0) {
        const { error: updateErr } = await supabase.from('rider_live_work_flow').update(payload).eq('id', existingRows[0].id);
        if (updateErr && !updateErr.message?.includes('Failed to fetch')) console.error("Error updating live work flow:", updateErr);
        
        // Clean up duplicates (the "kachra")
        if (existingRows.length > 1) {
            const idsToDelete = existingRows.slice(1).map(r => r.id);
            await supabase.from('rider_live_work_flow').delete().in('id', idsToDelete);
        }
      } else {
        // Hub has collected and deleted rider_live_work_flow: do not resurrect old data
        return;
      }
    };
    updateWF();
  }, [allPicDlvCount, pickupCount, deliveryCount, totalCashCollected, targetEarning, performanceRaw]);

  return (
    <div className="w-full p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">Work flow</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-blue-800 uppercase leading-tight">All Pic<br/>& Dlv</span>
            <span className="text-xl font-black text-blue-600 mt-1">{allPicDlvCount}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-emerald-800 uppercase leading-tight">Pickup</span>
            <span className="text-xl font-black text-emerald-600 mt-1">{pickupCount}</span>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-purple-800 uppercase leading-tight">Delivery</span>
            <span className="text-xl font-black text-purple-600 mt-1">{deliveryCount}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-orange-800 uppercase leading-tight">Total<br/>Cash</span>
            <span className="text-xl font-black text-orange-600 mt-1">₹{totalCashCollected}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-indigo-800 uppercase leading-tight">Today's<br/>Earning</span>
            <span className="text-xl font-black text-indigo-600 mt-1">₹{Math.round(displayEarning)}</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-rose-800 uppercase leading-tight">Perfor<br/>mance</span>
            <span className="text-xl font-black text-rose-600 mt-1">{performanceRaw.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {pickupsheets.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">Accept your all pickupsheet or runsheet</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                Sheets: {pickupsheets.length}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold">
                Shipments: {pickupsheets.reduce((acc, s) => acc + s.shipments.length, 0)}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setIsAcceptingAll(true);
              const currentSheets = [...pickupsheets];
              for (const sheet of currentSheets) {
                await handleAccept(sheet.pickupId, sheet.type);
              }
              setIsAcceptingAll(false);
            }}
            disabled={Object.values(acceptingMap).some(Boolean) || isAcceptingAll}
            className={`w-full h-[52px] flex items-center justify-center rounded-lg font-bold text-emerald-700 bg-emerald-50 border-2 transition-all duration-1000 ${Object.values(acceptingMap).some(Boolean) || isAcceptingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={!(Object.values(acceptingMap).some(Boolean) || isAcceptingAll) ? { animation: 'fireflyPulse 1.5s ease-in-out infinite' } : {}}
          >
            {Object.values(acceptingMap).some(Boolean) || isAcceptingAll ? (
              <div className="flex gap-1.5 items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : 'Accept'}
          </button>
          <style>
            {`
              @keyframes fireflyPulse {
                0%, 100% { border-color: #34d399; background-color: #ecfdf5; color: #047857; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
                50% { border-color: #059669; background-color: #d1fae5; color: #064e3b; box-shadow: 0 0 20px rgba(16, 185, 129, 0.9), inset 0 0 10px rgba(16, 185, 129, 0.4); transform: scale(1.01); }
              }
            `}
          </style>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 opacity-70">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">Accept your all pickupsheet or runsheet</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                Sheets: 0
              </p>
              <p className="text-[10px] text-slate-500 font-semibold">
                Shipments: 0
              </p>
            </div>
          </div>
          <button
            disabled
            className="w-full py-3 rounded-lg font-bold text-slate-500 bg-slate-50 border border-slate-200 cursor-not-allowed"
          >
            Accept
          </button>
        </div>
      )}

      {/* Route Selection Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex items-center gap-3">
        <div className="flex-[7] min-w-0">
          <CustomSelect 
             value={selectedRouteId}
             onChange={(e) => {
                 setSelectedRouteId(e.target.value);
                 setRouteSaved(false);
             }}
             className="w-full h-12 px-3 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 focus:outline-none"
             actionButton={
                <button 
                   onClick={async () => {
                      if (isSavingSelectedRoute) return;
                      setIsSavingSelectedRoute(true);
                      // Save to localStorage
                      let rId = riderData?.id;
                      if (!rId) {
                          try {
                              const stored = localStorage.getItem('portal_auth_rider');
                              if (stored) rId = JSON.parse(stored).id;
                          } catch (e) {}
                      }
                       // original time simulation
                      if (rId) {
                          if (selectedRouteId) {
                              const selected = riderRoutes.find(r => r.id === selectedRouteId);
                              if (selected) {
                                  localStorage.setItem('rider_selected_route_' + rId, JSON.stringify(selected));
                              }
                          } else {
                              localStorage.removeItem('rider_selected_route_' + rId);
                          }
                          // clear manual sort whenever route changes
                          localStorage.removeItem('rider_manual_sort_' + rId);
                      }
                      setIsSavingSelectedRoute(false);
                      setRouteSaved(true);
                   }} 
                   className={`h-10 w-full ${routeSaved || !selectedRouteId ? 'bg-slate-400' : 'bg-blue-600'} text-white text-sm font-bold rounded-lg flex items-center justify-center whitespace-nowrap transition-all`}
                >
                   {isSavingSelectedRoute ? (
                      <div className="flex space-x-1">
                         <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                         <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                         <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                   ) : (
                      'Save Change'
                   )}
                </button>
             }
          >
             <option value="">Select Route</option>
             {riderRoutes.map(route => (
                <option key={route.id} value={route.id}>{route.name}</option>
             ))}
          </CustomSelect>
        </div>
        <button 
           onClick={() => setShowRouteDetails(true)} 
           className="flex-[3] h-12 px-1 flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-[11px] sm:text-sm rounded-lg hover:bg-indigo-200 transition-colors shrink-0 min-w-0"
        >
           Route Details
        </button>
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
        updateType="rider_update"
        title="Suriyawan Shopping Updates"
        readOnly={true}
      />
      <RoleChatModal
        isOpen={showRoleChatModal}
        onClose={() => setShowRoleChatModal(false)}
        tableName="chat_for_riders"
        title="Chat with Cluster Support"
        currentUserType="rider"
        currentUserId={riderData?.id || ''}
        currentUserName={riderData?.rider_name || 'Rider'}
        clusterId={riderClusterId}
      />

      {/* Route Details Modal */}
      {showRouteDetails && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-full">
          <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 shrink-0">
            <h2 className="font-bold text-slate-800 text-lg">Route Details</h2>
            <button onClick={() => setShowRouteDetails(false)} className="w-8 h-8 flex items-center justify-center text-slate-500 rounded-full hover:bg-slate-100">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-slate-50">
            <div className="flex gap-2 mb-6 shrink-0">
               <button 
                  onClick={() => setShowCreateRoute(true)} 
                  className="flex-1 h-11 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-700 flex items-center justify-center active:scale-[0.98] transition-all"
               >
                  Create Route
               </button>
               <button 
                  onClick={handleDeleteRoute}
                  disabled={!longPressedRouteId || isDeletingRoute}
                  className={`w-11 h-11 border rounded-lg flex items-center justify-center shrink-0 transition-all ${longPressedRouteId ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-300 bg-white text-slate-400'}`}
               >
                  {isDeletingRoute ? (
                     <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                     </div>
                  ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  )}
               </button>
            </div>

            <div className="flex flex-col gap-3">
               {riderRoutes.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm font-medium">No routes created yet</div>
               ) : (
                  riderRoutes.map(route => (
                     <div 
                        key={route.id}
                        onTouchStart={() => {
                           // long press logic
                           const timer = setTimeout(() => {
                              setLongPressedRouteId(route.id);
                           }, 800);
                           // save timer to clear if released early
                           (window as any).longPressTimer = timer;
                        }}
                        onTouchEnd={() => {
                           clearTimeout((window as any).longPressTimer);
                        }}
                        onMouseDown={() => {
                           const timer = setTimeout(() => {
                              setLongPressedRouteId(route.id);
                           }, 800);
                           (window as any).longPressTimer = timer;
                        }}
                        onMouseUp={() => {
                           clearTimeout((window as any).longPressTimer);
                        }}
                        onMouseLeave={() => {
                           clearTimeout((window as any).longPressTimer);
                        }}
                        className={`p-4 rounded-xl border transition-all ${longPressedRouteId === route.id ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white shadow-sm'}`}
                     >
                        <div className="flex items-center justify-between">
                           <div>
                              <h3 className="font-bold text-slate-800">{route.name}</h3>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">Points: {route.villages.length}</p>
                           </div>
                           <button 
                              onClick={() => setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                              className="text-sm font-bold text-blue-600 hover:text-blue-700"
                           >
                              {expandedRouteId === route.id ? 'Hide' : 'View all'}
                           </button>
                        </div>
                        {expandedRouteId === route.id && (
                           <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-slate-100">
                              {route.villages.map((v: string, idx: number) => (
                                 <div key={idx} className="flex gap-2 text-xs font-medium text-slate-600">
                                    <span className="w-5 text-slate-400">{idx + 1}.</span>
                                    <span>{v}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* Create Route Modal */}
      {showCreateRoute && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-right-full">
          <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 shrink-0">
            <h2 className="font-bold text-slate-800 text-lg">Create Route</h2>
            <button onClick={() => { setShowCreateRoute(false); setNewRouteName(''); setNewRouteVillages(['']); }} className="w-8 h-8 flex items-center justify-center text-slate-500 rounded-full hover:bg-slate-100">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col">
            <div className="mb-6">
               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Route Name</label>
               <input 
                  type="text" 
                  placeholder="E.g. Morning Shift"
                  value={newRouteName}
                  onChange={e => setNewRouteName(e.target.value)}
                  className="w-full h-12 px-4 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
               />
            </div>
            
            <div className="flex-1">
               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Villages (In Order)</label>
               <div className="flex flex-col gap-3">
                  {newRouteVillages.map((village, idx) => (
                     <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 text-sm font-bold text-slate-400 text-center">{idx + 1}.</span>
                        <input 
                           type="text" 
                           placeholder="Enter village name"
                           value={village}
                           onChange={e => {
                              const updated = [...newRouteVillages];
                              updated[idx] = e.target.value;
                              setNewRouteVillages(updated);
                           }}
                           className="flex-1 h-12 px-4 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        {newRouteVillages.length > 1 && (
                           <button 
                              onClick={() => {
                                 const updated = newRouteVillages.filter((_, i) => i !== idx);
                                 setNewRouteVillages(updated);
                              }}
                              className="w-12 h-12 flex items-center justify-center text-red-500 shrink-0"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                           </button>
                        )}
                     </div>
                  ))}
                  
                  <button 
                     onClick={() => setNewRouteVillages([...newRouteVillages, ''])}
                     className="mt-2 h-12 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 flex items-center justify-center gap-2"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                     Add Village
                  </button>
               </div>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
             <button 
                onClick={handleSaveRoute}
                disabled={isSavingRoute}
                className={`w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-all ${isSavingRoute ? 'opacity-80' : 'active:scale-[0.98]'}`}
             >
                {isSavingRoute ? (
                   <span className="loading-ellipsis">Save</span>
                ) : (
                   "Save Changes"
                )}
             </button>
          </div>
        </div>
      )}
      <TermsAndConditionsModal isOpen={showTerms} onClose={() => setShowTerms(false)} userType="rider" />
    </div>
  );
};

export default RiderDashboardView;
