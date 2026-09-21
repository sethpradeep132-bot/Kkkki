import { TermsAndConditionsModal } from "./TermsAndConditionsModal";
import { trackShipmentWithConnectedDetails } from '../../utils/trackSearch';
import { TrackResultCard } from './TrackResultCard';
import { AnnouncementChatModal } from "./AnnouncementChatModal";
import { RoleChatModal } from "./RoleChatModal";
import { processShipmentsAddresses } from '../../utils/addressFormatter';
import { registerBackHandler } from '../../lib/backNavigation';
import React, { useEffect, useState, useRef } from 'react';
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
import { X, Package, PackageSearch, ArrowLeft, Download } from 'lucide-react';
import { FiveDotLoader } from './FiveDotLoader';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

export const HubDashboardView = () => {
 const [showTerms, setShowTerms] = useState(false);
 const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
 const [showRoleChatModal, setShowRoleChatModal] = useState(false);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [chatCount, setChatCount] = useState<number>(0);
 const [hubData, setHubData] = useState<any>(null);
 const [hubClusterId, setHubClusterId] = useState<string | null>(null);

 const [showTrackingModal, setShowTrackingModal] = useState(false);
 const [trackingInput, setTrackingInput] = useState("");
 const [trackingError, setTrackingError] = useState(false);
 const [isTracking, setIsTracking] = useState(false);
 const [trackResults, setTrackResults] = useState<any[]>([]);

 useEffect(() => {
 if (!showTrackingModal) return;
 return registerBackHandler(() => {
 setShowTrackingModal(false);
 setTrackingInput('');
 setTrackResults([]);
 setTrackingError(false);
 return true;
 });
 }, [showTrackingModal]);

 const [outerTrackingInput, setOuterTrackingInput] = useState("");
 const [outerStatusMsg, setOuterStatusMsg] = useState<string | null>(null);
 const [outerStatusError, setOuterStatusError] = useState(false);

 const handleOuterTrack = async () => {
 if (outerStatusError || outerStatusMsg || !outerTrackingInput.trim()) return;
 
 const term = outerTrackingInput.trim();
 
 let { data: acceptedData } = await supabase.from('accepted_shipments')
 .select('"shipment type"')
 .or(`"awb number".eq."${term}","order ID".eq."${term}","pickup ID".eq."${term}"`)
 .single();
 
 if (!acceptedData) {
 const { data: finishedData } = await supabase.from('finished_shipments')
 .select('"shipment type"')
 .or(`"awb number".eq."${term}","order ID".eq."${term}","pickup ID".eq."${term}"`)
 .single();
 acceptedData = finishedData;
 }
 
 if (acceptedData && acceptedData["shipment type"]) {
 setOuterStatusMsg(acceptedData["shipment type"]);
 setOuterStatusError(false);
 } else {
 setOuterStatusMsg("invalid format");
 setOuterStatusError(true);
 }
 
 setTimeout(() => {
 setOuterStatusMsg(null);
 setOuterStatusError(false);
 setOuterTrackingInput("");
 }, 3000);
 };

 const handleModalSearch = async () => {
 if (trackingError || !trackingInput.trim()) return;
 
 setIsTracking(true);
 setTrackingError(false);
 setTrackResults([]);
 
 const term = trackingInput.trim();
 const results = await trackShipmentWithConnectedDetails(term);
 
 if (results.length > 0) {
 setTrackResults(results);
 } else {
 setTrackingError(true);
 setTimeout(() => {
 setTrackingError(false);
 setTrackingInput("");
 }, 3000);
 }
 
 setIsTracking(false);
 };

 const handleDownloadBarcodePdf = () => {
 let targetAwb = trackingInput.trim().toUpperCase();
 if (!targetAwb && trackResults.length > 0) {
 const first = trackResults[0];
 targetAwb = String(
 first['awb number'] || 
 first['awb_number'] || 
 first['AWB'] || 
 first['awb'] || 
 first['tracking id number'] || 
 first['tracking_id'] || 
 ''
 ).trim().toUpperCase();
 }
 if (!targetAwb && outerTrackingInput.trim()) {
 targetAwb = outerTrackingInput.trim().toUpperCase();
 }

 if (!targetAwb || targetAwb === 'INVALID FORMAT') {
 alert("Please enter an AWB number in the search box first.");
 return;
 }

 try {
 const canvas = document.createElement('canvas');
 JsBarcode(canvas, targetAwb, {
 format: 'CODE128',
 displayValue: true,
 fontSize: 16,
 font: 'monospace',
 textMargin: 6,
 margin: 10,
 height: 70,
 width: 2.5
 });

 const barcodeData = canvas.toDataURL('image/jpeg', 1.0);

 const doc = new jsPDF({
 orientation: 'landscape',
 unit: 'mm',
 format: [100, 70]
 });

 // Header Brand
 doc.setFillColor(15, 23, 42);
 doc.rect(0, 0, 100, 12, 'F');
 doc.setFont('helvetica', 'bold');
 doc.setFontSize(10);
 doc.setTextColor(255, 255, 255);
 doc.text('SURIYAWAN SHOPPING - LOGISTICS', 50, 8, { align: 'center' });

 // Subtitle
 doc.setFont('helvetica', 'bold');
 doc.setFontSize(9);
 doc.setTextColor(51, 65, 85);
 doc.text('OFFICIAL AWB BARCODE', 50, 18, { align: 'center' });

 // Barcode Image
 doc.addImage(barcodeData, 'JPEG', 5, 20, 90, 40);

 // Footer
 doc.setFont('helvetica', 'normal');
 doc.setFontSize(7);
 doc.setTextColor(100, 116, 139);
 const printTime = new Date().toLocaleString('en-IN');
 doc.text(`Generated: ${printTime}`, 50, 66, { align: 'center' });

 // Download PDF
 doc.save(`Barcode_${targetAwb}.pdf`);
 } catch (err: any) {
 console.error('Error generating barcode PDF:', err);
 alert('Failed to generate barcode PDF: ' + (err.message || 'Unknown error'));
 }
 };


 
    const fetchHubAnnouncementCount = async () => {
    try {
      const { data, error } = await supabase
        .from('announcement_and_update')
        .select('id, hub_manager_update')
        .not('hub_manager_update', 'is', null);
      if (!error && data) {
        const validItems = data.filter(item => {
          if (!item.hub_manager_update) return false;
          const val = typeof item.hub_manager_update === 'string' ? item.hub_manager_update.trim() : item.hub_manager_update;
          return val !== '' && val !== '""' && val !== '{}';
        });
        setUpdateCount(validItems.length);
      }
    } catch (err) {
      console.error('Error fetching hub announcement count:', err);
    }
  };

  useEffect(() => {
    fetchHubAnnouncementCount();

    const channel = supabase
      .channel('hub_announcements_channel_' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_and_update' }, () => {
        fetchHubAnnouncementCount();
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchHubAnnouncementCount();
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
 const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
 if (localData) {
 const data = JSON.parse(localData);
 setHubData(data);
 if (data?.registered_pincode) {
 supabase.from('added_pincode').select('"cluster id"').eq('added pincode', data.registered_pincode).single().then(({data}) => {
 if (data && data['cluster id']) setHubClusterId(data['cluster id']);
 });
 }
 }
 }, []);
 const [readyToPickupCount, setReadyToPickupCount] = useState(0);
 const [outForPickupCount, setOutForPickupCount] = useState(0);
 const [failedPickupCount, setFailedPickupCount] = useState(0);
 const [pickedUpCount, setPickedUpCount] = useState(0);
 const [unableToCompleteCount, setUnableToCompleteCount] = useState(0);
 const [receivedAtHubCount, setReceivedAtHubCount] = useState(0);
 const [dispatchedCount, setDispatchedCount] = useState(0);
 const [inTransitCount, setInTransitCount] = useState(0);
 const [readyToDeliveryCount, setReadyToDeliveryCount] = useState(0);
 const [outForDeliveryCount, setOutForDeliveryCount] = useState(0);
 const [unableToCompleteDeliveryCount, setUnableToCompleteDeliveryCount] = useState(0);
 const [deliveredCount, setDeliveredCount] = useState(0);
 const [failedDeliveryCount, setFailedDeliveryCount] = useState(0);
 const [cancelledOrderCount, setCancelledOrderCount] = useState(0);
 
 const [showReceivedList, setShowReceivedList] = useState(false);
 const [totalCashWithRiders, setTotalCashWithRiders] = useState<number | null>(null);
 const [totalPendingDeposit, setTotalPendingDeposit] = useState<number | null>(null);
 const [showPendingDepositModal, setShowPendingDepositModal] = useState(false);
 const [pendingDepositsList, setPendingDepositsList] = useState<any[]>([]);
 const [showCashCollectionModal, setShowCashCollectionModal] = useState(false);
 const [collectingRiderMap, setCollectingRiderMap] = useState<Record<string, boolean>>({});
 const [cashRidersList, setCashRidersList] = useState<any[]>([]);
 const [selectedRiderForCalc, setSelectedRiderForCalc] = useState<any | null>(null);
 const [calcDenominations, setCalcDenominations] = useState<Record<number, number>>({});
 const [receivedShipments, setReceivedShipments] = useState<any[]>([]);
 const [scanInput, setScanInput] = useState('');
 const [scanMessage, setScanMessage] = useState('');
 const [scanType, setScanType] = useState<'success' | 'error' | ''>('');
 const [loadingReceived, setLoadingReceived] = useState(false);
 const [isDeletingZeros, setIsDeletingZeros] = useState(false);
 const [dashboardPincodes, setDashboardPincodes] = useState<string[]>([]);
 const [selectedDashboardPincodes, setSelectedDashboardPincodes] = useState<string[]>([]);
 const [sellersInfo, setSellersInfo] = useState<Record<string, any>>({});
 const dashboardPincodeRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dashboardPincodeRef.current && !dashboardPincodeRef.current.contains(event.target as Node)) {
 setShowDashboardPincodeDropdown(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);
 
 const toggleDashboardPincode = (pin: string) => {
 if (selectedDashboardPincodes.includes(pin)) {
 setSelectedDashboardPincodes(prev => prev.filter(p => p !== pin));
 } else {
 setSelectedDashboardPincodes(prev => [...prev, pin]);
 }
 };

 const [showDashboardPincodeDropdown, setShowDashboardPincodeDropdown] = useState(false);

  const fetchCashWithRiders = async () => {
    try {
      let userId = null;
      const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
      if (savedAuth) userId = JSON.parse(savedAuth).id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      }
      if (!userId) return;

      const { data: added } = await supabase.from('added_riders').select('"added rider id"').eq('hub manager id', userId);
      if (added && added.length > 0) {
        const rIds = added.map(a => a['added rider id']).filter(Boolean);
        if (rIds.length > 0) {
          const { data: wfData } = await supabase.from('rider_live_work_flow').select('*').in('rider_id', rIds);
          if (wfData && wfData.length > 0) {
            const { data: rData } = await supabase.from('riders').select('id, rider_name, registered_mobile_number').in('id', rIds);
            const groupedMap = new Map<string, any>();
            
            wfData.forEach(wf => {
              const riderId = wf.rider_id;
              const cash = Number(wf['Total Cash']) || 0;
              if (riderId) {
                if (groupedMap.has(riderId)) {
                  const existing = groupedMap.get(riderId);
                  if (cash > existing.cash) {
                    existing.cash = cash;
                    existing.all_pic_dlv = wf['All Pic & Dlv'] ?? existing.all_pic_dlv;
                    existing.pickup = wf['Pickup'] ?? existing.pickup;
                    existing.delivery = wf['Delivery'] ?? existing.delivery;
                    existing.todays_earning = wf["Today's Earning"] ?? existing.todays_earning;
                    existing.performance = wf['Performance'] ?? existing.performance;
                  }
                } else {
                  const r: any = (rData || []).find(r => r.id === riderId) || {};
                  groupedMap.set(riderId, {
                    id: riderId,
                    rider_name: r.rider_name || 'Unknown',
                    registered_mobile_number: r.registered_mobile_number || 'N/A',
                    cash: cash,
                    all_pic_dlv: wf['All Pic & Dlv'] ?? '0',
                    pickup: wf['Pickup'] ?? '0',
                    delivery: wf['Delivery'] ?? '0',
                    todays_earning: wf["Today's Earning"] ?? '0',
                    performance: wf['Performance'] ?? '0'
                  });
                }
              }
            });
            
            // Show riders present in rider_live_work_flow, even if Total Cash is 0
            const validRiders = Array.from(groupedMap.values())
              .sort((a, b) => a.rider_name.localeCompare(b.rider_name));

            const totalCash = validRiders.reduce((acc, curr) => acc + curr.cash, 0);

            setTotalCashWithRiders(totalCash);
            setCashRidersList(prev => {
              const isSame = prev.length === validRiders.length && prev.every((p, i) => 
                p.id === validRiders[i].id && 
                p.cash === validRiders[i].cash && 
                p.pickup === validRiders[i].pickup && 
                p.delivery === validRiders[i].delivery &&
                p.all_pic_dlv === validRiders[i].all_pic_dlv &&
                p.todays_earning === validRiders[i].todays_earning &&
                p.performance === validRiders[i].performance
              );
              return isSame ? prev : validRiders;
            });
          } else {
            setTotalCashWithRiders(0);
            setCashRidersList([]);
          }
        } else {
          setTotalCashWithRiders(0);
          setCashRidersList([]);
        }
      } else {
        setTotalCashWithRiders(0);
        setCashRidersList([]);
      }
    } catch (err) {
      console.error('Error fetching cash with riders:', err);
    }
  };

 useEffect(() => {
 const fetchCounts = async () => {
 try {
 let userId = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
 if (savedAuth) userId = JSON.parse(savedAuth).id;
 
 if (!userId) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) userId = user.id;
 }

 if (!userId) return;

 // Fetch precise hub manager details from added_pincode table to ensure no data is missed
 const { data: hmData } = await supabase.from('hub_managers').select('hub_name, registered_pincode, cluster_id').eq('id', userId).maybeSingle();
 let myHubName = '';
 let myClusterId = null;
 let myRegisteredPincode = '';
 if (hmData) {
 if (hmData.hub_name) myHubName = hmData.hub_name;
 if (hmData.cluster_id) myClusterId = hmData.cluster_id;
 if (hmData.registered_pincode) myRegisteredPincode = hmData.registered_pincode;
 }

 let pQuery = supabase.from('added_pincode').select('*');
 if (myHubName) {
 pQuery = pQuery.or(`"hub manager id".eq.${userId},"hub name".eq."${myHubName}"`);
 } else {
 pQuery = pQuery.eq('hub manager id', userId);
 }
 const { data: addedPincodeData } = await pQuery;
 const myPincodes = addedPincodeData ? addedPincodeData.map(d => d['added pincode']).filter(Boolean) : [];
 if (myRegisteredPincode && !myPincodes.includes(myRegisteredPincode)) {
 myPincodes.push(myRegisteredPincode);
 }
 const myHubNames = addedPincodeData ? [...new Set(addedPincodeData.map(d => d['hub name']).filter(Boolean))] : [];
 if (myHubName && !myHubNames.includes(myHubName)) {
 myHubNames.push(myHubName);
 }

 // 1. Ready to pickup
 const { data: readyShipments } = await supabase.from('accepted_shipments').select('id, "selller id", "hub manager id", "admin id"').ilike('shipment type', '%ready to pickup%');
 let c1 = 0;
 if (readyShipments && readyShipments.length > 0) {
 const cleanMyPincodes = myPincodes.map(p => p?.toString().replace(/\s/g, ''));
 const sellerIds = [...new Set(readyShipments.map(s => s['selller id']).filter(Boolean))];
 if (sellerIds.length > 0) {
 const { data: sellers } = await supabase.from('sellers').select('id, registered_pincode').in('id', sellerIds);
 const validSellerIds = new Set((sellers || []).filter(s => cleanMyPincodes.includes(s.registered_pincode?.toString().replace(/\s/g, ''))).map(s => s.id));
 c1 = readyShipments.filter(s => validSellerIds.has(s['selller id']) || s['hub manager id'] === userId || (myClusterId && s['admin id'] === myClusterId)).length;
 } else {
 c1 = readyShipments.filter(s => s['hub manager id'] === userId || (myClusterId && s['admin id'] === myClusterId)).length;
 }
 }
 setReadyToPickupCount(c1);

 // 2. Out for pickup
 const { count: c2 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).ilike('shipment type', '%out for pickup%');
 if (c2 !== null) setOutForPickupCount(c2);

 // 3. Failed pickup
 const { count: c3 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).in('shipment type', ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild']);
 if (c3 !== null) setFailedPickupCount(c3);

 // 4. Picked up
 const { count: c4 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).ilike('shipment type', '%picked up%');
 if (c4 !== null) setPickedUpCount(c4);

 // 5. Unable to complete
 const { count: c5 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).or('shipment type.ilike.%reschduled pickup%,shipment type.ilike.%rescheduled pickup%,shipment type.ilike.%not attended pickup%,shipment type.ilike.%not attanded pickup%,shipment type.ilike.%no responsed picckup%,shipment type.ilike.%no responsed pickup%,shipment type.ilike.%no response%,shipment type.ilike.%not attend%,shipment type.ilike.%reschedule%');
 if (c5 !== null) setUnableToCompleteCount(c5);

 // 6. Received at Hub (Destination or Origin, so we check hub manager id OR assignment hub name OR pincode)
 const { data: recData } = await supabase.from('accepted_shipments').select('id, "hub manager id", "assignment hub name", "pincode"').ilike('shipment type', '%received at hub%');
 const c6 = (recData || []).filter(s => 
 s['hub manager id'] === userId || 
 (s['assignment hub name'] && myHubNames.includes(s['assignment hub name'])) ||
 (s['pincode'] && myPincodes.includes(s['pincode']?.toString()))
 ).length;
 setReceivedAtHubCount(c6);

 // 7. Dispatched (Outbound)
 const { count: c7 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).ilike('shipment type', '%dispatched%');
 if (c7 !== null) setDispatchedCount(c7);

 // 8. In Transit (Inbound - Dispatched to this hub)
 let c8 = 0;
 if (myHubNames.length > 0) {
 const { count: c8_res } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).in('assignment hub name', myHubNames).ilike('shipment type', '%dispatched%');
 c8 = c8_res || 0;
 }
 setInTransitCount(c8);

 // 9. Ready to Delivery (Shipped)
 const { data: shippedData } = await supabase.from('accepted_shipments').select('id, "hub manager id", "assignment hub name", pincode').ilike('shipment type', '%shipped%');
 const c9 = (shippedData || []).filter(s => 
 s['hub manager id'] === userId || 
 (s['assignment hub name'] && myHubNames.includes(s['assignment hub name'])) ||
 (s['pincode'] && myPincodes.includes(s['pincode']?.toString()))
 ).length;
 setReadyToDeliveryCount(c9);

 // 10. Out for Delivery
 const { count: c10 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).ilike('shipment type', '%out for delivery%');
 if (c10 !== null) setOutForDeliveryCount(c10);

 // 11. Unable to Complete Delivery
 const { count: c11 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).or('shipment type.ilike.%delivery reschduled%,shipment type.ilike.%delivery not attended%,shipment type.ilike.%delivery no responsed%,shipment type.ilike.%no response%,shipment type.ilike.%not attend%,shipment type.ilike.%reschedule%');
 if (c11 !== null) setUnableToCompleteDeliveryCount(c11);

 // 12. Delivered
 const { count: c12 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).ilike('shipment type', '%delivered%');
 if (c12 !== null) setDeliveredCount(c12);

 // 13. Failed Delivery
 const { count: c13 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).ilike('shipment type', '%faild delivery%');
 if (c13 !== null) setFailedDeliveryCount(c13);

 // 14. Cancelled Order
 const { count: c14 } = await supabase.from('accepted_shipments').select('*', { count: 'exact', head: true }).eq('hub manager id', userId).ilike('shipment type', '%rejected by customer%');
 if (c14 !== null) setCancelledOrderCount(c14);

 // Fetch Pending Deposit (Cash with Hub Managers)
 const { data: hmCashData } = await supabase.from('cash_with_hub_managers').select('*').eq('hub manager id', userId).order('created_at', { ascending: true });
 if (hmCashData) {
 const pendingTotal = hmCashData.reduce((acc, curr) => acc + (Number(curr['total cash payment']) || 0), 0);
 setTotalPendingDeposit(pendingTotal);
 setPendingDepositsList(hmCashData);
 } else {
 setTotalPendingDeposit(0);
 setPendingDepositsList([]);
 }

 // Fetch Cash with Riders strictly from rider_live_work_flow
 await fetchCashWithRiders();
 } catch (err) {
 console.error(err);
 }
 };

 fetchCounts();

 const sub = supabase.channel('hub_dashboard_updates_' + Math.random().toString(36).substring(7))
 .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments' }, fetchCounts)
 .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_hub_managers' }, fetchCounts)
 .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_live_work_flow' }, fetchCounts)
 .subscribe();

 return () => { supabase.removeChannel(sub); };
 }, []);

 
 const fetchReceivedShipments = async () => {
 setShowReceivedList(true);
 setLoadingReceived(true);
 try {
 let userId = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
 if (savedAuth) userId = JSON.parse(savedAuth).id;
 
 if (!userId) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) userId = user.id;
 }
 if (!userId) return;
 
 
 const { data: hmData2 } = await supabase.from('hub_managers').select('hub_name').eq('id', userId).maybeSingle();
 let myHubName2 = '';
 if (hmData2 && hmData2.hub_name) {
 myHubName2 = hmData2.hub_name;
 }
 let pQuery2 = supabase.from('added_pincode').select('*').eq('hub manager id', userId);
 if (myHubName2) {
 pQuery2 = pQuery2.eq('hub name', myHubName2);
 }
 const { data: pincodeData } = await pQuery2;
 const myPincodes = pincodeData ? pincodeData.map(d => d['added pincode']).filter(Boolean) : [];
 const myHubNames = pincodeData ? [...new Set(pincodeData.map(d => d['hub name']).filter(Boolean))] : [];
 
 if (pincodeData) {
 const pins = new Set<string>();
 pincodeData.forEach(d => {
 if (d['added pincode']) pins.add(d['added pincode']);
 });
 const sortedPins = Array.from(pins).sort();
 setDashboardPincodes(sortedPins);
 } else {
 setDashboardPincodes([]);
 }

 const { data } = await supabase
 .from('accepted_shipments')
 .select('id, "awb number", "full address", "landmark", "address type", "pincode", "hub manager id", "assignment hub name", "shipment tag", "selller id", "order ID", "product id", "order status"')
 .ilike('shipment type', '%received at hub%');
 
 if (data) {
 const filteredData = data.filter(s => 
 s['hub manager id'] === userId || 
 (s['assignment hub name'] && myHubNames.includes(s['assignment hub name'])) ||
 (s['pincode'] && myPincodes.includes(s['pincode']?.toString()))
 );
 const processed = await processShipmentsAddresses(filteredData);
 
 const sellerIds = [...new Set(processed.map(s => s['selller id']).filter(Boolean))];
 if (sellerIds.length > 0) {
 const { data: sellersData } = await supabase.from('sellers').select('id, shop_name, seller_name, registered_full_address, registered_pincode').in('id', sellerIds);
 if (sellersData) {
 setSellersInfo(prev => {
 const newInfo = { ...prev };
 sellersData.forEach(s => newInfo[s.id] = s);
 return newInfo;
 });
 }
 }
 
 setReceivedShipments(processed);
 }
 } catch(err) {
 console.error(err);
 } finally {
 setLoadingReceived(false);
 }
 };

 
 
 const handleDeleteZeroAmounts = async () => {
 try {
 setIsDeletingZeros(true);
 const adminId = localStorage.getItem('portal_auth_hub') ? JSON.parse(localStorage.getItem('portal_auth_hub')!).id : null;
 if (!adminId) return;

 const { error } = await supabase
 .from('cash_with_hub_managers')
 .delete()
 .eq('hub manager id', adminId)
 .eq('total cash payment', '0');
 
 if (error) throw error;
 
 // Let's also try numeric 0 just in case
 await supabase
 .from('cash_with_hub_managers')
 .delete()
 .eq('hub manager id', adminId)
 .eq('total cash payment', 0 as any);

 // Update local state
 setPendingDepositsList(prev => prev.filter(dep => Number(dep['total cash payment']) !== 0));

 } catch (err) {
 console.error("Error deleting zero amounts:", err);
 } finally {
 setIsDeletingZeros(false);
 }
 };

 const handleCollect = async (rider: any) => {
 if (collectingRiderMap[rider.id]) return;
 try {
 setCollectingRiderMap(prev => ({ ...prev, [rider.id]: true }));
 const adminId = localStorage.getItem('portal_auth_hub') ? JSON.parse(localStorage.getItem('portal_auth_hub')!).id : null;
 if (!adminId) {
 setCollectingRiderMap(prev => ({ ...prev, [rider.id]: false }));
 return;
 }
 
 const riderId = rider.id;
 const collectedCash = rider.cash || 0;
 const dateStr = new Date().toLocaleString('en-IN');
 const shortRiderId = riderId.substring(0, 8);
 const riderName = rider.rider_name || 'Unknown';
 const riderMobile = rider.registered_mobile_number || 'N/A';
 const statusStr = `ID: ${shortRiderId} | Name: ${riderName} | Mob: ${riderMobile} | Date: ${dateStr} | Total Collected Cash: ₹${collectedCash}`;

 // 1. Reset collected cash in cash_with_riders while strictly preserving online payment data
 const cwrPromise = (async () => {
 const { data: rows } = await supabase.from('cash_with_riders').select('*').eq('rider id', riderId);
 if (rows && rows.length > 0) {
 const rowsWithOnline = rows.filter(r => (r['online payment status'] && r['online payment status'].trim() !== '') || (r['total online payment'] !== null && r['total online payment'] !== undefined && r['total online payment'] !== '0' && r['total online payment'] !== ''));
 const rowsWithoutOnline = rows.filter(r => !rowsWithOnline.includes(r));

 if (rowsWithoutOnline.length > 0) {
 const ids = rowsWithoutOnline.map(r => r.id);
 await supabase.from('cash_with_riders').delete().in('id', ids);
 }
 if (rowsWithOnline.length > 0) {
 const ids = rowsWithOnline.map(r => r.id);
 await supabase.from('cash_with_riders').update({
 'cash payment status': null,
 'total cash payment': '0'
 }).in('id', ids);
 }
 }
 })();

 // 2. Transfer specific shipments to finished_shipments
 const shipmentsPromise = (async () => {
 const { data: shipmentsToTransfer } = await supabase.from('accepted_shipments')
 .select('*')
 .eq('Rider id', riderId)
 .eq('shipment type', 'delivered');
 
 if (shipmentsToTransfer && shipmentsToTransfer.length > 0) {
 const finishedData = shipmentsToTransfer.map(s => ({ ...s }));
 const { error: insertAsErr } = await supabase.from('finished_shipments').upsert(finishedData, { onConflict: 'id' });
 if (!insertAsErr) {
 const idsToDelete = shipmentsToTransfer.map(s => s.id);
 for (let i = 0; i < idsToDelete.length; i += 100) {
 await supabase.from('accepted_shipments').delete().in('id', idsToDelete.slice(i, i + 100));
 }
 }
 }
 })();

 // 3. Insert into cash_with_hub_manager
 const payloadCHM = {
 'hub manager id': adminId,
 'cash payment status': statusStr,
 'total cash payment': String(collectedCash)
 };
 const chmPromise = supabase.from('cash_with_hub_managers').insert([payloadCHM]);

 // 4. Transfer and Delete rider_live_work_flow
 const wfPromise = (async () => {
 const { data: liveWfData, error: liveWfErr } = await supabase
 .from('rider_live_work_flow')
 .select('*')
 .eq('rider_id', riderId);
 
 if (!liveWfErr && liveWfData && liveWfData.length > 0) {
 const transferData = liveWfData.map(wf => {
 const newWf = { ...wf };
 delete newWf.id; // avoid primary key conflicts
 delete newWf.created_at; // Ensure fresh timestamp for history
 for (const key in newWf) {
 if (newWf[key] !== null && newWf[key] !== undefined) {
 newWf[key] = String(newWf[key]);
 }
 }
 return newWf;
 });
 const { error: insertErr } = await supabase.from('rider_shipment_work_flow').insert(transferData);
 if (insertErr) console.error("History insert error:", insertErr);
 // ALWAYS delete so Rider Dashboard resets properly to 0
 await supabase.from('rider_live_work_flow').delete().eq('rider_id', riderId);
 } else {
 await supabase.from('rider_live_work_flow').delete().eq('rider_id', riderId);
 }
 })();

 // 5. Update riders table
 const updateRiderPromise = supabase.from('riders').update({
 updated_at: new Date().toISOString(),
 'total collected cash': String(collectedCash)
 }).eq('id', riderId);

 // Run everything concurrently
 await Promise.all([cwrPromise, shipmentsPromise, chmPromise, wfPromise, updateRiderPromise]);

 // Safely update UI
 setCashRidersList(prev => prev.filter(r => r.id !== riderId));
 setTotalCashWithRiders(prev => prev !== null ? prev - collectedCash : 0);

 } catch (err) {
 console.error(err);
 } finally {
 setCollectingRiderMap(prev => ({ ...prev, [rider.id]: false }));
 }
 };


 const handleScan = async (awbValue: string) => {
 if (!awbValue.trim()) return;
 const awb = awbValue.trim().toUpperCase();
 setScanInput(''); // clear it
 setScanType('');
 setScanMessage('');
 
 // Small delay to allow react to reset the state and restart animation if scanned quickly
 await new Promise(r => setTimeout(r, 10));

 let userId = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
 if (savedAuth) userId = JSON.parse(savedAuth).id;
 
 const shipment = receivedShipments.find(s => s['awb number'] === awb);
 
 if (!shipment) {
 setScanMessage('invalid shipment');
 setScanType('error');
 setTimeout(() => setScanType(''), 2500);
 return;
 }

 if (selectedDashboardPincodes.length === 0) {
 setScanMessage('Please select a pincode');
 setScanType('error');
 setTimeout(() => setScanType(''), 2500);
 return;
 }

 if (!shipment.pincode || !selectedDashboardPincodes.includes(shipment.pincode.toString())) {
 setScanMessage('shipment pincode invalid');
 setScanType('error');
 setTimeout(() => setScanType(''), 2500);
 return;
 }

 try {
 const { data: hubData } = await supabase.from('hub_managers').select('hub_name').eq('id', userId).maybeSingle();
 const hubName = hubData ? hubData.hub_name : 'Unknown Hub';
 const dateStr = new Date().toLocaleString('en-IN');
 
 const { data: sData } = await supabase.from('accepted_shipments').select('"order status", "shipment status"').eq('id', shipment.id).maybeSingle();
 const prevOrderStatus = sData ? sData['order status'] || '' : '';
 const prevShipmentStatus = sData ? sData['shipment status'] || '' : '';

 const shipmentStatusMsg = `Order Shipped on ${dateStr} | Hub: ${hubName} | Hub ID: ${userId} | Pincode: ${shipment.pincode}`;
 let newShipmentStatus = prevShipmentStatus;

 let hubNameFromPincode = '';
 let myClusterId = null;
 const { data: hmData3 } = await supabase.from('hub_managers').select('hub_name, cluster_id').eq('id', userId).maybeSingle();
 if (hmData3) {
 if (hmData3.hub_name) hubNameFromPincode = hmData3.hub_name;
 if (hmData3.cluster_id) myClusterId = hmData3.cluster_id;
 }
 
 const updatePayload: any = {
 'hub manager id': userId,
 'cluster id': myClusterId,
 'shipment type': 'shipped',
 
 'updated_at': new Date().toISOString()
 };
 if (hubNameFromPincode) updatePayload['assignment hub name'] = hubNameFromPincode;
 
 updatePayload['shipment status'] = await buildShipmentStatus(shipmentStatusMsg, { ...shipment, 'shipment status': prevShipmentStatus }, updatePayload);

 setScanMessage('shipments shipped successfully');
 setScanType('success');
 setTimeout(() => setScanType(''), 2500);
 
 setReceivedShipments(prev => prev.filter(s => s.id !== shipment.id));

 Promise.all([
 updateAcceptedShipment(updatePayload, shipment.id, shipment),
 supabase.from('customer_orders').update({
 'hub manager id': userId,
 'cluster id': myClusterId,
 'updated_at': new Date().toISOString()
 }).eq('awb number', shipment['awb number'])
 ]).catch(err => {
 console.error('Background update failed', err);
 });
 } catch (err) {
 console.error(err);
 setScanMessage('error updating');
 setScanType('error');
 setTimeout(() => setScanType(''), 2500);
 }
 };

 if (showReceivedList) {
 return (
 <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden font-poppins">
 <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
 <button onClick={() => setShowReceivedList(false)} className="p-1.5 -ml-1 bg-gray-50 rounded-none border border-gray-300 shadow-sm text-gray-700 active:bg-gray-200">
 <ArrowLeft size={16} />
 </button>
 <h2 className="text-base font-bold ml-2 text-gray-800">Received at Hub</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
 
 
 {/* Text box and Ship button at the top */}
 <div className="flex gap-2 relative items-start mb-2">
 <div className="flex-1 relative">
 <input
 type="text"
 value={scanInput}
 onChange={(e) => setScanInput(e.target.value)}
 onKeyDown={(e) => { if(e.key === 'Enter') handleScan(scanInput); }}
 placeholder="Please scan to ship."
 className="w-full h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white font-medium box-border"
 />
 {scanType && scanMessage && (
 <div className={`absolute top-full left-0 mt-0.5 text-xs font-normal tracking-wide whitespace-nowrap z-10 ${scanType === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
 {scanMessage}
 </div>
 )}
 </div>
 <div className="relative shrink-0" ref={dashboardPincodeRef}>
 <button 
 onClick={() => setShowDashboardPincodeDropdown(!showDashboardPincodeDropdown)}
 className="h-[38px] min-h-[38px] max-h-[38px] border border-gray-400 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 rounded-none px-6 text-sm font-bold transition-colors shrink-0 flex items-center justify-center box-border"
 >
 Pincode
 </button>
 {showDashboardPincodeDropdown && (
 <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-300 shadow-lg z-50 max-h-48 overflow-y-auto">
 {dashboardPincodes.length === 0 ? (
 <div className="p-2 text-xs text-gray-500 text-center">No pincodes added</div>
 ) : (
 dashboardPincodes.map(pin => (
 <div 
 key={pin} 
 onClick={() => toggleDashboardPincode(pin)}
 className={`p-2 text-xs border-b border-gray-100 hover:bg-gray-100 cursor-pointer font-medium flex justify-between items-center ${selectedDashboardPincodes.includes(pin) ? 'bg-purple-50 text-purple-700' : 'text-gray-800'}`}
 >
 <span>{pin}</span>
 {selectedDashboardPincodes.includes(pin) && <span>✓</span>}
 </div>
 ))
 )}
 </div>
 )}
 </div>
 </div>


 {loadingReceived ? (
 <div className="flex justify-center py-10"><FiveDotLoader colorClass="bg-blue-500" /></div>
 ) : receivedShipments.length === 0 ? (
 <div className="text-center py-10 text-gray-500 text-sm font-bold">No shipments found.</div>
 ) : (
 <div className="space-y-4 pb-6">
 {receivedShipments.filter(s => {
 if (selectedDashboardPincodes.length === 0) return true;
 const pin = s.pincode || s['pincode'];
 return pin && selectedDashboardPincodes.includes(pin.toString());
 }).map((shipment, i) => (
 <div key={i} className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-none">
 <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50">
 <div className="border border-black px-2 py-1 text-xs font-bold text-black rounded-none">
 AWB: {shipment['awb number'] || 'N/A'}
 </div>
 {shipment['address type'] && (
 <div className="text-[10px] font-bold text-gray-700 uppercase bg-gray-200 px-2 py-1 rounded-none border border-gray-300">
 {shipment['address type']}
 </div>
 )}
 </div>
 <div className="p-3">
 <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
 {shipment['full address']}
 {shipment['landmark'] ? `\nLandmark: ${shipment['landmark']}` : ''}
 {shipment['pincode'] ? `\nPincode: ${shipment['pincode']}` : ''}
 </p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
 }

 return (
 <div className="w-full p-4 space-y-4">
 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
 <h2 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">All Orders Management</h2>
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 <div className="bg-white border border-purple-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
 <Package size={20} className="text-purple-500 mb-1" />
 <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Ready to Pickup</span>
 <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{readyToPickupCount}</span>
 </div>
 <div className="bg-white border border-blue-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
 <PackageSearch size={20} className="text-blue-500 mb-1" />
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
 <div onClick={() => fetchReceivedShipments()} className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition-colors sm:col-span-2">
 <PackageSearch size={20} className="text-blue-500 mb-1" />
 <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Received at Hub</span>
 <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{receivedAtHubCount}</span>
 </div>
 <div className="bg-white border border-purple-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
 <Package size={20} className="text-purple-500 mb-1" />
 <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Dispatched</span>
 <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{dispatchedCount}</span>
 </div>
 <div className="bg-white border border-blue-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
 <Package size={20} className="text-blue-500 mb-1" />
 <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">In Transit</span>
 <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{inTransitCount}</span>
 </div>
 <div className="bg-white border border-teal-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
 <Package size={20} className="text-teal-500 mb-1" />
 <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Ready to delivery</span>
 <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{readyToDeliveryCount}</span>
 </div>
 <div className="bg-white border border-fuchsia-300 rounded-none p-3 flex flex-col items-center justify-center text-center">
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
 <div className="bg-white border border-red-300 rounded-none p-3 flex flex-col items-center justify-center text-center sm:col-span-2">
 <Package size={20} className="text-red-500 mb-1" />
 <span className="text-[10px] font-bold text-slate-900 uppercase text-center w-full whitespace-normal break-words">Failed Delivery</span>
 <span className="text-lg font-black text-slate-900 mt-0.5 break-all text-center w-full whitespace-normal">{failedDeliveryCount}</span>
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
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
 <h2 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Sorting and Tracking</h2>
 <div className="flex flex-col gap-2">
 <form 
 className="flex flex-col gap-1 w-full"
 onSubmit={(e) => {
 e.preventDefault();
 handleOuterTrack();
 }}
 >
 <div className="flex items-center w-full">
 <input 
 type="text" 
 placeholder="Enter AWB or Tracking ID"
 className="flex-1 min-w-0 border border-slate-300 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors text-slate-900 font-medium"
 value={outerTrackingInput}
 onChange={(e) => {
 if (outerStatusError || outerStatusMsg) {
 setOuterStatusMsg(null);
 setOuterStatusError(false);
 }
 setOuterTrackingInput(e.target.value);
 }}
 />
 <button 
 type="button"
 onClick={() => {
 setTrackingInput("");
 setTrackResults([]);
 setTrackingError(false);
 setShowTrackingModal(true);
 }}
 className="shrink-0 border border-purple-600 text-purple-600 bg-white hover:bg-purple-50 active:bg-purple-100 rounded-none px-6 py-2 text-sm font-bold transition-colors">
 Track
 </button>
 </div>
 {(outerStatusMsg || outerStatusError) && (
 <div className={`text-xs font-normal tracking-wide mt-1 ${outerStatusError ? 'text-red-500' : 'text-emerald-600'}`}>
 {outerStatusMsg}
 </div>
 )}
 </form>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
 <h2 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
 Cash Collection
 </h2>
 <div className="flex flex-col gap-2">
 <div className="border border-slate-300 rounded-none p-4 flex flex-col justify-center gap-1 w-full bg-slate-50">
 <span className="text-xs text-slate-500 font-medium uppercase tracking-wider leading-none">Total Cash with Riders</span>
 <span className="text-2xl font-bold text-slate-800 leading-none mt-1 truncate">
 {totalCashWithRiders === null ? (
 <span className="flex items-center gap-1 text-sm font-medium text-slate-500 h-6">
 Calculating
 <span className="flex items-center gap-0.5 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </span>
 ) : (
 `₹ ${totalCashWithRiders}`
 )}
 </span>
 </div>
 <button onClick={() => { fetchCashWithRiders(); setShowCashCollectionModal(true); }} className="w-full border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-none py-2 text-[10px] font-bold transition-colors flex items-center justify-center uppercase tracking-wider">
 Start Collection
 </button>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mt-4">
 <h2 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
 Pending Deposit
 </h2>
 <div className="flex flex-col gap-2">
 <div onClick={() => setShowPendingDepositModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-center gap-1 w-full bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
 <span className="text-xs text-slate-500 font-medium uppercase tracking-wider leading-none">Cash with Hub Manager</span>
 <span className="text-2xl font-bold text-slate-800 leading-none mt-1 truncate">
 {totalPendingDeposit === null ? (
 <span className="flex items-center gap-1 text-sm font-medium text-slate-500 h-6">
 Calculating
 <span className="flex items-center gap-0.5 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </span>
 ) : (
 `₹ ${totalPendingDeposit}`
 )}
 </span>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 mt-4">
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
 updateType="hub_manager_update"
 title="Suriyawan Shopping Updates"
 readOnly={true}
 />
 <RoleChatModal
 isOpen={showRoleChatModal}
 onClose={() => setShowRoleChatModal(false)}
 tableName="chat_for_hub_managers"
 title="Chat with Cluster Support"
 currentUserType="hub_manager"
 currentUserId={hubData?.id || ''}
 currentUserName={hubData?.hub_manager_name || 'Hub Manager'}
 clusterId={hubClusterId}
 />

 <TermsAndConditionsModal isOpen={showTerms} onClose={() => setShowTerms(false)} userType="hub" />
 
 {showPendingDepositModal && (
 <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-slate-800 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
 Pending Deposit Details
 </h3>
 <button onClick={() => setShowPendingDepositModal(false)} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-3">
 {totalPendingDeposit === null ? (
 <div className="flex items-center justify-center py-8 text-sm font-medium text-slate-500">
 loading
 <span className="flex items-center gap-0.5 ml-1 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </div>
 ) : pendingDepositsList.length === 0 ? (
 <div className="text-center text-slate-500 text-sm py-8">No pending deposits found.</div>
 ) : (
 <>
 {(() => {
 const hasZeros = pendingDepositsList.some(dep => Number(dep['total cash payment']) === 0);
 const allAreZeros = pendingDepositsList.length > 0 && pendingDepositsList.every(dep => Number(dep['total cash payment']) === 0);
 
 if (!hasZeros) return null;
 
 return (
 <button
 onClick={allAreZeros ? handleDeleteZeroAmounts : undefined}
 disabled={isDeletingZeros || !allAreZeros}
 className={`w-full mb-3 flex items-center justify-center gap-2 border py-2 rounded-lg text-xs font-bold transition-colors ${
 allAreZeros
 ? 'border-red-500 text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 cursor-pointer'
 : 'border-slate-300 text-slate-500 bg-slate-100 cursor-not-allowed opacity-70'
 }`}
 >
 {isDeletingZeros ? (
 <div className="flex items-center justify-center">
 <span className="flex items-center gap-0.5">
 <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </div>
 ) : (
 'Delete all 0 amount list'
 )}
 </button>
 );
 })()}
 {pendingDepositsList.map((dep, idx) => (
 <div key={dep.id || idx} className="text-xs text-slate-600 bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex flex-col gap-1 mb-2">
 <div className="font-semibold text-slate-800">{dep['cash payment status']}</div>
 <div className="text-emerald-600 font-bold mt-1 text-sm">Amount: ₹ {dep['total cash payment']}</div>
 </div>
 ))}
 </>
 )}
 </div>
 </div>
 </div>
 )}

 {showCashCollectionModal && (
 <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
 Cash Collection
 </h3>
 <button onClick={() => setShowCashCollectionModal(false)} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-3">
 {totalCashWithRiders === null ? (
 <div className="flex items-center justify-center py-8 text-sm font-medium text-slate-500">
 loading
 <span className="flex items-center gap-0.5 ml-1 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </div>
 ) : cashRidersList.length === 0 ? (
 <div className="text-center text-slate-500 text-sm py-8">No riders found in rider live work flow.</div>
 ) : (
 cashRidersList.map(rider => (
 <div key={rider.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm bg-white">
 <div className="flex justify-between items-start">
 <div>
 <span className="font-bold text-slate-800 text-sm block">{rider.rider_name || 'Unknown'}</span>
 <div className="text-xs text-slate-500 font-medium mt-0.5">ID: {rider.id?.substring(0, 8)}</div>
 <div className="text-xs text-slate-500 font-medium">Mob: {rider.registered_mobile_number || 'N/A'}</div>
 </div>
 <div className="text-right">
 <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Cash</span>
 <span className="font-black text-emerald-600 text-lg">₹ {rider.cash}</span>
 </div>
 </div>
 <div className="flex items-center justify-between border-t border-slate-200 pt-2 gap-2">
 <button onClick={() => setSelectedRiderForCalc(rider)} className="flex-1 py-1.5 border border-slate-300 text-xs font-bold text-slate-700 rounded-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">Calculate</button>
 <button disabled={collectingRiderMap[rider.id]} onClick={() => handleCollect(rider)} className={`flex-1 h-[30px] border border-emerald-500 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-sm hover:bg-emerald-100 active:bg-emerald-200 transition-colors flex items-center justify-center ${collectingRiderMap[rider.id] ? 'opacity-70 cursor-not-allowed' : ''}`}>
 {collectingRiderMap[rider.id] ? (
 <div className="flex items-center justify-center gap-1 h-full">
 <div className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
 <div className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
 <div className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
 </div>
 ) : 'Collect'}
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {selectedRiderForCalc && (
 <div className="fixed inset-0 z-[70] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/><path d="M8 4v4"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M12 16h.01"/><path d="M16 16h.01"/><path d="M8 12h.01"/><path d="M8 16h.01"/></svg>
 Calculator
 </h3>
 <button onClick={() => { setSelectedRiderForCalc(null); setCalcDenominations({}); }} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-4">
 <div className="bg-slate-100 rounded-lg p-3 space-y-1">
 <div className="text-xs text-slate-500 font-medium">Rider: <span className="font-bold text-slate-800">{selectedRiderForCalc.rider_name || 'Unknown'}</span></div>
 <div className="text-xs text-slate-500 font-medium">Target Amount: <span className="font-bold text-emerald-600 text-sm">₹{selectedRiderForCalc.cash || 0}</span></div>
 <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-200 mt-1">Entered Amount: <span className="font-bold text-blue-600 text-sm">₹{Object.entries(calcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0)}</span></div>
 <div className="text-xs text-slate-500 font-medium">Remaining Amount: <span className={`font-bold text-sm ${(Number(selectedRiderForCalc.cash) || 0) - Object.entries(calcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0) < 0 ? 'text-red-600' : 'text-orange-600'}`}>₹{(Number(selectedRiderForCalc.cash) || 0) - Object.entries(calcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0)}</span></div>
 </div>
 <div className="space-y-2">
 {[2000, 500, 200, 100, 50, 20, 10, 5, 2, 1].map(den => (
 <div key={den} className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-md shadow-sm">
 <div className="w-16 font-bold text-slate-700 text-right">₹ {den}</div>
 <div className="text-slate-400 font-medium text-xs">x</div>
 <input
 type="number"
 min="0"
 placeholder="0"
 className="flex-1 w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500"
 value={calcDenominations[den] || ''}
 onChange={(e) => setCalcDenominations(prev => ({ ...prev, [den]: parseInt(e.target.value) || 0 }))}
 />
 <div className="text-slate-400 font-medium text-xs">=</div>
 <div className="w-20 font-bold text-emerald-600 text-right bg-emerald-50 px-2 py-1.5 rounded">₹ {(calcDenominations[den] || 0) * den}</div>
 </div>
 ))}
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 bg-white shrink-0">
 <button onClick={() => { setSelectedRiderForCalc(null); setCalcDenominations({}); }} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm">
 Done
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 {showTrackingModal && (
  <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
    <div className="shrink-0 bg-white border-b border-gray-200 p-4 pb-3 flex flex-col gap-1 w-full max-w-md mx-auto z-30">
      <div className="flex items-center gap-2 w-full">
        <input 
          type="text" 
          placeholder="SEARCH AWB..."
          value={trackingInput}
          onChange={(e) => {
            if (trackingError) setTrackingError(false);
            setTrackingInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleModalSearch();
          }}
          className="flex-1 py-2 px-3 border border-black rounded-none bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black uppercase tracking-wider text-sm font-medium text-black min-w-0"
        />
        <button 
          type="button"
          onClick={handleModalSearch}
          className="px-3.5 py-2 border border-black rounded-none bg-black text-white hover:bg-slate-800 active:bg-slate-900 text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-xs flex items-center justify-center text-center"
        >
          Track
        </button>
        <button 
          type="button"
          onClick={handleDownloadBarcodePdf}
          title="Download AWB Barcode PDF"
          className="px-3 py-2 border border-black rounded-none bg-black text-white hover:bg-slate-800 active:bg-slate-900 flex items-center justify-center gap-1 text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs text-center"
        >
          <Download size={14} strokeWidth={2.4} />
          <span>Barcode</span>
        </button>
      </div>
      {trackingError && (
        <div className="text-xs font-normal text-red-500 tracking-wide mt-1">
          invalid format
        </div>
      )}
    </div>
    
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      <div className="w-full max-w-md mx-auto space-y-4">
        {isTracking ? (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 py-10 animate-pulse">
            Scanning...
          </div>
        ) : trackResults.length === 0 ? (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 py-10">
            Enter an AWB number to track
          </div>
        ) : (
          trackResults.map((res, i) => (
            <TrackResultCard key={i} res={res} index={i} hideAdminId={true} />
          ))
        )}
      </div>
    </div>
  </div>
)}
 </div>
 );
};