import React, { useEffect, useState, useMemo } from 'react';
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
            'hub_shipments',
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
import { Html5Qrcode } from 'html5-qrcode';
import { Truck, ArrowLeft, Package, MapPin, Users, Plus, Trash2, Search, CheckCircle2, ChevronDown, Check, FileText, X } from 'lucide-react';
import { TaskDetailView } from './RiderTasksView';
import { processShipmentsAddresses } from '../../utils/addressFormatter';
import { FiveDotLoader } from './FiveDotLoader';

export const HubShipmentsView = ({
  onSubPageChange
}: {
  onSubPageChange?: (hide: boolean) => void;
}) => {
  const [activePage, setActivePage] = useState<'main' | 'create_pickupsheet' | 'create_runsheet' | 'riders' | 'all_sheets' | 'view_sheet'>('main');
  const [sheetFilterType, setSheetFilterType] = useState<'view' | 'close'>('view');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [hubScanInput, setHubScanInput] = useState('');
  const [isHubScannerOpen, setIsHubScannerOpen] = useState(false);
  const html5QrCode = React.useRef<Html5Qrcode | null>(null);

  
  const [hubScanStatus, setHubScanStatus] = useState<{text: string, type: 'success'|'error'} | null>(null);
  
  const handleHubScanSubmit = async (val: string) => {
    if (!val || !val.trim()) return;
    const awb = val.trim();
    setHubScanInput('');
    setHubScanStatus(null);
    await new Promise(r => setTimeout(r, 10)); // Force animation reset
    
    const sheet = allPickupsheets.find((s: any) => s.pickupId === viewingSheetId);
    if (!sheet) return;
    
    const isRunsheet = sheet.type === 'runsheet';
    
    const targetShipment = sheet.shipments.find((s: any) => {
      const type = (s['shipment type'] || '').toLowerCase();
      if (isRunsheet) {
        if (!['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'rejected by customer', 'no response', 'not attend', 'reschedule'].includes(type)) return false;
      } else {
        if (!['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup', 'no response', 'not attend', 'reschedule'].includes(type)) return false;
      }
      // For runsheet it's awb number, for pickupsheet it's pickup ID
      const idToMatch = isRunsheet ? s['awb number'] : s['pickup ID'];
      // Or fallback just in case
      return idToMatch === awb || s['awb number'] === awb || s['pickup ID'] === awb;
    });

    if (!targetShipment) {
      setHubScanStatus({ text: 'Invalid format', type: 'error' });
      setTimeout(() => setHubScanStatus(null), 3000);
      return;
    }

    try {
      const dateStr = new Date().toLocaleString('en-IN');
      const hubManagerInfo = currentUserId || 'Hub';
      
      const currentCoStatus = targetShipment['order status'] || '';
      const currentShipmentStatus = targetShipment['shipment status'] || '';
      
      let attemptCount = 0;
      const attemptStr = targetShipment['attempt'] || '0';
      if (typeof attemptStr === 'string' && attemptStr.includes('/')) {
        attemptCount = parseInt(attemptStr.split('/')[0], 10);
      } else {
        attemptCount = parseInt(attemptStr, 10);
      }
      if (isNaN(attemptCount)) attemptCount = 0;

      const targetTypeLower = (targetShipment['shipment type'] || '').toLowerCase();
      const isUnder3Delivery = isRunsheet && attemptCount < 3 && ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'no response', 'not attend', 'reschedule'].includes(targetTypeLower);

      const orderUpdateLine = isRunsheet 
        ? `Your order has been received at hub on ${dateStr} - AWB: ${targetShipment['awb number'] || 'N/A'}`
        : `Your order has been received at hub on ${dateStr} - Pickup ID: ${targetShipment['pickup ID'] || 'N/A'}`;
        
      let shipmentUpdateLine = isRunsheet
        ? `Received at Hub on ${dateStr} by ${hubManagerInfo} - AWB: ${targetShipment['awb number'] || 'N/A'}`
        : `Received at Hub on ${dateStr} by ${hubManagerInfo} - Pickup ID: ${targetShipment['pickup ID'] || 'N/A'}`;

      if (isUnder3Delivery) {
         shipmentUpdateLine = `${targetTypeLower} on ${dateStr}`;
      }

      if (isRunsheet && !isUnder3Delivery) {
        const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', targetShipment['order ID']);
        if (coRows && coRows.length > 0) {
           let targetRow = coRows.find((r: any) => r['awb number'] === targetShipment['awb number']);
           if (!targetRow) targetRow = coRows.find((r: any) => !r['awb number'] || r['awb number'].trim() === '');
           if (!targetRow) targetRow = coRows[0];
           /* disabled customer_orders update */
        }
      }

      const updatePayload: any = {
          'shipment type': isUnder3Delivery ? 'shipped' : 'received at hub',
          'Rider id': null,
          'hub manager id': null,
          'cluster id': null
      };
      
      if (['picked up', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild'].includes(targetTypeLower)) {
          updatePayload['attempt'] = '';
      }

      updatePayload['shipment status'] = await buildShipmentStatus(shipmentUpdateLine, targetShipment, updatePayload);
      
      const currentTagLower = (targetShipment['shipment tag'] || '').toLowerCase();

      if (isRunsheet) {
          updatePayload['runsheet id'] = null;
          if (targetTypeLower === 'picked up' && currentTagLower === 'customer pickup') {
              updatePayload['shipment tag'] = 'seller delivery';
          } else {
              updatePayload['shipment tag'] = 'customer delivery';
          }
      } else {
          updatePayload['pickupsheet id'] = null;
          if (targetTypeLower === 'picked up' && currentTagLower === 'customer pickup') {
              updatePayload['shipment tag'] = 'seller delivery';
          }
      }
      
      await updateAcceptedShipment(updatePayload, targetShipment.id, targetShipment);
      
      setHubScanStatus({ text: 'Scanned successfully', type: 'success' });
      setTimeout(() => setHubScanStatus(null), 3000);
      fetchAllSheets();
    } catch(err) {
      console.error(err);
      alert('Error updating shipment');
    }
  };

  const startHubScanner = async () => {
    setIsHubScannerOpen(true);
    setTimeout(async () => {
      try {
        html5QrCode.current = new Html5Qrcode('hub-awb-reader');
        await html5QrCode.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 100 } },
          (decodedText) => {
            setHubScanInput(decodedText);
            stopHubScanner();
            handleHubScanSubmit(decodedText);
          },
          (errorMessage) => {
            // Ignore background scan errors
          }
        );
      } catch (err) {
        console.error('Failed to start scanner', err);
        alert('Failed to start scanner. Please ensure camera permissions are granted.');
        setIsHubScannerOpen(false);
      }
    }, 200);
  };

  const stopHubScanner = () => {
    if (html5QrCode.current) {
      try {
        html5QrCode.current.stop().then(() => {
          html5QrCode.current?.clear();
          setIsHubScannerOpen(false);
        }).catch(err => {
          console.warn('Error in stop promise:', err);
          setIsHubScannerOpen(false);
        });
      } catch (err) {
        console.warn('Scanner not running:', err);
        setIsHubScannerOpen(false);
      }
    } else {
      setIsHubScannerOpen(false);
    }
  };

  useEffect(() => {
    if ((activePage === 'riders' || activePage === 'create_pickupsheet' || activePage === 'main') && currentUserId) {
      const fetchAddedRiders = async () => {
        const { data: hmData } = await supabase.from('hub_managers').select('hub_name').eq('id', currentUserId).maybeSingle();
        let myHubName = '';
        if (hmData && hmData.hub_name) {
           myHubName = hmData.hub_name;
        }
        let rQuery = supabase.from('added_riders').select('"added rider id"').eq('hub manager id', currentUserId);
        if (myHubName) {
           rQuery = rQuery.eq('hub name', myHubName);
        }
        const { data: addedRiders } = await rQuery;
        if (addedRiders && addedRiders.length > 0) {
          const ids = addedRiders.map(r => r["added rider id"]);
          const {
            data
          } = await supabase.from('riders').select('id, rider_name, registered_pincode, registered_mobile_number').in('id', ids);
          if (data) {
            setSavedRiders(data);
          } else {
            setSavedRiders([]);
          }
        } else {
          setSavedRiders([]);
        }
      };
      fetchAddedRiders();
    }
  }, [activePage, currentUserId]);

  // existing useEffects...

  useEffect(() => {
    const fetchUser = async () => {
      const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
      let uid = null;
      if (savedAuth) uid = JSON.parse(savedAuth).id;
      if (!uid) {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) uid = user.id;
      }
      setCurrentUserId(uid);
    };
    fetchUser();
  }, []);
  useEffect(() => {
    if (onSubPageChange) {
      onSubPageChange(activePage !== 'main');
    }
  }, [activePage, onSubPageChange]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [sellersInfo, setSellersInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [allPickupsheets, setAllPickupsheets] = useState<any[]>([]);
  const [viewingSheetId, setViewingSheetId] = useState<string | null>(null);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Riders State
  const [riderInput, setRiderInput] = useState('');
  const [riderError, setRiderError] = useState('');
  const [savedRiders, setSavedRiders] = useState<any[]>([]);
  const [isAddingRider, setIsAddingRider] = useState(false);

  // Pickupsheet State
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [isRiderDropdownOpen, setIsRiderDropdownOpen] = useState(false);
  const [riderSearch, setRiderSearch] = useState('');
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);
  const [isPincodeDropdownOpen, setIsPincodeDropdownOpen] = useState(false);
  const [pincodeSearch, setPincodeSearch] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  // Runsheet State
  const [runsheetAwbInput, setRunsheetAwbInput] = useState('');
  const [runsheetAwbError, setRunsheetAwbError] = useState('');
  const [runsheetAwbSuccess, setRunsheetAwbSuccess] = useState('');
  const [runsheetScannedShipments, setRunsheetScannedShipments] = useState<any[]>([]);
  const [runsheetSelectedRider, setRunsheetSelectedRider] = useState<any>(null);
  const [isRunsheetRiderDropdownOpen, setIsRunsheetRiderDropdownOpen] = useState(false);
  const [isConfirmingRunsheet, setIsConfirmingRunsheet] = useState(false);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [riderToRemove, setRiderToRemove] = useState<string | null>(null);
  const fetchReadyToPickup = async () => {
    setLoading(true);
    try {
      // Get hub manager pincode
      let hubPincode = '';
      if (currentUserId) {
        const {
          data: hubData
        } = await supabase.from('hub_managers').select('registered_pincode').eq('id', currentUserId).maybeSingle();
        if (hubData?.registered_pincode) {
          hubPincode = hubData.registered_pincode.toString();
        }
      }
      const {
        data,
        error
      } = await supabase.from('accepted_shipments').select('*').ilike('shipment type', 'ready to pickup');
      if (!error && data) {
        const processedData = await processShipmentsAddresses(data);
        setShipments(processedData);

        // Fetch seller details for these shipments
        const sellerIds = [...new Set(data.map(s => s['selller id']).filter(Boolean))];
        if (sellerIds.length > 0) {
          const {
            data: sellersData,
            error: sellerErr
          } = await supabase.from('sellers').select('id, shop_name, seller_name, registered_full_address, registered_pincode').in('id', sellerIds);
          if (!sellerErr && sellersData) {
            const infoMap: Record<string, any> = {};
            sellersData.forEach(s => {
              infoMap[s.id] = s;
            });
            setSellersInfo(infoMap);

            // Just select the pincode in the dropdown, but keep ALL data in shipments so availablePincodes works!
            if (hubPincode) {
              setSelectedPincodes([hubPincode]);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (activePage === 'create_pickupsheet') {
      fetchReadyToPickup();
    }
  }, [activePage]);
  const handleRunsheetAwbScan = async () => {
    if (!runsheetAwbInput.trim()) return;
    const awb = runsheetAwbInput.trim();
    setRunsheetAwbInput('');
    setRunsheetAwbError('');
    setRunsheetAwbSuccess('');
    await new Promise(r => setTimeout(r, 10)); // Force animation reset

    if (runsheetScannedShipments.some(s => s['awb number'] === awb)) {
      setRunsheetAwbError('AWB already scanned');
      setTimeout(() => setRunsheetAwbError(''), 2000);
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.from('accepted_shipments').select('*').eq('awb number', awb).maybeSingle();
      if (error || !data) {
        setRunsheetAwbError('Shipment not found');
        setTimeout(() => setRunsheetAwbError(''), 2000);
        return;
      }
      if ((data['shipment type'] || '').toLowerCase().trim() !== 'shipped') {
        setRunsheetAwbError('Not in Shipped status');
        setTimeout(() => setRunsheetAwbError(''), 2000);
        return;
      }
      if (data['hub manager id'] !== currentUserId) {
        setRunsheetAwbError('Shipment belongs to another Hub');
        setTimeout(() => setRunsheetAwbError(''), 2000);
        return;
      }
      
      const processedArr = await processShipmentsAddresses([data]);
      const processedData = processedArr[0];

      setRunsheetScannedShipments(prev => [...prev, processedData]);
      setRunsheetAwbSuccess('AWB Added');
      setTimeout(() => setRunsheetAwbSuccess(''), 2000);
    } catch (err) {
      console.error(err);
      setRunsheetAwbError('Error scanning AWB');
      setTimeout(() => setRunsheetAwbError(''), 2000);
    }
  };
  const handleConfirmRunsheet = async () => {
    if (!runsheetSelectedRider) {
      alert("Please select a rider");
      return;
    }
    if (runsheetScannedShipments.length === 0) {
      alert("Please scan at least one shipment");
      return;
    }
    setIsConfirmingRunsheet(true);
    try {
      let newRunsheetId = '';
      let isRSUnique = false;
      let rsLength = 8;
      while (!isRSUnique) {
        let id = '';
        const chars = '0123456789';
        for (let i = 0; i < rsLength; i++) id += chars[Math.floor(Math.random() * chars.length)];
        const { data } = await supabase.from('accepted_shipments').select('"runsheet id"').eq('runsheet id', id);
        if (!data || data.length === 0) {
          newRunsheetId = id;
          isRSUnique = true;
        } else {
          rsLength++;
        }
      }
      const runsheetId = newRunsheetId;
      const formattedDate = new Date().toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      let hubManagerName = '';
      let hubNameFromPincode = '';
      let myClusterId = null;
      if (currentUserId) {
        const { data: hmData } = await supabase.from('hub_managers').select('hub_name, cluster_id').eq('id', currentUserId).maybeSingle();
        if (hmData && hmData.hub_name) {
          hubNameFromPincode = hmData.hub_name;
        }
        if (hmData && hmData.cluster_id) {
          myClusterId = hmData.cluster_id;
        }
        const { data: hubData } = await supabase.from('hub_managers').select('hub_name').eq('id', currentUserId).maybeSingle();
        if (hubData && hubData.hub_name) {
          hubManagerName = hubData.hub_name;
        }
      }
      
      const hubManagerId = currentUserId || '';
      const riderId = runsheetSelectedRider.id;
      const riderName = runsheetSelectedRider.rider_name || '';
      const riderMobile = runsheetSelectedRider.registered_mobile_number || 'N/A';
      
      for (const s of runsheetScannedShipments) {
        let uniqueCode = '';
        let isUnique = false;
        let digits = 6;
        while (!isUnique) {
          uniqueCode = '';
          for(let i = 0; i < digits; i++) {
            uniqueCode += Math.floor(Math.random() * 10).toString();
          }
          const { data, error } = await supabase.from('accepted_shipments').select('"cancellation code"').eq('cancellation code', uniqueCode).maybeSingle();
          if (!data && !error) {
            isUnique = true;
          } else {
            digits++;
          }
        }
        
        const payload: any = {
          'cancellation code': uniqueCode,
          'hub manager id': hubManagerId,
          'cluster id': myClusterId,
          'Rider id': riderId,
          'runsheet id': runsheetId,
          'updated_at': new Date().toISOString()
        };
        if (hubNameFromPincode) payload['assignment hub name'] = hubNameFromPincode;
        
        payload['shipment status'] = await buildShipmentStatus('Runsheet created', s, payload);
        
        await updateAcceptedShipment(payload, s.id, s);
        
        if (s['order ID']) {
          const { data: coRows } = await supabase.from('customer_orders').select('id, "awb number"').eq('order ID', s['order ID']);
          if (coRows && coRows.length > 0) {
             let targetRow = coRows.find(r => r['awb number'] === s['awb number']);
             if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
             if (!targetRow) targetRow = coRows[0];
             /* disabled customer_orders update */
          }
        }
      }
      alert("Runsheet confirmed successfully!");
      setActivePage('main');
      setRunsheetScannedShipments([]);
      setRunsheetSelectedRider(null);
    } catch (err) {
      console.error(err);
      alert("Error confirming runsheet");
    } finally {
      setIsConfirmingRunsheet(false);
    }
  };
  const handleConfirmPickup = async () => {
    if (!selectedRider || selectedShipmentIds.length === 0) return;
    setIsConfirming(true);
    let newPickupId = '';
    let isUnique = false;
    let length = 8;
    while (!isUnique) {
      let id = '';
      const chars = '0123456789';
      for (let i = 0; i < length; i++) id += chars[Math.floor(Math.random() * chars.length)];
      const {
        data
      } = await supabase.from('accepted_shipments').select('"pickupsheet id"').eq('pickupsheet id', id);
      if (!data || data.length === 0) {
        newPickupId = id;
        isUnique = true;
      } else {
        length++;
      }
    }
    let hubManagerId = currentUserId;
    if (!hubManagerId) {
      const {
        data: authData
      } = await supabase.auth.getUser();
      hubManagerId = authData?.user?.id || null;
    }
    const now = new Date().toISOString();
    let hubInfoStr = '';
    let hubNameFromPincode = '';
    let myClusterId = null;
    if (hubManagerId) {
      const { data: hmData } = await supabase.from('hub_managers').select('hub_name, cluster_id').eq('id', hubManagerId).maybeSingle();
      if (hmData && hmData.cluster_id) myClusterId = hmData.cluster_id;
      if (hmData && hmData.hub_name) {
        hubNameFromPincode = hmData.hub_name;
      }
      const {
        data: hubData
      } = await supabase.from('hub_managers').select('id, hub_name, registered_pincode').eq('id', hubManagerId).maybeSingle();
      if (hubData) {
        hubInfoStr = `Hub: ${hubData.hub_name || 'N/A'} (ID: ${hubData.id}, Pin: ${hubData.registered_pincode || 'N/A'})`;
      }
    }
    const formattedDate = new Date(now).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata'
    });
    const riderInfoStr = `Rider: ${selectedRider.rider_name || 'N/A'} (ID: ${selectedRider.id}, Pin: ${selectedRider.registered_pincode || 'N/A'})`;
    const newStatusEntry = `[created pickupsheet - ${formattedDate}] ${hubInfoStr} | ${riderInfoStr}`;

    // Fetch existing shipments to append status
    const {
      data: existingShipments
    } = await supabase.from('accepted_shipments').select('*').in('id', selectedShipmentIds);
    let hasError = false;
    if (existingShipments) {
      for (const ship of existingShipments) {
        const currentOrderStatus = ship['order status'] || '';
        const updatedOrderStatus = currentOrderStatus ? currentOrderStatus + ' || ' + newStatusEntry : newStatusEntry;
        
        const updatePayload: any = {
          'hub manager id': hubManagerId,
          'cluster id': myClusterId,
          'Rider id': selectedRider.id,
//'order status': updatedOrderStatus,
          'pickupsheet id': newPickupId,
          'updated_at': now
        };
        updatePayload['shipment status'] = await buildShipmentStatus(newStatusEntry, ship, updatePayload);
        if (hubNameFromPincode) updatePayload['assignment hub name'] = hubNameFromPincode;

        const { error: updErr } = await updateAcceptedShipment(updatePayload, ship.id, ship);
        
        await supabase.from('finished_shipments').update(updatePayload).eq('id', ship.id);
        
        if (ship['order ID']) {
          const { data: coRows } = await supabase.from('customer_orders').select('id, "order status", "awb number"').eq('order ID', ship['order ID']);
          if (coRows && coRows.length > 0) {
             let targetRow = coRows.find(r => r['awb number'] === ship['awb number']);
             if (!targetRow) targetRow = coRows.find(r => !r['awb number'] || r['awb number'].trim() === '');
             if (!targetRow) targetRow = coRows[0];
             /* disabled customer_orders update */
          }
        }
        if (updErr) hasError = true;
      }
    }
    const error = hasError ? new Error('Update failed') : null;
    setIsConfirming(false);
    if (!error) {
      setSelectedShipmentIds([]);
      setSelectedRider(null);
      setActivePage('main');
    } else {
      alert("Error confirming pickup sheet.");
    }
  };
  const fetchAllSheets = async () => {
    setLoadingSheets(prev => (allPickupsheets.length === 0 ? true : prev));
    const { data, error } = await supabase.from('accepted_shipments').select('*').or('"pickupsheet id".not.is.null,"runsheet id".not.is.null').order('created_at', { ascending: true });
    if (!error && data) {
      // 1. Fetch all sellers data
      const sellerIds = [...new Set(data.map((s: any) => {
        const id = s['selller id'] || s['seller id'] || s.seller_id;
        return id ? String(id).trim() : null;
      }).filter(Boolean))];
      const infoMap: Record<string, any> = {};
      if (sellerIds.length > 0) {
        const { data: sellersData } = await supabase.from('sellers').select('id, shop_name, seller_name, registered_full_address, registered_pincode, registered_mobile_number').in('id', sellerIds);
        if (sellersData) {
          sellersData.forEach(s => {
            infoMap[s.id] = s;
            infoMap[String(s.id).trim()] = s;
          });
        }
      }

      // Fetch all sellers if any seller wasn't found or to ensure comprehensive mapping
      const { data: allSellersData } = await supabase.from('sellers').select('id, shop_name, seller_name, registered_full_address, registered_pincode, registered_mobile_number');
      if (allSellersData) {
        allSellersData.forEach(s => {
          infoMap[s.id] = s;
          infoMap[String(s.id).trim()] = s;
        });
        setSellersInfo(prev => ({
          ...prev,
          ...infoMap
        }));
      }

      // 2. Fetch all customer orders data
      const orderIds = [...new Set(data.map((s: any) => {
        const id = s['order ID'] || s['order_id'] || s.order_id;
        return id ? String(id).trim() : null;
      }).filter(Boolean))];
      const customerOrdersMap: Record<string, any> = {};
      if (orderIds.length > 0) {
        const { data: coData } = await supabase.from('customer_orders').select('id, "order ID", "full name", "full address", landmark, pincode, "mobile number"').in('order ID', orderIds);
        if (coData) {
          coData.forEach((co: any) => {
            if (co['order ID']) {
              customerOrdersMap[co['order ID']] = co;
              customerOrdersMap[String(co['order ID']).trim()] = co;
            }
          });
        }
      }

      // 3. Process shipments with 100% accurate addresses and details matching Rider Portal logic
      const processedShipments = data.map((s: any) => {
        const sTagLower = (s['shipment tag'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
        const sTypeLower = (s['shipment type'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();

        const isSellerDelivery = sTagLower.includes('seller delivery') || sTagLower.includes('selller delivery');
        const isCustomerDelivery = sTagLower.includes('customer delivery') || (!isSellerDelivery && sTypeLower === 'out for delivery');

        const isCustomerPickup = sTagLower.includes('customer pickup');
        const isSellerPickup = sTagLower.includes('seller pickup') || sTagLower.includes('selller pickup') || (!isCustomerPickup && sTypeLower === 'out for pickup');

        const isCustomerTask = isCustomerDelivery || isCustomerPickup;

        if (isCustomerTask) {
          const rawOrderId = s['order ID'] || s['order_id'] || s.order_id || '';
          const trimmedOrderId = String(rawOrderId).trim();
          const co = customerOrdersMap[trimmedOrderId] || customerOrdersMap[rawOrderId] || {};

          const cName = co['full name'] || s['full name'] || 'Customer';
          const cAddr = co['full address'] || s['full address'] || s.address || '';
          const cLandmark = (co['landmark'] !== undefined && co['landmark'] !== null && co['landmark'] !== '') ? co['landmark'] : (s['landmark'] || '');
          const cPin = co['pincode'] || s['pincode'] || '';
          const cMobile = co['mobile number'] || s['mobile number'] || '';

          return {
            ...s,
            'full name': cName,
            'full address': cAddr,
            'landmark': cLandmark,
            'pincode': cPin,
            'mobile number': cMobile,
            'address type': 'Customer Address',
            displayName: cName,
            resolvedAddress: cAddr,
            resolvedLandmark: cLandmark,
            resolvedPincode: cPin,
            isCustomerTask: true
          };
        } else {
          // Seller task (seller pickup or seller delivery)
          const rawSellerId = s['selller id'] || s['seller id'] || s.seller_id || '';
          const trimmedSellerId = String(rawSellerId).trim();
          const sInfo = infoMap[trimmedSellerId] || infoMap[rawSellerId] || {};

          const sShop = sInfo.shop_name || '';
          const sName = sInfo.seller_name || 'Seller';
          const sDisplayName = sShop ? `${sShop} - ${sName}` : sName;
          const sAddr = sInfo.registered_full_address || '';
          const sPin = sInfo.registered_pincode || '';
          const sMobile = sInfo.registered_mobile_number || '';

          const rawOrderId = s['order ID'] || s['order_id'] || s.order_id || '';
          const trimmedOrderId = String(rawOrderId).trim();
          const co = customerOrdersMap[trimmedOrderId] || customerOrdersMap[rawOrderId] || {};

          return {
            ...s,
            'full name': sName,
            'shop_name': sShop,
            'full address': sAddr,
            'landmark': '', // Seller task has NO landmark!
            'pincode': sPin,
            'mobile number': sMobile,
            'address type': 'Seller Address',
            displayName: sDisplayName,
            resolvedAddress: sAddr,
            resolvedLandmark: '',
            resolvedPincode: sPin,
            isCustomerTask: false,
            customerName: co['full name'] || '',
            customerAddress: co['full address'] || '',
            customerLandmark: co['landmark'] || '',
            customerPincode: co['pincode'] || '',
            customerMobile: co['mobile number'] || '',
            customerOrder: co
          };
        }
      });

      const sheetsMap: Record<string, any> = {};
      const riderIds = new Set<string>();
      processedShipments.forEach(s => {
        const pId = s['pickupsheet id'];
        const rId = s['runsheet id'];
        
        if (pId && String(pId).trim() !== '' && String(pId).trim() !== 'null') {
          if (!sheetsMap[pId]) {
            sheetsMap[pId] = {
              pickupId: pId,
              riderId: s['Rider id'],
              type: 'pickupsheet',
              shipments: [],
              date: s.updated_at || s.created_at
            };
          } else if (!sheetsMap[pId].riderId && s['Rider id']) {
             sheetsMap[pId].riderId = s['Rider id'];
          }
          sheetsMap[pId].shipments.push(s);
          if (s['Rider id']) riderIds.add(s['Rider id']);
        }
        
        if (rId && String(rId).trim() !== '' && String(rId).trim() !== 'null') {
          if (!sheetsMap[rId]) {
            sheetsMap[rId] = {
              pickupId: rId,
              riderId: s['Rider id'],
              type: 'runsheet',
              shipments: [],
              date: s.updated_at || s.created_at
            };
          } else if (!sheetsMap[rId].riderId && s['Rider id']) {
             sheetsMap[rId].riderId = s['Rider id'];
          }
          sheetsMap[rId].shipments.push(s);
          if (s['Rider id']) riderIds.add(s['Rider id']);
        }
      });
      
      const sheetsList = Object.values(sheetsMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (riderIds.size > 0) {
        const { data: ridersData } = await supabase.from('riders').select('id, rider_name').in('id', Array.from(riderIds));
        if (ridersData) {
          sheetsList.forEach(sheet => {
            const r = ridersData.find(x => x.id === sheet.riderId);
            if (r) sheet.riderName = r.rider_name;
          });
        }
      }
      setAllPickupsheets(sheetsList);
    }
    setLoadingSheets(false);
  };

  useEffect(() => {
    if (activePage === 'all_sheets' || activePage === 'view_sheet') {
      fetchAllSheets();

      const sub = supabase.channel('hub_all_sheets_sync_' + Math.random().toString(36).substring(7))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments' }, () => {
          fetchAllSheets();
        })
        .subscribe();

      const interval = setInterval(() => {
        fetchAllSheets();
      }, 2500);

      return () => {
        supabase.removeChannel(sub);
        clearInterval(interval);
      };
    }
  }, [activePage]);

  const handleCloseSheet = (targetSheet: any) => {
    if (!targetSheet) return;
    const pendingHubReceive = (targetSheet.shipments || []).filter((s: any) => {
      const type = (s['shipment type'] || '').toLowerCase().trim();
      const tag = (s['shipment tag'] || '').toLowerCase().trim();
      if (targetSheet.type === 'runsheet') {
        const isDelivered = type === 'delivered' && (tag === 'seller delivery' || tag === 'selller delivery' || tag === 'customer delivery');
        if (isDelivered) return false;
        return ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'no response', 'not attend', 'reschedule'].includes(type);
      }
      return ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup', 'no response', 'not attend', 'reschedule'].includes(type);
    });

    if (pendingHubReceive.length > 0) {
      setViewingSheetId(targetSheet.pickupId);
      setSheetFilterType('close');
      setActivePage('view_sheet');
    } else {
      alert(`${targetSheet.type === 'runsheet' ? 'Runsheet' : 'Pickupsheet'} closed successfully!`);
      setActivePage('all_sheets');
      fetchAllSheets();
    }
  };
  const handleAddRider = async () => {
    setRiderError('');
    if (!riderInput.trim()) return;
    setIsAddingRider(true);
    try {
      const {
        data,
        error
      } = await supabase.from('riders').select('id, rider_name, registered_pincode').eq('id', riderInput.trim()).maybeSingle();
      if (error || !data) {
        setRiderError('Invalid Rider ID');
        return;
      }
      const {
        data: addedRiderData
      } = await supabase.from('added_riders').select('"hub manager id"').eq('added rider id', data.id).limit(1).maybeSingle();
      
      if (addedRiderData && addedRiderData['hub manager id']) {
        const {
          data: hubData
        } = await supabase.from('hub_managers').select('hub_name, registered_pincode').eq('id', addedRiderData['hub manager id']).maybeSingle();
        if (hubData) {
          setRiderError(`Already added by Hub: ${hubData.hub_name || ''} (Pin: ${hubData.registered_pincode || ''})`);
        } else {
          setRiderError('Already added by another Hub');
        }
        return;
      }

      
      if (savedRiders.find(r => r.id === data.id)) {
        let hId = currentUserId;
        if (!hId) {
          const {
            data: authData
          } = await supabase.auth.getUser();
          if (authData?.user) hId = authData.user.id;
        }
        if (hId) {
          const {
            data: hubData
          } = await supabase.from('hub_managers').select('hub_name, registered_pincode').eq('id', hId).maybeSingle();
          if (hubData) {
            setRiderError(`Already added by Hub: ${hubData.hub_name || ''} (Pin: ${hubData.registered_pincode || ''})`);
            return;
          }
        }
        setRiderError('Already addeded');
        return;
      }
      if (currentUserId) {
        let hubNameForRider = null;
        const { data: hubData } = await supabase.from('hub_managers').select('hub_name, cluster_id').eq('id', currentUserId).maybeSingle();
        if (hubData && hubData.hub_name) {
          hubNameForRider = hubData.hub_name;
        }

        const insertPayload: any = {
          "hub manager id": currentUserId,
          "added rider id": data.id
        };
        if (hubNameForRider) {
          insertPayload["hub name"] = hubNameForRider;
        }

        const {
          error: insertErr
        } = await supabase.from('added_riders').insert(insertPayload);
        
        if (insertErr) {
          setRiderError('Failed to add rider to DB');
          return;
        }

        if (hubData && hubData.cluster_id) {
          await supabase.from('riders').update({ 'cluster_id': hubData.cluster_id }).eq('id', data.id);
        }
      }
      setSavedRiders(prev => {
        const exists = prev.find(r => r.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
      setRiderInput('');
    } catch (err) {
      setRiderError('Invalid Rider ID');
    } finally {
      setIsAddingRider(false);
    }
  };
  const handleRemoveRider = (id: string) => {
    setRiderToRemove(id);
  };
  const confirmRemoveRider = async () => {
    if (riderToRemove && currentUserId) {
      await supabase.from('added_riders').delete().eq('hub manager id', currentUserId).eq('added rider id', riderToRemove);
      setSavedRiders(prev => prev.filter(r => r.id !== riderToRemove));
      if (selectedRider?.id === riderToRemove) setSelectedRider(null);
      setRiderToRemove(null);
    }
  };

  // Process data for Pickupsheet
  const [availablePincodes, setAvailablePincodes] = useState<string[]>([]);
  useEffect(() => {
    if ((activePage === 'create_pickupsheet' || activePage === 'main') && currentUserId) {
      const fetchPincodes = async () => {
        const { data: hmData } = await supabase.from('hub_managers').select('hub_name').eq('id', currentUserId).maybeSingle();
        let myHubName = '';
        if (hmData && hmData.hub_name) {
           myHubName = hmData.hub_name;
        }
        let pQuery = supabase.from('added_pincode').select('"added pincode"').eq('hub manager id', currentUserId);
        if (myHubName) {
           pQuery = pQuery.eq('hub name', myHubName);
        }
        const { data } = await pQuery;
        if (data) {
          const pins = new Set<string>();
          data.forEach(d => {
            if (d['added pincode']) pins.add(d['added pincode']);
          });
          setAvailablePincodes(Array.from(pins).sort());
        }
      };
      fetchPincodes();
    }
  }, [activePage, currentUserId]);
  const lockedPincodes = useMemo(() => {
    const locked = new Set<string>();
    shipments.forEach(s => {
      if (s['hub manager id'] && s['hub manager id'] !== currentUserId) {
        const seller = sellersInfo[s['selller id']];
        if (seller?.registered_pincode) {
          locked.add(seller.registered_pincode.toString());
        }
      }
    });
    return Array.from(locked);
  }, [shipments, sellersInfo, currentUserId]);
  const filteredShipments = useMemo(() => {
    if (selectedPincodes.length === 0) return []; // Only show selected pincodes
    return shipments.filter(s => {
      const pin = s.pincode || s['pincode'];
      if (!pin) return false;
      return selectedPincodes.includes(pin.toString());
    });
  }, [shipments, sellersInfo, selectedPincodes]);
  const toggleShipmentSelection = (id: string) => {
    setSelectedShipmentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const togglePincode = async (pin: string) => {
    if (selectedPincodes.includes(pin)) {
      let hId = currentUserId;
      if (!hId) {
        const {
          data: authData
        } = await supabase.auth.getUser();
        if (authData?.user) hId = authData.user.id;
      }
      if (hId) {
        const {
          data: hubData
        } = await supabase.from('hub_managers').select('hub_name').eq('id', hId).maybeSingle();
        if (hubData) {
          setPincodeError(`Selected by ${hubData.hub_name || ''}`);
        } else {
          setPincodeError('Selected');
        }
      }
    } else {
      setSelectedPincodes(prev => [...prev, pin]);
      setPincodeError('');
    }
  };
  const removePincode = (pin: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPincodes(prev => prev.filter(x => x !== pin));
    setPincodeError('');
  };
  if (selectedTask) {
    return <TaskDetailView task={selectedTask} seller={sellersInfo[selectedTask['selller id']] || {}} isHubView={true} onBack={() => {
      setSelectedTask(null);
      if (activePage === 'view_sheet') fetchAllSheets();
    }} />;
  }
  if (activePage === 'create_runsheet') {
    return <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden">
        <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
          <button onClick={() => setActivePage('main')} className="p-1.5 -ml-1 bg-gray-50 rounded-full shadow-sm text-gray-700">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold ml-2 text-gray-800">Create Runsheet</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-1 relative">
              <input type="text" value={runsheetAwbInput} onChange={e => setRunsheetAwbInput(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter') handleRunsheetAwbScan();
            }} placeholder="Scan or Enter AWB..." className={`w-full h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white font-medium box-border`} />
              {(runsheetAwbError || runsheetAwbSuccess) && (
                <div className={`absolute top-full left-0 mt-0.5 text-xs font-normal tracking-wide whitespace-nowrap z-10 ${runsheetAwbError ? 'text-red-500' : 'text-emerald-600'}`}>
                  {runsheetAwbError || runsheetAwbSuccess}
                </div>
              )}
            </div>
            
            <div className="relative shrink-0 w-[180px]">
              <button onClick={() => setIsRunsheetRiderDropdownOpen(!isRunsheetRiderDropdownOpen)} className={`w-full h-[38px] min-h-[38px] max-h-[38px] bg-white border ${runsheetSelectedRider ? 'border-purple-500 text-purple-700' : 'border-gray-300 text-gray-700'} rounded-none px-3 text-left text-xs font-bold flex justify-between items-center box-border shrink-0`}>
                <span className="truncate">{runsheetSelectedRider ? `✓ ${runsheetSelectedRider.rider_name} (${runsheetSelectedRider.id?.substring(0,8)})` : 'Select Rider'}</span>
                <ChevronDown size={14} className={runsheetSelectedRider ? "text-purple-500" : "text-gray-500"} />
              </button>
              {isRunsheetRiderDropdownOpen && <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-30 max-h-48 overflow-y-auto">
                  {savedRiders.map((rider, i) => {
                    const isSelected = runsheetSelectedRider?.id === rider.id;
                    return (
                      <div key={i} onClick={() => {
                        setRunsheetSelectedRider(rider);
                        setIsRunsheetRiderDropdownOpen(false);
                      }} className={`p-2 border-b border-gray-100 text-xs cursor-pointer hover:bg-gray-50 font-bold ${isSelected ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            {rider.rider_name} - {rider.id?.substring(0,8)}<br />
                            <span className="text-[10px] opacity-80 font-medium">Mob: {rider.registered_mobile_number || 'N/A'}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-purple-600 mt-0.5" />}
                        </div>
                      </div>
                    );
                  })}
                  {savedRiders.length === 0 && <div className="p-2 text-xs text-gray-500 text-center">No saved riders found</div>}
                </div>}
            </div>
          </div>

          <div className="border border-black bg-white p-2 flex items-center justify-between mb-4 mt-2 shrink-0">
            <div className="flex-1 overflow-x-auto whitespace-nowrap flex gap-2 text-xs mr-3 no-scrollbar" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
               {Array.from(new Set(runsheetScannedShipments.map(s => s['order ID']).filter(Boolean))).map((oId, idx) => <span key={idx} className="text-gray-700 bg-gray-100 px-2 py-0.5 border border-gray-200">
                    {oId}
                  </span>)}
            </div>
            <button onClick={e => {
            const orderIds = Array.from(new Set(runsheetScannedShipments.map(s => s['order ID']).filter(Boolean))).join(', ');
            navigator.clipboard.writeText(orderIds);
            const btn = e.currentTarget;
            const original = btn.innerText;
            btn.innerText = 'COPIED!';
            setTimeout(() => btn.innerText = original, 2000);
          }} className="shrink-0 border border-black bg-white hover:bg-gray-100 active:bg-gray-200 px-3 py-1 text-[10px] font-bold text-black uppercase transition-colors">
              Copy
            </button>
          </div>
          <div className="text-xs font-bold text-gray-500 mb-2 shrink-0">{runsheetScannedShipments.length} Shipments</div>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {(() => {
              const groups = {};
              runsheetScannedShipments.forEach(s => {
                const oId = s['order ID'] || 'N/A';
                if (!groups[oId]) {
                  const tagLower = (s['shipment tag'] || '').toLowerCase();
                  const useCustomerDetails = tagLower === 'customer pickup' || tagLower === 'customer delivery';
                  const seller = sellersInfo[s['selller id']] || {};
                  
                  groups[oId] = {
                    orderId: oId,
                    shipmentIds: [s.id],
                    quantity: 0,
                    tags: new Set(),
                    address: useCustomerDetails ? s['full address'] : (seller.registered_full_address || s['full address']),
                    landmark: useCustomerDetails ? s['landmark'] : '',
                    pincode: useCustomerDetails ? s['pincode'] : (seller.registered_pincode || s['pincode'])
                  };
                } else {
                  groups[oId].shipmentIds.push(s.id);
                }
                const q = parseFloat(s['quantity'] || '1');
                groups[oId].quantity += (isNaN(q) ? 1 : q);
                if (s['shipment tag']) {
                  groups[oId].tags.add(s['shipment tag']);
                }
              });
              
              return Object.values(groups).map((group: any, i: number) => (
                <div key={i} className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-none relative">
                  <button onClick={() => setRunsheetScannedShipments(prev => prev.filter(s => !group.shipmentIds.includes(s.id)))} className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500 active:scale-95 transition-all bg-white rounded-full p-0.5 shadow-sm border border-gray-200 z-10">
                    <X size={14} />
                  </button>
                  <div className="flex items-center px-3 py-2 border-b border-gray-200 bg-gray-50 pr-8 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 flex-nowrap w-max">
                      <div className="border border-black px-2 py-1 text-[11px] sm:text-xs font-bold text-black rounded-none whitespace-nowrap">
                        Order ID: {group.orderId}
                      </div>
                      <div className="border border-black px-2 py-1 text-[11px] sm:text-xs font-bold text-black rounded-none whitespace-nowrap">
                        Qty: {group.quantity}
                      </div>
                      {Array.from(group.tags).map((tag: any, tIdx: number) => (
                        <div key={tIdx} className="text-[10px] font-bold text-gray-700 uppercase bg-gray-200 px-2 py-1 rounded-none border border-gray-300 whitespace-nowrap">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {group.address}
                      {group.landmark ? `, ${group.landmark}` : ''}
                      {group.pincode ? `, ${group.pincode}` : ''}
                    </p>
                  </div>
                </div>
              ));
            })()}
            {runsheetScannedShipments.length === 0 && <div className="flex items-center justify-center h-20 text-xs text-gray-400 font-medium">
                  No shipments scanned yet
               </div>}
          </div>

          <div className="flex gap-3 shrink-0">
             <button onClick={() => {
            setRunsheetScannedShipments([]);
            setActivePage('main');
            setRunsheetSelectedRider(null);
          }} className="flex-1 border border-gray-400 bg-white text-gray-700 py-3 text-sm font-bold active:scale-95 transition-all rounded-none">
                Cancel
             </button>
             <button onClick={handleConfirmRunsheet} disabled={isConfirmingRunsheet || runsheetScannedShipments.length === 0 || !runsheetSelectedRider} className="flex-1 border border-purple-600 bg-white text-purple-600 py-3 text-sm font-bold active:scale-95 transition-all disabled:opacity-50 rounded-none">
                {isConfirmingRunsheet ? 'Confirming...' : 'Confirm Runsheet'}
             </button>
          </div>
        </div>
      </div>;
  }
  if (activePage === 'riders') {
    return <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden">
        <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
          <button onClick={() => setActivePage('main')} className="p-1.5 -ml-1 bg-gray-50 rounded-full shadow-sm text-gray-700">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold ml-2 text-gray-800">Assign Rider</h2>
        </div>
        
        {isAddingRider && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex gap-2 p-4 bg-white shadow-md rounded-full border border-slate-200">
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div className="p-4 flex-1 overflow-y-auto w-full max-w-full relative">
          <div className="mb-6 w-full">
            <label className="text-xs font-bold text-slate-800 uppercase mb-2 block">Add Rider by ID</label>
            <div className="flex items-stretch gap-2 w-full max-w-full">
              <input type="text" placeholder="Enter Rider ID" value={riderInput} onChange={e => setRiderInput(e.target.value)} disabled={isAddingRider} className="flex-1 min-w-0 border border-slate-900 rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50" />
              <button onClick={handleAddRider} disabled={isAddingRider} className="shrink-0 bg-transparent text-slate-900 border border-slate-900 px-4 py-2 rounded-none font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1 w-20 disabled:opacity-50 disabled:cursor-not-allowed">
                {isAddingRider ? (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <><Plus size={16} /> Add</>
                )}
              </button>
            </div>
            {riderError && <p className="text-sm font-medium text-red-500 mt-2 flex items-center gap-1"><span className="text-red-500 text-sm">⚠</span> {riderError}</p>}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Saved Riders List</h3>
            {savedRiders.length > 0 ? savedRiders.map(rider => <div key={rider.id} className="bg-white border border-slate-900 p-3 flex items-center justify-between rounded-none shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{rider.rider_name || 'Unknown'}</h4>
                    <p className="text-xs text-slate-500 font-medium">ID: {rider.id}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pin: {rider.registered_pincode || 'N/A'}</p>
                  </div>
                  <button onClick={() => handleRemoveRider(rider.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-none transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>) : <div className="text-center py-10 border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm font-medium">No riders added yet.</p>
              </div>}
          </div>
        </div>
        
        {/* Custom Confirm Modal for Removal */}
        {riderToRemove && <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
              <h3 className="text-base font-bold text-slate-800 mb-2">Remove Rider</h3>
              <p className="text-sm text-slate-600 mb-5">Are you sure you want to remove this rider from the list?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setRiderToRemove(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">
                  Cancel
                </button>
                <button onClick={confirmRemoveRider} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">
                  Confirm
                </button>
              </div>
            </div>
          </div>}
      </div>;
  }
  if (activePage === 'create_pickupsheet') {
    return <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden">
        <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
          <button onClick={() => setActivePage('main')} className="p-1.5 -ml-1 bg-gray-50 rounded-full shadow-sm text-gray-700">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold ml-2 text-gray-800">Create Pickup Sheet</h2>
        </div>

        {/* Click-away overlay for dropdowns */}
        {(isRiderDropdownOpen || isPincodeDropdownOpen) && <div className="fixed inset-0 z-40" onClick={() => {
        setIsRiderDropdownOpen(false);
        setIsPincodeDropdownOpen(false);
      }} />}

        {/* Selection Area */}
        <div className="bg-white border-b border-gray-200 p-3 shrink-0 flex gap-2 relative z-50 shadow-sm">
          {/* Rider Selection Box */}
          <div className="w-[60%] relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Select Rider</label>
            <div className="border border-slate-900 rounded-none p-2 flex items-center justify-between cursor-pointer bg-white" onClick={() => setIsRiderDropdownOpen(!isRiderDropdownOpen)}>
              <div className="truncate text-xs font-bold text-slate-800">
                {selectedRider ? `${selectedRider.rider_name} (${selectedRider.id?.substring(0,8)})` : 'Select Rider...'}
              </div>
              <ChevronDown size={14} className="text-slate-500" />
            </div>
            
            {isRiderDropdownOpen && <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-900 shadow-lg z-50 max-h-48 overflow-y-auto">
                <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2 text-slate-400" />
                    <input type="text" placeholder="Search rider..." className="w-full text-xs border border-slate-300 pl-6 pr-2 py-1.5 focus:outline-none" value={riderSearch} onChange={e => setRiderSearch(e.target.value)} onClick={e => e.stopPropagation()} />
                  </div>
                </div>
                {savedRiders.filter(r => r.rider_name?.toLowerCase().includes(riderSearch.toLowerCase()) || r.id?.toLowerCase().includes(riderSearch.toLowerCase())).map(r => <div key={r.id} className="p-2 text-xs border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => {
              setSelectedRider(r);
              setIsRiderDropdownOpen(false);
              setRiderSearch('');
            }}>
                    <div className="font-bold text-slate-800">{r.rider_name}</div>
                    <div className="text-[10px] text-slate-500">{r.id?.substring(0,8)} | Mob: {r.registered_mobile_number || 'N/A'}</div>
                  </div>)}
              </div>}
          </div>

          {/* Pincode Selection Box */}
          <div className="w-[40%] relative">
            <label className="text-[10px] font-bold text-purple-600 uppercase mb-1 block">Filter Pincode</label>
            <div className="border border-purple-500 rounded-none p-2 flex items-center justify-between cursor-pointer bg-white" onClick={() => setIsPincodeDropdownOpen(!isPincodeDropdownOpen)}>
              <div className="truncate text-xs font-bold text-purple-800">
                {selectedPincodes.length > 0 ? `${selectedPincodes.length} Selected` : 'All Pincodes'}
              </div>
              <ChevronDown size={14} className="text-purple-500" />
            </div>

            {isPincodeDropdownOpen && <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-500 shadow-lg z-50 max-h-48 overflow-y-auto">
                {pincodeError && <div className="px-2 pt-2 text-xs font-bold text-red-500">{pincodeError}</div>}
                <div className="p-2 sticky top-0 bg-white border-b border-purple-100">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2 text-purple-400" />
                    <input type="text" placeholder="Search pincode..." className="w-full text-xs border border-purple-200 pl-6 pr-2 py-1.5 focus:outline-none focus:border-purple-500" value={pincodeSearch} onChange={e => setPincodeSearch(e.target.value)} onClick={e => e.stopPropagation()} />
                  </div>
                </div>
                {availablePincodes.filter(p => p.includes(pincodeSearch)).map(pin => <div key={pin} className="p-2 text-xs border-b border-purple-50 hover:bg-purple-50 cursor-pointer flex items-center justify-between" onClick={() => togglePincode(pin)}>
                    <span className="font-bold text-slate-700">{pin}</span>
                    {selectedPincodes.includes(pin) && <div className="w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 hover:bg-purple-700" onClick={e => removePincode(pin, e)} title="Remove">
                        <span className="text-[8px] leading-none font-bold">×</span>
                      </div>}
                  </div>)}
              </div>}
          </div>
        </div>

        {/* List Content */}
        <div className="p-3 flex-1 overflow-y-auto">
          {loading ? <div className="flex justify-center items-center py-20">
              <FiveDotLoader colorClass="bg-purple-500" />
            </div> : filteredShipments.length > 0 ? <div className="space-y-2">
              {filteredShipments.map((s, idx) => {
            const displayAddress = `${s['full address'] || ''}${s['landmark'] ? `, ${s['landmark']}` : ''}` || 'Address not available';
            const displayPincode = s['pincode'] || 'N/A';

            const isSelected = selectedShipmentIds.includes(s.id);
            return <div key={idx} onClick={() => toggleShipmentSelection(s.id)} className={`bg-white shadow-sm p-2.5 flex items-center justify-between gap-2 transition-all cursor-pointer ${isSelected ? 'border-2 border-purple-600 bg-purple-50/30 ring-2 ring-purple-100' : 'border border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <MapPin size={14} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <h4 className={`text-[11px] font-bold leading-tight break-words whitespace-normal ${isSelected ? 'text-purple-800' : 'text-slate-700'}`}>
                            {displayAddress || 'Address not available'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 justify-between">
                          <p className="text-[10px] font-extrabold text-slate-800">
                            Pin: {displayPincode}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${isSelected ? 'text-purple-700 bg-purple-100 border-purple-200' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                            {s['shipment tag'] || 'No Tag'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>;
          })}
            </div> : <div className="text-center py-20">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No ready to pickup shipments found.</p>
            </div>}
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="p-3 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-20 shrink-0">
          <button className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedShipmentIds.length > 0 && selectedRider ? 'bg-purple-600 text-white shadow-md shadow-purple-200 active:scale-[0.98] border-2 border-purple-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200'}`} disabled={!(selectedShipmentIds.length > 0 && selectedRider) || isConfirming} onClick={handleConfirmPickup}>
            {isConfirming ? <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
              </div> : 'Confirm'}
          </button>
        </div>
      </div>;
  }
  if (activePage === 'all_sheets') {
    return <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden">
        <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
          <button onClick={() => setActivePage('main')} className="p-1.5 -ml-1 bg-gray-50 rounded-full shadow-sm text-gray-700">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold ml-2 text-gray-800">All Runsheets & Pickupsheets</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingSheets && allPickupsheets.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <FiveDotLoader colorClass="bg-purple-500" />
            </div>
          ) : allPickupsheets.filter(sheet => {
              if (sheet.type === 'runsheet') {
                const remainingToClose = (sheet.shipments || []).filter((s: any) => {
                  const type = (s['shipment type'] || '').toLowerCase().trim();
                  const tag = (s['shipment tag'] || '').toLowerCase().trim();
                  const isDelivered = type === 'delivered' && (tag === 'seller delivery' || tag === 'selller delivery' || tag === 'customer delivery');
                  if (isDelivered) return false;
                  return ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'no response', 'not attend', 'reschedule'].includes(type);
                });
                return remainingToClose.length > 0;
              }
              return true;
            }).length > 0 ? (
            allPickupsheets.filter(sheet => {
              if (sheet.type === 'runsheet') {
                const remainingToClose = (sheet.shipments || []).filter((s: any) => {
                  const type = (s['shipment type'] || '').toLowerCase().trim();
                  const tag = (s['shipment tag'] || '').toLowerCase().trim();
                  const isDelivered = type === 'delivered' && (tag === 'seller delivery' || tag === 'selller delivery' || tag === 'customer delivery');
                  if (isDelivered) return false;
                  return ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'no response', 'not attend', 'reschedule'].includes(type);
                });
                return remainingToClose.length > 0;
              }
              return true;
            }).map(sheet => {
              const activeShipments = (sheet.shipments || []).filter((s: any) => {
                const type = (s['shipment type'] || '').toLowerCase().trim();
                const tag = (s['shipment tag'] || '').toLowerCase().trim();
                if (sheet.type === 'runsheet') {
                  return type === 'out for delivery' && (tag === 'seller delivery' || tag === 'selller delivery' || tag === 'customer delivery');
                }
                return type === 'out for pickup' && (tag === 'seller pickup' || tag === 'selller pickup' || tag === 'customer pickup');
              });
              const isCloseActive = activeShipments.length === 0;

              return (
                <div key={sheet.pickupId} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        {sheet.type === 'runsheet' ? 'Runsheet ID' : 'Pickupsheet ID'}: {sheet.pickupId}
                      </h3>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        Rider: {sheet.riderName || sheet.riderId || 'Unassigned'}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        Items: {activeShipments.length}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewingSheetId(sheet.pickupId);
                          setSheetFilterType('view');
                          setActivePage('view_sheet');
                        }}
                        className="text-[10px] font-bold text-purple-700 border border-purple-600 bg-white px-3 py-1.5 rounded-none active:scale-95 transition-all"
                      >
                        View
                      </button>
                      <button
                        disabled={!isCloseActive}
                        onClick={() => {
                          if (isCloseActive) {
                            handleCloseSheet(sheet);
                          }
                        }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-none transition-all ${
                          !isCloseActive
                            ? 'opacity-40 text-red-400 border border-red-300 bg-red-50/50 cursor-not-allowed'
                            : 'text-white bg-red-600 border border-red-600 hover:bg-red-700 active:scale-95 shadow-sm cursor-pointer'
                        }`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No pickupsheets found.</p>
            </div>
          )}
        </div>
      </div>;
  }
  if (activePage === 'view_sheet') {
    const sheet = allPickupsheets.find(s => s.pickupId === viewingSheetId);
    const filteredShipments = (sheet?.shipments || []).filter((s: any) => {
      const type = (s['shipment type'] || '').toLowerCase().trim();
      const tag = (s['shipment tag'] || '').toLowerCase().trim();
      if (sheetFilterType === 'view') {
        if (sheet?.type === 'runsheet') {
          return type === 'out for delivery' && (tag === 'seller delivery' || tag === 'selller delivery' || tag === 'customer delivery');
        }
        return type === 'out for pickup' && (tag === 'seller pickup' || tag === 'selller pickup' || tag === 'customer pickup');
      } else {
        if (sheet?.type === 'runsheet') {
          const isDelivered = type === 'delivered' && (tag === 'seller delivery' || tag === 'selller delivery' || tag === 'customer delivery');
          if (isDelivered) return false;
          return ['delivery reschduled', 'delivery not attended', 'delivery no responsed', 'delivery no response', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'no response', 'not attend', 'reschedule'].includes(type);
        }
        return ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild', 'faild delivery', 'failed delivery', 'delivery attempt faild', 'rejected by customer', 'picked up', 'rescheduled pickup', 'not attanded pickup', 'no responsed pickup', 'no response', 'not attend', 'reschedule'].includes(type);
      }
    });
    if (sheetFilterType === 'close' && filteredShipments.length === 0) {
      setTimeout(() => {
        alert(`${sheet?.type === 'runsheet' ? 'Runsheet' : 'Pickupsheet'} closed successfully!`);
        setActivePage('all_sheets');
        fetchAllSheets();
      }, 0);
      return null;
    }
    return <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
          <div className="flex items-center min-w-0">
            <button onClick={() => { setSheetFilterType('view'); setActivePage('all_sheets'); }} className="p-1.5 -ml-1 bg-gray-50 rounded-full shadow-sm text-gray-700 shrink-0">
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-sm font-bold ml-2 text-gray-800 truncate">
              {sheet?.type === "runsheet" ? "Runsheet" : "Pickupsheet"}: {viewingSheetId} 
              <span className="text-xs font-normal text-gray-500 ml-1">({filteredShipments.length})</span>
            </h2>
          </div>
          <button
            disabled={filteredShipments.length > 0}
            onClick={() => {
              if (filteredShipments.length === 0) {
                handleCloseSheet(sheet);
              }
            }}
            className={`text-[11px] font-bold px-3 py-1.5 rounded transition-all shrink-0 ml-2 ${
              filteredShipments.length > 0
                ? 'opacity-40 text-red-400 border border-red-300 bg-red-50/50 cursor-not-allowed'
                : 'text-white bg-red-600 border border-red-600 hover:bg-red-700 active:scale-95 shadow-sm cursor-pointer'
            }`}
          >
            Close
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sheetFilterType === 'view' && filteredShipments.length === 0 && (
            <div className="text-center py-20 px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">All shipments processed</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                All shipments have completed processing and been updated.
              </p>
              <button
                onClick={() => handleCloseSheet(sheet)}
                className="text-xs font-bold px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Close {sheet?.type === 'runsheet' ? 'Runsheet' : 'Pickupsheet'}
              </button>
            </div>
          )}
          {sheetFilterType === 'close' && sheet?.type === 'runsheet' && (
             <div className="flex flex-col mb-4 w-[90%] max-w-[320px] relative">
             <div className="flex gap-2 w-full relative items-center">
                <input 
                  type="text" 
                  placeholder="Scan AWB..." 
                  value={hubScanInput} 
                  onChange={(e) => setHubScanInput(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                        handleHubScanSubmit(hubScanInput);
                     }
                  }} 
                  className="flex-1 h-[38px] min-h-[38px] max-h-[38px] border border-slate-300 rounded-none px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 bg-white shadow-sm box-border" 
                />
                <button 
                  onClick={() => handleHubScanSubmit(hubScanInput)} 
                  className="shrink-0 h-[38px] min-h-[38px] max-h-[38px] border border-black text-black bg-transparent px-4 text-sm font-bold rounded-none hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center min-w-[70px] box-border"
                >
                  Scan
                </button>
             </div>
             {hubScanStatus && (
               <div className={`absolute top-full left-0 mt-0.5 text-xs font-normal tracking-wide whitespace-nowrap z-10 ${
                 hubScanStatus.type === 'success' 
                   ? 'text-emerald-600' 
                   : 'text-red-500'
               }`}>
                 {hubScanStatus.text}
               </div>
             )}
             </div>
          )}
          {filteredShipments.sort((a: any, b: any) => {
          const dateA = a.created_at || a.updated_at;
          const dateB = b.created_at || b.updated_at;
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }).map((s: any, idx: number) => {
          const isRunsheet = sheet?.type === 'runsheet';
          const isCustomer = s.isCustomerTask;
          const address = s.resolvedAddress || s['full address'] || 'Address not available';
          const landmark = isCustomer ? (s.resolvedLandmark !== undefined ? s.resolvedLandmark : (s['landmark'] || '')) : '';
          const pincode = s.resolvedPincode || s['pincode'] || '';
          const displayName = s.displayName || (isCustomer ? (s['full name'] || 'Customer') : (s.shop_name ? `${s.shop_name} - ${s['full name'] || 'Seller'}` : (s['full name'] || 'Seller')));
          return <div key={idx} onClick={() => {
            if (sheetFilterType === 'close') {
              setSelectedTask(s);
            }
          }} className={`bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 ${sheetFilterType === 'close' ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
                 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-slate-100 text-slate-400 border-slate-200">
                        <MapPin size={14} strokeWidth={2.5} />
                      </div>
                 <div className="flex flex-col flex-1 min-w-0">
                    {sheetFilterType === 'close' ? (
                       <div className="flex flex-col gap-1.5">
                         <div className="flex flex-wrap gap-x-3 gap-y-1">
                           {isRunsheet && s['order ID'] && <span className="text-[10px] font-bold text-slate-800">Order ID: {s['order ID']}</span>}
                           {isRunsheet && s['awb number'] && <span className="text-[10px] font-bold text-slate-800">AWB: {s['awb number']}</span>}
                           {!isRunsheet && s['pickup id'] && <span className="text-[10px] font-bold text-slate-800">Pickup ID: {s['pickup id']}</span>}
                           <span className="text-[10px] font-bold text-slate-800">Attempt: {s['attempt'] || '1'}</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                           <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 text-emerald-600 bg-emerald-50 border-emerald-100 uppercase">
                             {s['shipment tag'] || 'No Tag'}
                           </span>
                           {s['shipment type'] && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wide ${
                             ['picked up', 'delivered', 'shipped', 'out for delivery'].includes(s['shipment type']?.toLowerCase()) 
                               ? 'text-green-700 bg-green-50 border-green-200' 
                               : ['rescheduled pickup', 'not attanded pickup', 'no responsed pickup', 'delivery reschduled', 'delivery not attended', 'delivery no response', 'rescheduled delivery', 'no response', 'not attend', 'reschedule'].includes(s['shipment type']?.toLowerCase()) 
                                 ? 'text-amber-700 bg-amber-50 border-amber-200' 
                                 : s['shipment type']?.toLowerCase() === 'out for pickup' 
                                   ? 'text-purple-700 bg-purple-50 border-purple-200' 
                                   : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                             {s['shipment type']}
                           </span>}
                         </div>
                       </div>
                    ) : (
                       <>
                          <div className="flex flex-col gap-0.5">
                            {displayName && (
                              <h3 className="text-xs font-bold text-gray-900 leading-tight truncate">
                                {displayName}
                              </h3>
                            )}
                            <h4 className="text-[11px] font-normal leading-tight break-words whitespace-normal text-slate-600">
                              {address}{landmark ? `, ${landmark}` : ''}{pincode ? (isCustomer ? `, - ${pincode}` : `, ${pincode}`) : ''}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 justify-end flex-wrap">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 text-emerald-600 bg-emerald-50 border-emerald-100 uppercase">
                                {s['shipment tag'] || 'No Tag'}
                              </span>
                              {s['shipment type'] && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wide ${
                                 ['picked up', 'delivered', 'shipped', 'out for delivery'].includes(s['shipment type']?.toLowerCase()) 
                                   ? 'text-green-700 bg-green-50 border-green-200' 
                                   : ['rescheduled pickup', 'not attanded pickup', 'no responsed pickup', 'delivery reschduled', 'delivery not attended', 'delivery no response', 'rescheduled delivery', 'no response', 'not attend', 'reschedule'].includes(s['shipment type']?.toLowerCase()) 
                                     ? 'text-amber-700 bg-amber-50 border-amber-200' 
                                     : s['shipment type']?.toLowerCase() === 'out for pickup' 
                                       ? 'text-purple-700 bg-purple-50 border-purple-200' 
                                       : 'text-red-700 bg-red-50 border-red-200'
                                }`}>
                                  {s['shipment type']}
                                </span>}
                            </div>
                          </div>
                       </>
                    )}
                 </div>
              </div>;
        })}
        </div>

      {isHubScannerOpen && (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col">
          <div className="p-4 bg-black flex justify-between items-center text-white">
            <span className="font-bold text-lg">Scan AWB Barcode</span>
            <button onClick={stopHubScanner} className="p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden bg-black">
            <div id="hub-awb-reader" className="w-full max-w-sm mx-auto bg-black" />
          </div>
        </div>
      )}

      </div>;
  }
  return <div className="w-full p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Shipment Operations</h2>
        
        <div className="space-y-3">
          <button onClick={() => setActivePage('all_sheets')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 px-4 flex items-center justify-between transition-colors shadow-md shadow-indigo-600/20 active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText size={20} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide">All Runsheet & Pickupsheet</span>
            </div>
            <div className="text-white">→</div>
          </button>
          
          <button onClick={() => setActivePage('riders')} className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-3 px-4 flex items-center justify-between transition-colors shadow-sm active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users size={18} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide">Riders</span>
            </div>
            <div className="text-white">→</div>
          </button>

          <button onClick={() => setActivePage('create_pickupsheet')} className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-4 px-4 flex items-center justify-between transition-colors shadow-md shadow-purple-600/20 active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck size={20} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide">Create Pickup Sheet</span>
            </div>
            <div className="text-white">→</div>
          </button>
          
          <button onClick={() => setActivePage('create_runsheet')} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-4 px-4 flex items-center justify-between transition-colors shadow-md shadow-teal-600/20 active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck size={20} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide">Create Runsheet</span>
            </div>
            <div className="text-white">→</div>
          </button>
        </div>
      </div>
    </div>;
};