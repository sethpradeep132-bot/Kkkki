import { CustomSelect } from "./CustomSelect";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { trackAllSearch } from "../../utils/trackSearch";
import { TrackResultCard } from "./TrackResultCard";
import { AuthLogin } from "./AuthLogin";
import { 
LogoutModal } from './LogoutModal';
import { AdminLiveShipmentCard } from './AdminLiveShipmentCard';
import { supabase } from '../../lib/supabase';
import { AnnouncementChatModal } from './AnnouncementChatModal';
import { RoleChatModal } from './RoleChatModal';
import { PayableListBanner } from './PayableListBanner';

import { registerBackHandler } from '../../lib/backNavigation';
import React, { useState, useEffect, useRef } from "react";
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { RefreshCw, LayoutDashboard, 
 Users, 
 CreditCard, 
 MessageSquare, 
 CheckCircle, 
 Search, 
 Plus, 
 ShieldCheck,
 Phone,
 Store,
 Building2,
 Truck,
 
 UserCheck,
 Trash2,
 Layers,
 ArrowRight,
 ArrowLeft,
 User,
 Mail,
 MapPin,
 FileText,
 Eye,
 EyeOff,
 Save,
 Check,
 LogOut,
 TrendingUp,
 ChevronRight,
 List,
 Settings, Edit
, X, IndianRupee , AlertTriangle, ShieldAlert, Download } from 'lucide-react';
import { CreateUserIdPage, UserTypeCategory } from './CreateUserIdPage';

const isValidUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

interface PortalProps {
 onBack: () => void;
}

interface UserItem {
 id: string;
 type: 'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID';
 name: string;
 phone: string;
 secondaryInfo?: string;
 status: 'Active' | 'Verified' | 'On Duty' | 'Pending';
 createdDate: string;
 extraBadge?: string;
 avatar?: string;
 isFrozen?: boolean;
 dbRow?: any;
}

interface AdminProfileData {
 name: string;
 mobile: string;
 email: string;
 address: string;
 gstNo: string;
}

export const ClusterPortal: React.FC<PortalProps> = ({ onBack }) => {
  const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);
  const handleDeepRefresh = () => {
    setIsDeepRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

 const [showAnnouncementModal, setShowAnnouncementModal] = useState<{isOpen: boolean, type: any, title: string}>({isOpen: false, type: 'customer_update', title: ''});
 const [showRoleChatModal, setShowRoleChatModal] = useState<{isOpen: boolean, table: any, title: string}>({isOpen: false, table: 'chat_for_customers', title: ''});
 const [isLoggedIn, setIsLoggedIn] = useState(() => {
 if (typeof window !== 'undefined') {
 return !!localStorage.getItem('portal_auth_cluster');
 }
 return false;
 });

 useEffect(() => {
   if (!isLoggedIn) return;
   const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
   const userObj = savedAuth ? JSON.parse(savedAuth) : null;
   const clusterIdToTrack = userObj?.id;
   const clusterEmailToTrack = userObj?.email;
   if (!clusterIdToTrack && !clusterEmailToTrack) return;

   let channel: any = null;
   let interval: any = null;

   const performLogoutIfFrozen = (row: any) => {
     if (row && (row.freeze === 'true' || row.freeze === true || row.freeze === 'frozen')) {
       try {
         localStorage.removeItem('portal_auth_cluster');
       } catch (e) {}
       setIsLoggedIn(false);
       supabase.auth.signOut().catch(() => {});
     }
   };

   // Initial check
   const query = clusterIdToTrack
     ? supabase.from('clusters').select('id, freeze').eq('id', clusterIdToTrack)
     : supabase.from('clusters').select('id, freeze').eq('registered_email', clusterEmailToTrack);

   query.maybeSingle().then(({ data }) => {
     if (data) performLogoutIfFrozen(data);
   });

   channel = supabase.channel(`cluster_freeze_rt_${clusterIdToTrack || clusterEmailToTrack}_${Math.random().toString(36).substring(7)}`)
     .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clusters' }, (payload) => {
       if (payload?.new) {
         if (payload.new.id === clusterIdToTrack || (clusterEmailToTrack && payload.new.registered_email === clusterEmailToTrack)) {
           performLogoutIfFrozen(payload.new);
         }
       }
     })
     .subscribe();

   interval = setInterval(async () => {
     try {
       const q = clusterIdToTrack
         ? supabase.from('clusters').select('id, freeze').eq('id', clusterIdToTrack)
         : supabase.from('clusters').select('id, freeze').eq('registered_email', clusterEmailToTrack);
       const { data } = await q.maybeSingle();
       if (data) performLogoutIfFrozen(data);
     } catch (e) {}
   }, 2500);

   return () => {
     if (channel) supabase.removeChannel(channel);
     if (interval) clearInterval(interval);
   };
 }, [isLoggedIn]);
 const [clusterUserData, setClusterUserData] = useState<any>(null);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [chatCount, setChatCount] = useState<number>(0);

  useEffect(() => {
    if (clusterUserData?.id) {
      supabase.from('announcement_and_update').select('*', {count: 'exact', head: true}).not('cluster_update', 'is', null).neq('cluster_update', '').then(({count}) => {
        if (count !== null) setUpdateCount(count);
      });
      supabase.from('chat_for_clusters').select('*', {count: 'exact', head: true}).eq('admin_id', clusterUserData.id).not('message', 'is', null).then(({count}) => {
        if (count !== null) setChatCount(count);
      });
    }
  }, [clusterUserData?.id]);

 useEffect(() => {
 const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
 if (localData) {
 setClusterUserData(JSON.parse(localData));
 }
 }, []);
 const [showTrackAllModal, setShowTrackAllModal] = useState(false);
 const [trackSearchTerm, setTrackSearchTerm] = useState('');
 const [activeTrackCategory, setActiveTrackCategory] = useState<'User' | 'Shipments' | 'Other'>('User');
 const [trackResults, setTrackResults] = useState<any[]>([]);
 const [isTracking, setIsTracking] = useState(false);
 const [trackInvalidMsg, setTrackInvalidMsg] = useState('');

 const handleTrackSearch = async () => {
 if (!trackSearchTerm || trackSearchTerm.trim().length < 2) {
 setTrackInvalidMsg('Invalid Format');
 setTimeout(() => setTrackInvalidMsg(''), 2500);
 return;
 }
 
 setIsTracking(true);
 setTrackInvalidMsg('');
 const results = await trackAllSearch(trackSearchTerm, activeTrackCategory, false);
 setTrackResults(results);
 setIsTracking(false);
 };

 useEffect(() => {
 // Re-run search if category changes AND we already have a valid term that was searched
 if (trackSearchTerm.length >= 3 && trackResults.length > 0) {
 handleTrackSearch();
 }
 }, [activeTrackCategory]);
 const [activeTab, setActiveTab] = useState('Dashboard');
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

 const [totalCashWithRiders, setTotalCashWithRiders] = useState(0);
 const [cashRidersList, setCashRidersList] = useState<any[]>([]);
 const [showEarningModal, setShowEarningModal] = useState(false);
 const [showPenaltyModal, setShowPenaltyModal] = useState(false);
 const [clusterEarningData, setClusterEarningData] = useState<any>(null);
 const [clusterPenaltyData, setClusterPenaltyData] = useState<any[]>([]);
 const [clusterPenaltySum, setClusterPenaltySum] = useState<number | null>(null);
 const [clusterEarningShipments, setClusterEarningShipments] = useState<any[]>([]);
 const [showShipmentDetails, setShowShipmentDetails] = useState(false);


 const handleDownloadEarningPDF = () => {
 const doc = new jsPDF();
 doc.setFontSize(16);
 doc.text('Cluster Earning Shipments', 14, 20);
 doc.setFontSize(10);
 doc.text(`Total Count: ${clusterEarningShipments.length}`, 14, 30);
 
 const tableData = clusterEarningShipments.map(s => [
 s['awb number'] || s['AWB Number'] || s['awb_number'] || 'N/A',
 s['order id'] || s['Order ID'] || s['order_id'] || 'N/A',
 s['status'] || s['shipment type'] || 'N/A'
 ]);

 autoTable(doc, {
 startY: 40,
 head: [['AWB Number', 'Order ID', 'Status']],
 body: tableData,
 });

 doc.save('Cluster_Earning_Shipments.pdf');
 };
 const fetchClusterEarningAndPenalty = async () => {
 if (!clusterUserData?.id) return;
 
 // Fetch earning
 try {
 const { data: allData } = await supabase.from('finished_shipments').select('*');
 const { data: riders } = await supabase.from('riders').select('id, cluster_id').eq('cluster_id', clusterUserData.id);
 const riderMap = new Map();
 (riders || []).forEach(r => riderMap.set(r.id, r.cluster_id));
 const valid = (allData || []).filter(s => {
 const stype = (s['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
 const stag = (s['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
 const pstatus = (s['payout status'] || '').toLowerCase();
 return stype === 'delivered' && (stag.includes('seller delivery') || stag.includes('customer delivery')) && pstatus === 'settled';
 });
 let count = 0;
 const myShipments: any[] = [];
 valid.forEach(s => {
 let cId = s['cluster id'];
 if (!cId && s['Rider id']) cId = riderMap.get(s['Rider id']);
 if (cId === clusterUserData.id) {
 count++;
 myShipments.push(s);
 }
 });
 setClusterEarningShipments(myShipments);
 
 const { data: estimates } = await supabase.from('clusters_estimate').select('*').eq('cluster id', clusterUserData.id).maybeSingle();
 const rate = estimates ? parseFloat(estimates['per order rate'] || '0') : 0;
 const totalAmount = count * rate;
 
 setClusterEarningData({ count, rate, totalAmount });
 } catch(err) {}
 
 // Fetch penalty
 try {
 const { data: penalties } = await supabase.from('clusters_penalty').select('*').eq('cluster id', clusterUserData.id).order('created_at', { ascending: false });
 if (penalties) {
 setClusterPenaltyData(penalties);
 let sum = 0;
 penalties.forEach(p => {
 sum += parseFloat(p['penalty amount'] || '0');
 });
 setClusterPenaltySum(sum);
 }
 } catch(err) {}
 };

 useEffect(() => {
 if (isLoggedIn && clusterUserData) {
 fetchClusterEarningAndPenalty();
 }
 }, [isLoggedIn, clusterUserData]);
 const [showCashRidersModal, setShowCashRidersModal] = useState(false);
 
 const [showRiderPayableModal, setShowRiderPayableModal] = useState(false);
 const [totalRiderPayableAmount, setTotalRiderPayableAmount] = useState(0);
 const [riderPayableList, setRiderPayableList] = useState<any[]>([]);

  const fetchRiderPayableAmount = async () => {
    try {
      const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
      if (!localData) return;
      const user = JSON.parse(localData);
      if (!user?.id) return;
      
      const clusterId = user.id;

      const { data: incomeData, error: incomeError } = await supabase.from('rider_shipment_work_flow').select('*');
      if (incomeError) throw incomeError;
      
      const { data: riders, error: ridersError } = await supabase.from('riders').select('*').eq('cluster_id', clusterId);
      if (ridersError) throw ridersError;

      const riderMap: any = {};
      (riders || []).forEach((r: any) => {
        riderMap[r.id] = r;
      });

      const aggregated: any = {};
      (incomeData || []).forEach((row: any) => {
        const rId = row['rider_id'];
        if (!rId || !riderMap[rId]) return;
        const amt = parseFloat(row["Today's Earning"] || '0');
        if (!aggregated[rId]) {
          aggregated[rId] = 0;
        }
        aggregated[rId] += amt;
      });

      const { data: penaltyData } = await supabase.from('riders_penalty').select('*');
      const penaltyMap: any = {};
      (penaltyData || []).forEach((p: any) => {
        if (!penaltyMap[p['rider id']]) penaltyMap[p['rider id']] = 0;
        penaltyMap[p['rider id']] += parseFloat(p['penalty amount'] || '0');
      });

      let totalPayable = 0;
      const list = Object.keys(aggregated).map(rId => {
        const totalAmount = aggregated[rId];
        const penaltyAmount = penaltyMap[rId] || 0;
        const payable = Math.max(0, totalAmount - penaltyAmount);
        totalPayable += payable;
        const rInfo = riderMap[rId] || ({} as any);
        return {
          id: rId,
          short_id: rId.substring(0, 8),
          rider_name: rInfo.rider_name || rInfo['rider_name'] || 'Unknown',
          mobile: rInfo.registered_mobile_number || rInfo['registered_mobile_number'] || 'N/A',
          amount: payable,
          totalAmount,
          penaltyAmount,
          bank_name: rInfo.bank_name || 'N/A',
          account_no: rInfo.account_no || 'N/A',
          ifsc_code: rInfo.ifsc_code || 'N/A',
          upi_id: rInfo.upi_id || 'N/A'
        };
      });

      setRiderPayableList(list);
      setTotalRiderPayableAmount(totalPayable);
    } catch(e) {
      console.error("fetchRiderPayableAmount err", e);
    }
  };

  useEffect(() => {
    fetchRiderPayableAmount();
  }, [activeTab]);

  const [showHmPayableModal, setShowHmPayableModal] = useState(false);
  const [totalHmPayableAmount, setTotalHmPayableAmount] = useState(0);
  const [hmPayableList, setHmPayableList] = useState<any[]>([]);

  const fetchHmPayableAmount = async () => {
    try {
      const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
      let clusterId = adminProfileId;
      if (!clusterId && localData) {
        try {
          const user = JSON.parse(localData);
          clusterId = user?.id;
        } catch(e) {}
      }
      if (!clusterId) return;

      const { data: salaryData, error: salaryError } = await supabase.from('hub_manager_salary').select('*');
      if (salaryError) throw salaryError;
      
      const { data: hubManagers, error: hubManagersError } = await supabase.from('hub_managers').select('*').eq('cluster_id', clusterId);
      if (hubManagersError) throw hubManagersError;

      const hmMap: any = {};
      (hubManagers || []).forEach((hm: any) => {
        hmMap[hm.id] = hm;
      });

      const aggregated: any = {};
      (salaryData || []).forEach((row: any) => {
        const hmId = row['hub manager id'];
        if (!hmId || !hmMap[hmId]) return;
        const amt = parseFloat(row["fixed salary"] || '0');
        if (!amt) return;
        if (!aggregated[hmId]) {
          aggregated[hmId] = 0;
        }
        aggregated[hmId] += amt;
      });

      const { data: penaltyData } = await supabase.from('hub_managers_penalty').select('*');
      const penaltyMap: any = {};
      (penaltyData || []).forEach((p: any) => {
        if (!penaltyMap[p['hub manager id']]) penaltyMap[p['hub manager id']] = 0;
        penaltyMap[p['hub manager id']] += parseFloat(p['penalty amount'] || '0');
      });

      let totalPayable = 0;
      const list = Object.keys(aggregated).map(hmId => {
        const totalAmount = aggregated[hmId];
        const penaltyAmount = penaltyMap[hmId] || 0;
        const payable = Math.max(0, totalAmount - penaltyAmount);
        totalPayable += payable;
        const hmInfo = hmMap[hmId] || ({} as any);
        return {
          id: hmId,
          short_id: hmId.substring(0, 8),
          hub_manager_name: hmInfo.hub_manager_name || hmInfo.name || 'Unknown',
          hub_name: hmInfo.hub_name || 'N/A',
          mobile: hmInfo.registered_mobile_number || hmInfo.mobile || hmInfo.mobile_number || 'N/A',
          amount: payable,
          totalAmount,
          penaltyAmount,
          bank_name: hmInfo.bank_name || 'N/A',
          account_no: hmInfo.account_no || 'N/A',
          ifsc_code: hmInfo.ifsc_code || 'N/A',
          upi_id: hmInfo.upi_id || 'N/A'
        };
      });

      setHmPayableList(list);
      setTotalHmPayableAmount(totalPayable);
    } catch(e) {
      console.error("fetchHmPayableAmount err", e);
    }
  };

  const [showCustomerPayableModal, setShowCustomerPayableModal] = useState(false);
  const [totalCustomerPayableAmount, setTotalCustomerPayableAmount] = useState(0);
  const [customerPayableList, setCustomerPayableList] = useState<any[]>([]);

  const fetchClusterCustomerPayableAmount = async () => {
    try {
      const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
      let clusterId = adminProfileId;
      if (!clusterId && localData) {
        try {
          const user = JSON.parse(localData);
          clusterId = user?.id;
        } catch (e) {}
      }
      if (!clusterId && clusterUserData?.id) {
        clusterId = clusterUserData.id;
      }
      if (!clusterId) return;

      const { data: clusterAccepted } = await supabase
        .from('accepted_shipments')
        .select('"order ID", "awb number", "cluster id"')
        .eq('cluster id', clusterId);

      const clusterOrderIds = new Set<string>();
      const clusterAwbs = new Set<string>();
      (clusterAccepted || []).forEach((row: any) => {
        const ord = row['order ID'] || row['order id'];
        const awb = row['awb number'];
        if (ord) clusterOrderIds.add(ord);
        if (awb) clusterAwbs.add(awb);
      });

      const { data: customerOrders, error } = await supabase
        .from('customer_orders')
        .select('*')
        .neq('payout status', 'settled');

      if (error) {
        if (error.code === 'PGRST303') {
          setTimeout(fetchClusterCustomerPayableAmount, 2000);
          return;
        }
        throw error;
      }

      const filteredOrders = (customerOrders || []).filter((order: any) => {
        const orderClusterId = order['cluster id'] || order['cluster_id'];
        if (orderClusterId === clusterId) return true;
        const ord = order['order id'] || order['order ID'];
        if (ord && clusterOrderIds.has(ord)) return true;
        const awb = order['awb number'];
        if (awb && clusterAwbs.has(awb)) return true;
        return false;
      });

      const { data: customers } = await supabase.from('customers').select('*');
      const customerMap: Record<string, any> = {};
      (customers || []).forEach((c: any) => {
        customerMap[c.id] = c;
      });

      let total = 0;
      const list = filteredOrders.map((order: any) => {
        const cInfo = customerMap[order['customer id']] || {};
        const amt = parseFloat(order['sum'] || order['final payable amount'] || order['amount'] || '0');
        total += amt;

        const custId = order['customer id'] || order.id || 'N/A';
        return {
          id: order.id,
          order_id: order['order id'] || order['order ID'] || 'N/A',
          customer_id: custId,
          short_id: custId.length > 8 ? custId.substring(0, 8) : custId,
          name: cInfo.customer_name || cInfo.name || order.customer_name || 'Customer',
          mobile: cInfo.registered_mobile_number || cInfo.mobile_number || order['customer mobile number'] || 'N/A',
          sum: amt,
          bank_name: cInfo.bank_name || order.bank_name || 'N/A',
          account_no: cInfo.account_no || order.account_no || 'N/A',
          ifsc_code: cInfo.ifsc_code || order.ifsc_code || 'N/A',
          upi_id: cInfo.upi_id || order.upi_id || 'N/A'
        };
      });

      setCustomerPayableList(list);
      setTotalCustomerPayableAmount(total);
    } catch (e: any) {
      console.error("fetchClusterCustomerPayableAmount error:", e);
    }
  };

  const [showSellerPayableModal, setShowSellerPayableModal] = useState(false);
  const [totalSellerPayableAmount, setTotalSellerPayableAmount] = useState(0);
  const [sellerPayableList, setSellerPayableList] = useState<any[]>([]);

  const [customerPayableSearch, setCustomerPayableSearch] = useState('');
  const [sellerPayableSearch, setSellerPayableSearch] = useState('');
  const [riderPayableSearch, setRiderPayableSearch] = useState('');
  const [hmPayableSearch, setHmPayableSearch] = useState('');

  // Schedule & Ratio constants for Secure Transaction
  const SECURE_SCHEDULE_OPTIONS = [
    { value: '0 Days', label: '0 Days (≥ 0 Days / All Days)' },
    { value: '1 Day', label: '1 Day (≥ 1 Day)' },
    { value: '2 Days', label: '2 Days (≥ 2 Days)' },
    { value: '3 Days', label: '3 Days (≥ 3 Days)' },
    { value: '4 Days', label: '4 Days (≥ 4 Days)' },
    { value: '5 Days', label: '5 Days (≥ 5 Days)' },
    { value: '6 Days', label: '6 Days (≥ 6 Days)' },
    { value: '7 Days', label: '7 Days (≥ 7 Days)' },
    { value: '8 Days', label: '8 Days (≥ 8 Days)' },
    { value: '9 Days', label: '9 Days (≥ 9 Days)' },
    { value: '10 Days', label: '10 Days (≥ 10 Days)' },
    { value: '11 Days', label: '11 Days (≥ 11 Days)' },
    { value: '12 Days', label: '12 Days (≥ 12 Days)' },
    { value: '13 Days', label: '13 Days (≥ 13 Days)' },
    { value: '14 Days', label: '14 Days (≥ 14 Days)' },
    { value: '15 Days', label: '15 Days (≥ 15 Days)' },
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Instant', label: 'Instant' },
    { value: 'Per Delivery', label: 'Per Delivery' },
  ];

  const SECURE_RATIO_TEMPLATES = [
    { value: '1:1', label: '1:1 (1 Hr : 1 Day)' },
    { value: '1:2', label: '1:2 (1 Hr : 2 Days)' },
    { value: '1:3', label: '1:3 (1 Hr : 3 Days)' },
    { value: '2:1', label: '2:1 (2 Hrs : 1 Day)' },
    { value: '2:2', label: '2:2 (2 Hrs : 2 Days)' },
    { value: '2:3', label: '2:3 (2 Hrs : 3 Days)' },
    { value: '3:2', label: '3:2 (3 Hrs : 2 Days)' },
    { value: '4:1', label: '4:1 (4 Hrs : 1 Day)' },
    { value: '4:2', label: '4:2 (4 Hrs : 2 Days)' },
    { value: '6:1', label: '6:1 (6 Hrs : 1 Day)' },
    { value: '6:3', label: '6:3 (6 Hrs : 3 Days)' },
    { value: '12:1', label: '12:1 (12 Hrs : 1 Day)' },
    { value: '12:2', label: '12:2 (12 Hrs : 2 Days)' },
    { value: '24:1', label: '24:1 (24 Hrs : 1 Day)' },
    { value: '24:2', label: '24:2 (24 Hrs : 2 Days)' },
    { value: '48:2', label: '48:2 (48 Hrs : 2 Days)' },
    { value: '48:5', label: '48:5 (48 Hrs : 5 Days)' },
  ];

  const parseScheduleDays = (scheduleStr: string | null | undefined): number | null => {
    if (!scheduleStr || scheduleStr.trim().toLowerCase() === 'none') return null;
    const match = scheduleStr.match(/^(\d+)\s*Days?/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  const parseRatio = (ratioStr: string): { hours: number; days: number; isNone: boolean } => {
    if (!ratioStr || ratioStr.trim().toLowerCase() === 'none') return { hours: 0, days: 0, isNone: true };
    const parts = ratioStr.split(':').map(p => parseFloat(p.trim()));
    const hours = isNaN(parts[0]) || parts[0] <= 0 ? 1 : parts[0];
    const days = isNaN(parts[1]) || parts[1] <= 0 ? 2 : parts[1];
    return { hours, days, isNone: false };
  };

  const getSavedClusterSecureTx = () => {
    try {
      const data = typeof window !== 'undefined' ? localStorage.getItem('ss_secure_tx_settings_cluster') : null;
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  const savedClusterTx = getSavedClusterSecureTx();

  const [paymentMethodsList, setPaymentMethodsList] = useState<PaymentMethodType[]>(
    savedClusterTx?.paymentMethodsList || [
      { id: '1', name: 'Google Pay', link: 'tez://upi/pay?pa=merchant@upi&pn=Suriyawan&cu=INR' },
      { id: '2', name: 'PhonePe', link: 'phonepe://pay?pa=merchant@upi&pn=Suriyawan&cu=INR' },
      { id: '3', name: 'Paytm', link: 'paytmmp://pay?pa=merchant@upi&pn=Suriyawan&cu=INR' }
    ]
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<'UPI ID' | 'Bank Account'>(
    savedClusterTx?.selectedPaymentType || 'Bank Account'
  );
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(() => {
    try {
      const data = typeof window !== 'undefined' ? localStorage.getItem('ss_secure_tx_settings_cluster') : null;
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.selectedPaymentMethods) && parsed.selectedPaymentMethods.length > 0) {
          return parsed.selectedPaymentMethods;
        }
      }
    } catch (e) {}
    return ['1'];
  });
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodLink, setNewMethodLink] = useState('');
  const [secureSaveSuccess, setSecureSaveSuccess] = useState(false);

  // Master Secure Transaction Settings from Admin Portal (Single Source of Truth)
  const [masterAdminSettings, setMasterAdminSettings] = useState<any>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ss_secure_tx_settings_admin') : null;
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const syncFromAdmin = () => {
      try {
        const raw = localStorage.getItem('ss_secure_tx_settings_admin');
        if (raw) {
          setMasterAdminSettings(JSON.parse(raw));
        }
      } catch (e) {}
    };
    syncFromAdmin();
    window.addEventListener('storage', syncFromAdmin);
    window.addEventListener('secure_tx_settings_updated', syncFromAdmin);
    const interval = setInterval(syncFromAdmin, 1000);
    return () => {
      window.removeEventListener('storage', syncFromAdmin);
      window.removeEventListener('secure_tx_settings_updated', syncFromAdmin);
      clearInterval(interval);
    };
  }, []);

  const handleSaveSecureSettings = () => {
    try {
      const payload = {
        selectedPaymentType,
        paymentMethodsList,
        selectedPaymentMethods,
      };
      localStorage.setItem('ss_secure_tx_settings_cluster', JSON.stringify(payload));
      setSecureSaveSuccess(true);
      setTimeout(() => {
        setSecureSaveSuccess(false);
        setShowSecureTransactionModal(null);
      }, 700);
    } catch (e) {
      console.error('Error saving cluster secure tx settings:', e);
      setShowSecureTransactionModal(null);
    }
  };

  // Effective Lists based on Master Admin Policy Settings
  const effectiveCustomerPayableList = (
    masterAdminSettings?.customerSchedule !== 'None' &&
    masterAdminSettings?.customerLockState === 'Lock' &&
    masterAdminSettings?.customerLockedSnapshotIds
  ) ? customerPayableList.filter(c => masterAdminSettings.customerLockedSnapshotIds.includes(c.id))
    : customerPayableList;

  const effectiveSellerPayableList = (
    masterAdminSettings?.sellerSchedule !== 'None' &&
    masterAdminSettings?.sellerLockState === 'Lock' &&
    masterAdminSettings?.sellerLockedSnapshotIds
  ) ? sellerPayableList.filter(s => masterAdminSettings.sellerLockedSnapshotIds.includes(s.id))
    : sellerPayableList;

  const effectiveRiderPayableList = (
    masterAdminSettings?.riderSchedule !== 'None' &&
    masterAdminSettings?.riderLockState === 'Lock' &&
    masterAdminSettings?.riderLockedSnapshotIds
  ) ? riderPayableList.filter(r => masterAdminSettings.riderLockedSnapshotIds.includes(r.id))
    : riderPayableList;

  const effectiveHmPayableList = (
    masterAdminSettings?.hmSchedule !== 'None' &&
    masterAdminSettings?.hmLockState === 'Lock' &&
    masterAdminSettings?.hmLockedSnapshotIds
  ) ? hmPayableList.filter(h => masterAdminSettings.hmLockedSnapshotIds.includes(h.id))
    : hmPayableList;

  const displayCustomerPayableAmount = (
    masterAdminSettings?.customerSchedule !== 'None' &&
    masterAdminSettings?.customerLockState === 'Lock' &&
    masterAdminSettings?.customerLockedSnapshotIds
  ) ? effectiveCustomerPayableList.reduce((acc, c) => acc + (parseFloat(c.sum) || 0), 0)
    : totalCustomerPayableAmount;

  const displaySellerPayableAmount = (
    masterAdminSettings?.sellerSchedule !== 'None' &&
    masterAdminSettings?.sellerLockState === 'Lock' &&
    masterAdminSettings?.sellerLockedSnapshotIds
  ) ? effectiveSellerPayableList.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0)
    : totalSellerPayableAmount;

  const displayRiderPayableAmount = (
    masterAdminSettings?.riderSchedule !== 'None' &&
    masterAdminSettings?.riderLockState === 'Lock' &&
    masterAdminSettings?.riderLockedSnapshotIds
  ) ? effectiveRiderPayableList.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0)
    : totalRiderPayableAmount;

  const displayHmPayableAmount = (
    masterAdminSettings?.hmSchedule !== 'None' &&
    masterAdminSettings?.hmLockState === 'Lock' &&
    masterAdminSettings?.hmLockedSnapshotIds
  ) ? effectiveHmPayableList.reduce((acc, h) => acc + (parseFloat(h.amount) || 0), 0)
    : totalHmPayableAmount;

  const filteredCustomerPayableList = effectiveCustomerPayableList.filter(cust => {
    if (!customerPayableSearch.trim()) return true;
    const q = customerPayableSearch.toLowerCase();
    return (
      (cust.name && String(cust.name).toLowerCase().includes(q)) ||
      (cust.customer_id && String(cust.customer_id).toLowerCase().includes(q)) ||
      (cust.short_id && String(cust.short_id).toLowerCase().includes(q)) ||
      (cust.id && String(cust.id).toLowerCase().includes(q)) ||
      (cust.order_id && String(cust.order_id).toLowerCase().includes(q)) ||
      (cust.mobile && String(cust.mobile).toLowerCase().includes(q)) ||
      (cust.bank_name && String(cust.bank_name).toLowerCase().includes(q)) ||
      (cust.account_no && String(cust.account_no).toLowerCase().includes(q)) ||
      (cust.ifsc_code && String(cust.ifsc_code).toLowerCase().includes(q)) ||
      (cust.upi_id && String(cust.upi_id).toLowerCase().includes(q))
    );
  });

  const filteredSellerPayableList = effectiveSellerPayableList.filter(seller => {
    if (!sellerPayableSearch.trim()) return true;
    const q = sellerPayableSearch.toLowerCase();
    return (
      (seller.shop_name && String(seller.shop_name).toLowerCase().includes(q)) ||
      (seller.seller_name && String(seller.seller_name).toLowerCase().includes(q)) ||
      (seller.short_id && String(seller.short_id).toLowerCase().includes(q)) ||
      (seller.id && String(seller.id).toLowerCase().includes(q)) ||
      (seller.pincode && String(seller.pincode).toLowerCase().includes(q)) ||
      (seller.mobile && String(seller.mobile).toLowerCase().includes(q)) ||
      (seller.bank_name && String(seller.bank_name).toLowerCase().includes(q)) ||
      (seller.account_no && String(seller.account_no).toLowerCase().includes(q)) ||
      (seller.ifsc_code && String(seller.ifsc_code).toLowerCase().includes(q)) ||
      (seller.upi_id && String(seller.upi_id).toLowerCase().includes(q))
    );
  });

  const filteredRiderPayableList = effectiveRiderPayableList.filter(rider => {
    if (!riderPayableSearch.trim()) return true;
    const q = riderPayableSearch.toLowerCase();
    return (
      (rider.rider_name && String(rider.rider_name).toLowerCase().includes(q)) ||
      (rider.short_id && String(rider.short_id).toLowerCase().includes(q)) ||
      (rider.id && String(rider.id).toLowerCase().includes(q)) ||
      (rider.mobile && String(rider.mobile).toLowerCase().includes(q)) ||
      (rider.bank_name && String(rider.bank_name).toLowerCase().includes(q)) ||
      (rider.account_no && String(rider.account_no).toLowerCase().includes(q)) ||
      (rider.ifsc_code && String(rider.ifsc_code).toLowerCase().includes(q)) ||
      (rider.upi_id && String(rider.upi_id).toLowerCase().includes(q))
    );
  });

  const filteredHmPayableList = effectiveHmPayableList.filter(hm => {
    if (!hmPayableSearch.trim()) return true;
    const q = hmPayableSearch.toLowerCase();
    return (
      (hm.hub_manager_name && String(hm.hub_manager_name).toLowerCase().includes(q)) ||
      (hm.hub_name && String(hm.hub_name).toLowerCase().includes(q)) ||
      (hm.short_id && String(hm.short_id).toLowerCase().includes(q)) ||
      (hm.id && String(hm.id).toLowerCase().includes(q)) ||
      (hm.mobile && String(hm.mobile).toLowerCase().includes(q)) ||
      (hm.bank_name && String(hm.bank_name).toLowerCase().includes(q)) ||
      (hm.account_no && String(hm.account_no).toLowerCase().includes(q)) ||
      (hm.ifsc_code && String(hm.ifsc_code).toLowerCase().includes(q)) ||
      (hm.upi_id && String(hm.upi_id).toLowerCase().includes(q))
    );
  });

  const fetchClusterSellerPayableAmount = async () => {
    try {
      const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
      let clusterId = adminProfileId;
      if (!clusterId && localData) {
        try {
          const user = JSON.parse(localData);
          clusterId = user?.id;
        } catch (e) {}
      }
      if (!clusterId && clusterUserData?.id) {
        clusterId = clusterUserData.id;
      }
      if (!clusterId) return;

      const { data: acceptedRows, error: acceptedErr } = await supabase
        .from('accepted_shipments')
        .select('"id", "selller id", "cluster id", "order ID", "awb number", "days", "shipment type", "total selling price", "total delevery charge", "payout status"')
        .eq('cluster id', clusterId);

      if (acceptedErr) console.warn("Error fetching cluster accepted_shipments:", acceptedErr);

      const clusterSellerIds = new Set<string>();
      const clusterOrderIds = new Set<string>();
      const clusterAwbs = new Set<string>();

      const orderDaysMap: Record<string, number> = {};
      const awbDaysMap: Record<string, number> = {};
      const sellerShipmentsMap: Record<string, any[]> = {};

      (acceptedRows || []).forEach((row: any) => {
        const sId = row['selller id'] || row['seller id'];
        const ordId = row['order ID'] || row['order id'];
        const awb = row['awb number'];
        const rawDays = row['days'];
        const parsedDays = rawDays !== null && rawDays !== undefined && rawDays !== '' ? parseFloat(rawDays) : null;

        if (sId) clusterSellerIds.add(sId);
        if (ordId) clusterOrderIds.add(ordId);
        if (awb) clusterAwbs.add(awb);

        if (ordId && parsedDays !== null && !isNaN(parsedDays)) {
          orderDaysMap[ordId] = Math.max(orderDaysMap[ordId] ?? -Infinity, parsedDays);
        }
        if (awb && parsedDays !== null && !isNaN(parsedDays)) {
          awbDaysMap[awb] = Math.max(awbDaysMap[awb] ?? -Infinity, parsedDays);
        }
      });

      const { data: incomeData, error: incomeErr } = await supabase
        .from('selller_income_estimate')
        .select('*')
        .eq('payout status', 'Pending');

      if (incomeErr) {
        if (incomeErr.code === 'PGRST303') {
          setTimeout(fetchClusterSellerPayableAmount, 2000);
          return;
        }
        throw incomeErr;
      }

      // Read master admin schedule for seller (default: '4 Days')
      const rawAdminTx = typeof window !== 'undefined' ? localStorage.getItem('ss_secure_tx_settings_admin') : null;
      const parsedAdminTx = rawAdminTx ? JSON.parse(rawAdminTx) : null;
      const currentSchedule = parsedAdminTx?.sellerSchedule || masterAdminSettings?.sellerSchedule || '4 Days';
      const minDays = parseScheduleDays(currentSchedule);

      const { data: sellers } = await supabase.from('sellers').select('*');
      const sellerMap: Record<string, any> = {};
      (sellers || []).forEach((s: any) => {
        sellerMap[s.id] = s;
      });

      let total = 0;
      const aggregated: Record<string, number> = {};
      const processedOrderIds = new Set<string>();
      const processedAwbs = new Set<string>();

      (incomeData || []).forEach((row: any) => {
        const sId = row['seller id'] || row['selller id'];
        const ordId = row['order id'] || row['order ID'];
        const awb = row['awb number'];
        if (!sId) return;

        const inCluster = (ordId && clusterOrderIds.has(ordId)) || (awb && clusterAwbs.has(awb)) || clusterSellerIds.has(sId);
        if (!inCluster) return;

        // Check days from accepted_shipments or income
        const rawDays = row['days'];
        const incomeDays = rawDays !== null && rawDays !== undefined && rawDays !== '' ? parseFloat(rawDays) : null;
        let shipmentDays: number | null = null;
        if (ordId && orderDaysMap[ordId] !== undefined) {
          shipmentDays = orderDaysMap[ordId];
        } else if (awb && awbDaysMap[awb] !== undefined) {
          shipmentDays = awbDaysMap[awb];
        } else if (incomeDays !== null && !isNaN(incomeDays)) {
          shipmentDays = incomeDays;
        }

        // Apply schedule filter if not 'None'
        if (minDays !== null) {
          if (shipmentDays === null || shipmentDays < minDays) return;
        }

        const amt = parseFloat(row['final payable amount'] || '0');
        total += amt;
        aggregated[sId] = (aggregated[sId] || 0) + amt;

        if (ordId) processedOrderIds.add(ordId);
        if (awb) processedAwbs.add(awb);

        if (!sellerShipmentsMap[sId]) sellerShipmentsMap[sId] = [];
        sellerShipmentsMap[sId].push({
          orderId: ordId,
          awb: awb,
          days: shipmentDays,
          amount: amt
        });
      });

      // Also check accepted_shipments directly for any missing delivered/pending shipments
      (acceptedRows || []).forEach((ship: any) => {
        const ordId = ship['order ID'] || ship['order id'];
        const awb = ship['awb number'];
        const sId = ship['selller id'] || ship['seller id'];
        const pStatus = (ship['payout status'] || '').toLowerCase();
        if (pStatus === 'settled') return;
        if (!sId) return;

        if (ordId && processedOrderIds.has(ordId)) return;
        if (awb && processedAwbs.has(awb)) return;

        const rawDays = ship['days'];
        const parsedDays = rawDays !== null && rawDays !== undefined && rawDays !== '' ? parseFloat(rawDays) : null;

        if (minDays !== null) {
          if (parsedDays === null || parsedDays < minDays) return;
        }

        const sp = parseFloat(ship['total selling price']) || parseFloat(ship['total amount']) || 0;
        const dc = parseFloat(ship['total delevery charge']) || 0;
        const amt = sp + dc;
        if (amt > 0) {
          total += amt;
          aggregated[sId] = (aggregated[sId] || 0) + amt;
          if (!sellerShipmentsMap[sId]) sellerShipmentsMap[sId] = [];
          sellerShipmentsMap[sId].push({
            orderId: ordId,
            awb: awb,
            days: parsedDays,
            amount: amt
          });
        }
      });

      const list = Object.keys(aggregated).map(sId => {
        const sInfo = sellerMap[sId] || {};
        return {
          id: sId,
          short_id: sId.substring(0, 8),
          shop_name: sInfo.shop_name || sInfo['shop name'] || sInfo.name || 'Seller Shop',
          seller_name: sInfo.seller_name || sInfo['seller name'] || sInfo.name || 'Seller',
          pincode: sInfo.registered_pincode || sInfo.pincode || sInfo['pin code'] || 'N/A',
          mobile: sInfo.registered_mobile_number || sInfo.mobile_number || sInfo['mobile number'] || 'N/A',
          amount: aggregated[sId],
          bank_name: sInfo.bank_name || 'N/A',
          account_no: sInfo.account_no || 'N/A',
          ifsc_code: sInfo.ifsc_code || 'N/A',
          upi_id: sInfo.upi_id || 'N/A',
          shipments: sellerShipmentsMap[sId] || []
        };
      });

      setSellerPayableList(list);
      setTotalSellerPayableAmount(total);
    } catch (e: any) {
      console.error("fetchClusterSellerPayableAmount error:", e);
    }
  };

  useEffect(() => {
    fetchClusterCustomerPayableAmount();
    fetchClusterSellerPayableAmount();

    const channel = supabase.channel('cluster_portal_payables_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments' }, () => {
        fetchClusterCustomerPayableAmount();
        fetchClusterSellerPayableAmount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'selller_income_estimate' }, () => {
        fetchClusterSellerPayableAmount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_orders' }, () => {
        fetchClusterCustomerPayableAmount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, clusterUserData?.id, masterAdminSettings?.sellerSchedule]);
 const [showCashHubManagersModal, setShowCashHubManagersModal] = useState(false);
 const [totalCashWithHubManagers, setTotalCashWithHubManagers] = useState(0);
 const [cashHubManagersList, setCashHubManagersList] = useState<any[]>([]);
 const [collectingHmId, setCollectingHmId] = useState<string | null>(null);
 const [selectedHubManagerForCalc, setSelectedHubManagerForCalc] = useState<any | null>(null);
 const [hmCalcDenominations, setHmCalcDenominations] = useState<Record<number, number>>({});
 const [previewImage, setPreviewImage] = useState<string | null>(null);
 const scrollDir = useScrollDirection();
 
 const [secureTxSettings, setSecureTxSettings] = useState({
 autoSequential: false,
 autoBatch: false,
 autoSettlement: true,
 salaryHold: false
 });
 const secureTxSettingsRef = useRef(secureTxSettings);
 useEffect(() => {
 secureTxSettingsRef.current = secureTxSettings;
 }, [secureTxSettings]);
const [multiPaymentEnabled, setMultiPaymentEnabled] = useState(false);
 const [paymentStates, setPaymentStates] = useState<Record<string, { status: 'pending' | 'processing' | 'hold' | 'settled' | 'failed', failedAt?: number }>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('cluster_payable_payment_states') : null;
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cluster_payable_payment_states', JSON.stringify(paymentStates));
      }
    } catch (e) {}
  }, [paymentStates]);

  const [clusterDisbursementBalance, setClusterDisbursementBalance] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('cluster_disbursement_balance') : null;
    return saved ? parseFloat(saved) : 150000;
  });

  const handlePayNow = (_userId?: string) => {
    if (!_userId) return;
    const target =
      customerPayableList.find(c => c.id === _userId) ||
      sellerPayableList.find(s => s.id === _userId) ||
      riderPayableList.find(r => r.id === _userId) ||
      hmPayableList.find(h => h.id === _userId);

    if (!target) return;

    let savedTx: any = null;
    try {
      const raw = localStorage.getItem('ss_secure_tx_settings_cluster');
      if (raw) savedTx = JSON.parse(raw);
    } catch (e) {}

    const upiId = (target.upi_id || target.upiId || '').trim();
    const payeeName = (target.name || target.customer_name || target.seller_name || target.shop_name || target.rider_name || target.hub_manager_name || 'Payee').trim();
    const rawAmt = target.amount || target.sum || target.payableAmount || 0;
    const amount = Number(rawAmt).toFixed(2);
    const purpose = `Payout-${target.short_id || target.id || 'Settlement'}`;

    const selectedMethodId = (savedTx?.selectedPaymentMethods && savedTx.selectedPaymentMethods[0]) || (selectedPaymentMethods && selectedPaymentMethods[0]) || '1';
    const listToSearch = (savedTx?.paymentMethodsList && savedTx.paymentMethodsList.length > 0) ? savedTx.paymentMethodsList : paymentMethodsList;
    const method = listToSearch.find((m: any) => m.id === selectedMethodId) || listToSearch[0] || { link: 'upi://pay' };

    let baseLink = method.link || 'upi://pay';
    const scheme = baseLink.split('?')[0] || 'upi://pay';

    const params = new URLSearchParams();
    if (upiId) params.set('pa', upiId);
    params.set('pn', payeeName);
    params.set('am', amount);
    params.set('cu', 'INR');
    params.set('tn', purpose);

    const fullDeepLink = `${scheme}?${params.toString()}`;

    setPaymentStates(prev => ({
      ...prev,
      [_userId]: { status: 'processing' }
    }));

    try {
      const a = document.createElement('a');
      a.href = fullDeepLink;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Deep link invocation error:", e);
    }
  };

  const [settlingAllUserType, setSettlingAllUserType] = useState<string | null>(null);
  const [settlingProgress, setSettlingProgress] = useState<{ current: number; total: number } | null>(null);

  const handleMarkAllSettledForType = async (userType: string) => {
    let list: any[] = [];
    if (userType === 'Customer') list = filteredCustomerPayableList;
    else if (userType === 'Seller') list = filteredSellerPayableList;
    else if (userType === 'Rider') list = filteredRiderPayableList;
    else if (userType === 'Hub Manager') list = filteredHmPayableList;

    const eligible = list.filter(item => {
      const state = paymentStates[item.id]?.status;
      return state !== 'settled' && state !== 'hold';
    });

    if (eligible.length === 0) return;

    setSettlingAllUserType(userType);
    setSettlingProgress({ current: 0, total: eligible.length });

    for (let i = 0; i < eligible.length; i++) {
      const item = eligible[i];
      try {
        await handleMarkAsSettled(item.id);
      } catch (e) {
        console.error(`Error settling ${userType} item ${item.id}:`, e);
      }
      setSettlingProgress({ current: i + 1, total: eligible.length });
      await new Promise(r => setTimeout(r, 60));
    }

    setSettlingAllUserType(null);
    setSettlingProgress(null);
  };
 const handleHoldAmount = (userId: string) => {
 setPaymentStates(prev => ({ ...prev, [userId]: { status: 'hold' } }));
 };
  const handleMarkAsSettled = async (userId: string) => {
    if (paymentStates[userId]?.status === 'hold') return;
    setPaymentStates(prev => {
      const updated = { ...prev, [userId]: { status: 'settled' } };
      try {
        localStorage.setItem('cluster_payable_payment_states', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
 
 const currentClusterId = clusterUserData?.id || (() => {
   try {
     const local = localStorage.getItem('portal_auth_cluster');
     return local ? JSON.parse(local)?.id : null;
   } catch(e) { return null; }
 })();
 const validClusterId = isValidUUID(currentClusterId) ? currentClusterId : null;

 // Check if it's a Rider
 const riderOrder = riderPayableList.find(c => c.id === userId);
 if (riderOrder) {
 try {
 const { data: shipmentsToTransfer } = await supabase.from('rider_shipment_work_flow').select('*').eq('rider_id', riderOrder.id);
 if (shipmentsToTransfer && shipmentsToTransfer.length > 0) {
 const mappedRider = shipmentsToTransfer.map(s => {
   const { id, created_at, ...rest } = s;
   return {
     ...rest,
     'cluster id': validClusterId,
     'rider_id': isValidUUID(riderOrder.id) ? riderOrder.id : (isValidUUID(s.rider_id) ? s.rider_id : null),
     'payout status': 'settled'
   };
 });
 const { error: insertRiderErr } = await supabase.from('settled_rider_shipments').insert(mappedRider);
 if (insertRiderErr) console.error("Error inserting settled_rider_shipments:", insertRiderErr);
 await supabase.from('rider_shipment_work_flow').delete().eq('rider_id', riderOrder.id);
 }
 await supabase.from('riders_penalty').delete().eq('rider id', riderOrder.id);
 const { error: insertFinRiderErr } = await supabase.from('finished_riders_payable_amount').insert([{
 'rider id': isValidUUID(riderOrder.id) ? riderOrder.id : null,
 'total amount': (riderOrder.amount || 0).toString(),
 'bank name': riderOrder.bank_name || 'N/A',
 'account no': riderOrder.account_no || 'N/A',
 'ifsc code': riderOrder.ifsc_code || 'N/A',
 'upi id': riderOrder.upi_id || 'N/A',
 'total settled amount': (riderOrder.amount || 0).toString(),
 'penalty amount': (riderOrder.penaltyAmount || 0).toString(),
 'penalty status': 'N/A',
 'final Settlement status': 'settled'
 }]);
 if (insertFinRiderErr) {
   console.error("Error inserting finished_riders_payable_amount:", insertFinRiderErr);
 }
 fetchRiderPayableAmount();
 } catch (e) {
 console.error("Error settling rider in ClusterPortal:", e);
 }
 }
 
 // Check if it's a Hub Manager
 const hmOrder = hmPayableList.find(c => c.id === userId);
 if (hmOrder) {
 try {
 const { data: salaryData } = await supabase.from('hub_manager_salary').select('*').eq('hub manager id', hmOrder.id);
 if (salaryData && salaryData.length > 0) {
 const mappedHm = salaryData.map(s => {
   const { id, created_at, ...rest } = s;
   return {
     ...rest,
     'cluster id': validClusterId,
     'hub manager id': isValidUUID(hmOrder.id) ? hmOrder.id : (isValidUUID(s['hub manager id']) ? s['hub manager id'] : null),
     'payout status': 'settled'
   };
 });
  const { error: insertHmErr } = await supabase.from('settled_hub_manager_salary').insert(mappedHm);
  if (insertHmErr) {
    console.error("Error inserting settled_hub_manager_salary:", insertHmErr);
  } else {
    await supabase.from('hub_manager_salary').delete().eq('hub manager id', hmOrder.id);
  }
 }
 await supabase.from('hub_managers_penalty').delete().eq('hub manager id', hmOrder.id);
 const { error: insertFinHmErr } = await supabase.from('finished_hub_managers_payable_amount').insert([{
 'hub manager id': isValidUUID(hmOrder.id) ? hmOrder.id : null,
 'total amount': (hmOrder.amount || 0).toString(),
 'bank name': hmOrder.bank_name || 'N/A',
 'account no': hmOrder.account_no || 'N/A',
 'ifsc code': hmOrder.ifsc_code || 'N/A',
 'upi id': hmOrder.upi_id || 'N/A',
 'total settled amount': (hmOrder.amount || 0).toString(),
 'penalty amount': (hmOrder.penaltyAmount || 0).toString(),
 'penalty status': 'N/A',
 'final Settlement status': 'settled'
 }]);
 if (insertFinHmErr) {
   console.error("Error inserting finished_hub_managers_payable_amount:", insertFinHmErr);
 }
 fetchHmPayableAmount();
 } catch (e) {
 console.error("Error settling hub manager in ClusterPortal:", e);
 }
 }
 };

 

 const activePayableList = [...riderPayableList, ...hmPayableList];

 useEffect(() => {
 if (!activePayableList || activePayableList.length === 0) return;

 if (secureTxSettings.salaryHold) {
 // Apply Hold to all
 const newStates = { ...paymentStates };
 let changed = false;
 activePayableList.forEach(item => {
 if (newStates[item.id]?.status !== 'settled' && newStates[item.id]?.status !== 'success') {
 newStates[item.id] = { status: 'hold' };
 changed = true;
 }
 });
 if (changed) setPaymentStates(newStates);
 return; // If salary hold is on, we don't process auto payments
 } else {
 // If salary hold is OFF, remove hold from those currently on hold?
 // Let's assume toggling OFF salaryHold reverts pending.
 const newStates = { ...paymentStates };
 let changed = false;
 activePayableList.forEach(item => {
 if (newStates[item.id]?.status === 'hold') {
 delete newStates[item.id];
 changed = true;
 }
 });
 if (changed) setPaymentStates(newStates);
 }

 if (secureTxSettings.autoBatch) {
 activePayableList.forEach(item => {
 handlePayNow(item.id);
 });
 } else if (secureTxSettings.autoSequential) {
 // Find pending items
 const pendingItems = activePayableList.filter(item => {
 const st = paymentStates[item.id]?.status;
 return !st || (st === 'failed' && paymentStates[item.id]?.failedAt && (Date.now() - paymentStates[item.id].failedAt) / (1000 * 60 * 60) >= 4);
 });
 
 // Count how many are currently processing
 const processingCount = activePayableList.filter(item => paymentStates[item.id]?.status === 'processing').length;
 
 // Allowed concurrent limit based on selected payment methods
 const maxConcurrent = multiPaymentEnabled ? Math.max(1, selectedPaymentMethods.length) : 1;
 
 const availableSlots = maxConcurrent - processingCount;
 
 if (availableSlots > 0 && pendingItems.length > 0) {
 const itemsToProcess = pendingItems.slice(0, availableSlots);
 itemsToProcess.forEach(item => {
 handlePayNow(item.id);
 });
 }
 }
 }, [secureTxSettings, activePayableList, paymentStates, multiPaymentEnabled, selectedPaymentMethods]);
const [showProfile, setShowProfile] = useState(false);
 const [showLossPenalty, setShowLossPenalty] = useState(false);
 const [clusterPenalties, setClusterPenalties] = useState<any[]>([]);
 const [loadingClusterPenalties, setLoadingClusterPenalties] = useState(false);
 
 const fetchClusterPenaltiesLoss = async () => {
 if (!clusterUserData?.id) return;
 setLoadingClusterPenalties(true);
 const { data } = await supabase.from('clusters_penalty').select('*').eq('cluster id', clusterUserData.id).order('created_at', { ascending: false });
 setClusterPenalties(data || []);
 setLoadingClusterPenalties(false);
 };
 const [showLogoutModal, setShowLogoutModal] = useState(false);
 const [profileSavedToast, setProfileSavedToast] = useState(false);
 const [adminProfileId, setAdminProfileId] = useState<string | null>(null);
 const [originalEmail, setOriginalEmail] = useState('');
 const [isLoadingProfile, setIsLoadingProfile] = useState(false);
 
 const [totalPendingDepositCluster, setTotalPendingDepositCluster] = useState<number | null>(null);
 const [pendingDepositsListCluster, setPendingDepositsListCluster] = useState<any[]>([]);
 const [showPendingDepositModal, setShowPendingDepositModal] = useState(false);
 
 const handleHmCollect = async (hm: any) => {
 setCollectingHmId(hm.id);
 if (!adminProfileId) {
 alert('Cluster profile not loaded.');
 return;
 }
 try {
 const statusStr = `ID: ${hm.id?.substring(0,8) || 'N/A'} | Hub: ${hm.hub_name || 'Unknown'} | Name: ${hm.hub_manager_name || 'Unknown'} | Mob: ${hm.registered_mobile_number || 'N/A'} | Date: ${new Date().toLocaleString('en-IN')} | Total Collected Cash: ₹${hm.cash}`;
 
 await supabase.from('cash_with_clusters').insert([{
 'cluster id': adminProfileId,
 
 'cash payment status': statusStr,
 'total cash payment': String(hm.cash)
 }]);
 
 await supabase.from('hub_managers').update({
 updated_at: new Date().toISOString(),
 'total collected cash': String(hm.cash)
 }).eq('id', hm.id);
 
 await supabase.from('cash_with_hub_managers').delete().eq('hub manager id', hm.id);
 
 setCashHubManagersList(prev => prev.filter(h => h.id !== hm.id));
 setTotalCashWithHubManagers(prev => prev !== null ? prev - (hm.cash || 0) : 0);
 
 // Fetch pending deposit again
 fetchClusterPendingDeposit(adminProfileId);
 
 alert('Cash collected from Hub Manager successfully!');
 } catch (err) {
 console.error(err);
 alert('Error collecting cash');
 } finally {
 setCollectingHmId(null);
 }
 };

 const fetchClusterPendingDeposit = async (clusterId: string) => {
 try {
 const { data } = await supabase.from('cash_with_clusters').select('*').eq('cluster id', clusterId).order('created_at', { ascending: true });
 if (data) {
 setTotalPendingDepositCluster(data.reduce((acc, curr) => acc + (Number(curr['total cash payment']) || 0), 0));
 setPendingDepositsListCluster(data);
 } else {
 setTotalPendingDepositCluster(0);
 setPendingDepositsListCluster([]);
 }
 } catch (err) { 
 console.error(err); 
 setTotalPendingDepositCluster(0);
 }
 };

 useEffect(() => {
 if (adminProfileId) {
 fetchClusterPendingDeposit(adminProfileId);
 }
 }, [adminProfileId]);

useEffect(() => {
 const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
 let clusterId = adminProfileId;
 if (!clusterId && localData) {
   try {
     const user = JSON.parse(localData);
     clusterId = user?.id;
   } catch(e) {}
 }

 if (activeTab === 'Payments' && clusterId) {
   fetchCashWithHubManagers();
   fetchCashWithRiders();
   fetchHmPayableAmount();
   fetchRiderPayableAmount();

   const clPmtChannel = supabase.channel(`cluster_pmt_rt_${Date.now()}`)
     .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_riders' }, () => {
       fetchCashWithRiders();
     })
     .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_live_work_flow' }, () => {
       fetchCashWithRiders();
     })
     .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_hub_managers' }, () => {
       fetchCashWithHubManagers();
     })
     .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_manager_salary' }, () => {
       fetchHmPayableAmount();
     })
     .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_managers' }, () => {
       fetchHmPayableAmount();
     })
     .subscribe();

   return () => {
     supabase.removeChannel(clPmtChannel);
   };
 }
 }, [activeTab, adminProfileId]);

 const fetchCashWithHubManagers = async () => {
 try {
 const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
 let clusterId = adminProfileId;
 if (!clusterId && localData) {
   try {
     const user = JSON.parse(localData);
     clusterId = user?.id;
   } catch(e) {}
 }

 const { data: chmData } = await supabase.from('cash_with_hub_managers').select('*').order('created_at', { ascending: true });
 if (chmData && chmData.length > 0) {
 const hubManagerIds = [...new Set(chmData.map((i: any) => i['hub manager id']).filter(Boolean))];
 
 const { data: hmData } = await supabase.from('hub_managers').select('id, hub_name, hub_manager_name, registered_mobile_number, cluster_id').in('id', hubManagerIds);
 
 let totalHM = 0;
 const hmList: any[] = [];
 
 hubManagerIds.forEach((hmId: any) => {
 const managerInfo = (hmData || []).find((h: any) => h.id === hmId) || ({} as any);
 if (clusterId && managerInfo.cluster_id !== clusterId) return;

 const managerRecords = chmData.filter((c: any) => c['hub manager id'] === hmId);
 const managerTotal = managerRecords.reduce((acc: number, curr: any) => acc + (Number(curr['total cash payment']) || 0), 0);
 
 if (managerTotal > 0) {
 totalHM += managerTotal;
 hmList.push({
 id: hmId,
 hub_name: managerInfo.hub_name || 'Unknown Hub',
 hub_manager_name: managerInfo.hub_manager_name || 'Unknown Manager',
 registered_mobile_number: managerInfo.registered_mobile_number || 'N/A',
 cash: managerTotal,
 rawRecords: managerRecords
 });
 }
 });
 
 setTotalCashWithHubManagers(totalHM);
 setCashHubManagersList(hmList);
 } else {
 setTotalCashWithHubManagers(0);
 setCashHubManagersList([]);
 }
 } catch (err) {
 console.error(err);
 }
 };

 const fetchCashWithRiders = async () => {
 try {
 const localData = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_cluster') : null;
 let clusterId = adminProfileId;
 if (!clusterId && localData) {
   try {
     const user = JSON.parse(localData);
     clusterId = user?.id;
   } catch(e) {}
 }

 const [{ data: cwrData }, { data: wfData }] = await Promise.all([
   supabase.from('cash_with_riders').select('*').order('created_at', { ascending: true }),
   supabase.from('rider_live_work_flow').select('*')
 ]);

 const allRiderIds = new Set<string>();
 (cwrData || []).forEach((c: any) => { if (c['rider id']) allRiderIds.add(c['rider id']); });
 (wfData || []).forEach((w: any) => { if (w.rider_id) allRiderIds.add(w.rider_id); });

 const riderIdList = Array.from(allRiderIds);
 if (riderIdList.length > 0) {
 const { data: ridersData } = await supabase.from('riders').select('id, rider_name, registered_mobile_number, cluster_id').in('id', riderIdList);
 
 let total = 0;
 const list: any[] = [];
 
 riderIdList.forEach((riderId: string) => {
 const riderInfo = (ridersData || []).find((r: any) => r.id === riderId) || ({} as any);
 if (clusterId && riderInfo.cluster_id !== clusterId) return;

 const records = (cwrData || []).filter((c: any) => c['rider id'] === riderId);
 const cwrPayment = records.reduce((acc: number, curr: any) => acc + (Number(curr['total cash payment']) || 0), 0);

 const wfRecords = (wfData || []).filter((w: any) => w.rider_id === riderId);
 const wfPayment = wfRecords.reduce((acc: number, curr: any) => Math.max(acc, Number(curr['Total Cash']) || 0), 0);

 const totalPayment = Math.max(cwrPayment, wfPayment);
 
 if (totalPayment > 0) {
 total += totalPayment;
 list.push({
 id: riderId,
 rider_name: riderInfo.rider_name || 'Unknown Rider',
 registered_mobile_number: riderInfo.registered_mobile_number || 'N/A',
 cash: totalPayment,
 rawRecords: records
 });
 }
 });
 setCashRidersList(list);
 setTotalCashWithRiders(total);
 } else {
 setCashRidersList([]);
 setTotalCashWithRiders(0);
 }
 } catch (err) {
 console.error(err);
 }
 };

 // Admin Profile State
 const [adminProfile, setAdminProfile] = useState<any>(null);

 useEffect(() => {
 async function fetchAdminProfile() {
 setIsLoadingProfile(true);
 const localData = localStorage.getItem('portal_auth_cluster');
 if (localData) {
 try {
 const user = JSON.parse(localData);
 if (user?.id) {
 const { data, error } = await supabase.from('clusters').select('*').eq('id', user.id).maybeSingle();
 if (data) {
 setAdminProfileId(data.id);
 setAdminProfile(data);
 } else {
 localStorage.removeItem('portal_auth_cluster');
 setIsLoggedIn(false);
 setAdminProfile(null);
 return;
 }
 }
 } catch (e) {
 console.error("Error parsing auth data:", e);
 }
 }
 setIsLoadingProfile(false);
 }
 
 if (showProfile || !adminProfile) {
 fetchAdminProfile();
 }
 }, [showProfile]);

 const [isSavingProfile, setIsSavingProfile] = useState(false);

 const handleSaveRiderPenalty = async () => {
 if (!riderPenaltyForm.userId || !riderPenaltyForm.amount) return alert('Select rider and amount');
 setIsSavingRiderPenalty(true);
 
 const existing = riderPenalties.find(p => p["rider id"] === riderPenaltyForm.userId);
 
 const payload: any = {
 //
 "rider id": riderPenaltyForm.userId,
 "penalty amount": riderPenaltyForm.amount,
 "penalty status": riderPenaltyForm.status,
 "updated_at": new Date().toISOString()
 };
 
 try {
 if (existing) {
 await supabase.from('riders_penalty').update(payload).eq('id', existing.id);
 } else {
 payload.created_at = new Date().toISOString();
 await supabase.from('riders_penalty').insert([payload]);
 }
 
 setRiderPenaltyForm({ userId: '', amount: '', status: '' });
 await fetchRiderPenalties();
 } finally {
 setIsSavingRiderPenalty(false);
 }
 };

 const handleRemoveRiderPenalty = async (id: string) => {
 setRemovingRiderPenaltyId(id);
 try {
 await supabase.from('riders_penalty').delete().eq('id', id);
 await fetchRiderPenalties();
 } finally {
 setRemovingRiderPenaltyId(null);
 }
 };

 const handleSaveHmPenalty = async () => {
 if (!hmPenaltyForm.userId || !hmPenaltyForm.amount) return alert('Select Hub Manager and amount');
 setIsSavingHmPenalty(true);
 
 const existing = hmPenalties.find(p => p["hub manager id"] === hmPenaltyForm.userId);
 
 const payload: any = {
 //
 "hub manager id": hmPenaltyForm.userId,
 "penalty amount": hmPenaltyForm.amount,
 "penalty status": hmPenaltyForm.status,
 "updated_at": new Date().toISOString()
 };
 
 try {
 if (existing) {
 await supabase.from('hub_managers_penalty').update(payload).eq('id', existing.id);
 } else {
 payload.created_at = new Date().toISOString();
 await supabase.from('hub_managers_penalty').insert([payload]);
 }
 
 setHmPenaltyForm({ userId: '', amount: '', status: '' });
 await fetchHmPenalties();
 } finally {
 setIsSavingHmPenalty(false);
 }
 };

 const handleRemoveHmPenalty = async (id: string) => {
 setRemovingHmPenaltyId(id);
 try {
 await supabase.from('hub_managers_penalty').delete().eq('id', id);
 await fetchHmPenalties();
 } finally {
 setRemovingHmPenaltyId(null);
 }
 };


 const handleSaveProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSavingProfile(true);
 try {
 const updateData = {
 admin_name: adminProfile.name,
 mobile_number: adminProfile.mobile,
 email_address: adminProfile.email,
 address: adminProfile.address,
 gstin: adminProfile.gstNo,
 };

 if (adminProfileId) {
 const { error } = await supabase.from('admins').update(updateData).eq('id', adminProfileId);
 if (error) throw error;
 } else {
 const { data, error } = await supabase.from('admins').insert([updateData]).select().single();
 if (error) throw error;
 if (data) {
 setAdminProfileId(data.id);
 }
 }
 
 // Update Auth User Metadata and Profiles Table
 const { data: authData } = await supabase.auth.getUser();
 if (authData?.user) {
 // Update user metadata in auth
 await supabase.auth.updateUser({
 data: {
 full_name: adminProfile.name,
 role: 'admin'
 }
 });
 
 // Update profiles table
 await supabase.from('profiles').upsert({
 id: authData.user.id,
 full_name: adminProfile.name,
 email: adminProfile.email || authData.user.email,
 role: 'admin',
 updated_at: new Date().toISOString()
 });
 }

 if (adminProfile.email) {
 try {
 const res = await fetch('/api/admin/upsert-admin', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: authData?.user?.id, adminTableId: adminProfileId, email: adminProfile.email, name: adminProfile.name, oldEmail: originalEmail })
 });
 if (!res.ok) {
 const errRes = await res.json();
 console.error("Failed to sync admin auth profile with backend", errRes);
 alert(`Failed to save admin profile: ${errRes.error || 'Unknown error'}`);
 throw new Error(errRes.error || 'Failed to sync admin profile');
 }
 } catch(e) {
 console.error("Error calling upsert-admin API", e);
 }
 }

 setOriginalEmail(adminProfile.email);
 setProfileSavedToast(true);
 setTimeout(() => setProfileSavedToast(false), 3000);
 } catch (err) {
 console.error("Failed to save admin profile", err);
 } finally {
 setIsSavingProfile(false);
 }
 };
 
 // State for User ID Setup sub-page & Create ID page
 const [selectedUserIdSetup, setSelectedUserIdSetup] = useState<string | null>(null);
 const [isCreatingUserId, setIsCreatingUserId] = useState(false);
 const [isApprovalMode, setIsApprovalMode] = useState(false);
 const [editingUser, setEditingUser] = useState<any>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [refreshTrigger, setRefreshTrigger] = useState(0);
 const [activeUserType, setActiveUserType] = useState<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID'>('Customer ID');
 const [usersList, setUsersList] = useState<UserItem[]>([]);
 const [isUsersLoading, setIsUsersLoading] = useState(false);
 const [showFullApprovals, setShowFullApprovals] = useState(false);
 const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
 const [processingAction, setProcessingAction] = useState<{ id: string, action: 'approve' | 'reject' | null }>({ id: '', action: null });

 const handleApproveRequest = async (req: any) => {
 setProcessingAction({ id: req.id, action: 'approve' });
 try {
 const { type, ...data } = req;
 const targetTable = type === 'Seller' ? 'sellers' : 'riders';
 const sourceTable = type === 'Seller' ? 'sellers_for_approval' : 'riders_for_approval';

 const { error: insertError } = await supabase.from(targetTable).upsert([data], { onConflict: 'id' });
 if (insertError) {
 throw insertError;
 }

 const { error: deleteError } = await supabase.from(sourceTable).delete().eq('id', req.id);
 if (deleteError) throw deleteError;

 setPendingApprovals(prev => prev.filter(p => p.id !== req.id));
 setRefreshTrigger(prev => prev + 1);
 } catch (error) {
 console.error('Error approving request:', error);
 alert('Failed to approve request.');
 } finally {
 setProcessingAction({ id: '', action: null });
 }
 };

 const handleRejectRequest = async (req: any) => {
 setProcessingAction({ id: req.id, action: 'reject' });
 try {
 const sourceTable = req.type === 'Seller' ? 'sellers_for_approval' : 'riders_for_approval';
 const { error: deleteError } = await supabase.from(sourceTable).delete().eq('id', req.id);
 if (deleteError) throw deleteError;

 setPendingApprovals(prev => prev.filter(p => p.id !== req.id));
 } catch (error) {
 console.error('Error rejecting request:', error);
 alert('Failed to reject request.');
 } finally {
 setProcessingAction({ id: '', action: null });
 }
 };

 const handleViewRequest = (req: any) => {
 setActiveUserType((req.type + ' ID') as any);
 setEditingUser(req);
 setIsApprovalMode(true);
 setIsCreatingUserId(true);
 };


 useEffect(() => {
 async function fetchPendingApprovals() {
 if (activeTab === 'Message & Approval' && clusterUserData?.id) {
 const { data: riders } = await supabase.from('riders_for_approval').select('*').eq('cluster_id', clusterUserData.id);
 
 const { data: pincodesData } = await supabase.from('added_pincode').select('"added pincode"').eq('cluster id', clusterUserData.id);
 const pincodes = (pincodesData || []).map(p => p['added pincode']).filter(Boolean);
 
 let sellers = [];
 if (pincodes.length > 0) {
 const { data } = await supabase.from('sellers_for_approval').select('*').in('registered_pincode', pincodes);
 sellers = data || [];
 }
 
 const formatted = [
 ...(sellers || []).map((s: any) => ({ ...s, type: 'Seller' })),
 ...(riders || []).map((r: any) => ({ ...r, type: 'Rider' }))
 ];
 setPendingApprovals(formatted);
 }
 }
 fetchPendingApprovals();
 }, [activeTab, showFullApprovals, clusterUserData]);

 
 useEffect(() => {
 async function fetchUsers() {
 setIsUsersLoading(true);
 let tableName = '';
 if (activeUserType === 'Customer ID') tableName = 'customers';
 else if (activeUserType === 'Seller ID') tableName = 'sellers';
 else if (activeUserType === 'Hub Manager ID') tableName = 'hub_managers';
 else if (activeUserType === 'Rider ID') tableName = 'riders';

 if (!tableName) return;
 if (!adminProfileId && (tableName === 'riders' || tableName === 'hub_managers')) return;

 let data = [];
 let error = null;
 try {
 const res = await fetch(`/api/admin/get-users?table=${tableName}${adminProfileId ? '&cluster_id=' + adminProfileId : ''}`, { cache: 'no-store' });
 if (!res.ok) {
 const errData = await res.json();
 throw new Error(errData.error || 'Failed to fetch users');
 }
 const json = await res.json();
 data = json.data;
 } catch (err) {
 error = err;
 }
 
 if (error) {
 console.warn("Could not fetch " + tableName + " - server might be unavailable");
 return;
 }
 
 const mapped = (data || []).map(row => {
 let name = '';
 let phone = '';
 let secondary = '';
 let status: any = 'Active';

 if (activeUserType === 'Customer ID') {
 name = row.full_name || 'No Name';
 phone = row.mobile_number || '';
 secondary = '';
 } else if (activeUserType === 'Seller ID') {
 name = row.seller_name || 'No Name';
 phone = row.registered_mobile_number || '';
 secondary = `Shop: ${row.shop_name || 'N/A'}`;
 } else if (activeUserType === 'Hub Manager ID') {
 name = row.hub_manager_name || 'No Name';
 phone = row.registered_mobile_number || '';
 secondary = `Store: ${row.store_name || 'N/A'} • Hub: ${row.hub_name || 'N/A'}`;
 } else if (activeUserType === 'Rider ID') {
 name = row.rider_name || 'No Name';
 phone = row.registered_mobile_number || '';
 secondary = `Pincode: ${row.registered_pincode || 'N/A'}`;
 }
 
 let avatar = '';
 if (activeUserType === 'Hub Manager ID' || activeUserType === 'Rider ID') {
 avatar = row.avatar || '';
 }
 
 const isFrozen = row.freeze === 'true' || row.freeze === true || row.freeze === 'frozen';

 return {
 id: row.id,
 type: activeUserType,
 name,
 phone,
 secondaryInfo: secondary,
 status,
 createdDate: new Date(row.created_at || Date.now()).toLocaleDateString(),
 avatar,
 isFrozen,
 dbRow: row // store original row for editing
 };
 });
 setUsersList(mapped);
 setIsUsersLoading(false);
 }
 fetchUsers();
 let channelName = '';
 let channel: any = null;

 if (activeUserType === 'Customer ID') channelName = 'customers';
 else if (activeUserType === 'Seller ID') channelName = 'sellers';
 else if (activeUserType === 'Hub Manager ID') channelName = 'hub_managers';
 else if (activeUserType === 'Rider ID') channelName = 'riders';

 if (channelName) {
 channel = supabase.channel('cluster_users_list_updates_' + Math.random().toString(36).substring(7))
 .on('postgres_changes', { event: '*', schema: 'public', table: channelName }, () => {
 fetchUsers();
 })
 .subscribe();
 }

 return () => {
 if (channel) supabase.removeChannel(channel);
 };
 }, [activeUserType, selectedUserIdSetup, refreshTrigger, adminProfileId]);

 const handleToggleFreeze = async (user: UserItem) => {
   let tableName = '';
   if (user.type === 'Customer ID') tableName = 'customers';
   else if (user.type === 'Seller ID') tableName = 'sellers';
   else if (user.type === 'Hub Manager ID') tableName = 'hub_managers';
   else if (user.type === 'Rider ID') tableName = 'riders';

   if (!tableName) return;

   const currentFrozen = user.isFrozen ?? (user.dbRow?.freeze === 'true' || user.dbRow?.freeze === true || user.dbRow?.freeze === 'frozen');
   const newFreezeVal = currentFrozen ? 'false' : 'true';

   setUsersList(prev => prev.map(u => {
     if (u.id === user.id) {
       return {
         ...u,
         isFrozen: !currentFrozen,
         dbRow: { ...(u.dbRow || {}), freeze: newFreezeVal }
       };
     }
     return u;
   }));

   try {
     const { error } = await supabase
       .from(tableName)
       .update({ freeze: newFreezeVal })
       .eq('id', user.id);

     if (error) {
       console.warn('Supabase client update warning in ClusterPortal, using server fallback:', error);
     }

     await fetch('/api/admin/toggle-freeze', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ userId: user.id, table: tableName, freeze: newFreezeVal })
     });
   } catch (err) {
     console.error('Error in handleToggleFreeze (ClusterPortal):', err);
   }
 };

 const openAdminProfile = () => {
 setShowProfile(true);
 };

 const closeAdminProfile = () => {
 setShowProfile(false);
 };

 const openCreateUserId = () => {
 setEditingUser(null);
 setIsApprovalMode(false);
 setIsCreatingUserId(true);
 };
 
 const openViewUserId = (user: any) => {
 setEditingUser(user);
 setIsApprovalMode(false);
 setIsCreatingUserId(true);
 };

 const closeCreateUserId = () => {
 setIsCreatingUserId(false);
 };

 const openUserIdSetup = (userType: string) => {
 const validTypes: Array<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID'> = [
 'Customer ID',
 'Seller ID',
 'Hub Manager ID',
 'Rider ID'
 ];
 if (validTypes.includes(userType as any)) {
 setActiveUserType(userType as any);
 }
 setSelectedUserIdSetup(userType);
 };

 const closeUserIdSetup = () => {
 setSelectedUserIdSetup(null);
 };

 // Persist created IDs locally
 const saveUsers = (updated: UserItem[]) => {
 setUsersList(updated);
 try {
 localStorage.setItem('ss_admin_user_ids', JSON.stringify(updated));
 } catch {}
 };

 const tabs = [
 { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
 { id: 'User Activity', label: 'Activity', icon: Users },
 { id: 'Payments', label: 'Payments', icon: CreditCard },
 { id: 'Message & Approval', label: 'Message & Appr.', icon: MessageSquare },
 ];

 // State for Portal Setup modal
 const [selectedPortalSetup, setSelectedPortalSetup] = useState<string | null>(null);

 // Secure Transaction State
 type PaymentMethodType = { id: string, name: string, link: string };
 const [showSecureTransactionModal, setShowSecureTransactionModal] = useState<string | null>(null);
 const [showRiderPenaltyModal, setShowRiderPenaltyModal] = useState(false);

 const [showHubManagerPenaltyModal, setShowHubManagerPenaltyModal] = useState(false);

 // Handle device / browser back button within ClusterPortal sub-pages
 useEffect(() => {
 return registerBackHandler(() => {
 if (showLogoutModal) {
 setShowLogoutModal(false);
 return true;
 }
 if (showRoleChatModal.isOpen) {
 setShowRoleChatModal(prev => ({ ...prev, isOpen: false }));
 return true;
 }
 if (showAnnouncementModal.isOpen) {
 setShowAnnouncementModal(prev => ({ ...prev, isOpen: false }));
 return true;
 }
 if (showSecureTransactionModal) {
 setShowSecureTransactionModal(null);
 return true;
 }
 if (showRiderPenaltyModal) {
 setShowRiderPenaltyModal(false);
 return true;
 }
 if (showHubManagerPenaltyModal) {
 setShowHubManagerPenaltyModal(false);
 return true;
 }
 if (showProfile) {
 setShowProfile(false);
 return true;
 }
 if (isCreatingUserId) {
 setIsCreatingUserId(false);
 return true;
 }
 if (selectedUserIdSetup) {
 setSelectedUserIdSetup(null);
 return true;
 }
 if (selectedPortalSetup) {
 setSelectedPortalSetup(null);
 return true;
 }
 if (activeTab !== 'Dashboard') {
 setActiveTab('Dashboard');
 return true;
 }
 return false;
 });
 }, [
 showLogoutModal,
 showRoleChatModal.isOpen,
 showAnnouncementModal.isOpen,
 showSecureTransactionModal,
 showRiderPenaltyModal,
 showHubManagerPenaltyModal,
 showProfile,
 isCreatingUserId,
 selectedUserIdSetup,
 selectedPortalSetup,
 activeTab
 ]);
 const [penaltyRiders, setPenaltyRiders] = useState<any[]>([]);
 const [riderPenaltySearch, setRiderPenaltySearch] = useState('');
 const [hubManagerPenaltySearch, setHubManagerPenaltySearch] = useState('');
 const [clusterPenaltySearch, setClusterPenaltySearch] = useState('');
 
 const [isSavingRiderPenalty, setIsSavingRiderPenalty] = useState(false);
 const [isSavingHmPenalty, setIsSavingHmPenalty] = useState(false);

 const [removingRiderPenaltyId, setRemovingRiderPenaltyId] = useState<string | null>(null);
 const [removingHmPenaltyId, setRemovingHmPenaltyId] = useState<string | null>(null);

 const [penaltyHubManagers, setPenaltyHubManagers] = useState<any[]>([]);

 const [riderPenaltyForm, setRiderPenaltyForm] = useState({ userId: '', amount: '', status: '' });
 const [riderPenalties, setRiderPenalties] = useState<any[]>([]);
 
 const [hmPenaltyForm, setHmPenaltyForm] = useState({ userId: '', amount: '', status: '' });
 const [hmPenalties, setHmPenalties] = useState<any[]>([]);

 const fetchRiderPenalties = async () => {
 if (!clusterUserData?.id) return;
 const { data } = await supabase.from('riders_penalty').select('*').order('created_at', { ascending: false });
 setRiderPenalties(data || []);
 };
 const fetchHmPenalties = async () => {
 if (!clusterUserData?.id) return;
 const { data } = await supabase.from('hub_managers_penalty').select('*').order('created_at', { ascending: false });
 setHmPenalties(data || []);
 };

 
 useEffect(() => {
 if (showRiderPenaltyModal && clusterUserData?.id) {
 supabase.from('riders').select('*').eq('cluster_id', clusterUserData.id).then(({data}) => setPenaltyRiders(data || []));
 fetchRiderPenalties();
 fetchRiderPenalties();
 }
 }, [showRiderPenaltyModal, clusterUserData]);
 
 useEffect(() => {
 if (showHubManagerPenaltyModal && clusterUserData?.id) {
 supabase.from('hub_managers').select('*').eq('cluster_id', clusterUserData.id).then(({data}) => setPenaltyHubManagers(data || []));
 fetchHmPenalties();
 fetchHmPenalties();
 }
 }, [showHubManagerPenaltyModal, clusterUserData]);
 
   const handleMethodNameChange = (val: string) => {
 setNewMethodName(val);
 if (!newMethodLink || newMethodLink.includes('upi://pay') || newMethodLink.includes('phonepe') || newMethodLink.includes('paytm') || newMethodLink.includes('tez') || newMethodLink.includes('bhim') || newMethodLink.includes('amzn')) {
 const lower = val.toLowerCase();
 if (lower.includes('google') || lower.includes('gpay')) {
 setNewMethodLink('tez://upi/pay?pa=your-upi-id&pn=YourName&cu=INR');
 } else if (lower.includes('phone') || lower.includes('phonepe')) {
 setNewMethodLink('phonepe://pay?pa=your-upi-id&pn=YourName&cu=INR');
 } else if (lower.includes('paytm')) {
 setNewMethodLink('paytmmp://pay?pa=your-upi-id&pn=YourName&cu=INR');
 } else if (lower.includes('bhim')) {
 setNewMethodLink('bhim://pay?pa=your-upi-id&pn=YourName&cu=INR');
 } else if (lower.includes('amazon')) {
 setNewMethodLink('amzn://upi/pay?pa=your-upi-id&pn=YourName&cu=INR');
 } else if (val.trim().length > 0) {
 setNewMethodLink('upi://pay?pa=your-upi-id&pn=YourName&cu=INR');
 } else {
 setNewMethodLink('');
 }
 }
 };

 const handleAddPaymentMethod = () => {
 if (newMethodName.trim() && newMethodLink.trim()) {
 const newId = Date.now().toString();
 setPaymentMethodsList([...paymentMethodsList, { id: newId, name: newMethodName.trim(), link: newMethodLink.trim() }]);
 setSelectedPaymentMethods(prev => multiPaymentEnabled ? [...prev, newId] : [newId]);
 setNewMethodName('');
 setNewMethodLink('');
 }
 };
const [portalSettings, setPortalSettings] = useState<Record<string, { enabled: boolean; autoSync: boolean; pushAlerts: boolean }>>({
 'Customer Portal Setup': { enabled: true, autoSync: true, pushAlerts: true },
 'Seller Portal Setup': { enabled: true, autoSync: true, pushAlerts: true },
 'Hub Logistic Setup': { enabled: true, autoSync: true, pushAlerts: true },
 'Rider Portal Setup': { enabled: true, autoSync: true, pushAlerts: true }
 });

 // Estimated Earning Chart State
 const [showEarningChart, setShowEarningChart] = useState(false);
 const [isSavingEarningChart, setIsSavingEarningChart] = useState(false);
 const [earningChartId, setEarningChartId] = useState<string | null>(null);

 // Rider Earning Settings State
 const [multipleQtyHalfRate, setMultipleQtyHalfRate] = useState(false);
 const [performanceBasedRate, setPerformanceBasedRate] = useState(false);

 const toggleMultipleQtyHalfRate = () => {
 const newVal = !multipleQtyHalfRate;
 setMultipleQtyHalfRate(newVal);
 localStorage.setItem('rider_multiple_qty_half_rate', newVal.toString());
 };

 const togglePerformanceBasedRate = () => {
 const newVal = !performanceBasedRate;
 setPerformanceBasedRate(newVal);
 localStorage.setItem('rider_performance_based_rate', newVal.toString());
 };


 
 // Hub Manager Salary Setup State
 const [showHubManagerSalarySetup, setShowHubManagerSalarySetup] = useState(false);
 const [selectedHubManagerForSalary, setSelectedHubManagerForSalary] = useState('');
 const [hmSalaryValue, setHmSalaryValue] = useState('');
 const [isSavingHmSalary, setIsSavingHmSalary] = useState(false);
 const [addedHmSalaryList, setAddedHmSalaryList] = useState<any[]>([]);

 const fetchHubManagersAndSalaries = async () => {
 try {
 if (!adminProfileId) return;
 const hubManagersRes = await fetch(`/api/admin/get-users?table=hub_managers${adminProfileId ? '&cluster_id=' + adminProfileId : ''}`, { cache: 'no-store' }).then(r => r.json()).then(d => ({ data: d.data, error: null })).catch(e => ({ error: e }));
 
 let salaryQuery = supabase.from('hub_manager_salary').select('*').order('created_at', { ascending: false });
 // Depending on table schema, we might not have admin id, we will just fetch all and map by hub manager id
 const salariesRes = await salaryQuery;
 
 if (!hubManagersRes.error && 'data' in hubManagersRes) setHubManagersList(hubManagersRes.data || []);
 if (!salariesRes.error) setAddedHmSalaryList(salariesRes.data || []);
 } catch (err) {
 console.error("Error fetching hub managers and salaries:", err);
 }
 };

 useEffect(() => {
 if (showHubManagerSalarySetup) {
 fetchHubManagersAndSalaries();
 }
 }, [showHubManagerSalarySetup, adminProfileId]);

 // Hub Manager Pincode Service State
 // Hub Manager Pincode Service State
 const [showHubManagersPincodeService, setShowHubManagersPincodeService] = useState(false);
 const [hubManagersList, setHubManagersList] = useState<any[]>([]);
 const [selectedHubManagerForPincode, setSelectedHubManagerForPincode] = useState('');
 const [newPincodeValue, setNewPincodeValue] = useState('');
 const [addedPincodesList, setAddedPincodesList] = useState<any[]>([]);
 const [isSavingPincode, setIsSavingPincode] = useState(false);
 const [currentManagerPincodes, setCurrentManagerPincodes] = useState<string[]>([]);

 const fetchHubManagersAndPincodes = async () => {
 try {
 if (!adminProfileId) return;
 const hubManagersRes = await fetch(`/api/admin/get-users?table=hub_managers${adminProfileId ? '&cluster_id=' + adminProfileId : ''}`, { cache: 'no-store' }).then(r => r.json()).then(d => ({ data: d.data, error: null })).catch(e => ({ error: e }));
 let pincodeQuery = supabase.from('added_pincode').select('id, "hub manager id", "cluster id", "added pincode", created_at').order('created_at', { ascending: false });
 if (adminProfileId) pincodeQuery = pincodeQuery.eq('cluster id', adminProfileId);
 const pincodesRes = await pincodeQuery;


 if (!hubManagersRes.error && 'data' in hubManagersRes) setHubManagersList(hubManagersRes.data || []);
 if (!pincodesRes.error) setAddedPincodesList(pincodesRes.data || []);
 } catch (err) {
 console.error("Error fetching hub managers and pincodes:", err);
 }
 };

 useEffect(() => {
 if (showHubManagersPincodeService) {
 fetchHubManagersAndPincodes();
 }
 }, [showHubManagersPincodeService, adminProfileId]);

 // When Hub Manager is selected, load their pincodes into the array
 useEffect(() => {
 if (selectedHubManagerForPincode) {
 const managerPincodes = addedPincodesList
 .filter(p => p["hub manager id"] === selectedHubManagerForPincode)
 .map(p => p["added pincode"]);
 setCurrentManagerPincodes(managerPincodes);
 } else {
 setCurrentManagerPincodes([]);
 }
 setNewPincodeValue('');
 }, [selectedHubManagerForPincode, addedPincodesList]);

 const handleAddPincodeChip = () => {
 const pin = newPincodeValue.trim();
 if (pin.length === 6 && /^[0-9]+$/.test(pin)) {
 if (!currentManagerPincodes.includes(pin)) {
 setCurrentManagerPincodes(prev => [...prev, pin]);
 }
 setNewPincodeValue('');
 } else {
 alert("Please enter a valid 6-digit pincode.");
 }
 };

 const handleRemovePincodeChip = (pinToRemove: string) => {
 setCurrentManagerPincodes(prev => prev.filter(p => p !== pinToRemove));
 };

 
 const handleSaveHmSalary = async () => {
 if (!selectedHubManagerForSalary) {
 alert("Please select a Hub Manager");
 return;
 }
 if (!hmSalaryValue || isNaN(Number(hmSalaryValue))) {
 alert("Please enter a valid amount");
 return;
 }

 setIsSavingHmSalary(true);
 try {
 // Upsert logic: delete existing if needed, or simply insert/update. 
 // Checking if existing record exists
 const existing = addedHmSalaryList.find(s => s['hub manager id'] === selectedHubManagerForSalary);
 
 let res;
 if (existing && existing.id) {
 res = await supabase.from('hub_manager_salary').update({ 'fixed salary': Number(hmSalaryValue) }).eq('id', existing.id);
 } else {
 res = await supabase.from('hub_manager_salary').insert({ 
 'hub manager id': selectedHubManagerForSalary,
 'fixed salary': Number(hmSalaryValue),
 'cluster id': adminProfileId || null
 });
 }

 if (res.error) throw res.error;
 
 setHmSalaryValue('');
 setSelectedHubManagerForSalary('');
 fetchHubManagersAndSalaries();
 
 } catch (e: any) {
 console.error("Error saving HM salary:", e);
 alert("Error saving salary: " + (e.message || 'Unknown error'));
 } finally {
 setIsSavingHmSalary(false);
 }
 };

 const handleSavePincode = async () => {
 if (!selectedHubManagerForPincode) {
 alert("Please select a hub manager.");
 return;
 }

 setIsSavingPincode(true);
 try {
 let finalPincodes = [...currentManagerPincodes];
 const pin = newPincodeValue.trim();
 if (pin.length === 6 && /^[0-9]+$/.test(pin) && !finalPincodes.includes(pin)) {
 finalPincodes.push(pin);
 }

 const dbPincodes = addedPincodesList
 .filter(p => p["hub manager id"] === selectedHubManagerForPincode)
 .map(p => p["added pincode"]);

 const toDelete = dbPincodes.filter(p => !finalPincodes.includes(p));
 if (toDelete.length > 0) {
 const { error: deleteError } = await supabase
 .from('added_pincode')
 .delete()
 .eq('hub manager id', selectedHubManagerForPincode)
 .in('added pincode', toDelete);
 if (deleteError) throw deleteError;
 }

 const toInsert = finalPincodes.filter(p => !dbPincodes.includes(p));
 if (toInsert.length > 0) {
 const selectedManager = hubManagersList.find(m => m.id === selectedHubManagerForPincode);
 const hubName = selectedManager ? (selectedManager.hub_name || selectedManager['hub name'] || '') : '';
 
 // Find existing cluster_id from already added pincodes for this manager to preserve it
 const existingRow = addedPincodesList.find(p => p["hub manager id"] === selectedHubManagerForPincode && p["cluster id"]);
 let finalClusterId = existingRow ? existingRow["cluster id"] : null;
 
 if (!finalClusterId) {
 finalClusterId = selectedManager ? (selectedManager.cluster_id || selectedManager['cluster id'] || clusterUserData?.id) : clusterUserData?.id;
 }

 const insertData = toInsert.map(p => {
 const payload: any = {
 "hub manager id": selectedHubManagerForPincode,
 "added pincode": p,
 "hub name": hubName
 };
 if (finalClusterId) {
 payload["cluster id"] = finalClusterId;
 }
 return payload;
 });
 
 const { error: insertError } = await supabase.from('added_pincode').insert(insertData);
 if (insertError) throw insertError;
 }

 setCurrentManagerPincodes(finalPincodes);
 setNewPincodeValue('');
 await fetchHubManagersAndPincodes();
 } catch (err: any) {
 console.error("Error saving pincodes:", err);
 alert("Error saving pincodes: " + (err.message || "Unknown error"));
 } finally {
 setIsSavingPincode(false);
 }
 };

 // Services Visual State
 const [allSellers, setAllSellers] = useState<any[]>([]);
 const [visualSelectedSeller, setVisualSelectedSeller] = useState<string>('');
 const [visualModelValue, setVisualModelValue] = useState<'show' | 'hide'>('hide');
 const [isSavingVisual, setIsSavingVisual] = useState(false);

 const [showVisualList, setShowVisualList] = useState(false);
 const [showRiderRateList, setShowRiderRateList] = useState(false);
 const [riderRateListData, setRiderRateListData] = useState<{regular: any[], premium: any[], ultra: any[]}>({regular: [], premium: [], ultra: []});


 // Rider Service Rate State
 const [showRiderServiceRate, setShowRiderServiceRate] = useState(false);
 const [showRiderRateSettings, setShowRiderRateSettings] = useState(false);
 const [isSavingRiderRateSettings, setIsSavingRiderRateSettings] = useState(false);
 const [riderSettingMultipleQtyHalfRate, setRiderSettingMultipleQtyHalfRate] = useState(false);
 const [riderSettingPerformanceBasedRate, setRiderSettingPerformanceBasedRate] = useState(false);

 useEffect(() => {
 async function fetchClusterSettings() {
 if (!adminProfileId) return;
 const { data } = await supabase.from('rider_rate_setting_with_cluster').select('*').eq('cluster id', adminProfileId).limit(1).maybeSingle();
 if (data) {
 setRiderSettingMultipleQtyHalfRate(data['multiple quantity half rate'] || false);
 setRiderSettingPerformanceBasedRate(data['performance based proportional rate'] || false);
 } else {
 // Clear if not set specifically for this cluster
 setRiderSettingMultipleQtyHalfRate(false);
 setRiderSettingPerformanceBasedRate(false);
 }
 }
 if (showRiderRateSettings) {
 fetchClusterSettings();
 }
 }, [showRiderRateSettings, adminProfileId]);


 const [riderServiceTab, setRiderServiceTab] = useState<'default' | 'specific'>('default');
 const [activeRateRank, setActiveRateRank] = useState<'Regular' | 'Premium' | 'Ultra'>('Regular');
 const [defaultRates, setDefaultRates] = useState<Record<string, { pickup: string, delivery: string, return: string }>>({
 'Regular': { pickup: '', delivery: '', return: '' },
 'Premium': { pickup: '', delivery: '', return: '' },
 'Ultra': { pickup: '', delivery: '', return: '' },
 });
 const [allRiders, setAllRiders] = useState<any[]>([]);
 const [specificSelectedRider, setSpecificSelectedRider] = useState<string>('');
 const [specificRiderRates, setSpecificRiderRates] = useState<{ pickup: string, delivery: string, return: string }>({ pickup: '', delivery: '', return: '' });
 const [isSavingRiderRate, setIsSavingRiderRate] = useState(false);

 useEffect(() => {
 async function fetchRidersForRates() {
 if (showRiderServiceRate) {
 if (!adminProfileId) return;
 // Fetch all riders
 let query = supabase.from('riders').select('*').eq('cluster_id', adminProfileId);
 const { data: ridersData } = await query;
 if (ridersData) {
 setAllRiders(ridersData);
 if (ridersData.length > 0 && !specificSelectedRider) {
 setSpecificSelectedRider(ridersData[0].id);
 }
 
 // Fetch rider_service_rates to categorize
 const { data: ratesData } = await supabase.from('rider_service_rates').select('rider_id, rank');
 const premiumIds = new Set((ratesData || []).filter(r => r.rank === 'Premium').map(r => r.rider_id));
 const ultraIds = new Set((ratesData || []).filter(r => r.rank === 'Ultra').map(r => r.rider_id));
 
 const premium = [];
 const ultra = [];
 const regular = [];
 
 ridersData.forEach(r => {
 if (premiumIds.has(r.id)) premium.push(r);
 else if (ultraIds.has(r.id)) ultra.push(r);
 else regular.push(r);
 });
 
 setRiderRateListData({ regular, premium, ultra });
 }
 
 // Fetch active_service_rate
 const { data: activeRate } = await supabase.from('active_service_rate').select('*').limit(1).single();
 if (activeRate) {
 setDefaultRates(prev => ({
 ...prev,
 'Regular': {
 pickup: activeRate.pickup_rate || '',
 delivery: activeRate.delivery_rate || '',
 return: activeRate.return_delivery_rate || ''
 }
 }));
 }
 }
 }
 fetchRidersForRates();
 }, [showRiderServiceRate, adminProfileId]);
 
 useEffect(() => {
 async function fetchSpecificRate() {
 if (showRiderServiceRate && specificSelectedRider) {
 const { data } = await supabase.from('rider_service_rates').select('*').eq('rider_id', specificSelectedRider).limit(1).single();
 if (data) {
 setSpecificRiderRates({
 pickup: data.pickup_rate || '',
 delivery: data.delivery_rate || '',
 return: data.return_delivery_rate || ''
 });
 if (data.rank) {
 setActiveRateRank(data.rank as 'Premium' | 'Ultra');
 }
 } else {
 setSpecificRiderRates({ pickup: '', delivery: '', return: '' });
 }
 }
 }
 fetchSpecificRate();
 }, [specificSelectedRider, showRiderServiceRate]);

 const [earningCharges, setEarningCharges] = useState<{ id: string; name: string; value: string; isPercentage: boolean }[]>([
 { id: '1', name: 'Referral Fee', value: '0', isPercentage: true },
 { id: '2', name: 'Closing Fee', value: '0', isPercentage: false },
 { id: '3', name: 'COD Fee', value: '0', isPercentage: false },
 { id: '4', name: 'Shipping Fee', value: '0', isPercentage: false },
 { id: '5', name: 'C-GST', value: '0', isPercentage: true },
 { id: '6', name: 'S-GST', value: '0', isPercentage: true },
 { id: '7', name: 'TDS charge', value: '0', isPercentage: true },
 { id: '8', name: 'TCS charge', value: '0', isPercentage: true },
 ]);

 useEffect(() => {
 async function fetchEarningChart() {
 const { data, error } = await supabase.from('seller_estimated_earning').select('*').limit(1).single();
 if (!error && data) {
 setEarningChartId(data.id);
 
 const parseValue = (val: string | null) => {
 if (!val) return { value: '0', isPercentage: false };
 if (val.endsWith('%')) return { value: val.slice(0, -1), isPercentage: true };
 return { value: val, isPercentage: false };
 };

 const loadedCharges = [
 { id: '1', name: 'Referral Fee', ...parseValue(data['Referral Fee']) },
 { id: '2', name: 'Closing Fee', ...parseValue(data['Closing Fee']) },
 { id: '3', name: 'COD Fee', ...parseValue(data['COD Fee']) },
 { id: '4', name: 'Shipping Fee', ...parseValue(data['Shipping Fee']) },
 { id: '5', name: 'C-GST', ...parseValue(data['C-GST']) },
 { id: '6', name: 'S-GST', ...parseValue(data['S-GST']) },
 { id: '7', name: 'TDS charge', ...parseValue(data['TDS charge']) },
 { id: '8', name: 'TCS charge', ...parseValue(data['TCS charge']) },
 ];

 if (data.other_charges) {
 try {
 const others = data.other_charges;
 Object.keys(others).forEach((key, idx) => {
 loadedCharges.push({
 id: `other_${idx}`,
 name: key,
 ...parseValue(others[key])
 });
 });
 } catch (e) {}
 }
 
 setEarningCharges(loadedCharges);
 }
 }
 if (showEarningChart) {
 fetchEarningChart();
 }
 }, [showEarningChart]);

 useEffect(() => {
 async function fetchSellersForVisual() {
 if (selectedPortalSetup === 'Services Visual Setup') {
 const { data } = await supabase.from('sellers').select('id, shop_name, seller_name, upload_service_visible');
 if (data) {
 setAllSellers(data);
 if (data.length > 0) {
 setVisualSelectedSeller(data[0].id);
 setVisualModelValue('hide');
 }
 }
 }
 }
 fetchSellersForVisual();
 }, [selectedPortalSetup]);

 const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const sId = e.target.value;
 setVisualSelectedSeller(sId);
 const seller = allSellers.find(s => s.id === sId);
 if (seller) {
 setVisualModelValue('hide');
 }
 };

 const handleSaveServicesVisual = async () => {
 if (!visualSelectedSeller) return;
 setIsSavingVisual(true);
 try {
 const { error } = await supabase.from('sellers').update({ 
 upload_service_visible: visualModelValue === 'show' 
 }).eq('id', visualSelectedSeller);
 
 if (error) {
 if (error.message?.includes('column "upload_service_visible" of relation "sellers" does not exist')) {
 alert('Please run the SQL command in your Supabase SQL editor to add the column:\n\nALTER TABLE sellers ADD COLUMN IF NOT EXISTS upload_service_visible BOOLEAN DEFAULT true;');
 } else {
 throw error;
 }
 } else {
 alert('Visual Model setting saved successfully.');
 setAllSellers(prev => prev.map(s => s.id === visualSelectedSeller ? { ...s, upload_service_visible: visualModelValue === 'show' } : s));
 }
 } catch (err: any) {
 alert('Failed to save settings: ' + err.message);
 } finally {
 setIsSavingVisual(false);
 }
 };

 const handleSaveEarningChart = async () => {
 setIsSavingEarningChart(true);
 try {
 const updateData: any = {
 other_charges: {}
 };
 
 const standardKeys = ['Referral Fee', 'Closing Fee', 'COD Fee', 'Shipping Fee', 'C-GST', 'S-GST', 'TDS charge', 'TCS charge'];
 
 earningCharges.forEach(charge => {
 const valStr = charge.isPercentage ? `${charge.value}%` : charge.value;
 if (standardKeys.includes(charge.name)) {
 updateData[charge.name] = valStr;
 } else {
 updateData.other_charges[charge.name] = valStr;
 }
 });

 if (earningChartId) {
 await supabase.from('seller_estimated_earning').update(updateData).eq('id', earningChartId);
 } else {
 const { data, error } = await supabase.from('seller_estimated_earning').insert([updateData]).select().single();
 if (!error && data) {
 setEarningChartId(data.id);
 }
 }
 } catch (err) {
 console.error(err);
 } finally {
 setIsSavingEarningChart(false);
 }
 };

 // Premium, colored portal setup options with clean titles and no internal subtitles
 const portalSetupOptions = [
 { 
 label: 'Hub Logistics', 
 modalKey: 'Hub Logistic Setup',
 icon: Building2, 
 accentColor: 'text-purple-700',
 bgColor: 'bg-purple-50/90',
 iconBg: 'bg-purple-600 text-white shadow-purple-500/20',
 borderHover: 'hover:border-purple-400 hover:shadow-purple-500/10'
 },
 { 
 label: 'Rider', 
 modalKey: 'Rider Portal Setup',
 icon: Truck, 
 accentColor: 'text-emerald-700',
 bgColor: 'bg-emerald-50/90',
 iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
 borderHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10'
 }
 ];

 // Premium colored User ID setup options with clean titles, no subtitles and no count badges
 const userIdSetupOptions = [
 { 
 label: 'Hub Manager ID', 
 icon: Building2, 
 color: 'text-purple-700',
 iconBg: 'bg-purple-600 text-white shadow-purple-500/20',
 badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
 borderHover: 'hover:border-purple-400 hover:shadow-purple-500/10'
 },
 { 
 label: 'Rider ID', 
 icon: Truck, 
 color: 'text-emerald-700',
 iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
 badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
 borderHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10'
 }
 ];

 const userTypeTabs: Array<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID'> = [
 'Customer ID',
 'Seller ID',
 'Hub Manager ID',
 'Rider ID'
 ];

 const handleOpenUserIdSetup = (typeLabel: string) => {
 const validTypes: Array<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID'> = [
 'Customer ID',
 'Seller ID',
 'Hub Manager ID',
 'Rider ID'
 ];
 if (validTypes.includes(typeLabel as any)) {
 setActiveUserType(typeLabel as any);
 }
 setSelectedUserIdSetup(typeLabel);
 setSearchQuery('');
 };

 const filteredUsers = usersList.filter(user => {
 const matchesType = user.type === activeUserType;
 if (!matchesType) return false;
 if (!searchQuery.trim()) return true;
 const query = searchQuery.toLowerCase();
 return (
 user.name.toLowerCase().includes(query) ||
 user.id.toLowerCase().includes(query) ||
 user.phone.toLowerCase().includes(query) ||
 (user.secondaryInfo && user.secondaryInfo.toLowerCase().includes(query))
 );
 });

 // If user is not logged in, show AuthLogin
 if (!isLoggedIn) {
 return <AuthLogin portalName="Cluster" onLoginSuccess={() => setIsLoggedIn(true)} onBack={onBack} />;
 }

 // If Create ID is requested: Render the dedicated Create User ID page
 if (isCreatingUserId) {
 const mapToCategory = (typeStr: string): UserTypeCategory => {
 if (typeStr === 'Seller ID') return 'Seller';
 if (typeStr === 'Hub Manager ID') return 'Hub Manager';
 if (typeStr === 'Rider ID') return 'Rider';
 return 'Customer';
 };

 return (
 <CreateUserIdPage
 initialType={mapToCategory(activeUserType)}
 initialData={editingUser}
 isReadOnly={activeUserType === 'Customer ID' || activeUserType === 'Seller ID'}
 adminProfileId={adminProfileId}
 isApprovalMode={isApprovalMode}
 onBack={() => {
 setIsApprovalMode(false);
 closeCreateUserId();
 }}
 onUserCreated={() => {
 setRefreshTrigger(prev => prev + 1);
 setIsApprovalMode(false);
 closeCreateUserId();
 }}
 />
 );
 }

 // If Profile is requested: Render the dedicated Admin Profile Page
 
 if (showLossPenalty) {
 const penaltySum = clusterPenalties.reduce((sum, p) => sum + parseFloat(p['penalty amount'] || '0'), 0);
 return (
 <div className="fixed inset-0 w-full bg-[#F8FAFC] text-slate-900 flex flex-col z-50 overflow-y-auto">
 <div className="w-full min-h-full flex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto mt-10">
 <div className="flex items-center mb-6">
 <button onClick={() => { setShowLossPenalty(false); setShowProfile(true); }} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-xl font-bold ml-3 text-gray-800">Loss & Penalty</h2>
 </div>
 
 <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center mb-6">
 <AlertTriangle size={48} className="text-red-500 mb-4 opacity-50" />
 <span className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wider">Total Loss & Penalty</span>
 <span className="text-4xl font-black text-red-700 break-words whitespace-normal">{loadingClusterPenalties ? <span className="loading-ellipsis">Loading</span> : `₹ ${penaltySum.toLocaleString('en-IN', {maximumFractionDigits: 2})}`}</span>
 </div>

 {loadingClusterPenalties ? (
 <div className="text-center text-gray-500 py-10 font-medium"><span className="loading-ellipsis">Loading</span></div>
 ) : clusterPenalties.length === 0 ? null : (
 <div className="flex flex-col gap-4">
 {clusterPenalties.map((p, i) => (
 <div key={p.id || i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
 <div className="flex justify-between items-center">
 <span className="text-sm font-semibold text-gray-800">{p['penalty status'] || 'N/A'}</span>
 <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-700 rounded-md">₹{p['penalty amount'] || 0}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
 }


 if (showProfile) {
 return (
 <div className="fixed inset-0 w-full bg-[#F8FAFC] text-slate-900 flex flex-col z-50 overflow-y-auto">
 <CreateUserIdPage
 initialType="Cluster"
 initialData={adminProfile}
 isLoading={isLoadingProfile}
 adminProfileId={adminProfileId}
 onBack={closeAdminProfile}
 onLogout={() => setShowLogoutModal(true)}
 />
 {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} portalName="Cluster" />}
 </div>
 );
 }

 if (selectedUserIdSetup) {
 const getRoleColor = (type: string) => {
 switch (type) {
 case 'Customer ID': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', btn: 'bg-blue-600 hover:bg-blue-700', focusRing: 'focus:border-blue-500', iconColor: 'text-blue-500', iconBadge: 'bg-blue-50 text-blue-700 border-blue-200/60' };
 case 'Seller ID': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', btn: 'bg-amber-600 hover:bg-amber-700', focusRing: 'focus:border-amber-500', iconColor: 'text-amber-500', iconBadge: 'bg-amber-50 text-amber-700 border-amber-200/60' };
 case 'Hub Manager ID': return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', btn: 'bg-purple-600 hover:bg-purple-700', focusRing: 'focus:border-purple-500', iconColor: 'text-purple-500', iconBadge: 'bg-purple-50 text-purple-700 border-purple-200/60' };
 case 'Rider ID': return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700', focusRing: 'focus:border-emerald-500', iconColor: 'text-emerald-500', iconBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' };
 default: return { bg: 'bg-slate-200', text: 'text-slate-900', border: 'border-slate-300', btn: 'bg-slate-800 hover:bg-slate-900', focusRing: 'focus:border-slate-1000', iconColor: 'text-slate-1000', iconBadge: 'bg-slate-100 text-slate-900 border-slate-300/60' };
 }
 };
 const activeColor = getRoleColor(activeUserType);

 return (
 <div className="fixed inset-0 w-full bg-slate-50 flex flex-col font-poppins antialiased p-3 sm:p-4 overflow-hidden">
 <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">
 {/* Search and Create ID (Moved Up) */}
 <div className="flex items-center gap-2">
 <div className="relative flex-1">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input 
 type="text" 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder={`Search ${activeUserType.toLowerCase()}...`}
 className={`w-full h-11 sm:h-12 pl-10 pr-9 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium ${activeColor.focusRing} focus:outline-none focus:border-2`}
 />
 </div>
 <button 
 onClick={openCreateUserId}
 className={`h-9 px-3 ${activeColor.btn} text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer`}
 >
 <Plus size={16} strokeWidth={2.5} />
 <span className="whitespace-nowrap">Create ID</span>
 </button>
 </div>
 {/* Title and Total Count (Moved Down) */}
 <div className="flex items-center justify-between border-b border-slate-200/90 pb-2 mt-2">
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setSelectedUserIdSetup(null)}
 className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all cursor-pointer"
 >
 <ArrowLeft size={16} strokeWidth={2.4} />
 </button>
 <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">All {activeUserType.replace(' ID', '')} List</h1>
 </div>
 <span className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">Total: {filteredUsers.length}</span>
 </div>
 </div>

 <div className="w-full max-w-3xl mx-auto flex flex-col mt-2.5 flex-1">
 <div className="flex-1 bg-white border border-slate-200/90 rounded-xl p-2 sm:p-3 shadow-xs flex flex-col overflow-hidden">
 {isUsersLoading ? (
 <div className="py-14 flex flex-col items-center justify-center text-center gap-2">
 <div className="flex space-x-1.5 items-center">
 {activeUserType === 'Customer ID' && (
 <>
 <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
 </>
 )}
 {activeUserType === 'Seller ID' && (
 <>
 <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-bounce"></span>
 </>
 )}
 {activeUserType === 'Hub Manager ID' && (
 <>
 <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce"></span>
 </>
 )}
 {activeUserType === 'Rider ID' && (
 <>
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
 </>
 )}
 </div>
 <p className="text-xs font-bold text-slate-500">Loading records...</p>
 </div>
 ) : filteredUsers.length === 0 ? (
 <div className="py-14 flex flex-col items-center justify-center text-center">
 <p className="text-xs font-bold text-slate-800">No records found</p>
 </div>
 ) : (
 <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-100px)] p-1">
 {filteredUsers.map((user) => {
 const roleTheme = getRoleColor(user.type);
 const isFrozen = user.isFrozen ?? (user.dbRow?.freeze === 'true' || user.dbRow?.freeze === true || user.dbRow?.freeze === 'frozen');
 return (
 <div key={user.id} className="py-2.5 px-3 bg-white border border-slate-200 shadow-sm rounded-lg hover:shadow-md transition-shadow flex items-start justify-between gap-3 group">
 {(user.type === 'Cluster ID') && (
 <div className="w-14 sm:w-16 shrink-0 aspect-[4/5] border border-slate-200 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
 {user.avatar ? (
 <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(user.avatar || null)} />
 ) : (
 <div className="text-slate-300 text-[10px] font-bold">4:5</div>
 )}
 </div>
 )}
 <div className="flex flex-col gap-1.5 min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
   <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start">{user.id}</span>
   {isFrozen && (
     <span className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 self-start">
       Frozen
     </span>
   )}
 </div>
 <div className="min-w-0 flex items-center gap-2 flex-wrap mt-0.5">
 <span className="text-[13px] font-semibold text-slate-900 truncate">{user.name}</span>
 <span className="flex items-center gap-1 font-medium text-slate-600 text-[11px]">
 <Phone size={10} className={roleTheme.iconColor} />
 {user.phone}
 </span>
 {user.secondaryInfo && (
 <span className="flex items-center gap-1 truncate text-slate-400 text-[10px]">
 • {user.secondaryInfo}
 </span>
 )}
 </div>
 </div>
 <div className="flex flex-col gap-1.5 shrink-0 ml-2">
 <button 
 onClick={() => openViewUserId(user.dbRow)}
 title="View / Edit"
 className="px-2 py-1 w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded text-[10px] font-semibold cursor-pointer transition-colors text-center"
 >
 View
 </button>
 <button 
 onClick={() => handleToggleFreeze(user)}
 title={isFrozen ? "Unfreeze" : "Freeze"}
 className={`px-2 py-1 w-full rounded text-[10px] font-semibold cursor-pointer transition-colors text-center border ${
   isFrozen
     ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
     : "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
 }`}
 >
 {isFrozen ? "Unfreeze" : "Freeze"}
 </button>
 <button 
 onClick={async () => {
 if (!window.confirm('Are you sure you want to delete this user?')) return;
 let table = '';
 if (user.type === 'Customer ID') table = 'customers';
 else if (user.type === 'Seller ID') table = 'sellers';
 else if (user.type === 'Rider ID') table = 'riders';
 else if (user.type === 'Hub Manager ID') table = 'hub_managers';
 else if (user.type === 'Cluster ID') table = 'clusters';
 if (table) {
 await supabase.from(table).delete().eq('id', user.id);
 setUsersList(prev => prev.filter(u => u.id !== user.id));
 }
 }}
 title="Delete"
 className="px-2 py-1 w-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded text-[10px] font-semibold cursor-pointer transition-colors text-center"
 >
 Delete
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 flex flex-col font-poppins antialiased select-none overflow-hidden">
 
 {/* Top Header - Clear title banner with distinct console styling */}
 <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 flex items-center justify-between px-3 sm:px-5 min-h-[58px] sm:min-h-[64px] h-auto py-2.5 shrink-0 shadow-xs gap-2">
 <div className="flex items-center gap-2 cursor-pointer min-w-0 flex-1" onClick={() => setActiveTab('Dashboard')}>
 <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-1.5 rounded-lg text-white shadow-xs shrink-0">
 <ShieldCheck size={16} strokeWidth={2.4} />
 </div>
 <div className="min-w-0 flex items-center gap-1.5">
 <h1 className="text-[12px] sm:text-sm font-bold text-slate-900 tracking-tight flex items-center min-w-0 gap-1.5">
 <span className="truncate">Suriyawan Shopping Cluster</span>
 <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 uppercase">
 Console
 </span>
 </h1>
 </div>
 </div>
 <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
 <button onClick={handleDeepRefresh} title="Real-time Deep Refresh" className="p-1.5 rounded-md hover:bg-slate-100 transition-colors active:bg-slate-200 text-slate-600 border border-transparent hover:border-slate-300 cursor-pointer shrink-0">
 <RefreshCw size={18} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-blue-600" : ""} />
 </button>
 <button 
 onClick={openAdminProfile}
 id="admin-header-profile-btn"
 title="Cluster Profile"
 className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition-all cursor-pointer shadow-2xs group shrink-0"
 >
 <div className="w-4 h-4 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shadow-xs group-hover:scale-105 transition-transform">
 <User size={10} strokeWidth={2.5} />
 </div>
 <span className="text-[10px] sm:text-xs font-bold text-slate-900">
 Profile
 </span>
 </button>
 </div>
 </header>

 {/* Main Content Area - Generous top spacing, completely unhindered and not hidden under header */}
 <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 sm:max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-5 pb-24">
 {activeTab === 'Dashboard' && (
 <div className="w-full flex flex-col gap-4 sm:gap-5">
 
 {/* Section 1: Portal Setup */}
 <section className="w-full">
 <div className="flex items-center justify-between mb-2.5 px-0.5">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-slate-200 text-slate-900 flex items-center justify-center font-bold shadow-2xs">
 <Layers size={14} strokeWidth={2.4} />
 </div>
 <div className="flex items-center gap-2">
 <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
 Portal Setup
 </h2>
 <span className="text-[10px] font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300/60 hidden sm:inline-flex">
 Core Modules
 </span>
 </div>
 </div>
 <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
 Suriyawan Platform Portals
 </span>
 </div>

 {/* 4 Cards Grid - Clean chips without internal subtitle descriptions */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
 {portalSetupOptions.map((option) => {
 const IconComp = option.icon;
 return (
 <div
 key={option.label}
 onClick={() => setSelectedPortalSetup(option.modalKey || option.label)}
 className={`bg-white border border-slate-200/90 ${option.borderHover} rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer h-20 sm:h-22`}
 >
 <div className="flex items-center justify-between">
 <div className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl ${option.iconBg} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}>
 <IconComp size={16} strokeWidth={2.2} />
 </div>
 <ArrowRight size={13} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
 </div>

 <div className="mt-1">
 <span className={`text-xs sm:text-[13px] font-bold ${option.accentColor} block leading-tight truncate`}>
 {option.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </section>

 {/* Section 2: User ID Setup */}
 <section className="w-full">
 <div className="flex items-center justify-between mb-2.5 px-0.5">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
 <Users size={14} strokeWidth={2.4} />
 </div>
 <div className="flex items-center gap-2">
 <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
 User ID Setup
 </h2>
 <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 hidden sm:inline-flex">
 Identity & Roles
 </span>
 </div>
 </div>
 </div>

 {/* 4 Cards Grid - Clean chips without internal subtitle descriptions and without count badge */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
 {userIdSetupOptions.map((option) => {
 const IconComp = option.icon;
 return (
 <button
 key={option.label}
 onClick={() => openUserIdSetup(option.label)}
 className={`bg-white border border-slate-200/90 ${option.borderHover} rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between text-left group cursor-pointer h-20 sm:h-22`}
 >
 <div className="flex items-center justify-between w-full">
 <div className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl ${option.iconBg} flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform`}>
 <IconComp size={16} strokeWidth={2.2} />
 </div>
 <ArrowRight size={13} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
 </div>

 <div className="w-full mt-1">
 <span className={`text-xs sm:text-[13px] font-bold ${option.color} block leading-tight truncate`}>
 {option.label}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 </section>

 {/* Section 3: Communications */}
 <section className="w-full">
 <div className="flex items-center justify-between mb-2.5 px-0.5">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-slate-200 text-slate-900 flex items-center justify-center font-bold shadow-2xs">
 <MessageSquare size={14} strokeWidth={2.4} />
 </div>
 <div className="flex items-center gap-2">
 <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
 Communications
 </h2>
 <span className="text-[10px] font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300/60 hidden sm:inline-flex">
 Updates & Support
 </span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
 <button
 onClick={() => setShowAnnouncementModal({ isOpen: true, type: 'cluster_update', title: 'Suriyawan Shopping Update' })}
 className="bg-white border border-slate-200/90 hover:border-slate-400 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between text-left group cursor-pointer h-20 sm:h-22"
 >
 <div className="flex items-center justify-between w-full">
 <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 relative text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">{updateCount > 0 && <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 min-w-[18px] text-center">{updateCount}</span>}
 <TrendingUp size={16} strokeWidth={2.2} />
 </div>
 <ArrowRight size={13} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
 </div>
 <div className="w-full mt-1">
 <span className="text-xs sm:text-[13px] font-bold text-slate-900 block leading-tight truncate">
 Suriyawan Shopping Update
 </span>
 </div>
 </button>
 <button
 onClick={() => setShowRoleChatModal({isOpen: true, table: "chat_for_clusters", title: "Chat with Admin"})}
 className="bg-white border border-slate-200/90 hover:border-slate-400 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between text-left group cursor-pointer h-20 sm:h-22"
 >
 <div className="flex items-center justify-between w-full">
 <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-800 relative text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform"><MessageSquare size={16} strokeWidth={2.2} />
 </div>
 <ArrowRight size={13} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
 </div>
 <div className="w-full mt-1">
 <span className="text-xs sm:text-[13px] font-bold text-slate-900 block leading-tight truncate">
 Chat With Admin
 </span>
 </div>
 </button>
 </div>
 </section>

 {/* Section 4: Pending Deposit */}
 <section className="w-full">
 <div className="flex items-center justify-between mb-2.5 px-0.5">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold shadow-2xs">
 <CreditCard size={14} strokeWidth={2.4} />
 </div>
 <div className="flex items-center gap-2">
 <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
 Pending Deposit
 </h2>
 </div>
 </div>
 </div>
 
 <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2.5">
 <div className="flex flex-col gap-3">
 <div onClick={() => setShowPendingDepositModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Pending Deposit Amount</span>
 <span className="text-2xl truncate font-bold text-slate-800">
 {totalPendingDepositCluster === null ? (
 <span className="flex items-center gap-1 text-sm font-medium text-slate-500 h-6">
 Calculating
 <span className="flex items-center gap-0.5 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </span>
 ) : (
 `₹ ${totalPendingDepositCluster}`
 )}
 </span>
 </div>
 </div>
 </div>
 </section>

 {/* Section 5: My Earning & Penalty Chips */}
 <section className="w-full mt-2">
 <div className="flex flex-col gap-3">
 <button onClick={() => setShowEarningModal(true)} className="w-full bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer min-h-[80px]">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
 <CreditCard size={20} strokeWidth={2.4} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">My Earning</span>
 <span className="text-xl sm:text-2xl font-black text-slate-900 break-words whitespace-normal">{!clusterEarningData ? <span className="loading-ellipsis">Loading</span> : `₹ ${clusterEarningData.totalAmount?.toLocaleString('en-IN') || 0}`}</span>
 </div>
 </div>
 <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
 </button>
 <button onClick={() => setShowPenaltyModal(true)} className="w-full bg-white border border-slate-200 hover:border-red-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer min-h-[80px]">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
 <AlertTriangle size={20} strokeWidth={2.4} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Loss & Penalty</span>
 <span className="text-xl sm:text-2xl font-black text-slate-900 break-words whitespace-normal">{clusterPenaltySum === null ? <span className="loading-ellipsis">Loading</span> : `₹ ${clusterPenaltySum.toLocaleString('en-IN')}`}</span>
 </div>
 </div>
 <ArrowRight size={18} className="text-slate-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
 </button>
 </div>
 </section>

          {/* Secure Transaction Option at the bottom of Dashboard */}
          <div className="w-full mt-3">
            <button
              type="button"
              onClick={() => setShowSecureTransactionModal('Secure Transaction')}
              className="w-full p-3.5 sm:p-4 bg-white border border-black rounded-lg text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-black block leading-tight">Secure Transaction</span>
                  <span className="text-[11px] text-slate-600 font-medium">Configure transaction, rider, hub manager & payment settings</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-black group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>

 </div>
 )}

 {/* Portal Setup Configuration Modal */}
 {selectedPortalSetup && (
 <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
 <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shadow-xs">
 <Layers size={16} strokeWidth={2.4} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">{selectedPortalSetup}</h3>
 <p className="text-[11px] text-slate-500">Live regional configuration for Suriyawan</p>
 </div>
 </div>
 <button 
 onClick={() => setSelectedPortalSetup(null)}
 className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
 >
 <X size={16} />
 </button>
 </div>

 <div className="space-y-3">
 {selectedPortalSetup === 'Seller Portal Setup' && (
 <div className="flex flex-col gap-3">
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowEarningChart(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
 <TrendingUp size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-amber-900 block">Estimated Earning Chart</span>
 <span className="text-[11px] text-amber-700">Configure seller earning calculation rules</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-amber-500" />
 </button>
 
 <button
 onClick={() => {
 setSelectedPortalSetup('Services Visual Setup');
 }}
 className="w-full flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
 <Eye size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-rose-900 block">Services Visual</span>
 <span className="text-[11px] text-rose-700">Configure upload service visibility</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-rose-500" />
 </button>
 </div>
 )}
 {selectedPortalSetup === 'Services Visual Setup' && (
 <div className="flex flex-col gap-4">
 <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
 <div className="mb-4">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Select Seller ID</label>
 <CustomSelect
 value={visualSelectedSeller}
 onChange={handleSellerChange}
 className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
 >
 {allSellers.map(seller => (
 <option key={seller.id} value={seller.id}>
 {seller.shop_name || seller.seller_name} ({seller.id.substring(0, 8)}...)
 </option>
 ))}
 {allSellers.length === 0 && <option value="">No sellers found</option>}
 </CustomSelect>
 </div>

 <div className="mb-4">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Visual Model (Upload Service)</label>
 <CustomSelect
 value={visualModelValue}
 onChange={(e) => setVisualModelValue(e.target.value as 'show' | 'hide')}
 className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
 >
 <option value="show">Show</option>
 <option value="hide">Hide</option>
 </CustomSelect>
 </div>

 <button
 onClick={handleSaveServicesVisual}
 disabled={isSavingVisual || !visualSelectedSeller}
 className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
 >
 {isSavingVisual ? (
 <span className="flex items-center">
 Applying
 <span className="flex gap-0.5 items-center ml-0.5">
 <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
 </span>
 </span>
 ) : (
 <>
 <Save size={16} />
 Apply Setting
 </>
 )}
 </button>
 </div>
 
 

 </div>
 )}
 {selectedPortalSetup === 'Rider Portal Setup' && (
 <div className="flex flex-col gap-3">
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowRiderServiceRate(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
 <Truck size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-emerald-900 block">Service Rate setup</span>
 <span className="text-[11px] text-emerald-700">Configure pickup, delivery & return rates</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-emerald-500" />
 </button>
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowRiderPenaltyModal(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer mt-3"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
 <AlertTriangle size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-red-900 block">Rider Penalty</span>
 <span className="text-[11px] text-red-700">Configure rider penalties</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-red-500" />
 </button>
 </div>
 )}
 
 {selectedPortalSetup === 'Hub Logistic Setup' && (
 <div className="flex flex-col gap-3">
 <button 
 onClick={() => setShowHubManagersPincodeService(true)}
 className="w-full flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center">
 <MapPin size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-purple-900 block">Hub Managers Pincode Service</span>
 <span className="text-[11px] text-purple-700">Manage serviceable pincodes for hub managers</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-purple-500" />
 </button>
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowHubManagerPenaltyModal(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
 <AlertTriangle size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-red-900 block">Hub Manager Penalty</span>
 <span className="text-[11px] text-red-700">Configure hub manager penalties</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-red-500" />
 </button>
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowHubManagerSalarySetup(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
 <IndianRupee size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-blue-900 block">Hub Manager Salary Setup</span>
 <span className="text-[11px] text-blue-700">Configure fixed salaries for hub managers</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-blue-500" />
 </button>
 </div>
 )}
 {selectedPortalSetup !== 'Seller Portal Setup' && selectedPortalSetup !== 'Services Visual Setup' && selectedPortalSetup !== 'Rider Portal Setup' && selectedPortalSetup !== 'Hub Logistic Setup' && (
 <div className="p-8 text-center text-slate-500 text-xs">
 Configuration options will be available soon.
 </div>
 )}
 </div>
 <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
 {selectedPortalSetup === 'Services Visual Setup' ? (
 <button onClick={() => setShowVisualList(!showVisualList)} className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
 <List size={14} /> View List
 </button>
 ) : <div></div>}
 <button 
 onClick={() => setSelectedPortalSetup(null)}
 className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 )}

 
 {/* Cluster Earning Details Modal */}
 {showEarningModal && (
 <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 <CreditCard size={18} className="text-emerald-600" />
 My Earning Details
 </h3>
 <button onClick={() => setShowEarningModal(false)} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 bg-slate-50 space-y-4">
 {clusterEarningData ? (
 <>
 <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl p-6 shadow-md text-white relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-20">
 <CreditCard size={64} />
 </div>
 <div className="flex justify-between items-end">
 <div className="flex flex-col">
 <span className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Total Earning Amount</span>
 <span className="text-3xl sm:text-4xl font-black break-words whitespace-normal">₹ {clusterEarningData.totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
 </div>
 </div>
 <div className="mt-6 pt-4 border-t border-emerald-400/30 flex justify-between items-center">
 <div className="flex gap-4">
 <div className="flex flex-col">
 <span className="text-emerald-100 text-[10px] uppercase">Orders</span>
 <span className="font-bold">{clusterEarningData.count}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-emerald-100 text-[10px] uppercase">Rate</span>
 <span className="font-bold">₹ {clusterEarningData.rate}</span>
 </div>
 </div>
 <button onClick={() => setShowShipmentDetails(true)} className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors">
 View Details
 </button>
 </div>
 </div>
 
 <h4 className="font-bold text-slate-800 mt-6 mb-2">Transaction History</h4>
 <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="max-h-[300px] overflow-y-auto p-2">
 {clusterPenaltyData.length === 0 ? (
 <div className="text-center text-slate-500 py-8 text-sm">No transaction records found.</div>
 ) : (
 clusterPenaltyData.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map((p, idx) => (
 <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
 <div className="flex flex-col">
 <span className="font-bold text-slate-800 text-sm">Penalty Applied</span>
 {p['penalty status'] && (
 <span className="text-[11px] text-slate-500 mt-0.5">Status: <span className="font-medium text-slate-700">{p['penalty status']}</span></span>
 )}
 </div>
 <span className="font-bold text-red-600">-₹ {parseFloat(p['penalty amount'] || '0').toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
 </div>
 ))
 )}
 </div>
 </div>
 </>
 ) : (
 <div className="text-center text-slate-500 py-10">Loading earning details...</div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Cluster Penalty Details Modal */}
 {showPenaltyModal && (
 <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-red-800 flex items-center gap-2">
 <AlertTriangle size={18} className="text-red-600" />
 Loss & Penalty Details
 </h3>
 <button onClick={() => setShowPenaltyModal(false)} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 bg-slate-50 space-y-4">
 <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
 <AlertTriangle size={48} className="text-red-500 mb-4 opacity-50" />
 <span className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wider">Total Loss & Penalty</span>
 <span className="text-4xl font-black text-red-700 break-words whitespace-normal">{clusterPenaltySum === null ? <span className="loading-ellipsis">Loading</span> : `₹ ${clusterPenaltySum.toLocaleString('en-IN', {maximumFractionDigits: 2})}`}</span>
 </div>
 
 {clusterPenaltyData.length === 0 ? null : (
 <div className="flex flex-col gap-4">
 {clusterPenaltyData.map((p, i) => (
 <div key={p.id || i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
 <div className="flex justify-between items-center">
 <span className="text-sm font-semibold text-gray-800">{p['penalty status'] || 'N/A'}</span>
 <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-700 rounded-md">₹{p['penalty amount'] || 0}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 
 {/* Shipment Details Modal */}
 {showShipmentDetails && (
 <div className="fixed inset-0 z-[70] flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-200">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <div className="flex items-center gap-3">
 <button onClick={() => setShowShipmentDetails(false)} className="text-slate-500 hover:text-slate-800">
 <ArrowRight size={20} className="rotate-180" />
 </button>
 <h3 className="font-bold text-slate-800">
 Total Earning Shipments
 </h3>
 </div>
 <div className="flex items-center gap-2">
 <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
 Count: {clusterEarningShipments.length.toLocaleString('en-IN')}
 </span>
 <button onClick={handleDownloadEarningPDF} className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer" title="Download PDF">
 <Download size={16} />
 </button>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto bg-slate-50 p-2 sm:p-4">
 <div className="space-y-3">
 {clusterEarningShipments.length === 0 ? (
 <div className="text-center py-10 text-slate-500">No shipments found.</div>
 ) : (
 clusterEarningShipments.map((s, idx) => (
 <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
 <div className="flex justify-between items-start">
 <div className="flex flex-col">
 <span className="text-xs text-slate-500 font-medium">AWB Number</span>
 <span className="font-bold text-slate-900 break-all">{s['awb number'] || s['AWB Number'] || s['awb_number'] || 'N/A'}</span>
 </div>
 </div>
 <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col">
 <span className="text-xs text-slate-500 font-medium">Order ID</span>
 <span className="font-semibold text-slate-800 break-all">{s['order id'] || s['Order ID'] || s['order_id'] || 'N/A'}</span>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Estimated Earning Chart Modal */}
 
 
 {/* Hub Manager Salary Setup Full Screen Modal */}
 {showHubManagerSalarySetup && (
 <div className="fixed inset-0 z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
 {/* Header */}
 <header className="sticky top-0 z-10 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 h-14 shrink-0 shadow-sm">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setShowHubManagerSalarySetup(false)}
 className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-base font-bold text-slate-900">Hub Manager Salary Setup</h2>
 </div>
 </header>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
 
 {/* Add / Edit Form */}
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
 <h3 className="text-sm font-bold text-slate-800">
 Manage Salaries
 </h3>
 
 <div className="flex flex-col gap-4">
 <div className="flex flex-col gap-4 items-start">
 <div className="w-full">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Hub Manager ID</label>
 <CustomSelect 
 value={selectedHubManagerForSalary}
 onChange={(e) => setSelectedHubManagerForSalary(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
 >
 <option value="">Select Hub Manager</option>
 {hubManagersList.map((hm) => (
 <option key={hm.id} value={hm.id}>
 {hm.id.substring(0, 8)} - {hm.hub_name || 'No Hub'} ({hm.hub_manager_name || 'No Name'})
 </option>
 ))}
 </CustomSelect>
 </div>

 <div className="w-full flex gap-2 items-end">
 <div className="flex-1">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Amount</label>
 <input 
 type="text"
 placeholder="Enter salary amount"
 value={hmSalaryValue}
 onChange={(e) => {
 const val = e.target.value.replace(/[^0-9.]/g, '');
 setHmSalaryValue(val);
 }}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
 />
 </div>
 </div>
 
 <button 
 onClick={handleSaveHmSalary}
 disabled={isSavingHmSalary || !hmSalaryValue || !selectedHubManagerForSalary}
 className="w-full sm:w-auto h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSavingHmSalary ? (
 <>
 <div className="flex gap-1">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
 </div>
 </>
 ) : (
 'Save Change'
 )}
 </button>
 </div>
 </div>
 </div>

 {/* List */}
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] shrink-0">
 <div className="p-4 border-b border-slate-200 bg-slate-50">
 <h3 className="font-bold text-slate-800 text-sm">Configured Salaries</h3>
 </div>
 <div className="p-4 flex flex-col gap-3">
 {addedHmSalaryList.length === 0 ? (
 <div className="text-center text-slate-500 text-sm py-4">No salaries configured yet.</div>
 ) : (
 addedHmSalaryList.map((salaryItem) => {
 const hm = hubManagersList.find(h => h.id === salaryItem['hub manager id']);
 return (
 <div key={salaryItem.id} className="border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
 <div className="flex flex-col gap-1 w-full">
 <div className="flex items-center justify-between w-full">
 <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
 <IndianRupee size={16} className="text-purple-600" />
 {salaryItem['fixed salary']}
 </span>
 </div>
 <div className="text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
 <span className="font-semibold">Hub Manager:</span>
 <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">
 {hm ? `${hm.id.substring(0, 8)} - ${hm.hub_name || 'No Hub'} (${hm.hub_manager_name || 'No Name'})` : salaryItem['hub manager id']?.substring(0, 8)}
 </span>
 </div>
 </div>
 
 <button 
 onClick={() => {
 setSelectedHubManagerForSalary(salaryItem["hub manager id"]);
 setHmSalaryValue(salaryItem["fixed salary"] ? salaryItem["fixed salary"].toString() : '');
 // Scroll to top
 document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
 }}
 className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-colors border border-slate-300/50"
 >
 Edit
 </button>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Hub Managers Pincode Service Full Screen Modal */}
 {showHubManagersPincodeService && (
 <div className="fixed inset-0 z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
 {/* Header */}
 <header className="sticky top-0 z-10 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 h-14 shrink-0 shadow-sm">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setShowHubManagersPincodeService(false)}
 className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-base font-bold text-slate-900">Hub Managers Pincode Service</h2>
 </div>
 </header>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
 
 {/* Add / Edit Form */}
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
 <h3 className="text-sm font-bold text-slate-800">
 Manage Pincodes
 </h3>
 
 <div className="flex flex-col gap-4">
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-1 w-full">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Hub Manager ID</label>
 <CustomSelect 
 value={selectedHubManagerForPincode}
 onChange={(e) => setSelectedHubManagerForPincode(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
 >
 <option value="">Select Hub Manager</option>
 {hubManagersList.map((hm) => (
 <option key={hm.id} value={hm.id}>
 {hm.id.substring(0, 8)} - {hm.hub_name || 'No Hub'} ({hm.hub_manager_name || 'No Name'})
 </option>
 ))}
 </CustomSelect>
 </div>

 <div className="flex-1 w-full flex gap-2">
 <div className="flex-1">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Add Pincode</label>
 <input 
 type="text"
 maxLength={6}
 placeholder="Enter 6-digit pincode"
 value={newPincodeValue}
 onChange={(e) => {
 const val = e.target.value.replace(/\D/g, '');
 setNewPincodeValue(val);
 }}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleAddPincodeChip();
 }
 }}
 disabled={!selectedHubManagerForPincode}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
 />
 </div>
 <button 
 onClick={handleAddPincodeChip}
 disabled={!selectedHubManagerForPincode || newPincodeValue.length !== 6}
 className="h-11 px-4 mt-[22px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
 >
 Add
 </button>
 </div>

 <div className="w-full sm:w-auto flex gap-2 shrink-0">
 <button 
 onClick={handleSavePincode}
 disabled={isSavingPincode || !selectedHubManagerForPincode}
 className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
 >
 {isSavingPincode ? 'Saving...' : 'Save Change'}
 </button>
 </div>
 </div>

 {/* Pincode Chips Area */}
 {selectedHubManagerForPincode && (
 <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mt-2 min-h-[80px]">
 {currentManagerPincodes.length === 0 ? (
 <p className="text-xs text-slate-500 text-center mt-2">No pincodes added for this manager yet.</p>
 ) : (
 <div className="flex flex-wrap gap-2">
 {currentManagerPincodes.map((pin) => (
 <div key={pin} className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-full px-3 py-1 shadow-sm">
 <span className="text-sm font-bold text-purple-700">{pin}</span>
 <button 
 onClick={() => handleRemovePincodeChip(pin)}
 className="w-4 h-4 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-colors pb-0.5"
 title="Remove"
 >
 <span className="text-xs leading-none font-bold">-</span>
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* List of Added Pincodes Overview */}
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] shrink-0">
 <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
 <h3 className="text-sm font-bold text-slate-800">All Latest Added Pincodes</h3>
 <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">{new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(addedPincodesList.length).toLowerCase()} Updates</span>
 </div>
 
 <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-0">
 {addedPincodesList.length === 0 ? (
 <div className="p-8 text-center text-slate-500 text-sm">
 No pincodes added yet.
 </div>
 ) : (
 addedPincodesList.map((pincodeItem) => {
 const hm = hubManagersList.find(h => h.id === pincodeItem['hub manager id']);
 
 return (
 <div key={pincodeItem.id} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between hover:bg-slate-50 transition-colors">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2">
 <span className="text-sm font-bold text-slate-900">{pincodeItem['added pincode']}</span>
 <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase border border-purple-200/50">
 {pincodeItem['cluster id'] === adminProfileId ? 'Added by You' : 'Added by Admin'}
 </span>
 </div>
 <div className="text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
 <span className="font-semibold">Hub Manager:</span>
 <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">
 {hm ? `${hm.id.substring(0, 8)} - ${hm.hub_name || 'No Hub'} (${hm.hub_manager_name || 'No Name'})` : pincodeItem['hub manager id']?.substring(0, 8)}
 </span>
 </div>
 </div>
 
 <button 
 onClick={() => {
 setSelectedHubManagerForPincode(pincodeItem["hub manager id"]);
 // Scroll to top
 document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
 }}
 className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-colors border border-slate-300/50"
 >
 Edit Manager
 </button>
 </div>
 );
 })
 )}
 </div>
 </div>

 </div>
 </div>
 )}

 {showEarningChart && (
 <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
 <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-xl border border-slate-200">
 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-xs">
 <TrendingUp size={16} strokeWidth={2.4} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">Estimated Earning per Unit</h3>
 <p className="text-[11px] text-slate-500">Manage charges and fees applied to sellers</p>
 </div>
 </div>
 <button 
 onClick={() => setShowEarningChart(false)}
 className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
 >
 <X size={16} />
 </button>
 </div>

 <div className="p-4 flex-1 overflow-y-auto space-y-4">
 <div className="grid grid-cols-12 gap-3 pb-2 border-b border-slate-100 px-1">
 <div className="col-span-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Charge Name</div>
 <div className="col-span-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Value</div>
 <div className="col-span-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Type</div>
 </div>

 {earningCharges.map((charge, idx) => (
 <div key={charge.id} className="grid grid-cols-12 gap-3 items-center bg-white p-1">
 <div className="col-span-5">
 <input 
 type="text" 
 value={charge.name}
 onChange={(e) => {
 const newCharges = [...earningCharges];
 newCharges[idx].name = e.target.value;
 setEarningCharges(newCharges);
 }}
 className="w-full text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none transition-colors px-1 py-1"
 placeholder="Charge Name"
 />
 </div>
 <div className="col-span-4 relative">
 <input 
 type="number" 
 value={charge.value}
 onChange={(e) => {
 const newCharges = [...earningCharges];
 newCharges[idx].value = e.target.value;
 setEarningCharges(newCharges);
 }}
 className="w-full h-8 pl-2 pr-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
 placeholder="0"
 />
 </div>
 <div className="col-span-3 flex items-center justify-end">
 <button
 onClick={() => {
 const newCharges = [...earningCharges];
 newCharges[idx].isPercentage = !newCharges[idx].isPercentage;
 setEarningCharges(newCharges);
 }}
 className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer w-[68px] text-center ${charge.isPercentage ? 'bg-slate-200 text-slate-900 hover:bg-slate-300' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
 >
 {charge.isPercentage ? '% Percent' : '₹ Fixed'}
 </button>
 </div>
 </div>
 ))}

 <button
 onClick={() => {
 setEarningCharges([
 ...earningCharges,
 { id: Date.now().toString(), name: 'New Charge', value: '0', isPercentage: false }
 ]);
 }}
 className="w-full mt-4 py-2.5 border-2 border-dashed border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
 >
 <Plus size={14} /> Add New Charge
 </button>
 </div>

 <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-2">
 <button 
 onClick={() => setShowEarningChart(false)}
 className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
 >
 Cancel
 </button>
 <button 
 onClick={handleSaveEarningChart}
 disabled={isSavingEarningChart}
 className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
 >
 {isSavingEarningChart ? (
 <>
 Saving<span className="flex gap-0.5 items-center"><span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="w-1 h-1 bg-white rounded-full animate-bounce"></span></span>
 </>
 ) : (
 'Save'
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Rider Service Rate Modal */}
 {showRiderServiceRate && (
 <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
 <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-xl border border-slate-200">
 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/50 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
 <Truck size={16} strokeWidth={2.4} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">Rider Service Rates</h3>
 <p className="text-[11px] text-slate-500">Configure pickup and delivery rates</p>
 </div>
 </div>
 <button 
 onClick={() => setShowRiderServiceRate(false)}
 className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
 >
 <X size={16} />
 </button>
 </div>

 <div className="p-4 flex-1 overflow-y-auto bg-slate-50 space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold text-slate-600">Select Rank to configure rates</p>
 <div className="flex bg-slate-200/60 p-1 rounded-lg gap-1">
 <button 
 onClick={() => setActiveRateRank('Regular')}
 className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm ${activeRateRank === 'Regular' ? 'bg-white text-slate-800 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
 >
 Regular
 </button>
 <button 
 onClick={() => setActiveRateRank('Premium')}
 className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm ${activeRateRank === 'Premium' ? 'bg-white text-blue-700 ring-1 ring-blue-200' : 'text-slate-500 hover:bg-white/50'}`}
 >
 Premium
 </button>
 <button 
 onClick={() => setActiveRateRank('Ultra')}
 className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm ${activeRateRank === 'Ultra' ? 'bg-white text-amber-600 ring-1 ring-amber-200' : 'text-slate-500 hover:bg-white/50'}`}
 >
 Ultra
 </button>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Rider</label>
 <CustomSelect
 value={specificSelectedRider}
 onChange={(e) => setSpecificSelectedRider(e.target.value)}
 
 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
 >
 {allRiders.map(rider => (
 <option key={rider.id} value={rider.id}>
 {rider.rider_name} ({rider.id.substring(0, 8)})
 </option>
 ))}
 {allRiders.length === 0 && <option value="">No riders found</option>}
 </CustomSelect>
 {activeRateRank === 'Regular' && (
 <p className="text-[10px] text-slate-500 mt-1">* Regular rank applies globally to all unassigned riders.</p>
 )}
 </div>

 <div className="pt-2 space-y-3">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pickup Rate (₹)</label>
 <input 
 type="number"
 value={specificRiderRates.pickup}
 onChange={(e) => {
 setSpecificRiderRates({...specificRiderRates, pickup: e.target.value});
 }}
 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Delivery Rate (₹)</label>
 <input 
 type="number"
 value={specificRiderRates.delivery}
 onChange={(e) => {
 setSpecificRiderRates({...specificRiderRates, delivery: e.target.value});
 }}
 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
 />
 </div>
 
 </div>
 </div>

 
 </div>
 <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex flex-wrap justify-between items-center gap-3">
 <div className="flex gap-2">
 <button onClick={() => setShowRiderRateList(!showRiderRateList)} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
 <List size={14} /> View List
 </button>
 <button onClick={() => setShowRiderRateSettings(true)} className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
 <Settings size={14} /> Settings
 </button>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setShowRiderServiceRate(false)}
 className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
 >
 Cancel
 </button>
 <button 
 onClick={async () => {
 setIsSavingRiderRate(true);
 try {
 if (!specificSelectedRider) throw new Error("Select a rider first");
 
 let error;
 const ratesToSave = specificRiderRates;

 // Fetch the rider's cluster_id from the riders table
 const { data: riderData } = await supabase.from('riders').select('cluster_id').eq('id', specificSelectedRider).limit(1).single();
 const actualClusterId = riderData?.cluster_id || adminProfileId;

 const { data: existingRider } = await supabase.from('rider_service_rates').select('id').eq('rider_id', specificSelectedRider).limit(1).single();
 
 if (existingRider) {
 const res = await supabase.from('rider_service_rates').update({
 rank: activeRateRank,
 pickup_rate: ratesToSave.pickup,
 delivery_rate: ratesToSave.delivery,
 
 tag: activeRateRank,
 cluster_id: actualClusterId
 }).eq('id', existingRider.id);
 error = res.error;
 } else {
 const res = await supabase.from('rider_service_rates').insert({
 rider_id: specificSelectedRider,
 rank: activeRateRank,
 pickup_rate: ratesToSave.pickup,
 delivery_rate: ratesToSave.delivery,
 
 tag: activeRateRank,
 cluster_id: actualClusterId
 });
 error = res.error;
 }
 
 if (error) {
 if (error.code === '42P01') {
 alert('Table "rider_service_rates" does not exist yet. Please run the SQL in your Supabase editor.');
 } else throw error;
 }
 } catch (e: any) {
 alert('Error: ' + e.message);
 } finally {
 setIsSavingRiderRate(false);
 // Re-fetch lists to update counts
 const { data: ratesData } = await supabase.from('rider_service_rates').select('rider_id, rank');
 if (ratesData) {
 const premiumIds = new Set((ratesData || []).filter(r => r.rank === 'Premium').map(r => r.rider_id));
 const ultraIds = new Set((ratesData || []).filter(r => r.rank === 'Ultra').map(r => r.rider_id));
 const premium = []; const ultra = []; const regular = [];
 allRiders.forEach(r => {
 if (premiumIds.has(r.id)) premium.push(r);
 else if (ultraIds.has(r.id)) ultra.push(r);
 else regular.push(r);
 });
 setRiderRateListData({ regular, premium, ultra });
 }
 }
 }}
 disabled={isSavingRiderRate || !specificSelectedRider}
 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 w-[110px] ${isSavingRiderRate ? 'bg-emerald-600 opacity-50 shadow-none cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'}`}
 >
 {isSavingRiderRate ? (
 <span className="flex gap-1 items-center justify-center">
 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
 </span>
 ) : (
 'Save Rates'
 )}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Section for Other Tabs: User Activity */}
 {activeTab === 'User Activity' && (
 <div className="w-full flex flex-col gap-4 sm:gap-5">
 <AdminLiveShipmentCard clusterId={adminProfileId || undefined} />
 <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-xs mt-2">
 <button onClick={() => setShowTrackAllModal(true)} className="py-2.5 border border-black rounded-none bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors text-center w-full">
 Track All
 </button>
 </div>
 </div>
 )}

 {showTrackAllModal && (
  <div className="fixed inset-0 h-[100dvh] z-[100] bg-white flex flex-col animate-in fade-in duration-200">
    {/* Pinned top search & 3 category chips: User, Shipments, Other - ALWAYS visible and never hidden */}
    <div className="shrink-0 bg-white border-b border-gray-200 p-4 pb-3 flex flex-col gap-3 w-full max-w-md mx-auto z-30">
      <div className="flex items-center gap-2 w-full">
        <input 
          type="text" 
          placeholder={trackInvalidMsg ? trackInvalidMsg : "SEARCH..."} 
          value={trackInvalidMsg ? trackInvalidMsg : trackSearchTerm}
          onChange={(e) => {
            if (trackInvalidMsg) setTrackInvalidMsg('');
            setTrackSearchTerm(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTrackSearch();
          }}
          className={'w-0 flex-1 py-2 px-3 border border-black rounded-none bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black uppercase tracking-wider text-sm font-bold min-w-0 ' + (trackInvalidMsg ? 'text-red-600 font-normal placeholder:text-red-600' : 'text-black')}
        />
        <button 
          type="button"
          onClick={handleTrackSearch}
          className="px-3 py-2 border border-black rounded-none bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
        >
          Track
        </button>
        <button 
          type="button"
          onClick={() => {
            setShowTrackAllModal(false);
            setTrackSearchTerm('');
            setTrackResults([]);
            setTrackInvalidMsg('');
          }} 
          className="p-2 border border-black rounded-none bg-white text-black hover:bg-black hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Pinned 3 Chips */}
      <div className="flex flex-nowrap gap-2 w-full overflow-x-auto no-scrollbar pb-0.5">
        {(['User', 'Shipments', 'Other'] as const).map(cat => (
          <button 
            key={cat}
            type="button"
            onClick={() => setActiveTrackCategory(cat)}
            className={'flex-1 py-2 border border-black rounded-none uppercase tracking-widest text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ' + (activeTrackCategory === cat ? 'bg-black text-white shadow-xs' : 'bg-white text-black hover:bg-black hover:text-white')}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>

    {/* Scrollable results area */}
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      <div className="w-full max-w-md mx-auto space-y-4">
        {isTracking ? (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 py-10 animate-pulse">
            Scanning...
          </div>
        ) : trackSearchTerm.trim().length >= 2 && trackResults.length === 0 ? (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 py-10">
            No Details Found
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

 {/* Section for Other Tabs: Payments */}
 {activeTab === 'Payments' && (
 <div className="w-full flex flex-col gap-4 sm:gap-5 pb-4">
 <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
 <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
 <IndianRupee size={16} className="text-blue-600" />
 Cash Holders
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div onClick={() => { fetchCashWithRiders(); setShowCashRidersModal(true); }} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Cash with Riders</span>
 <span className="text-2xl truncate font-bold text-blue-600">{totalCashWithRiders === null ? (
 <span className="flex items-center gap-1 text-sm font-medium text-slate-500 h-6">
 Calculating
 <span className="flex items-center gap-0.5 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </span>
 ) : (
 `₹ ${totalCashWithRiders.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
 )}</span>
 </div>
 <div onClick={() => setShowCashHubManagersModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Cash with Hub Managers</span>
 <span className="text-2xl truncate font-bold text-blue-600">{totalCashWithHubManagers === null ? (
 <span className="flex items-center gap-1 text-sm font-medium text-slate-500 h-6">
 Calculating
 <span className="flex items-center gap-0.5 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </span>
 ) : (
 `₹ ${totalCashWithHubManagers.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
 )}</span>
 </div>
 </div>
 </div>

 <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
 <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
 <CreditCard size={16} className="text-emerald-600" />
 Payables
 </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div onClick={() => { fetchClusterCustomerPayableAmount(); setShowCustomerPayableModal(true); }} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Customer Payable Amount</span>
                <span className="text-2xl truncate font-bold text-emerald-600">₹ {displayCustomerPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div onClick={() => { fetchClusterSellerPayableAmount(); setShowSellerPayableModal(true); }} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Seller Payable Amount</span>
                <span className="text-2xl truncate font-bold text-emerald-600">₹ {displaySellerPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div onClick={() => setShowRiderPayableModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Rider Payable Amount</span>
                <span className="text-2xl truncate font-bold text-emerald-600">₹ {displayRiderPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div onClick={() => { fetchHmPayableAmount(); setShowHmPayableModal(true); }} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Hub Manager Payable Amount</span>
                <span className="text-2xl truncate font-bold text-emerald-600">₹ {displayHmPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
 </div>
 </div>
 )}

 {/* Section for Other Tabs: Message & Approval */}
 {activeTab === 'Message & Approval' && (
 <div className="w-full min-h-full flex flex-col gap-4 max-h-[calc(100vh-140px)] overflow-y-auto pb-4">
 <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-3 shrink-0">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <MessageSquare size={16} className="text-blue-600" />
 Chat Messages
 </h3>
 <div className="grid grid-cols-2 gap-3">
 <button onClick={() => setShowRoleChatModal({isOpen: true, table: "chat_for_customers", title: "Customer Message"})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-blue-300 hover:bg-blue-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Customer Message</button>
 <button onClick={() => setShowRoleChatModal({isOpen: true, table: "chat_for_sellers", title: "Seller Message"})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-purple-300 hover:bg-purple-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Seller Message</button>
 <button onClick={() => setShowRoleChatModal({isOpen: true, table: "chat_for_riders", title: "Rider Message"})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-emerald-300 hover:bg-emerald-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Rider Message</button>
 <button onClick={() => setShowRoleChatModal({isOpen: true, table: "chat_for_hub_managers", title: "Hub Manager Message"})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-orange-300 hover:bg-orange-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Hub Manager Message</button>
 </div>
 </div>

 <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-3 shrink-0">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <CheckCircle size={16} className="text-amber-600" />
 Announcement & Updates
 </h3>
 <div className="grid grid-cols-2 gap-3">
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'customer_update', title: 'Customer Update'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-blue-300 hover:bg-blue-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Customer Update</button>
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'seller_update', title: 'Seller Update'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-purple-300 hover:bg-purple-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Seller Update</button>
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'rider_update', title: 'Rider Update'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-emerald-300 hover:bg-emerald-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Rider Update</button>
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'hub_manager_update', title: 'Hub Manager Update'})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-orange-300 hover:bg-orange-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Hub Manager Update</button>
 </div>
 </div>
 
 <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-[250px] flex flex-col shrink-0">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <CheckCircle size={16} className="text-slate-800" />
 Approvals
 </h3>
 <button onClick={() => setShowFullApprovals(true)} className="text-blue-600 text-xs font-bold hover:underline cursor-pointer">View all</button>
 </div>
 <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3">
 {pendingApprovals.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50 min-h-[100px]">
 <p className="text-sm font-medium text-slate-400">No approval requests pending</p>
 </div>
 ) : (
 pendingApprovals.map(req => {
 const isSeller = req.type === 'Seller';
 const name = isSeller ? (req.seller_name || 'No Name') : (req.rider_name || 'No Name');
 const phone = req.registered_mobile_number || '';
 const secondaryInfo = isSeller ? `Shop: ${req.shop_name || 'N/A'}` : `Cluster: ${req.cluster_id || 'N/A'}`;
 const themeColor = isSeller ? 'text-orange-500' : 'text-emerald-500';

 return (
 <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex flex-col gap-2">
 <div className="flex items-start justify-between gap-3">
 <div className="flex flex-col gap-1.5 min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start">{req.id}</span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSeller ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
 {req.type}
 </span>
 </div>
 <div className="min-w-0 flex items-center gap-2 flex-wrap mt-0.5">
 <span className="text-[13px] font-semibold text-slate-900 truncate">{name}</span>
 {phone && (
 <span className="flex items-center gap-1 font-medium text-slate-600 text-[11px]">
 <Phone size={10} className={themeColor} />
 {phone}
 </span>
 )}
 {secondaryInfo && (
 <span className="flex items-center gap-1 truncate text-slate-400 text-[10px]">
 • {secondaryInfo}
 </span>
 )}
 </div>
 </div>
 </div>
 <div className="flex gap-2 mt-2">
 <button 
 onClick={() => handleApproveRequest(req)} 
 disabled={processingAction.id === req.id}
 className={`flex-1 py-1.5 border hover:bg-emerald-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center ${processingAction.id === req.id && processingAction.action === 'approve' ? 'bg-emerald-100 text-emerald-700 border-emerald-300 opacity-90' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}
 >
 {processingAction.id === req.id && processingAction.action === 'approve' ? 
 <span className="flex items-center">Wait<span className="loading-ellipsis"></span></span> : 
 "Approve"
 }
 </button>
 <button 
 onClick={() => handleViewRequest(req)} 
 disabled={processingAction.id === req.id}
 className="flex-1 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
 >
 View
 </button>
 <button 
 onClick={() => handleRejectRequest(req)} 
 disabled={processingAction.id === req.id}
 className={`flex-1 py-1.5 border hover:bg-red-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center ${processingAction.id === req.id && processingAction.action === 'reject' ? 'bg-red-100 text-red-700 border-red-300 opacity-90' : 'bg-red-50 text-red-600 border-red-200'}`}
 >
 {processingAction.id === req.id && processingAction.action === 'reject' ? 
 <span className="flex items-center">Wait<span className="loading-ellipsis"></span></span> : 
 "Reject"
 }
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 </div>
 )}
 </main>

 {showFullApprovals && (
 <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center">
 <CheckCircle size={16} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">All Approvals</h3>
 <p className="text-[10px] text-slate-500">Manage all pending requests</p>
 </div>
 </div>
 <button onClick={() => setShowFullApprovals(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><X size={16} /></button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-3">
 {pendingApprovals.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center">
 <p className="text-sm font-medium text-slate-400">No approval requests pending</p>
 </div>
 ) : (
 pendingApprovals.map(req => {
 const isSeller = req.type === 'Seller';
 const name = isSeller ? (req.seller_name || 'No Name') : (req.rider_name || 'No Name');
 const phone = req.registered_mobile_number || '';
 const secondaryInfo = isSeller ? `Shop: ${req.shop_name || 'N/A'}` : `Cluster: ${req.cluster_id || 'N/A'}`;
 const themeColor = isSeller ? 'text-orange-500' : 'text-emerald-500';

 return (
 <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex flex-col gap-2">
 <div className="flex items-start justify-between gap-3">
 <div className="flex flex-col gap-1.5 min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start">{req.id}</span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSeller ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
 {req.type}
 </span>
 </div>
 <div className="min-w-0 flex items-center gap-2 flex-wrap mt-0.5">
 <span className="text-[13px] font-semibold text-slate-900 truncate">{name}</span>
 {phone && (
 <span className="flex items-center gap-1 font-medium text-slate-600 text-[11px]">
 <Phone size={10} className={themeColor} />
 {phone}
 </span>
 )}
 {secondaryInfo && (
 <span className="flex items-center gap-1 truncate text-slate-400 text-[10px]">
 • {secondaryInfo}
 </span>
 )}
 </div>
 </div>
 </div>
 <div className="flex gap-2 mt-2">
 <button 
 onClick={() => handleApproveRequest(req)} 
 disabled={processingAction.id === req.id}
 className={`flex-1 py-1.5 border hover:bg-emerald-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center ${processingAction.id === req.id && processingAction.action === 'approve' ? 'bg-emerald-100 text-emerald-700 border-emerald-300 opacity-90' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}
 >
 {processingAction.id === req.id && processingAction.action === 'approve' ? 
 <span className="flex items-center">Wait<span className="loading-ellipsis"></span></span> : 
 "Approve"
 }
 </button>
 <button 
 onClick={() => handleViewRequest(req)} 
 disabled={processingAction.id === req.id}
 className="flex-1 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
 >
 View
 </button>
 <button 
 onClick={() => handleRejectRequest(req)} 
 disabled={processingAction.id === req.id}
 className={`flex-1 py-1.5 border hover:bg-red-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center ${processingAction.id === req.id && processingAction.action === 'reject' ? 'bg-red-100 text-red-700 border-red-300 opacity-90' : 'bg-red-50 text-red-600 border-red-200'}`}
 >
 {processingAction.id === req.id && processingAction.action === 'reject' ? 
 <span className="flex items-center">Wait<span className="loading-ellipsis"></span></span> : 
 "Reject"
 }
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 )}

 
 {/* Full Page Seller List Modal */}
 {showVisualList && (
 <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/50">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
 <List size={16} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">Seller Service Visibility List</h3>
 <p className="text-[10px] text-slate-500">Overview of all sellers</p>
 </div>
 </div>
 <button onClick={() => setShowVisualList(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><X size={16} /></button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
 <div className="flex gap-4 h-full">
 <div className="flex-1 flex flex-col bg-white border border-emerald-100 rounded-xl shadow-sm overflow-hidden">
 <h4 className="text-xs font-bold text-emerald-600 uppercase p-3 border-b border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
 Show <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{allSellers.filter(s => s.upload_service_visible === true).length}</span>
 </h4>
 <ul className="text-xs text-slate-600 space-y-1 p-2 overflow-y-auto flex-1">
 {allSellers.filter(s => s.upload_service_visible === true).map(s => (
 <li key={s.id} className="truncate p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors" title={s.id}>{s.shop_name || s.seller_name}</li>
 ))}
 </ul>
 </div>
 <div className="flex-1 flex flex-col bg-white border border-rose-100 rounded-xl shadow-sm overflow-hidden">
 <h4 className="text-xs font-bold text-rose-600 uppercase p-3 border-b border-rose-50 bg-rose-50/30 flex items-center justify-between">
 Hide <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{allSellers.filter(s => s.upload_service_visible !== true).length}</span>
 </h4>
 <ul className="text-xs text-slate-600 space-y-1 p-2 overflow-y-auto flex-1">
 {allSellers.filter(s => s.upload_service_visible !== true).map(s => (
 <li key={s.id} className="truncate p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors" title={s.id}>{s.shop_name || s.seller_name}</li>
 ))}
 </ul>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 
 {/* Rider Rate Settings Modal */}
 {showRiderRateSettings && (
 <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-md flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
 <Settings size={16} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">Rider Rate Settings</h3>
 <p className="text-[10px] text-slate-500">Global calculation rules for rider earnings</p>
 </div>
 </div>
 <button 
 onClick={() => setShowRiderRateSettings(false)}
 className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
 >
 <X size={16} />
 </button>
 </div>

 <div className="p-4 flex-1 overflow-y-auto space-y-5 bg-white">
 {/* Setting 1 */}
 <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden bg-slate-50">
 <div className="flex items-start justify-between gap-3 relative z-10">
 <div className="flex-1">
 <h4 className="text-sm font-bold text-slate-800">Multiple Quantity Half Rate</h4>
 <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
 If an order contains multiple quantities (e.g., 4 items), the rider receives the <strong>full rate</strong> for the 1st item, and exactly <strong>half rate</strong> for the remaining items.
 </p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
 <input 
 type="checkbox" 
 className="sr-only peer"
 checked={riderSettingMultipleQtyHalfRate}
 onChange={() => setRiderSettingMultipleQtyHalfRate(!riderSettingMultipleQtyHalfRate)}
 />
 <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
 </label>
 </div>
 </div>

 {/* Setting 2 */}
 <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden bg-slate-50">
 <div className="flex items-start justify-between gap-3 relative z-10">
 <div className="flex-1">
 <h4 className="text-sm font-bold text-slate-800">Performance-based Proportional Rate</h4>
 <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
 Earnings scale based on performance. E.g., for a ₹15 rate:<br/>
 • Performance <strong>≤ 60%</strong> = flat ₹11.<br/>
 • Performance <strong>&gt; 60% up to 100%</strong> = proportional scale between ₹11 and ₹15.
 </p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
 <input 
 type="checkbox" 
 className="sr-only peer"
 checked={riderSettingPerformanceBasedRate}
 onChange={() => setRiderSettingPerformanceBasedRate(!riderSettingPerformanceBasedRate)}
 />
 <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
 </label>
 </div>
 </div>
 </div>
 
 <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
 <button 
 disabled={isSavingRiderRateSettings}
 onClick={async () => {
 if (!adminProfileId) return;
 setIsSavingRiderRateSettings(true);
 try {
 const { data } = await supabase.from('rider_rate_setting_with_cluster').select('id').eq('cluster id', adminProfileId).limit(1).maybeSingle();
 if (data?.id) {
 const { error } = await supabase.from('rider_rate_setting_with_cluster').update({
 'multiple quantity half rate': riderSettingMultipleQtyHalfRate,
 'performance based proportional rate': riderSettingPerformanceBasedRate
 }).eq('id', data.id);
 if (error) throw error;
 } else {
 const { error } = await supabase.from('rider_rate_setting_with_cluster').insert({
 'cluster id': adminProfileId,
 'multiple quantity half rate': riderSettingMultipleQtyHalfRate,
 'performance based proportional rate': riderSettingPerformanceBasedRate
 });
 if (error) throw error;
 }
 setShowRiderRateSettings(false);
 } catch (e) {
 console.error(e);
 alert(e.message || JSON.stringify(e));
 } finally {
 setIsSavingRiderRateSettings(false);
 }
 }}
 className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center min-w-[80px]"
 >
 {isSavingRiderRateSettings ? (
 <div className="flex gap-1.5 items-center justify-center">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
 </div>
 ) : (
 "Done"
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Full Page Rider List Modal */}
 {showRiderRateList && (
 <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/50">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <List size={16} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">Rider Rate Ranks List</h3>
 <p className="text-[10px] text-slate-500">Overview of all riders categorized by rank</p>
 </div>
 </div>
 <button onClick={() => setShowRiderRateList(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><X size={16} /></button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
 <div className="flex gap-4 h-full">
 <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 <h4 className="text-[11px] font-bold text-slate-600 uppercase p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
 Regular <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{riderRateListData.regular.length}</span>
 </h4>
 <ul className="text-xs text-slate-600 space-y-1 p-2 overflow-y-auto flex-1">
 {riderRateListData.regular.map(r => (
 <li key={r.id} className="truncate p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors" title={r.id}>{r.rider_name || 'Rider'}</li>
 ))}
 </ul>
 </div>
 <div className="flex-1 flex flex-col bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
 <h4 className="text-[11px] font-bold text-blue-600 uppercase p-3 border-b border-blue-50 bg-blue-50/30 flex items-center justify-between">
 Premium <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{riderRateListData.premium.length}</span>
 </h4>
 <ul className="text-xs text-slate-600 space-y-1 p-2 overflow-y-auto flex-1">
 {riderRateListData.premium.map(r => (
 <li key={r.id} className="truncate p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors" title={r.id}>{r.rider_name || 'Rider'}</li>
 ))}
 </ul>
 </div>
 <div className="flex-1 flex flex-col bg-white border border-amber-100 rounded-xl shadow-sm overflow-hidden">
 <h4 className="text-[11px] font-bold text-amber-600 uppercase p-3 border-b border-amber-50 bg-amber-50/30 flex items-center justify-between">
 Ultra <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{riderRateListData.ultra.length}</span>
 </h4>
 <ul className="text-xs text-slate-600 space-y-1 p-2 overflow-y-auto flex-1">
 {riderRateListData.ultra.map(r => (
 <li key={r.id} className="truncate p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors" title={r.id}>{r.rider_name || 'Rider'}</li>
 ))}
 </ul>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 {/* Bottom Nav - Refined colorful active indicators */}
 <nav className={"fixed bottom-0 w-full z-40 bg-white border-t border-slate-200 shrink-0 shadow-xs transition-transform duration-300 ease-in-out " + (scrollDir === "down" ? "translate-y-full" : "translate-y-0")}>
 <div className="flex justify-around items-center h-14 sm:h-16 max-w-md mx-auto px-2">
 {tabs.map((tab) => {
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex flex-col items-center justify-center w-full h-full py-0.5 transition-all cursor-pointer ${
 isActive ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
 }`}
 >
 <div className={`p-1 rounded-md transition-colors ${isActive ? 'bg-slate-100 text-slate-900' : ''}`}>
 <tab.icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
 </div>
 <span className="text-[9.5px] sm:text-[10px] tracking-tight leading-none mt-0.5">{tab.label}</span>
 </button>
 );
 })}
 </div>
 </nav>
 {showSecureTransactionModal && (
        <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-100 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSecureTransactionModal(null)} 
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title="Go Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">Secure Transaction Setting</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Configure settlement policies & payment preferences</p>
                </div>
              </div>
              <button
                onClick={handleSaveSecureSettings}
                className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {secureSaveSuccess ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Saved</span>
                  </>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </header>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-xl mx-auto flex flex-col gap-5 pb-16">
              {/* Payment Category */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">Payment Category</h3>
                  <span className="text-[10px] font-medium text-slate-500">Choose primary payout method</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType('UPI ID')}
                    className={`py-3 px-4 border border-black rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedPaymentType === 'UPI ID'
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-white text-black hover:bg-slate-50'
                    }`}
                  >
                    {selectedPaymentType === 'UPI ID' && <Check size={16} className="text-emerald-400" />}
                    <span>UPI ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType('Bank Account')}
                    className={`py-3 px-4 border border-black rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedPaymentType === 'Bank Account'
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-white text-black hover:bg-slate-50'
                    }`}
                  >
                    {selectedPaymentType === 'Bank Account' && <Check size={16} className="text-emerald-400" />}
                    <span>Bank Account</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Select Payment Method */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">Select Payment Method</h3>
                  <span className="text-[11px] font-semibold text-slate-500">{paymentMethodsList.length} Methods Available</span>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  {paymentMethodsList.map(method => {
                    const isSelected = selectedPaymentMethods.includes(method.id);
                    return (
                      <div 
                        key={method.id} 
                        onClick={() => setSelectedPaymentMethods([method.id])} 
                        className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-black bg-slate-50 shadow-xs' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex flex-col pr-3 min-w-0 flex-1">
                          <span className={`text-sm font-bold truncate ${isSelected ? 'text-black' : 'text-slate-800'}`}>
                            {method.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 truncate mt-0.5" title={method.link}>
                            {method.link}
                          </span>
                        </div>
                        <div className={`w-5 h-5 shrink-0 border-2 rounded-full flex items-center justify-center transition-colors ${
                          isSelected ? 'border-black bg-black' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Add Payment Method Sub-form */}
                <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Add New Payment Method</span>
                  <input 
                    type="text" 
                    placeholder="Method Name (e.g. Kotak Mahindra, PhonePe, Google Pay)" 
                    value={newMethodName} 
                    onChange={(e) => handleMethodNameChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-black transition-colors"
                  />
                  <input 
                    type="text" 
                    placeholder="Deep Link (e.g. upi://pay?...)" 
                    value={newMethodLink} 
                    onChange={(e) => setNewMethodLink(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-black transition-colors"
                  />
                  <button 
                    onClick={handleAddPaymentMethod} 
                    disabled={!newMethodName.trim() || !newMethodLink.trim()} 
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Add Payment Method
                  </button>
                </div>
              </div>

              {/* Bottom Action: Save Changes */}
              <div className="pt-1 pb-10 flex flex-col gap-2">
                <button 
                  onClick={handleSaveSecureSettings} 
                  className="w-full py-3.5 bg-black hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {secureSaveSuccess ? (
                    <>
                      <Check size={18} className="text-emerald-400" />
                      <span className="text-emerald-400">Settings Saved to Device!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-500 font-medium">
                  All settings are saved directly to this device and persist across logins & logouts.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
  {previewImage && (
 <div className="fixed inset-0 z-[100] bg-black/100 flex flex-col items-center justify-center" onClick={() => setPreviewImage(null)}>
 <img src={previewImage} alt="Avatar Fullscreen" className="w-full h-full object-contain" onClick={(e) => e.stopPropagation()} />
 </div>
 )}
 
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
 {pendingDepositsListCluster.length === 0 ? (
 <div className="text-center text-slate-500 text-sm py-8">No pending deposits found.</div>
 ) : (
 pendingDepositsListCluster.map((dep, idx) => (
 <div key={dep.id || idx} className="text-xs text-slate-600 bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex flex-col gap-1">
 <div className="font-semibold text-slate-800">{dep['cash payment status']}</div>
 <div className="text-emerald-600 font-bold mt-1 text-sm">Amount: ₹ {dep['total cash payment']}</div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}

 {showCashRidersModal && (
 <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 Total Cash with Riders
 </h3>
 <button onClick={() => setShowCashRidersModal(false)} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-3">
 {cashRidersList.length === 0 ? (
 <div className="text-center text-slate-500 text-sm py-8">No riders found with cash.</div>
 ) : (
 cashRidersList.map(rider => (
 <div key={rider.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-1 shadow-sm">
 <div className="flex justify-between items-start">
 <span className="font-bold text-slate-800 text-sm">{rider.rider_name || 'Unknown'}</span>
 <span className="font-black text-emerald-600 text-base">₹ {rider.cash}</span>
 </div>
 <div className="text-xs text-slate-500 font-medium">ID: {rider.id?.substring(0, 8)}</div>
 <div className="text-xs text-slate-500 font-medium">Mob: {rider.registered_mobile_number || 'N/A'}</div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}

 
 
 {showHmPayableModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Hub Manager Payable Details
              </h3>
              <button onClick={() => setShowHmPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Hub Manager"
              items={filteredHmPayableList}
              count={filteredHmPayableList.length}
              searchQuery={hmPayableSearch}
              onSearchChange={setHmPayableSearch}
              defaultPurpose="Hub Manager Salary"
              onMarkAllSettled={() => handleMarkAllSettledForType('Hub Manager')}
              isSettlingAll={settlingAllUserType === 'Hub Manager'}
              settlingProgress={settlingAllUserType === 'Hub Manager' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredHmPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No hub managers found with payable amounts.</div>
              ) : (
                filteredHmPayableList.map(hm => (
                  <div key={hm.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="truncate">{hm.hub_manager_name}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{hm.short_id}</span>
                      </span>
                      <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Total Amount: ₹ {(hm.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-bold text-red-500">Penalty Amount: -₹ {(hm.penaltyAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        <span className="text-xs font-black text-emerald-600 mt-1">Total Payable Amount: ₹ {(hm.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 font-medium grid grid-cols-2 gap-2 mb-1">
                      <span><span className="text-slate-400">Hub:</span> {hm.hub_name}</span>
                      <span><span className="text-slate-400">Mob:</span> {hm.mobile}</span>
                    </div>
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex flex-row justify-between gap-4 text-xs mt-1">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Details</p>
                        <p className="font-semibold text-slate-700">{hm.bank_name}</p>
                        <p className="text-slate-600">A/C: <span className="font-medium">{hm.account_no}</span></p>
                        <p className="text-slate-600">IFSC: <span className="font-medium">{hm.ifsc_code}</span></p>
                      </div>
                      <div className="flex-1 border-l border-slate-200 pl-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">UPI Details</p>
                        <p className="font-semibold text-slate-700 break-all">{hm.upi_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => { if (paymentStates[hm.id]?.status !== 'hold' && paymentStates[hm.id]?.status !== 'settled') handlePayNow(hm.id); }}
                        disabled={paymentStates[hm.id]?.status === 'hold' || paymentStates[hm.id]?.status === 'settled'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[hm.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-blue-300 text-blue-400 bg-slate-50'
                            : paymentStates[hm.id]?.status === 'settled'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                        }`}
                      >
                        Pay Now
                      </button>
                      <button
                        onClick={() => handleHoldAmount(hm.id)}
                        disabled={paymentStates[hm.id]?.status === 'settled' || paymentStates[hm.id]?.status === 'success'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[hm.id]?.status === 'settled' || paymentStates[hm.id]?.status === 'success'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : paymentStates[hm.id]?.status === 'hold'
                            ? 'border-2 border-yellow-400 bg-yellow-50 text-yellow-800 shadow-xs ring-2 ring-yellow-400/40 cursor-pointer font-black'
                            : 'border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[hm.id]?.status === 'hold' ? 'On Hold' : 'Hold Amount'}
                      </button>
                      <button
                        onClick={() => { if (paymentStates[hm.id]?.status !== 'hold') handleMarkAsSettled(hm.id); }}
                        disabled={paymentStates[hm.id]?.status === 'settled' || paymentStates[hm.id]?.status === 'hold'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[hm.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-emerald-300 text-emerald-400 bg-slate-50'
                            : paymentStates[hm.id]?.status === 'settled'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600 cursor-default'
                            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[hm.id]?.status === 'settled' ? 'Settled' : 'Mark as Settled'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showRiderPayableModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Rider Payable Details
              </h3>
              <button onClick={() => setShowRiderPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Rider"
              items={filteredRiderPayableList}
              count={filteredRiderPayableList.length}
              searchQuery={riderPayableSearch}
              onSearchChange={setRiderPayableSearch}
              defaultPurpose="Rider Salary / Payout"
              onMarkAllSettled={() => handleMarkAllSettledForType('Rider')}
              isSettlingAll={settlingAllUserType === 'Rider'}
              settlingProgress={settlingAllUserType === 'Rider' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredRiderPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No riders found with payable amounts.</div>
              ) : (
                filteredRiderPayableList.map(rider => (
                  <div key={rider.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="truncate">{rider.rider_name}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{rider.short_id}</span>
                      </span>
                      <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Total Amount: ₹ {(rider.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-bold text-red-500">Penalty Amount: -₹ {(rider.penaltyAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        <span className="text-xs font-black text-emerald-600 mt-1">Total Payable Amount: ₹ {(rider.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 font-medium grid grid-cols-2 gap-2 mb-1">
                      <span><span className="text-slate-400">Mob:</span> {rider.mobile}</span>
                    </div>
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex flex-row justify-between gap-4 text-xs mt-1">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Details</p>
                        <p className="font-semibold text-slate-700">{rider.bank_name}</p>
                        <p className="text-slate-600">A/C: <span className="font-medium">{rider.account_no}</span></p>
                        <p className="text-slate-600">IFSC: <span className="font-medium">{rider.ifsc_code}</span></p>
                      </div>
                      <div className="flex-1 border-l border-slate-200 pl-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">UPI Details</p>
                        <p className="font-semibold text-slate-700 break-all">{rider.upi_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => { if (paymentStates[rider.id]?.status !== 'hold' && paymentStates[rider.id]?.status !== 'settled') handlePayNow(rider.id); }}
                        disabled={paymentStates[rider.id]?.status === 'hold' || paymentStates[rider.id]?.status === 'settled'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[rider.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-blue-300 text-blue-400 bg-slate-50'
                            : paymentStates[rider.id]?.status === 'settled'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                        }`}
                      >
                        Pay Now
                      </button>
                      <button
                        onClick={() => handleHoldAmount(rider.id)}
                        disabled={paymentStates[rider.id]?.status === 'settled' || paymentStates[rider.id]?.status === 'success'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[rider.id]?.status === 'settled' || paymentStates[rider.id]?.status === 'success'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : paymentStates[rider.id]?.status === 'hold'
                            ? 'border-2 border-yellow-400 bg-yellow-50 text-yellow-800 shadow-xs ring-2 ring-yellow-400/40 cursor-pointer font-black'
                            : 'border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[rider.id]?.status === 'hold' ? 'On Hold' : 'Hold Amount'}
                      </button>
                      <button
                        onClick={() => { if (paymentStates[rider.id]?.status !== 'hold') handleMarkAsSettled(rider.id); }}
                        disabled={paymentStates[rider.id]?.status === 'settled' || paymentStates[rider.id]?.status === 'hold'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[rider.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-emerald-300 text-emerald-400 bg-slate-50'
                            : paymentStates[rider.id]?.status === 'settled'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600 cursor-default'
                            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[rider.id]?.status === 'settled' ? 'Settled' : 'Mark as Settled'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showCustomerPayableModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Customer Refund & Payable Details
              </h3>
              <button onClick={() => setShowCustomerPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Customer"
              items={filteredCustomerPayableList}
              count={filteredCustomerPayableList.length}
              searchQuery={customerPayableSearch}
              onSearchChange={setCustomerPayableSearch}
              defaultPurpose="Customer Refund"
              onMarkAllSettled={() => handleMarkAllSettledForType('Customer')}
              isSettlingAll={settlingAllUserType === 'Customer'}
              settlingProgress={settlingAllUserType === 'Customer' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredCustomerPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No customers found with payable refund amounts.</div>
              ) : (
                filteredCustomerPayableList.map(cust => (
                  <div key={cust.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="truncate">{cust.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{cust.short_id}</span>
                      </span>
                      <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                        <span className="text-xs font-black text-emerald-600">Total Refund: ₹ {(cust.sum || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 font-medium flex flex-wrap gap-x-4 gap-y-1 mb-1">
                      <span><span className="text-slate-400">Mob:</span> {cust.mobile}</span>
                      {cust.total_selling_price ? <span><span className="text-slate-400">Selling Price:</span> ₹{cust.total_selling_price}</span> : null}
                      {cust.total_amount ? <span><span className="text-slate-400">Total Order:</span> ₹{cust.total_amount}</span> : null}
                    </div>
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex flex-row justify-between gap-4 text-xs mt-1">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Details</p>
                        <p className="font-semibold text-slate-700">{cust.bank_name}</p>
                        <p className="text-slate-600">A/C: <span className="font-medium">{cust.account_no}</span></p>
                        <p className="text-slate-600">IFSC: <span className="font-medium">{cust.ifsc_code}</span></p>
                      </div>
                      <div className="flex-1 border-l border-slate-200 pl-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">UPI Details</p>
                        <p className="font-semibold text-slate-700 break-all">{cust.upi_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => { if (paymentStates[cust.id]?.status !== 'hold' && paymentStates[cust.id]?.status !== 'settled') handlePayNow(cust.id); }}
                        disabled={paymentStates[cust.id]?.status === 'hold' || paymentStates[cust.id]?.status === 'settled'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[cust.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-blue-300 text-blue-400 bg-slate-50'
                            : paymentStates[cust.id]?.status === 'settled'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                        }`}
                      >
                        Pay Now
                      </button>
                      <button
                        onClick={() => handleHoldAmount(cust.id)}
                        disabled={paymentStates[cust.id]?.status === 'settled' || paymentStates[cust.id]?.status === 'success'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[cust.id]?.status === 'settled' || paymentStates[cust.id]?.status === 'success'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : paymentStates[cust.id]?.status === 'hold'
                            ? 'border-2 border-yellow-400 bg-yellow-50 text-yellow-800 shadow-xs ring-2 ring-yellow-400/40 cursor-pointer font-black'
                            : 'border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[cust.id]?.status === 'hold' ? 'On Hold' : 'Hold Amount'}
                      </button>
                      <button
                        onClick={() => { if (paymentStates[cust.id]?.status !== 'hold') handleMarkAsSettled(cust.id); }}
                        disabled={paymentStates[cust.id]?.status === 'settled' || paymentStates[cust.id]?.status === 'hold'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[cust.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-emerald-300 text-emerald-400 bg-slate-50'
                            : paymentStates[cust.id]?.status === 'settled'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600 cursor-default'
                            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[cust.id]?.status === 'settled' ? 'Settled' : 'Mark as Settled'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSellerPayableModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Seller Payable Details
              </h3>
              <button onClick={() => setShowSellerPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Seller"
              items={filteredSellerPayableList}
              count={filteredSellerPayableList.length}
              searchQuery={sellerPayableSearch}
              onSearchChange={setSellerPayableSearch}
              defaultPurpose="Seller Settlement / Payout"
              onMarkAllSettled={() => handleMarkAllSettledForType('Seller')}
              isSettlingAll={settlingAllUserType === 'Seller'}
              settlingProgress={settlingAllUserType === 'Seller' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredSellerPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No sellers found with payable amounts.</div>
              ) : (
                filteredSellerPayableList.map(seller => (
                  <div key={seller.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="truncate">{seller.seller_name || seller.shop_name}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{seller.short_id}</span>
                      </span>
                      <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                        <span className="text-xs font-black text-emerald-600">Total Payable: ₹ {(seller.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-600 font-medium grid grid-cols-2 gap-2 mb-1">
                      <span><span className="text-slate-400">Shop Name:</span> {seller.shop_name}</span>
                      <span><span className="text-slate-400">Mob:</span> {seller.mobile}</span>
                    </div>
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex flex-row justify-between gap-4 text-xs mt-1">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Details</p>
                        <p className="font-semibold text-slate-700">{seller.bank_name || 'N/A'}</p>
                        <p className="text-slate-600">A/C: <span className="font-medium">{seller.account_no || 'N/A'}</span></p>
                        <p className="text-slate-600">IFSC: <span className="font-medium">{seller.ifsc_code || 'N/A'}</span></p>
                      </div>
                      <div className="flex-1 border-l border-slate-200 pl-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">UPI Details</p>
                        <p className="font-semibold text-slate-700 break-all">{seller.upi_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => { if (paymentStates[seller.id]?.status !== 'hold' && paymentStates[seller.id]?.status !== 'settled') handlePayNow(seller.id); }}
                        disabled={paymentStates[seller.id]?.status === 'hold' || paymentStates[seller.id]?.status === 'settled'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[seller.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-blue-300 text-blue-400 bg-slate-50'
                            : paymentStates[seller.id]?.status === 'settled'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                        }`}
                      >
                        Pay Now
                      </button>
                      <button
                        onClick={() => handleHoldAmount(seller.id)}
                        disabled={paymentStates[seller.id]?.status === 'settled' || paymentStates[seller.id]?.status === 'success'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[seller.id]?.status === 'settled' || paymentStates[seller.id]?.status === 'success'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : paymentStates[seller.id]?.status === 'hold'
                            ? 'border-2 border-yellow-400 bg-yellow-50 text-yellow-800 shadow-xs ring-2 ring-yellow-400/40 cursor-pointer font-black'
                            : 'border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[seller.id]?.status === 'hold' ? 'On Hold' : 'Hold Amount'}
                      </button>
                      <button
                        onClick={() => { if (paymentStates[seller.id]?.status !== 'hold') handleMarkAsSettled(seller.id); }}
                        disabled={paymentStates[seller.id]?.status === 'settled' || paymentStates[seller.id]?.status === 'hold'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[seller.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-emerald-300 text-emerald-400 bg-slate-50'
                            : paymentStates[seller.id]?.status === 'settled'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600 cursor-default'
                            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[seller.id]?.status === 'settled' ? 'Settled' : 'Mark as Settled'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showCashHubManagersModal && (
 <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 <CreditCard size={18} />
 Total Cash with Hub Managers
 </h3>
 <button onClick={() => setShowCashHubManagersModal(false)} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-3">
 {cashHubManagersList.length === 0 ? (
 <div className="text-center text-slate-500 text-sm py-8">No hub managers found with cash.</div>
 ) : (
 cashHubManagersList.map(hm => (
 <div key={hm.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-1 shadow-sm bg-white">
 <div className="flex justify-between items-start">
 <span className="font-bold text-slate-800 text-sm">{hm.hub_manager_name || 'Unknown'}</span>
 <span className="font-black text-emerald-600 text-base">₹ {hm.cash}</span>
 </div>
 <div className="text-xs text-slate-500 font-medium">Hub: <span className="font-bold text-slate-700">{hm.hub_name}</span></div>
 <div className="text-xs text-slate-500 font-medium">ID: {hm.id?.substring(0, 8)}</div>
 
 
 <div className="flex items-center justify-between border-t border-slate-200 mt-2 pt-2 gap-2">
 <button onClick={() => setSelectedHubManagerForCalc(hm)} className="flex-1 py-1.5 border border-slate-300 text-xs font-bold text-slate-700 rounded-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">Calculate</button>
 <button disabled={collectingHmId === hm.id} onClick={() => handleHmCollect(hm)} className={`flex-1 h-[30px] border border-emerald-500 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-sm hover:bg-emerald-100 active:bg-emerald-200 transition-colors flex items-center justify-center ${collectingHmId === hm.id ? 'opacity-70 cursor-not-allowed' : ''}`}>
 {collectingHmId === hm.id ? (
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
 
 {selectedHubManagerForCalc && (
 <div className="fixed inset-0 z-[70] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/><path d="M8 4v4"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M12 16h.01"/><path d="M16 16h.01"/><path d="M8 12h.01"/><path d="M8 16h.01"/></svg>
 Calculator
 </h3>
 <button onClick={() => { setSelectedHubManagerForCalc(null); setHmCalcDenominations({}); }} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-4">
 <div className="bg-slate-100 rounded-lg p-3 space-y-1">
 <div className="text-xs text-slate-500 font-medium">Manager: <span className="font-bold text-slate-800">{selectedHubManagerForCalc.name || 'Unknown'}</span></div>
 <div className="text-xs text-slate-500 font-medium">Target Amount: <span className="font-bold text-emerald-600 text-sm">₹{selectedHubManagerForCalc.cash || 0}</span></div>
 <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-200 mt-1">Entered Amount: <span className="font-bold text-blue-600 text-sm">₹{Object.entries(hmCalcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0)}</span></div>
 <div className="text-xs text-slate-500 font-medium">Remaining Amount: <span className={`font-bold text-sm ${(Number(selectedHubManagerForCalc.cash) || 0) - Object.entries(hmCalcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0) < 0 ? 'text-red-600' : 'text-orange-600'}`}>₹{(Number(selectedHubManagerForCalc.cash) || 0) - Object.entries(hmCalcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0)}</span></div>
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
 value={hmCalcDenominations[den] || ''}
 onChange={(e) => setHmCalcDenominations(prev => ({ ...prev, [den]: parseInt(e.target.value) || 0 }))}
 />
 <div className="text-slate-400 font-medium text-xs">=</div>
 <div className="w-20 font-bold text-emerald-600 text-right bg-emerald-50 px-2 py-1.5 rounded">₹ {(hmCalcDenominations[den] || 0) * den}</div>
 </div>
 ))}
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 bg-white shrink-0">
 <button onClick={() => { setSelectedHubManagerForCalc(null); setHmCalcDenominations({}); }} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm">
 Done
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 )}
 
 <RoleChatModal
 isOpen={showRoleChatModal.isOpen}
 onClose={() => setShowRoleChatModal({ ...showRoleChatModal, isOpen: false })}
 tableName={showRoleChatModal.table}
 title={showRoleChatModal.title}
 currentUserType="cluster"
 currentUserId={clusterUserData?.id || ""}
 currentUserName={clusterUserData?.cluster_name || "Cluster"}
 clusterId={null}
 />
 <AnnouncementChatModal
 isOpen={showAnnouncementModal.isOpen}
 onClose={() => setShowAnnouncementModal({ ...showAnnouncementModal, isOpen: false })}
 updateType={showAnnouncementModal.type}
 title={showAnnouncementModal.title}
 readOnly={showAnnouncementModal.type === 'customer_update' || showAnnouncementModal.type === 'seller_update'}

 />

 {showRiderPenaltyModal && (
 <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200">
 <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 shrink-0">
 <button onClick={() => setShowRiderPenaltyModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
 <ArrowLeft size={20} />
 </button>
 <h2 className="font-bold text-slate-800">Rider Penalty</h2>
 </div>
 
 <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Select Rider</label>
 <CustomSelect value={riderPenaltyForm.userId} onChange={(e) => setRiderPenaltyForm({...riderPenaltyForm, userId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
 <option value="">Select a rider</option>
 {penaltyRiders.map(item => (
 <option key={item.id} value={item.id}>{item.id.substring(0, 8)} - {item.rider_name || 'No Name'} - {item.registered_pincode || item.pincode || 'N/A'}</option>
 ))}
 </CustomSelect>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Penalty Amount</label>
 <input type="number" placeholder="Enter amount" value={riderPenaltyForm.amount} onChange={(e) => setRiderPenaltyForm({...riderPenaltyForm, amount: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Penalty Status</label>
 <input type="text" placeholder="Enter status" value={riderPenaltyForm.status} onChange={(e) => setRiderPenaltyForm({...riderPenaltyForm, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
 </div>
 <button disabled={isSavingRiderPenalty} onClick={handleSaveRiderPenalty} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl text-sm transition-colors mt-2 flex items-center justify-center ${isSavingRiderPenalty ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}>
 {isSavingRiderPenalty ? (
 <div className="flex items-center justify-center gap-1">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
 </div>
 ) : (
 "Save Changes"
 )}
 </button>
 </div>

 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[600px] shrink-0">
 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
 <h3 className="font-bold text-slate-800">All Penalty List</h3>
 </div>
 <div className="p-3 border-b border-slate-100 bg-white">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
 <input 
 type="text" 
 placeholder="Search user..." 
 value={riderPenaltySearch}
 onChange={(e) => setRiderPenaltySearch(e.target.value)}
 className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-0">
 
 {riderPenalties.length > 0 ? (
 <div className="flex flex-col">
 {riderPenalties
 .filter(p => penaltyRiders.some(r => r.id === p["rider id"]))
 .filter(p => !riderPenaltySearch || (penaltyRiders.find(r => r.id === p["rider id"])?.rider_name || p["rider id"])?.toLowerCase().includes(riderPenaltySearch.toLowerCase()))
 .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
 .map(p => (
 <div key={p.id} className="p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-800">{(penaltyRiders.find(r => r.id === p["rider id"])?.rider_name || p["rider id"])}</span>
 <span className="text-xs text-slate-500">₹{p["penalty amount"]} - {p["penalty status"]}</span>
 </div>
 <button disabled={removingRiderPenaltyId === p.id} onClick={() => handleRemoveRiderPenalty(p.id)} className={`px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded transition-colors flex items-center justify-center min-w-[105px] h-[26px] ${removingRiderPenaltyId === p.id ? 'opacity-80 cursor-not-allowed bg-red-50' : 'hover:bg-red-50'}`}>
 {removingRiderPenaltyId === p.id ? (
 <div className="flex items-center justify-center gap-1">
 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></div>
 </div>
 ) : (
 "Remove Penalty"
 )}
 </button>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-8 text-center text-slate-500 text-sm">No penalties found.</div>
 )}

 </div>
 </div>
 </div>
 </div>
 )}
 {showHubManagerPenaltyModal && (
 <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200">
 <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 shrink-0">
 <button onClick={() => setShowHubManagerPenaltyModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
 <ArrowLeft size={20} />
 </button>
 <h2 className="font-bold text-slate-800">Hub Manager Penalty</h2>
 </div>
 
 <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Select Hub Manager</label>
 <CustomSelect value={hmPenaltyForm.userId} onChange={(e) => setHmPenaltyForm({...hmPenaltyForm, userId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
 <option value="">Select a hub manager</option>
 {penaltyHubManagers.map(item => (
 <option key={item.id} value={item.id}>{item.id.substring(0, 8)} - {item.hub_name || 'No Hub'} - {item.hub_manager_name || 'No Name'} - {item.registered_pincode || item.pincode || 'N/A'}</option>
 ))}
 </CustomSelect>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Penalty Amount</label>
 <input type="number" placeholder="Enter amount" value={hmPenaltyForm.amount} onChange={(e) => setHmPenaltyForm({...hmPenaltyForm, amount: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Penalty Status</label>
 <input type="text" placeholder="Enter status" value={hmPenaltyForm.status} onChange={(e) => setHmPenaltyForm({...hmPenaltyForm, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
 </div>
 <button disabled={isSavingHmPenalty} onClick={handleSaveHmPenalty} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl text-sm transition-colors mt-2 flex items-center justify-center ${isSavingHmPenalty ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}>
 {isSavingHmPenalty ? (
 <div className="flex items-center justify-center gap-1">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
 </div>
 ) : (
 "Save Changes"
 )}
 </button>
 </div>

 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[600px] shrink-0">
 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
 <h3 className="font-bold text-slate-800">All Penalty List</h3>
 </div>
 <div className="p-3 border-b border-slate-100 bg-white">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
 <input 
 type="text" 
 placeholder="Search user..." 
 value={hubManagerPenaltySearch}
 onChange={(e) => setHubManagerPenaltySearch(e.target.value)}
 className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-0">
 
 {hmPenalties.length > 0 ? (
 <div className="flex flex-col">
 {hmPenalties
 .filter(p => penaltyHubManagers.some(r => r.id === p["hub manager id"]))
 .filter(p => !hubManagerPenaltySearch || (penaltyHubManagers.find(r => r.id === p["hub manager id"])?.hub_manager_name || p["hub manager id"])?.toLowerCase().includes(hubManagerPenaltySearch.toLowerCase()))
 .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
 .map(p => (
 <div key={p.id} className="p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-800">{(penaltyHubManagers.find(r => r.id === p["hub manager id"])?.hub_manager_name || p["hub manager id"])}</span>
 <span className="text-xs text-slate-500">₹{p["penalty amount"]} - {p["penalty status"]}</span>
 </div>
 <button disabled={removingHmPenaltyId === p.id} onClick={() => handleRemoveHmPenalty(p.id)} className={`px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded transition-colors flex items-center justify-center min-w-[105px] h-[26px] ${removingHmPenaltyId === p.id ? 'opacity-80 cursor-not-allowed bg-red-50' : 'hover:bg-red-50'}`}>
 {removingHmPenaltyId === p.id ? (
 <div className="flex items-center justify-center gap-1">
 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></div>
 </div>
 ) : (
 "Remove Penalty"
 )}
 </button>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-8 text-center text-slate-500 text-sm">No penalties found.</div>
 )}

 </div>
 </div>
 </div>
 </div>
 )}
 
</div>
 );
};
