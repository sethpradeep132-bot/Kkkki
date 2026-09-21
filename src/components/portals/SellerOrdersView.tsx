import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { buildShipmentStatus } from '../../utils/statusFormatter';
import { Check, X, Package, Clock, Filter, ArrowLeft } from 'lucide-react';
import { processShipmentsAddresses } from '../../utils/addressFormatter';
import { FiveDotLoader } from './FiveDotLoader';


export const SellerOrdersView: React.FC<{ onBack?: () => void; key?: any }> = ({ onBack }) => {
  const [activeChip, setActiveChip] = useState<'New Order' | 'Accepted' | 'Out for Pickup' | 'Failed Pickup' | 'Picked Up' | 'Received at Hub' | 'Unable to Complete Pickup' | 'Dispatched' | 'Shipped' | 'Out for Delivery' | 'Unable to Complete Delivery' | 'Delivered' | 'Cancelled Order'>('New Order');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [adminCharges, setAdminCharges] = useState<any[]>([]);
  const [selectedOrderForEarning, setSelectedOrderForEarning] = useState<any>(null);
  const [orderProductGst, setOrderProductGst] = useState<number>(0);
  const [earningLoading, setEarningLoading] = useState<boolean>(false);
  const [isAcceptingAll, setIsAcceptingAll] = useState<boolean>(false);

  useEffect(() => {
    const fetchSellerAuth = async () => {
      try {
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
        
        if (finalSellerId) {
          setSellerId(finalSellerId);
        }
      } catch (err) {
        console.error("Error fetching seller auth:", err);
      }
    };
    fetchSellerAuth();
  }, []);

  useEffect(() => {
    // Reset to "New Order" when component mounts/remounts due to bell click
    setActiveChip('New Order');
  }, []);

  useEffect(() => {
    // Smoothly scroll to top whenever active chip changes
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeChip]);

  const autoRejectingIdsRef = useRef<Set<string>>(new Set());

  const executeRejectOrder = useCallback(async (shipmentId: string, orderId: string, isAuto: boolean = false) => {
    try {
      if (!isAuto) {
        setIsUpdatingId(shipmentId + '-reject');
      }

      // 1. Fetch current status from accepted_shipments
      const { data: currentData } = await supabase
        .from('accepted_shipments')
        .select('"order status", "shipment status", "product id"')
        .eq('id', shipmentId)
        .maybeSingle();

      const existingOrderStatus = currentData ? (currentData['order status'] || '') : '';
      const existingShipmentStatus = currentData ? (currentData['shipment status'] || '') : '';

      const now = new Date();
      const formattedDate = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedTime = now.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      const newCancelEntry = `Your order has been cancelled on ${formattedDate}, ${formattedTime}, Order ID: ${orderId}`;
      
      const finalOrderStatus = existingOrderStatus ? existingOrderStatus + ' || ' + newCancelEntry : newCancelEntry;
      const finalShipmentStatus = existingShipmentStatus;

      if (orderId) {
        const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "tracking id number", "product id"').eq('order ID', orderId);
        if (coRows && coRows.length > 0) {
          let targetRow = currentData && currentData['product id'] ? coRows.find(r => r['product id'] === currentData['product id'] && !r['order status']?.includes('cancelled')) : null;
          if (!targetRow) targetRow = coRows.find(r => !r['order status']?.includes('cancelled'));
          if (!targetRow) targetRow = coRows[0];
          await supabase.from('customer_orders').update({ 'order status': finalOrderStatus }).eq('id', targetRow.id);
        }
      }

      const { error: shipmentError } = await supabase
        .from('accepted_shipments')
        .delete()
        .eq('id', shipmentId);
        
      await supabase.from('finished_shipments').update({ "shipment status": finalShipmentStatus }).eq('id', shipmentId);

      if (!shipmentError) {
        setOrders(prev => prev.filter(o => o.id !== shipmentId));
      } else {
        console.error('Failed to reject order.');
        autoRejectingIdsRef.current.delete(shipmentId);
      }
    } catch (e) {
      console.error('Error auto/manual rejecting order:', e);
      autoRejectingIdsRef.current.delete(shipmentId);
    } finally {
      if (!isAuto) {
        setIsUpdatingId(null);
      }
    }
  }, []);

  // 3-Day Auto-Rejection background engine for unaccepted New Orders (Ready to accept)
  useEffect(() => {
    if (!sellerId) return;

    let isCancelled = false;
    const scheduledTimers: NodeJS.Timeout[] = [];

    const checkAutoRejectExpiredOrders = async () => {
      try {
        const { data: pendingOrders, error } = await supabase
          .from('accepted_shipments')
          .select('id, "order ID", created_at, "shipment type"')
          .eq('selller id', sellerId)
          .ilike('shipment type', 'Ready to accept');

        if (error || !pendingOrders || isCancelled) return;

        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // Exact 3 days (72 hours)
        const now = Date.now();

        for (const order of pendingOrders) {
          if (!order?.id || !order.created_at) continue;

          const createdTime = new Date(order.created_at).getTime();
          if (isNaN(createdTime) || createdTime <= 0) continue;

          const elapsed = now - createdTime;

          if (elapsed >= THREE_DAYS_MS) {
            // 3 days have already expired: auto-reject at this exact moment
            if (!autoRejectingIdsRef.current.has(order.id) && !isCancelled) {
              autoRejectingIdsRef.current.add(order.id);
              try {
                await executeRejectOrder(order.id, order['order ID'], true);
              } catch (err) {
                autoRejectingIdsRef.current.delete(order.id);
                console.error('Auto-reject failed:', err);
              }
            }
          } else {
            // Schedule auto-rejection at the exact instant 3 days will complete
            const remaining = THREE_DAYS_MS - elapsed;
            if (remaining > 0 && remaining <= 2147483647) {
              const timer = setTimeout(async () => {
                if (isCancelled) return;
                if (!autoRejectingIdsRef.current.has(order.id)) {
                  autoRejectingIdsRef.current.add(order.id);
                  try {
                    await executeRejectOrder(order.id, order['order ID'], true);
                  } catch (err) {
                    autoRejectingIdsRef.current.delete(order.id);
                    console.error('Auto-reject timer failed:', err);
                  }
                }
              }, remaining);
              scheduledTimers.push(timer);
            }
          }
        }
      } catch (err) {
        console.error('Error during auto-reject check:', err);
      }
    };

    checkAutoRejectExpiredOrders();
    const interval = setInterval(checkAutoRejectExpiredOrders, 10000);

    return () => {
      isCancelled = true;
      scheduledTimers.forEach(t => clearTimeout(t));
      clearInterval(interval);
      // NOTE: Back navigation / unmount only clears timers and NEVER rejects any order!
    };
  }, [sellerId, executeRejectOrder]);

  const fetchOrders = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const { data: adminData } = await supabase.from('seller_estimated_earning').select('*').limit(1).maybeSingle();
      if (adminData) {
        setAdminCharges([
          { id: '1', name: 'Referral Fee', value: adminData['Referral Fee'] || '0', isPercentage: true },
          { id: '2', name: 'Closing Fee', value: adminData['Closing Fee'] || '0', isPercentage: false },
          { id: '3', name: 'COD Fee', value: adminData['COD Fee'] || '0', isPercentage: false },
          { id: '4', name: 'Shipping Fee', value: adminData['Shipping Fee'] || '0', isPercentage: false },
          { id: '5', name: 'C-GST', value: adminData['C-GST'] || '0', isPercentage: true },
          { id: '6', name: 'S-GST', value: adminData['S-GST'] || '0', isPercentage: true },
          { id: '7', name: 'TDS charge', value: adminData['TDS charge'] || '0', isPercentage: true },
          { id: '8', name: 'TCS charge', value: adminData['TCS charge'] || '0', isPercentage: true },
        ]);
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

      // Here we use accepted_shipments
      let query = supabase
        .from('accepted_shipments')
        .select('*')
        .eq('selller id', sellerId)
        .order('created_at', { ascending: false });

      if (activeChip === 'New Order') {
         query = query.ilike('shipment type', 'Ready to accept');
      } else if (activeChip === 'Accepted') {
         query = query.ilike('shipment type', 'ready to pickup').in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
      } else if (activeChip === 'Out for Pickup') {
         query = query.ilike('shipment type', 'out for pickup').in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
      } else if (activeChip === 'Failed Pickup') {
         query = query.in('shipment type', ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild']).in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
      } else if (activeChip === 'Picked Up') {
         query = query.ilike('shipment type', '%picked up%');
      } else if (activeChip === 'Received at Hub') {
         query = query.ilike('shipment type', 'received at hub').in('shipment tag', ['Customer delivery', 'customer delivery']);
      } else if (activeChip === 'Unable to Complete Pickup') {
         query = query.or('shipment type.ilike.rescheduled pickup,shipment type.ilike.not attanded pickup,shipment type.ilike.no responsed pickup,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule').in('shipment tag', ['Seller pickup', 'seller pickup', 'selller pickup', 'Selller pickup']);
      } else if (activeChip === 'Dispatched') {
         query = query.ilike('shipment type', 'dispatched').in('shipment tag', ['Customer delivery', 'customer delivery']);
      } else if (activeChip === 'Shipped') {
         query = query.ilike('shipment type', 'shipped').in('shipment tag', ['Customer delivery', 'customer delivery']);
      } else if (activeChip === 'Out for Delivery') {
         query = query.ilike('shipment type', 'out for delivery').in('shipment tag', ['Customer delivery', 'customer delivery']);
      } else if (activeChip === 'Unable to Complete Delivery') {
         query = query.or('shipment type.ilike.delivery rescheduled,shipment type.ilike.delivery not attanded,shipment type.ilike.delivery no responsed,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule').in('shipment tag', ['Customer delivery', 'customer delivery']);
      } else if (activeChip === 'Delivered') {
         query = query.ilike('shipment type', 'delivered').in('shipment tag', ['Customer delivery', 'customer delivery']);
      } else if (activeChip === 'Cancelled Order') {
         query = query.or('shipment type.ilike.faild delivery,shipment type.ilike.rejected by customer').in('shipment tag', ['Customer delivery', 'customer delivery']);
      } else if (activeChip === 'Return Processing') {
         const { data: data1, error: err1 } = await supabase.from('accepted_shipments').select('*').eq('selller id', sellerId).in('shipment tag', ['Customer pickup', 'customer pickup']).or('shipment type.ilike.ready to pickup,shipment type.ilike.out for pickup,shipment type.ilike.rescheduled pickup,shipment type.ilike.not attanded pickup,shipment type.ilike.no responsed pickup,shipment type.ilike.picked up,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule');
         
         const { data: data2, error: err2 } = await supabase.from('accepted_shipments').select('*').eq('selller id', sellerId).in('shipment tag', ['seller delivery', 'seller delivery']).or('shipment type.ilike.received at hub,shipment type.ilike.shipped,shipment type.ilike.dispatched,shipment type.ilike.delivery rescheduled,shipment type.ilike.delivery not attanded,shipment type.ilike.delivery no responsed,shipment type.ilike.faild delivery,shipment type.ilike.rejected by customer,shipment type.ilike.no response,shipment type.ilike.not attend,shipment type.ilike.reschedule');
         
         if (!err1 && !err2 && data1 && data2) {
            const combined = [...data1, ...data2];
            combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const processedData = await processShipmentsAddresses(combined);
            setOrders(processedData);
         }
         setLoading(false);
         return;
      } else if (activeChip === 'Out for Return') {
         query = query.ilike('shipment type', 'out for delivery').in('shipment tag', ['seller delivery', 'seller delivery']);
      } else if (activeChip === 'Returned') {
         query = query.ilike('shipment type', 'delivered').in('shipment tag', ['seller delivery', 'seller delivery']);
      }

      const { data, error } = await query;

      if (!error && data) {
        const processedData = await processShipmentsAddresses(data);
        setOrders(processedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sellerId, activeChip]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time Supabase listener on accepted_shipments
  useEffect(() => {
    if (!sellerId) return;

    const channel = supabase
      .channel(`seller_orders_live_${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accepted_shipments',
          filter: `selller id=eq.${sellerId}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, fetchOrders]);

  

  useEffect(() => {
    const saveEarningsToDB = async () => {
      if (!selectedOrderForEarning || earningLoading) return;
      
      const earnings = calculateOrderEarnings();
      if (!earnings) return;
      
      if (['Delivered', 'Return Processing', 'Out for Return', 'Returned'].includes(activeChip)) {
        try {
          const order = selectedOrderForEarning;
          const orderId = order['order ID'] || order['order id'];
          
          const { data: existingRecord } = await supabase.from('selller_income_estimate')
            .select('id')
            .eq('order id', orderId)
            .eq('product id', order['product id'])
            .maybeSingle();

          const recordData = {
            "admin id": order['admin id'],
            "seller id": order['seller id'] || order['selller id'] || sellerId,
            "order id": orderId,
            "product id": order['product id'],
            "awb number": order['awb number'] || '',
            "total earning amount": earnings.totalSellerEarning.toFixed(2),
            "total platform estimate": earnings.totalPlatformEstimate.toFixed(2),
            "final payable amount": earnings.finalPayable.toFixed(2),
            "payout status": "Pending"
          };

          if (existingRecord) {
            await supabase.from('selller_income_estimate').update(recordData).eq('id', existingRecord.id);
          } else {
            await supabase.from('selller_income_estimate').insert([recordData]);
          }
        } catch (e) {
          console.error("Error saving seller income estimate", e);
        }
      }
    };
    
    saveEarningsToDB();
  }, [selectedOrderForEarning, earningLoading, activeChip, orderProductGst, adminCharges]);

  const handleOpenEarning = async (order: any) => {
    setSelectedOrderForEarning(order);
    setEarningLoading(true);
    try {
      const { data } = await supabase.from('upload_products').select('"gst rate %", "gst %"').eq('id', order['product id']).maybeSingle();
      if (data) {
        setOrderProductGst(parseFloat(data['gst rate %']) || parseFloat(data['gst %']) || 0);
      } else {
        setOrderProductGst(0);
      }
    } catch(e) {
      setOrderProductGst(0);
    } finally {
      setEarningLoading(false);
    }
  };

  const calculateOrderEarnings = () => {
    if (!selectedOrderForEarning) return null;
    
    // Parse amounts
    const parseAmt = (val: any) => parseFloat(val) || 0;
    
    const sp = parseAmt(selectedOrderForEarning['total selling price']);
    const dc = parseAmt(selectedOrderForEarning['total delevery charge']);
    const gd = parseAmt(selectedOrderForEarning['gift cash donation']);
    
    const sellerGstPercent = orderProductGst;
    const halfGstPercent = sellerGstPercent / 2;

    let grossRateNum = 0;
    let totalGstAmount = 0;

    if (sp > 0) {
      grossRateNum = sp / (1 + (sellerGstPercent / 100));
      totalGstAmount = sp - grossRateNum;
    }

    const sellerCgstAmount = totalGstAmount / 2;
    const sellerSgstAmount = totalGstAmount / 2;

    
    const isReturn = ['Return Processing', 'Out for Return', 'Returned'].includes(activeChip);
    const totalSellerEarning = isReturn ? 0 : sp + dc;

    
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
      platformTotal += finalAmount;
      return { ...charge, amount: finalAmount };
    });

    const totalPlatformEstimate = platformTotal + gd;
    const finalPayable = totalSellerEarning - totalPlatformEstimate;

    return {
      sellingPrice: sp,
      deliveryCharge: dc,
      grossRateNum,
      sellerCgstAmount,
      sellerSgstAmount,
      halfGstPercent,
      totalSellerEarning,
      calculatedCharges,
      platformTotal,
      giftDonation: gd,
      totalPlatformEstimate,
      finalPayable
    };
  };

  const parseAmtStr = (val: any) => (parseFloat(val) || 0).toFixed(2);

  // For the moment, we just show all fetched orders under 'New Order', or filter them based on status.
  // We'll filter based on activeChip:
  const filteredOrders = orders.filter((o) => {
    return true; // We are already filtering via supabase query based on activeChip
  });

  const handleStatusUpdate = async (shipmentId: string, orderId: string, newStatus: string) => {
    try {
      if (newStatus === 'Rejected') {
        await executeRejectOrder(shipmentId, orderId);
        return;
      }

      setIsUpdatingId(shipmentId + '-accept');

      // 1. Fetch current status from accepted_shipments
      const { data: currentData } = await supabase
        .from('accepted_shipments')
        .select('"order status", "shipment status"')
        .eq('id', shipmentId)
        .maybeSingle();

      const existingOrderStatus = currentData ? (currentData['order status'] || '') : '';
      const existingShipmentStatus = currentData ? (currentData['shipment status'] || '') : '';

      const now = new Date();
      const formattedDate = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedTime = now.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        const newProcessedEntry = `Your order has been accepted by seller on ${formattedDate}, ${formattedTime}`;
        const newAcceptedShipmentEntry = `Order accepted. Seller has accepted the order on ${formattedDate}, ${formattedTime}.`;
        
        const finalOrderStatus = existingOrderStatus ? existingOrderStatus + ' || ' + newProcessedEntry : newProcessedEntry;
        let finalShipmentStatus = existingShipmentStatus;
        
        // Generate a highly unique tracking ID and auto scale if necessary
        let trackingId = '';
        let isUnique = false;
        let digits = 9;
        
        while (!isUnique) {
          let numStr = '';
          for (let i = 0; i < digits; i++) numStr += Math.floor(Math.random() * 10).toString();
          trackingId = `SS-${numStr}`;
          
          const { data, error: checkErr } = await supabase.from('accepted_shipments').select('id').eq('tracking id number', trackingId).maybeSingle();
          if (!data && !checkErr) isUnique = true;
          else if (data) digits++;
          else isUnique = true;
        }

        // Fetch admin id
        let adminId = null;
        const { data: adminData } = await supabase.from('admins').select('id').limit(1).maybeSingle();
        if (adminData && adminData.id) adminId = adminData.id;

        // Fetch cluster id based on seller's registered pincode
        let sellerClusterId = null;
        const { data: sellerData } = await supabase.from('sellers').select('registered_pincode').eq('id', sellerId).maybeSingle();
        if (sellerData && sellerData.registered_pincode) {
            const { data: pincodeData } = await supabase.from('added_pincode').select('"cluster id"').eq('added pincode', sellerData.registered_pincode.toString()).limit(1).maybeSingle();
            if (pincodeData && pincodeData['cluster id']) {
                sellerClusterId = pincodeData['cluster id'];
            }
        }

        if (orderId) {
          const updatePayload: any = { 'tracking id number': trackingId, 'order status': finalOrderStatus };
          if (adminId) updatePayload['admin id'] = adminId;
          if (sellerClusterId) updatePayload['cluster id'] = sellerClusterId;
          
          const { data: coRows } = await supabase.from('customer_orders').select('id, "tracking id number", "product id"').eq('order ID', orderId);
          if (coRows && coRows.length > 0) {
              let targetRow = currentData && currentData['product id'] ? coRows.find(r => r['product id'] === currentData['product id'] && !r['tracking id number']) : null;
              if (!targetRow) targetRow = coRows.find(r => !r['tracking id number']);
              if (!targetRow) targetRow = coRows[0];
              await supabase.from('customer_orders').update(updatePayload).eq('id', targetRow.id);
          }
        }

        const shipmentUpdatePayload: any = { 
                        "shipment type": "ready to pickup",
            "shipment tag": "seller pickup",
            "tracking id number": trackingId,
            "order status": finalOrderStatus
        };
        if (adminId) shipmentUpdatePayload['admin id'] = adminId;
        if (sellerClusterId) shipmentUpdatePayload['cluster id'] = sellerClusterId;
        
        if (currentData) {
            shipmentUpdatePayload['shipment status'] = await buildShipmentStatus(newAcceptedShipmentEntry, currentData, shipmentUpdatePayload);
            finalShipmentStatus = shipmentUpdatePayload['shipment status'];
        }

        const { error } = await supabase.from('accepted_shipments').update(shipmentUpdatePayload).eq('id', shipmentId);
        await supabase.from('finished_shipments').update(shipmentUpdatePayload).eq('id', shipmentId);
          
        if (!error) {
          setOrders(prev => {
            if (activeChip === 'New Order') {
               return prev.filter(o => o.id !== shipmentId);
            } else {
               return prev.map(o => o.id === shipmentId ? { 
                  ...o, 
//
                  "shipment status": finalShipmentStatus,
                  "shipment type": "ready to pickup",
                  "shipment tag": "seller pickup",
                  "tracking id number": trackingId,
                  ...(adminId ? { "admin id": adminId } : {})
               } : o);
            }
          });
        } else {
          console.error('Failed to accept order.', error);
        }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingId(null);
    }
  };

  
  const handleAcceptAll = async () => {
    setIsAcceptingAll(true);
    // Iterate through all filtered orders sequentially
    for (const order of filteredOrders) {
      if (!order.id || !order['order ID']) continue;
      await handleStatusUpdate(order.id, order['order ID'], 'Accepted');
    }
    setIsAcceptingAll(false);
  };

  return (
      <div className="w-full min-h-full flex flex-col bg-[#FFFBF0]">
      <div className="sticky top-0 z-20 flex items-center gap-2 p-3 sm:p-4 bg-white shadow-sm border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
          {['New Order', 'Accepted', 'Out for Pickup', 'Failed Pickup', 'Picked Up', 'Received at Hub', 'Unable to Complete Pickup', 'Dispatched', 'Shipped', 'Out for Delivery', 'Unable to Complete Delivery', 'Delivered', 'Cancelled Order', 'Return Processing', 'Out for Return', 'Returned'].map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeChip === chip 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {activeChip === 'New Order' && filteredOrders.length > 0 && !loading && (
          <button 
            onClick={handleAcceptAll}
            disabled={isAcceptingAll}
            className="w-full h-[48px] bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all flex items-center justify-center gap-2 mb-2 tracking-widest text-sm"
          >
             {isAcceptingAll ? (
                <div className="flex gap-2 items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
             ) : (
                <><Check size={20} strokeWidth={3} /> ACCEPT ALL</>
             )}
          </button>
        )}
        {loading ? (
          <div className="flex justify-center py-10">
            <FiveDotLoader colorClass="bg-orange-500" />
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-gray-500 uppercase">{activeChip === 'Out for Pickup' ? 'PICKUP ID: ' : 'ORDER ID: '} <span className="text-gray-800">{activeChip === 'Out for Pickup' ? (order['pickup ID'] || 'N/A') : (order['order ID'] || 'N/A')}</span></span>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="p-4 flex gap-4">
                <div onClick={() => handleOpenEarning(order)} className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={order['product image'] ? order['product image'].split('|||')[0] : 'https://via.placeholder.com/150'} alt="product" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight">{order['product name']}</h3>
                  {order['product tittle name'] && (
                    <p className="text-[10px] text-gray-500 line-clamp-1">{order['product tittle name']}</p>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1">
                    Qty: {order['total quantity']} 
                    {order.size && order.size !== 'N/A' && ` • ${order.size}`}
                    {order.colour && order.colour !== 'N/A' && ` • ${order.colour}`}
                    {order.weight && order.weight !== 'N/A' && ` • ${order.weight}`}
                  </p>
                  <p className="text-xs font-medium text-gray-700 mt-1">Total: ₹ {order['total amount']}</p>
                  <p className="text-[10px] font-semibold text-blue-600 bg-blue-50 w-max px-2 py-0.5 rounded mt-1 uppercase">{order['payment method']}</p>
                  {activeChip === 'Out for Pickup' && order['pickup pin'] && (
                    <p className="text-[11px] font-black text-purple-700 bg-purple-100 border border-purple-200 w-max px-2 py-1 rounded mt-2 tracking-wide uppercase">
                      Pickup Pin: {order['pickup pin']}
                    </p>
                  )}
                </div>
              </div>
              
              {activeChip === 'New Order' && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-0.5">
                  <p className="text-[11px] font-bold text-gray-800">{order['full name']} </p>
                  <p className="text-[10px] text-gray-600 line-clamp-2">{order['full address']}, {order['landmark'] ? `${order['landmark']}, ` : ''}{order['pincode']}</p>
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide mt-0.5">{order['address type']}</p>
                </div>
              )}

              {activeChip === 'New Order' && (
                <div className="p-3 bg-white border-t border-gray-100 flex gap-3">
                  <button 
                    onClick={() => handleStatusUpdate(order.id, order['order ID'], 'Rejected')}
                    disabled={!!isUpdatingId}
                    className="flex-1 py-2.5 rounded-lg border-2 border-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-50 active:scale-95 transition-all h-[40px]"
                  >
                    {isUpdatingId === order.id + '-reject' ? (
                      <div className="flex gap-1 items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    ) : (
                      <><X size={14} strokeWidth={3} /> Reject</>
                    )}
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(order.id, order['order ID'], 'Accepted')}
                    disabled={!!isUpdatingId}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 active:scale-95 transition-all h-[40px]"
                  >
                    {isUpdatingId === order.id + '-accept' ? (
                      <div className="flex gap-1 items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    ) : (
                      <><Check size={14} strokeWidth={3} /> Accept</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Package size={24} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-600 text-sm">No {activeChip}s Found</h3>
            <p className="text-xs text-gray-400 mt-1">Orders will appear here.</p>
          </div>
        )}
      </div>

      {selectedOrderForEarning && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 animate-in slide-in-from-right-4 duration-300 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col max-w-2xl mx-auto border-x border-slate-200 shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shadow-sm shrink-0">
              <h2 className="text-lg font-black text-slate-800">Order Earning Details</h2>
              <button onClick={() => setSelectedOrderForEarning(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto no-scrollbar bg-slate-50 flex-1">
              {earningLoading ? (
                <div className="flex justify-center py-10">
                  <FiveDotLoader colorClass="bg-orange-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order Info Summary */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-3 shadow-sm">
                    <img src={selectedOrderForEarning['product image'] ? selectedOrderForEarning['product image'].split('|||')[0] : 'https://via.placeholder.com/150'} alt="product" className="w-16 h-16 rounded-lg object-cover border border-slate-100" />
                    <div className="flex flex-col justify-center gap-0.5">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">{activeChip === 'Out for Pickup' ? 'PICKUP ID: ' : 'ORDER ID: '} <span className="text-slate-800">{activeChip === 'Out for Pickup' ? (selectedOrderForEarning['pickup ID'] || 'N/A') : (selectedOrderForEarning['order ID'] || 'N/A')}</span></p>
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mt-1">{selectedOrderForEarning['product name']}</h3>
                      {selectedOrderForEarning['product tittle name'] && (
                        <p className="text-[10px] text-slate-500 line-clamp-1">{selectedOrderForEarning['product tittle name']}</p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-0.5">Qty: {selectedOrderForEarning['total quantity']}</p>
                    </div>
                  </div>

                  {(() => {
                    const earnings = calculateOrderEarnings();
                    if (!earnings) return null;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Seller Estimated Earning (Order)</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                            <span>Total Selling Price (Qty: {selectedOrderForEarning['total quantity']})</span>
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
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Platform Estimated</h4>
                            {earnings.calculatedCharges.map(charge => (
                              <div key={charge.id} className="flex justify-between items-center text-[10px] font-medium text-slate-500 mb-1.5">
                                <span>{charge.name}</span>
                                <span className="text-red-500">- ₹ {charge.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          {earnings.giftDonation > 0 && (
                            <div className="flex justify-between items-center text-[10px] font-medium text-slate-500 mb-1.5">
                              <span>Gift / Cash Donation</span>
                              <span className="text-red-500">- ₹ {earnings.giftDonation.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-800">
                            <span>Total Platform Estimate</span>
                            <span className="text-red-500">₹ {earnings.totalPlatformEstimate.toFixed(2)}</span>
                          </div>

                          <div className="pt-3 mt-3 border-t-2 border-slate-800 flex justify-between items-center">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Final Payable Amount</span>
                            <span className="text-lg font-black text-emerald-600">₹ {earnings.finalPayable.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
