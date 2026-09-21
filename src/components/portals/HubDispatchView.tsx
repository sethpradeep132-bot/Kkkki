import { CustomSelect } from "./CustomSelect";
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
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
import { processShipmentsAddresses } from '../../utils/addressFormatter';


export const HubDispatchView = ({ onSubPageChange }: { onSubPageChange?: (hide: boolean) => void }) => {
 const [showCreateBag, setShowCreateBag] = useState(false);
 const [showAllBagsType, setShowAllBagsType] = useState<string | null>(null);
 const [currentUserId, setCurrentUserId] = useState<string | null>(null);
 const [currentHubData, setCurrentHubData] = useState<any>(null);
 const [inTransitBags, setInTransitBags] = useState<any[]>([]);
 const [dispatchedBags, setDispatchedBags] = useState<any[]>([]);
 const [sellersInfo, setSellersInfo] = useState<Record<string, any>>({});
 const [selectedBag, setSelectedBag] = useState<{ type: string, bagId: string, shipments: any[], count: number } | null>(null);
 const [isLoadingLists, setIsLoadingLists] = useState(false);

 // Receive state variables
 const [receiveAwbInput, setReceiveAwbInput] = useState('');
 const [receiveBagId, setReceiveBagId] = useState('');
 const [receiveSealTag, setReceiveSealTag] = useState('');
 const [receiveVehicleNumber, setReceiveVehicleNumber] = useState('');

 const [receiveAwbError, setReceiveAwbError] = useState('');
 const [receiveBagIdError, setReceiveBagIdError] = useState('');
 const [receiveSealTagError, setReceiveSealTagError] = useState('');
 const [receiveVehicleNumberError, setReceiveVehicleNumberError] = useState('');

 
 const [receiveAwbSuccess, setReceiveAwbSuccess] = useState('');
 const [totalShipmentsInBag, setTotalShipmentsInBag] = useState<number>(0);

 const [receivedShipmentsList, setReceivedShipmentsList] = useState<any[]>([]);
 const [showReceivedList, setShowReceivedList] = useState(false);
 const [isReceiveScannerFocused, setIsReceiveScannerFocused] = useState(false);
 
 useEffect(() => {
 if (!showCreateBag && currentUserId && !selectedBag) {
 const fetchLists = async () => {
 setIsLoadingLists(true);
 try {
 const { data: inTransitData } = await supabase
 .from('accepted_shipments')
 .select('*')
 .eq('assignment hub name', currentHubData?.hub_name)
 .ilike('shipment type', 'dispatched');
 
 const { data: dispatchedData } = await supabase
 .from('accepted_shipments')
 .select('*')
 .eq('hub manager id', currentUserId)
 .ilike('shipment type', 'dispatched');
 
 const allShipments = [...(inTransitData || []), ...(dispatchedData || [])];
 const sellerIds = [...new Set(allShipments.map(s => s['selller id']).filter(Boolean))];
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

 const groupBags = (data: any[]) => {
 if (!data) return [];
 const groups: Record<string, any[]> = {};
 data.forEach(s => {
 const bid = s['bag id'] || 'Unknown Bag';
 if (!groups[bid]) groups[bid] = [];
 groups[bid].push(s);
 });
 return Object.keys(groups).map(bid => ({
 bagId: bid,
 count: groups[bid].length,
 shipments: groups[bid]
 }));
 };
 
 setInTransitBags(groupBags(inTransitData));
 setDispatchedBags(groupBags(dispatchedData));
 } catch (e) {
 console.error(e);
 } finally {
 setIsLoadingLists(false);
 }
 };
 fetchLists();
 }
 }, [showCreateBag, currentUserId, selectedBag, currentHubData]);



 // Bag creation state
 const [hubManagersList, setHubManagersList] = useState<any[]>([]);
 const [selectedHubManagerId, setSelectedHubManagerId] = useState('');
 
 const [addedPincodes, setAddedPincodes] = useState<string[]>([]);
 const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);
 const [showPincodeDropdown, setShowPincodeDropdown] = useState(false);

 const [bagId, setBagId] = useState('');
 const [sealTag, setSealTag] = useState('');
 const [sealTagError, setSealTagError] = useState('');
 const [vehicleNumber, setVehicleNumber] = useState('');
 
 const [awbInput, setAwbInput] = useState('');
 const [awbScanMessage, setAwbScanMessage] = useState('');
 const [awbScanType, setAwbScanType] = useState<'success' | 'error' | ''>('');
 
 const [scannedShipments, setScannedShipments] = useState<any[]>([]);
 const [isSubmitting, setIsSubmitting] = useState(false);
 
 const awbInputRef = useRef<HTMLInputElement>(null);
 const pincodeDropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent | TouchEvent) => {
 if (pincodeDropdownRef.current && !pincodeDropdownRef.current.contains(event.target as Node)) {
 setShowPincodeDropdown(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 document.addEventListener('touchstart', handleClickOutside);
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 document.removeEventListener('touchstart', handleClickOutside);
 };
 }, []);

 useEffect(() => {
 if (onSubPageChange) {
 onSubPageChange(showCreateBag || showReceivedList || !!selectedBag || !!showAllBagsType);
 }
 }, [showCreateBag, showReceivedList, selectedBag, showAllBagsType, onSubPageChange]);

 useEffect(() => {
 const init = async () => {
 let uid = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
 if (savedAuth) uid = JSON.parse(savedAuth).id;
 if (!uid) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) uid = user.id;
 }
 setCurrentUserId(uid);
 
 if (uid) {
 const { data: hubData } = await supabase.from('hub_managers').select('*').eq('id', uid).maybeSingle();
 if (hubData) setCurrentHubData(hubData);
 }
 };
 init();
 }, []);

 // Fetch all hub managers
 useEffect(() => {
 if (showCreateBag) {
 const fetchHM = async () => {
 const { data } = await supabase.from('hub_managers').select('id, hub_name, hub_manager_name');
 if (data) setHubManagersList(data);
 };
 fetchHM();
 
 // Generate initial bag id if not exists
 if (!bagId) {
 setBagId('BAG-' + Math.floor(10000000 + Math.random() * 90000000).toString());
 }
 }
 }, [showCreateBag]);

 // Fetch added pincodes when hub manager changes
 useEffect(() => {
 if (selectedHubManagerId) {
 const fetchPins = async () => {
 const { data: hmData } = await supabase.from('hub_managers').select('hub_name').eq('id', selectedHubManagerId).maybeSingle();
 let hName = '';
 if (hmData && hmData.hub_name) {
 hName = hmData.hub_name;
 }
 let pQuery = supabase.from('added_pincode').select('"added pincode"').eq('hub manager id', selectedHubManagerId);
 if (hName) pQuery = pQuery.eq('hub name', hName);
 const { data } = await pQuery;
 if (data) {
 const pins = new Set<string>();
 data.forEach(d => {
 if (d['added pincode']) pins.add(d['added pincode']);
 });
 const sortedPins = Array.from(pins).sort();
 setAddedPincodes(sortedPins);
 setSelectedPincodes(sortedPins.length > 0 ? [sortedPins[0]] : []); // Select only one by default
 } else {
 setAddedPincodes([]);
 setSelectedPincodes([]);
 }
 };
 fetchPins();
 } else {
 setAddedPincodes([]);
 setSelectedPincodes([]);
 }
 }, [selectedHubManagerId]);

 const showAwbMessage = (msg: string, type: 'success' | 'error') => {
 setAwbScanMessage(msg);
 setAwbScanType(type);
 setTimeout(() => {
 setAwbScanMessage('');
 setAwbScanType('');
 }, 3000);
 };

 const handleScanAwb = async () => {
 if (!awbInput.trim()) return;
 const awb = awbInput.trim().toUpperCase();
 setAwbInput(''); // Clear input immediately for next scan
 setAwbScanType('');
 setAwbScanMessage('');
 await new Promise(r => setTimeout(r, 10)); // Force animation reset
 awbInputRef.current?.focus();

 // Check if already scanned
 if (scannedShipments.some(s => s['awb number'] === awb)) {
 showAwbMessage(`This shipment already scanned successfully by ${currentHubData?.hub_name || 'Unknown Hub'}`, 'success');
 return;
 }

 // Check in database without restricting by shipment type initially to see its actual state
 const { data, error } = await supabase
 .from('accepted_shipments')
 .select('*')
 .eq('awb number', awb)
 .maybeSingle();

 if (error || !data) {
 showAwbMessage('invalid awb number order barcode', 'error');
 return;
 }

 const statusType = (data['shipment type'] || '').toLowerCase();
 
 // If Delivered, Returned, or Shipped
 if (statusType.includes('delivered') || statusType.includes('returned') || statusType.includes('shipped')) {
 // Fetch the hub name
 let hName = 'Unknown Hub';
 if (data['assignment hub name'] || data['hub manager id']) {
 const hid = data['hub manager id'];
 const { data: hData } = await supabase.from('hub_managers').select('hub_name').eq('id', hid).maybeSingle();
 hName = data['assignment hub name'] || (hData && hData.hub_name) || 'Unknown Hub';
 }
 
 const printType = statusType.includes('delivered') ? 'delivered' : statusType.includes('returned') ? 'returned' : 'shipped';
 showAwbMessage(`This shipment has been ${printType} by ${hName}`, 'error');
 return;
 }
 
 // Only "Received at Hub" is allowed for dispatch scanning
 if (!statusType.includes('received at hub')) {
 showAwbMessage('invalid awb number order barcode', 'error');
 return;
 }

 // Fetch seller info if it's seller delivery and not already in state
 let currentSellerData = sellersInfo[data['selller id']];
 if (data['selller id'] && !currentSellerData) {
 const { data: sellerData } = await supabase.from('sellers').select('id, shop_name, seller_name, registered_full_address, registered_pincode').eq('id', data['selller id']).maybeSingle();
 if (sellerData) {
 setSellersInfo(prev => ({ ...prev, [data['selller id']]: sellerData }));
 currentSellerData = sellerData;
 }
 }

 // Check if shipment pincode matches one of the selected pincodes (if any are selected)
 if (selectedPincodes.length > 0) {
 const tagLower = (data['shipment tag'] || '').toLowerCase();
 const isSellerDelivery = tagLower === 'seller delivery';
 const pinToCheck = isSellerDelivery && currentSellerData ? currentSellerData.registered_pincode : data.pincode;

 if (!pinToCheck || !selectedPincodes.includes(pinToCheck.toString())) {
 showAwbMessage('invalid shipment pincode invalid', 'error');
 return;
 }
 }

 // Success
 setScannedShipments(prev => [data, ...prev]);
 showAwbMessage('shipment scanned successfully', 'success');
 };


 
 
 const triggerError = (field: 'awb' | 'bag' | 'seal' | 'vehicle', msg: string) => {
 if (field === 'awb') {
 setReceiveAwbError(msg);
 setTimeout(() => setReceiveAwbError(''), 2500);
 } else if (field === 'bag') {
 setReceiveBagIdError(msg);
 setTimeout(() => setReceiveBagIdError(''), 2500);
 } else if (field === 'seal') {
 setReceiveSealTagError(msg);
 setTimeout(() => setReceiveSealTagError(''), 2500);
 } else if (field === 'vehicle') {
 setReceiveVehicleNumberError(msg);
 setTimeout(() => setReceiveVehicleNumberError(''), 2500);
 }
 };

 const handleReceiveScan = async (awbValue: string) => {
 if (!awbValue.trim()) return;
 const awb = awbValue.trim();
 setReceiveAwbInput('');
 setReceiveAwbError('');
 setReceiveAwbSuccess('');
 await new Promise(r => setTimeout(r, 10)); // Force animation reset

 // Check if already in our temp list
 if (receivedShipmentsList.find(s => s['awb number'] === awb)) {
 setReceiveAwbSuccess('shipment scanned successfully');
 setTimeout(() => setReceiveAwbSuccess(''), 2500);
 return;
 }

 // Query DB
 const { data, error } = await supabase
 .from('accepted_shipments')
 .select('*')
 .eq('awb number', awb)
 .maybeSingle();

 if (error || !data || !data['shipment type'] || data['shipment type'].toLowerCase() !== 'dispatched') {
 triggerError('awb', 'invalid shipment');
 return;
 }

 let hasError = false;

 if ((data['bag id'] || '') !== receiveBagId.trim()) {
 triggerError('bag', 'invalid bag id');
 hasError = true;
 }

 if ((data['seal tag'] || '') !== receiveSealTag.trim()) {
 triggerError('seal', 'invalid seal tag');
 hasError = true;
 }

 if ((data['vehicle number'] || '') !== receiveVehicleNumber.trim()) {
 triggerError('vehicle', 'invalid vehicle number');
 hasError = true;
 }

 if (hasError) return;

 // Fetch seller info if not already in state
 if (data['selller id'] && !sellersInfo[data['selller id']]) {
 const { data: sellerData } = await supabase.from('sellers').select('id, shop_name, seller_name, registered_full_address, registered_pincode').eq('id', data['selller id']).maybeSingle();
 if (sellerData) {
 setSellersInfo(prev => ({ ...prev, [data['selller id']]: sellerData }));
 }
 }

 // Success scan (Add to list temporarily)
 setReceiveAwbSuccess('shipment scanned successfully');
 setTimeout(() => setReceiveAwbSuccess(''), 2500);

 // Fetch total count if not fetched yet
 if (totalShipmentsInBag === 0) {
 const { count } = await supabase
 .from('accepted_shipments')
 .select('*', { count: 'exact', head: true })
 .eq('bag id', data['bag id'])
 .ilike('shipment type', 'dispatched');
 
 if (count !== null) {
 setTotalShipmentsInBag(count);
 }
 }

 setReceivedShipmentsList(prev => [data, ...prev]);
 setShowReceivedList(true);
 };

 const handleReceiveAll = async () => {
 setIsSubmitting(true);
 try {
 const dateStr = new Date().toLocaleString('en-IN');
 
 let pCode = '';
 const { data: hmData } = await supabase.from('hub_managers').select('hub_name, cluster_id').eq('id', currentUserId).maybeSingle();
 let myHName = '';
 let myClusterId = null;
 if (hmData && hmData.hub_name) myHName = hmData.hub_name;
 if (hmData && hmData.cluster_id) myClusterId = hmData.cluster_id;
 let pQuery = supabase.from('added_pincode').select('"added pincode"').eq('hub manager id', currentUserId);
 if (myHName) pQuery = pQuery.eq('hub name', myHName);
 const { data: pData } = await pQuery.limit(1).maybeSingle();
 if (pData) {
 pCode = pData['added pincode'] || '';
 }
 
 for (const shipment of receivedShipmentsList) {
 const payload: any = {
 'shipment type': 'received at hub',
 'bag id': null,
 'vehicle number': null,
 'seal tag': null,
 'assignment hub name': null,
 'hub manager id': currentUserId,
 'cluster id': myClusterId,
 'updated_at': new Date().toISOString()
 };
 payload['shipment status'] = await buildShipmentStatus('Order Received at Hub', shipment, payload);
 await updateAcceptedShipment(payload, shipment.id, shipment);
 }
 
 const currentBagId = receiveBagId;

 setReceivedShipmentsList([]);
 setTotalShipmentsInBag(0);
 setShowReceivedList(false);
 setReceiveAwbInput('');
 setReceiveBagId('');
 setReceiveSealTag('');
 setReceiveVehicleNumber('');
 alert('Shipments Received Successfully');

 const { data: remainingData } = await supabase
 .from('accepted_shipments')
 .select('*')
 .eq('bag id', currentBagId)
 .ilike('shipment type', 'dispatched');

 setSelectedBag({
 type: 'In Transit',
 bagId: currentBagId,
 shipments: remainingData || [],
 count: (remainingData || []).length
 });
 } catch (err) {
 console.error(err);
 } finally {
 setIsSubmitting(false);
 }
 };

const togglePincode = (pin: string) => {
 if (selectedPincodes.includes(pin)) {
 setSelectedPincodes(prev => prev.filter(p => p !== pin));
 } else {
 setSelectedPincodes(prev => [...prev, pin]);
 }
 };

 const checkSealTag = async (tag: string) => {
 setSealTag(tag);
 if (!tag.trim()) {
 setSealTagError('');
 return;
 }
 // Check if duplicate in bag id just to be safe
 const { data } = await supabase.from('accepted_shipments').select('id').eq('bag id', tag).limit(1);
 if (data && data.length > 0) {
 setSealTagError('invalid');
 } else {
 setSealTagError('');
 }
 };

 const handleConfirmDispatch = async () => {
 if (scannedShipments.length === 0) {
 alert('No shipments scanned.');
 return;
 }
 if (!selectedHubManagerId) {
 alert('Please select a destination Hub Manager.');
 return;
 }
 if (!vehicleNumber.trim()) {
 alert('Please enter vehicle number.');
 return;
 }
 if (sealTagError) {
 alert('Invalid Seal Tag.');
 return;
 }

 setIsSubmitting(true);
 
 const destHub = hubManagersList.find(h => h.id === selectedHubManagerId);
 const currHubName = currentHubData?.hub_name || 'Unknown Hub';
 const currHubManagerName = currentHubData?.hub_manager_name || 'Unknown Manager';
 let destHubName = destHub?.hub_name || 'Unknown Hub';
 const destHubManagerName = destHub?.hub_manager_name || 'Unknown Manager';
 
 const dateStr = new Date().toLocaleString('en-IN');
 const pinsStr = selectedPincodes.length > 0 ? selectedPincodes.join(', ') : 'All';

 try {
 let targetClusterId = null;
 if (selectedHubManagerId) {
 const { data: targetHm } = await supabase.from('hub_managers').select('cluster_id').eq('id', selectedHubManagerId).maybeSingle();
 if (targetHm && targetHm.cluster_id) targetClusterId = targetHm.cluster_id;
 }
 const updates = await Promise.all(scannedShipments.map(async s => {
 const payload: any = {
 'assignment hub name': destHubName,
 'bag id': bagId,
 'seal tag': sealTag,
 'vehicle number': vehicleNumber,
 'shipment type': 'dispatched',
 'updated_at': new Date().toISOString()
 };
 payload['shipment status'] = await buildShipmentStatus('Dispatched', s, payload);
 
 return updateAcceptedShipment(payload, s.id, s);
 }));
 
 await Promise.all(updates);
 
 alert('Dispatch Confirmed Successfully!');
 setShowCreateBag(false);
 setScannedShipments([]);
 setBagId('');
 setSealTag('');
 setVehicleNumber('');
 setSelectedHubManagerId('');
 setSelectedPincodes([]);
 
 } catch (err) {
 console.error(err);
 alert('Error confirming dispatch');
 } finally {
 setIsSubmitting(false);
 }
 };


 if (showCreateBag) {
 return (
 <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden font-poppins">
 <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
 <button onClick={() => setShowCreateBag(false)} className="p-1.5 -ml-1 bg-gray-50 rounded-none border border-gray-300 shadow-sm text-gray-700 active:bg-gray-200">
 <ArrowLeft size={16} />
 </button>
 <h2 className="text-base font-bold ml-2 text-gray-800">Create Bag</h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
 
 {/* Row 1: Scan AWB */}
 <div className="flex gap-2 relative items-start mb-2">
 <div className="flex-1 relative">
 <input 
 ref={awbInputRef}
 type="text" 
 value={awbInput}
 onChange={(e) => setAwbInput(e.target.value)}
 onKeyDown={(e) => { if(e.key === 'Enter') handleScanAwb(); }}
 placeholder="Scan or Enter AWB..." 
 className="w-full h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white font-medium box-border"
 />
 {awbScanType && awbScanMessage && (
 <div className={`absolute top-full left-0 mt-0.5 text-xs font-normal tracking-wide whitespace-nowrap z-10 ${awbScanType === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
 {awbScanMessage}
 </div>
 )}
 </div>
 <button 
 onClick={handleScanAwb}
 style={{ backgroundColor: awbScanType === 'success' ? '#22c55e' : '' }}
 className={`shrink-0 h-[38px] min-h-[38px] max-h-[38px] border border-black bg-white rounded-none px-6 text-sm font-bold active:bg-gray-100 transition-colors flex items-center justify-center box-border ${awbScanType === 'success' ? 'text-white border-green-500' : 'text-black'}`}
 >
 Scan
 </button>
 
 </div>

 {/* Row 2: Bag ID + Seal Tag + Vehicle Number */}
 <div className="flex gap-2">
 <input 
 type="text" 
 value={bagId}
 readOnly
 placeholder="Bag ID" 
 className="flex-1 min-w-0 h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white box-border"
 />
 <div className="relative flex-1 min-w-0">
 <input 
 type="text" 
 value={sealTag}
 onChange={(e) => checkSealTag(e.target.value)}
 placeholder="Seal Tag" 
 className="w-full h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white box-border"
 />
 {sealTagError && (
 <div className="absolute top-full left-0 mt-1 w-full p-2 border border-red-300 shadow-md text-xs font-bold text-center text-red-600 bg-red-50 z-50">
 {sealTagError}
 </div>
 )}
 </div>
 <input 
 type="text" 
 value={vehicleNumber}
 onChange={(e) => setVehicleNumber(e.target.value)}
 placeholder="Vehicle Number" 
 className="flex-1 min-w-0 h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white box-border"
 />
 </div>

 {/* Row 3: Hub Manager Selection + Pincode */}
 <div className="flex gap-2">
 <CustomSelect 
 value={selectedHubManagerId}
 onChange={(e) => setSelectedHubManagerId(e.target.value)}
 className="flex-1 min-w-0 h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white box-border"
 >
 <option value="">Select Hub Manager</option>
 {hubManagersList.map((hm) => (
 <option key={hm.id} value={hm.id}>
 {hm.hub_name || 'No Hub Name'}
 </option>
 ))}
 </CustomSelect>
 
 <div className="relative shrink-0 w-28" ref={pincodeDropdownRef}>
 <button 
 onClick={() => setShowPincodeDropdown(!showPincodeDropdown)}
 className="w-full h-[38px] min-h-[38px] max-h-[38px] border border-black bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-none px-2 text-sm font-bold transition-colors text-center truncate shrink-0 flex items-center justify-center box-border"
 title={selectedPincodes.length > 0 ? selectedPincodes.join(', ') : 'Pincodes'}
 >
 {selectedPincodes.length > 0 ? selectedPincodes.join(', ') : 'Pincodes'}
 </button>
 {showPincodeDropdown && (
 <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-300 shadow-lg z-50 max-h-48 overflow-y-auto">
 {addedPincodes.length === 0 ? (
 <div className="p-2 text-xs text-gray-500 text-center">No pincodes</div>
 ) : (
 addedPincodes.map(pin => (
 <div 
 key={pin} 
 onClick={() => togglePincode(pin)}
 className="p-2 text-xs border-b border-gray-100 hover:bg-gray-100 cursor-pointer flex items-center justify-between font-medium"
 >
 <span className="text-gray-800">{pin}</span>
 {selectedPincodes.includes(pin) && (
 <div className="w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
 <span className="text-[8px] leading-none font-bold">×</span>
 </div>
 )}
 </div>
 ))
 )}
 </div>
 )}
 </div>
 </div>

 {/* Scanned Shipments Section */}
 <div className="mt-6 border border-gray-300 p-2 relative bg-gray-50">
 <div className="absolute -top-3 left-3 bg-[#fafafa] px-2 text-xs font-bold text-gray-600">
 Scanned Shipments ({scannedShipments.length})
 </div>
 
 {scannedShipments.length === 0 ? (
 <div className="text-center py-6 text-gray-400 text-xs">No shipments scanned yet.</div>
 ) : (
 <div className="space-y-3 mt-2">
 {scannedShipments.map((shipment, i) => (
 <div key={i} className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-none">
 <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50">
 <div className="border border-black px-2 py-1 text-xs font-bold text-black rounded-none">
 AWB: {shipment['awb number'] || 'N/A'}
 </div>
 {shipment['shipment tag'] && (
 <div className="text-[10px] font-bold text-gray-700 uppercase bg-gray-200 px-2 py-1 rounded-none border border-gray-300">
 {shipment['shipment tag']}
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
 
 {/* Fixed Bottom Button */}
 <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 z-30">
 <button 
 disabled={isSubmitting || scannedShipments.length === 0}
 onClick={handleConfirmDispatch}
 className="w-full bg-purple-600 text-white font-bold py-3 text-sm rounded-none active:bg-purple-700 disabled:opacity-50"
 >
 {isSubmitting ? 'Confirming...' : 'Confirm Dispatch'}
 </button>
 </div>
 
 </div>
 );
 }

 
 const renderBagList = (bags: any[], type: string, limit: boolean = true) => {
 if (isLoadingLists) {
 return <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>;
 }
 const bagsToRender = limit ? bags.slice(0, 5) : bags;
 if (bagsToRender.length === 0) {
 return <div className="text-center py-8 text-gray-400 text-xs">No records found</div>;
 }
 return (
 <div className="space-y-3 mt-3">
 {bagsToRender.map((bag, i) => (
 <div key={i} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-none shadow-sm">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-gray-800">{bag.bagId}</span>
 <span className="text-[10px] text-gray-500 font-semibold">{bag.count} Shipments</span>
 </div>
 <button 
 onClick={() => setSelectedBag({ type, ...bag })}
 className="border-2 border-purple-600 text-purple-700 bg-white hover:bg-purple-50 active:bg-purple-100 rounded-none px-4 py-1.5 text-[10px] font-bold uppercase transition-colors"
 >
 View
 </button>
 </div>
 ))}
 </div>
 );
 };

 
 if (showReceivedList) {
 return (
 <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden font-poppins">
 <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
 <button onClick={() => setShowReceivedList(false)} className="p-1.5 -ml-1 bg-gray-50 rounded-none border border-gray-300 shadow-sm text-gray-700 active:bg-gray-200">
 <ArrowLeft size={16} />
 </button>
 <h2 className="text-base font-bold ml-2 text-gray-800">Received Shipments</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
 {/* Top Scanner within full screen */}
 <div className="flex gap-2 relative items-start mb-2">
 <div className="flex-1 relative">
 <input 
 type="text" 
 value={receiveAwbInput}
 onChange={(e) => setReceiveAwbInput(e.target.value)}
 onKeyDown={(e) => { if(e.key === 'Enter') handleReceiveScan(receiveAwbInput); }}
 onFocus={() => setIsReceiveScannerFocused(true)}
 onBlur={() => setIsReceiveScannerFocused(false)}
 placeholder="Scan or Enter AWB..." 
 className="w-full h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white font-medium box-border"
 />
 {(receiveAwbError || receiveAwbSuccess) && (
 <div className={`absolute top-full left-0 mt-0.5 text-xs font-normal tracking-wide whitespace-nowrap z-10 ${receiveAwbError ? 'text-red-500' : 'text-emerald-600'}`}>
 {receiveAwbError || receiveAwbSuccess}
 </div>
 )}
 </div>
 <button 
 onClick={() => handleReceiveScan(receiveAwbInput)}
 className="shrink-0 h-[38px] min-h-[38px] max-h-[38px] border border-black bg-white rounded-none px-6 text-sm font-bold text-black active:bg-gray-100 transition-colors flex items-center justify-center box-border"
 >
 Scan
 </button>
 </div>
 
 <div className="border border-black bg-white p-2 flex items-center justify-between mb-4 mt-2">
 <div className="flex-1 overflow-x-auto whitespace-nowrap flex gap-2 text-xs mr-3 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
 {receivedShipmentsList.map(s => s['awb number']).filter(Boolean).map((awb, idx) => (
 <span key={idx} className="text-gray-700 bg-gray-100 px-2 py-0.5 border border-gray-200">
 {awb}
 </span>
 ))}
 </div>
 <button
 onClick={(e) => {
 const awbs = receivedShipmentsList.map(s => s['awb number']).filter(Boolean).join(', ');
 navigator.clipboard.writeText(awbs);
 const btn = e.currentTarget;
 const original = btn.innerText;
 btn.innerText = 'COPIED!';
 setTimeout(() => btn.innerText = original, 2000);
 }}
 className="shrink-0 border border-black bg-white hover:bg-gray-100 active:bg-gray-200 px-3 py-1 text-[10px] font-bold text-black uppercase transition-colors"
 >
 Copy
 </button>
 </div>
 <div className="text-xs font-bold text-gray-500 mb-2">{receivedShipmentsList.length} Shipments</div>
 <div className="space-y-3">
 {receivedShipmentsList.map((shipment, i) => (
 <div key={i} className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-none">
 <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50">
 <div className="border border-black px-2 py-1 text-xs font-bold text-black rounded-none">
 AWB: {shipment['awb number'] || 'N/A'}
 </div>
 {shipment['shipment tag'] && (
 <div className="text-[10px] font-bold text-gray-700 uppercase bg-gray-200 px-2 py-1 rounded-none border border-gray-300">
 {shipment['shipment tag']}
 </div>
 )}
 </div>
 <div className="p-3">
 <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
 {(() => {
 const tagLower = (shipment['shipment tag'] || '').toLowerCase();
 const isSellerDelivery = tagLower === 'seller delivery';
 const seller = sellersInfo[shipment['selller id']] || {};
 
 const address = isSellerDelivery ? seller.registered_full_address : shipment['full address'];
 const landmark = isSellerDelivery ? '' : shipment['landmark'];
 const pincode = isSellerDelivery ? seller.registered_pincode : shipment['pincode'];
 
 return (
 <>
 {address}
 {landmark ? `\nLandmark: ${landmark}` : ''}
 {pincode ? `\nPincode: ${pincode}` : ''}
 </>
 );
 })()}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 
 {!isReceiveScannerFocused && (
 <nav className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-2 z-30">
 <button 
 onClick={() => setShowReceivedList(false)}
 className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-none active:bg-gray-200"
 >
 Cancel
 </button>
 <button 
 onClick={handleReceiveAll}
 disabled={isSubmitting || receivedShipmentsList.length === 0}
 className={`flex-1 py-3 text-sm font-bold rounded-none border transition-colors ${receivedShipmentsList.length > 0 ? 'bg-purple-600 text-white border-purple-700 active:bg-purple-700' : 'bg-gray-200 text-gray-500 border-gray-300'}`}
 >
 {isSubmitting ? 'Receiving...' : 'Receive'}
 </button>
 </nav>
 )}
 </div>
 );
 }

 if (showAllBagsType) {
 const listToRender = showAllBagsType === 'In Transit' ? inTransitBags : dispatchedBags;
 return (
 <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden font-poppins">
 <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
 <button onClick={() => setShowAllBagsType(null)} className="p-1.5 -ml-1 bg-gray-50 rounded-none border border-gray-300 shadow-sm text-gray-700 active:bg-gray-200">
 <ArrowLeft size={16} />
 </button>
 <h2 className="text-base font-bold ml-2 text-gray-800">{showAllBagsType} (All)</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
 {renderBagList(listToRender, showAllBagsType, false)}
 </div>
 </div>
 );
 }

 if (selectedBag) {
 return (
 <div className="fixed inset-0 h-[100dvh] z-50 bg-[#fafafa] flex flex-col overflow-hidden font-poppins">
 <div className="flex items-center p-3 h-12 bg-white border-b border-gray-200 shrink-0 shadow-sm relative z-20">
 <button onClick={() => setSelectedBag(null)} className="p-1.5 -ml-1 bg-gray-50 rounded-none border border-gray-300 shadow-sm text-gray-700 active:bg-gray-200">
 <ArrowLeft size={16} />
 </button>
 <h2 className="text-base font-bold ml-2 text-gray-800">{selectedBag.bagId} - {selectedBag.type}</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
 {selectedBag.type === 'In Transit' && (
 <div className="border border-black bg-white p-2 flex items-center justify-between mb-4">
 <div className="flex-1 overflow-x-auto whitespace-nowrap flex gap-2 text-xs mr-3 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
 {selectedBag.shipments.map(s => s['awb number']).filter(Boolean).map((awb, idx) => (
 <span key={idx} className="text-gray-700 bg-gray-100 px-2 py-0.5 border border-gray-200">
 {awb}
 </span>
 ))}
 </div>
 <button
 onClick={(e) => {
 const awbs = selectedBag.shipments.map(s => s['awb number']).filter(Boolean).join(', ');
 navigator.clipboard.writeText(awbs);
 const btn = e.currentTarget;
 const original = btn.innerText;
 btn.innerText = 'COPIED!';
 setTimeout(() => btn.innerText = original, 2000);
 }}
 className="shrink-0 border border-black bg-white hover:bg-gray-100 active:bg-gray-200 px-3 py-1 text-[10px] font-bold text-black uppercase transition-colors"
 >
 Copy
 </button>
 </div>
 )}
 <div className="text-xs font-bold text-gray-500 mb-2">{selectedBag.count} Shipments</div>
 <div className="space-y-3">
 {selectedBag.shipments.map((shipment, i) => (
 <div key={i} className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-none">
 <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50">
 <div className="border border-black px-2 py-1 text-xs font-bold text-black rounded-none">
 AWB: {shipment['awb number'] || 'N/A'}
 </div>
 {shipment['shipment tag'] && (
 <div className="text-[10px] font-bold text-gray-700 uppercase bg-gray-200 px-2 py-1 rounded-none border border-gray-300">
 {shipment['shipment tag']}
 </div>
 )}
 </div>
 <div className="p-3">
 <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
 {(() => {
 const tagLower = (shipment['shipment tag'] || '').toLowerCase();
 const isSellerDelivery = tagLower === 'seller delivery';
 const seller = sellersInfo[shipment['selller id']] || {};
 
 const address = isSellerDelivery ? seller.registered_full_address : shipment['full address'];
 const landmark = isSellerDelivery ? '' : shipment['landmark'];
 const pincode = isSellerDelivery ? seller.registered_pincode : shipment['pincode'];
 
 return (
 <>
 {address}
 {landmark ? `\nLandmark: ${landmark}` : ''}
 {pincode ? `\nPincode: ${pincode}` : ''}
 </>
 );
 })()}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="w-full p-4 space-y-4 font-poppins pb-6">

 
 {/* Top Section */}
 <div className="flex flex-col gap-1 w-full">
 <div className="flex gap-2">
 <input 
 type="text" 
 value={receiveAwbInput}
 onChange={(e) => {
   if (receiveAwbError || receiveAwbSuccess) {
     setReceiveAwbError('');
     setReceiveAwbSuccess('');
   }
   setReceiveAwbInput(e.target.value);
 }}
 onKeyDown={(e) => { if(e.key === 'Enter') handleReceiveScan(receiveAwbInput); }}
 placeholder="Enter details..." 
 className="flex-1 min-w-0 h-[38px] min-h-[38px] max-h-[38px] border border-black rounded-none px-3 text-sm focus:outline-none bg-white font-medium box-border"
 />
 <button 
 onClick={() => setShowCreateBag(true)}
 className="shrink-0 h-[38px] min-h-[38px] max-h-[38px] border border-purple-600 text-purple-600 bg-white hover:bg-purple-50 active:bg-purple-100 rounded-none px-4 text-sm font-bold transition-colors whitespace-nowrap flex items-center justify-center box-border"
 >
 Create Bag
 </button>
 </div>
 {(receiveAwbError || receiveAwbSuccess) && (
 <div className={`text-xs font-normal tracking-wide mt-0.5 ${receiveAwbError ? 'text-red-500' : 'text-emerald-600'}`}>
 {receiveAwbError || receiveAwbSuccess}
 </div>
 )}
 </div>

 <div className="flex gap-2 mt-4">
 <input 
 type="text" 
 value={receiveBagIdError ? receiveBagIdError : receiveBagId}
 onChange={(e) => !receiveBagIdError && setReceiveBagId(e.target.value)}
 placeholder="Bag ID" 
 className={`flex-1 min-w-0 border border-black rounded-none px-3 py-2 text-sm focus:outline-none ${receiveBagIdError ? 'text-red-600 font-bold bg-red-50' : 'bg-white'}`}
 readOnly={!!receiveBagIdError}
 />
 <input 
 type="text" 
 value={receiveSealTagError ? receiveSealTagError : receiveSealTag}
 onChange={(e) => !receiveSealTagError && setReceiveSealTag(e.target.value)}
 placeholder="Seal Tag" 
 className={`flex-1 min-w-0 border border-black rounded-none px-3 py-2 text-sm focus:outline-none ${receiveSealTagError ? 'text-red-600 font-bold bg-red-50' : 'bg-white'}`}
 readOnly={!!receiveSealTagError}
 />
 <input 
 type="text" 
 value={receiveVehicleNumberError ? receiveVehicleNumberError : receiveVehicleNumber}
 onChange={(e) => !receiveVehicleNumberError && setReceiveVehicleNumber(e.target.value)}
 placeholder="Vehicle Number" 
 className={`flex-1 min-w-0 border border-black rounded-none px-3 py-2 text-sm focus:outline-none ${receiveVehicleNumberError ? 'text-red-600 font-bold bg-red-50' : 'bg-white'}`}
 readOnly={!!receiveVehicleNumberError}
 />
 </div>
 {/* In Transit Section */}
 <div className="bg-white border border-gray-200 rounded-none p-4 shadow-sm mt-4">
 <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
 <h2 className="text-sm font-bold text-gray-800">In Transit</h2>
 <span onClick={() => setShowAllBagsType('In Transit')} className="text-xs font-bold text-purple-600 cursor-pointer hover:underline">View All</span>
 </div>
 {renderBagList(inTransitBags, 'In Transit')}
 </div>

 {/* Dispatched Section */}
 <div className="bg-white border border-gray-200 rounded-none p-4 shadow-sm mt-4">
 <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
 <h2 className="text-sm font-bold text-gray-800">Dispatched</h2>
 <span onClick={() => setShowAllBagsType('Dispatched')} className="text-xs font-bold text-purple-600 cursor-pointer hover:underline">View All</span>
 </div>
 {renderBagList(dispatchedBags, 'Dispatched')}
 </div>
 </div>
 );
};
