import { CustomSelect } from "./CustomSelect";
import { trackAllSearch } from "../../utils/trackSearch";
import { TrackResultCard } from "./TrackResultCard";
import { LogoutModal } from './LogoutModal';
import { AdminLiveShipmentCard } from './AdminLiveShipmentCard';
import { supabase } from '../../lib/supabase';
import { AnnouncementChatModal } from './AnnouncementChatModal';
import { RoleChatModal } from './RoleChatModal';
import { PayableListBanner } from './PayableListBanner';
import { registerBackHandler } from '../../lib/backNavigation';
import React, { useState, useEffect, useRef } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { Download, Bot, Loader2, LayoutDashboard, 
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
 Settings, Image, Edit
, X, AlertTriangle, IndianRupee, RefreshCw, Lock } from 'lucide-react';
import { CreateUserIdPage, UserTypeCategory } from './CreateUserIdPage';

const isValidUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

interface PortalProps {
 onBack: () => void;
}

interface UserItem {
 id: string;
 type: 'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID' | 'Cluster ID';
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

export const AdminPortal: React.FC<PortalProps> = ({ onBack }) => {
 const [showAnnouncementModal, setShowAnnouncementModal] = useState<{isOpen: boolean, type: any, title: string}>({isOpen: false, type: 'customer_update', title: ''});
 const [showRoleChatModal, setShowRoleChatModal] = useState<{isOpen: boolean, table: any, title: string}>({isOpen: false, table: 'chat_for_customers', title: ''});
 const [activeTab, setActiveTab] = useState('Dashboard');
  const [headerLogo, setHeaderLogo] = useState('');
  const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);
  const handleDeepRefresh = () => {
    setIsDeepRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    try {
      if (typeof fetchAdminRiderPayableAmount === 'function') fetchAdminRiderPayableAmount();
      if (typeof fetchAdminHmPayableAmount === 'function') fetchAdminHmPayableAmount();
      if (typeof fetchAdminClusterPayableAmount === 'function') fetchAdminClusterPayableAmount();
      if (typeof fetchAdminCustomerPayableAmount === 'function') fetchAdminCustomerPayableAmount();
      if (typeof fetchSellerPayableAmount === 'function') fetchSellerPayableAmount();
      if (typeof fetchAdminCollectedCash === 'function') fetchAdminCollectedCash();
      if (typeof fetchCashWithRiders === 'function') fetchCashWithRiders();
      if (typeof fetchCashWithHubManagers === 'function') fetchCashWithHubManagers();
      if (typeof fetchCashClusters === 'function') fetchCashClusters();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ss_customer_additional_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.logoUrl) setHeaderLogo(parsed.logoUrl);
      }
    } catch (e) {}
  }, []);

 const [adminProfileId, setAdminProfileId] = useState<string | null>(null);

 const [userToDelete, setUserToDelete] = useState<any>(null);
 const [isDeletingUser, setIsDeletingUser] = useState(false);

 const handleConfirmDeleteUser = async () => {
 if (!userToDelete) return;
 setIsDeletingUser(true);
 let table = '';
 const user = userToDelete;
 if (user.type === 'Customer ID') table = 'customers';
 else if (user.type === 'Seller ID') table = 'sellers';
 else if (user.type === 'Rider ID') table = 'riders';
 else if (user.type === 'Hub Manager ID') table = 'hub_managers';
 else if (user.type === 'Cluster ID') table = 'clusters';
 if (table) {
 try {
 const res = await fetch('/api/admin/delete-user', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user.id, table })
 });
 const result = await res.json();
 if (!res.ok) throw new Error(result.error || 'Failed to delete user');
 setUsersList(prev => prev.filter(u => u.id !== user.id));
 } catch (err: any) {
 console.error(err);
 alert('Error: ' + err.message);
 }
 }
 setIsDeletingUser(false);
 setUserToDelete(null);
 };

 // Asur AI Agent States
 const [asurInput, setAsurInput] = useState('');
 const [asurMessages, setAsurMessages] = useState<{sender: 'user' | 'asur', text: string, type?: 'status' | 'report', actions?: any[]}[]>(() => {
 const saved = localStorage.getItem('asur_admin_chat');
 if (saved) {
 try {
 return JSON.parse(saved);
 } catch (e) {
 console.error("Failed to parse saved asur chat", e);
 }
 }
 return [
 { sender: 'asur', text: "Hello Sir! Main Asur hoon, aapka AI Assistant. Main hamesha online hoon aur aapki commands execute karne ke liye taiyaar hoon. Boliye, main aaj aapki kya madad kar sakta hoon?" }
 ];
 });
 
 const [asurSelectionMode, setAsurSelectionMode] = useState(false);
 const [asurSelectedMsgs, setAsurSelectedMsgs] = useState<number[]>([]);
 const pressTimer = useRef<NodeJS.Timeout | null>(null);

 const handlePressStart = (idx: number) => {
 pressTimer.current = setTimeout(() => {
 setAsurSelectionMode(true);
 if (!asurSelectedMsgs.includes(idx)) {
 setAsurSelectedMsgs(prev => [...prev, idx]);
 }
 }, 600); // 600ms long press
 };

 const handlePressEnd = () => {
 if (pressTimer.current) {
 clearTimeout(pressTimer.current);
 pressTimer.current = null;
 }
 };

 const toggleAsurMsgSelection = (idx: number) => {
 if (asurSelectedMsgs.includes(idx)) {
 setAsurSelectedMsgs(prev => prev.filter(i => i !== idx));
 } else {
 setAsurSelectedMsgs(prev => [...prev, idx]);
 }
 };

 const handleSelectAllAsur = () => {
 if (asurSelectedMsgs.length === asurMessages.length) {
 setAsurSelectedMsgs([]);
 } else {
 setAsurSelectedMsgs(asurMessages.map((_, i) => i));
 }
 };

 const handleDeleteSelectedAsurMsgs = async () => {
 // Find background tasks to cancel
 const tasksToRemove: string[] = [];
 let msgsToDelete = new Set(asurSelectedMsgs);

 asurSelectedMsgs.forEach(idx => {
 const msg = asurMessages[idx];
 if (msg) {
 if (msg.actions) {
 msg.actions.forEach((act: any) => {
 if (act.type === 'ADD_BACKGROUND_TASK' && act.task) {
 tasksToRemove.push(act.task);
 }
 });
 }
 if (msg.sender === 'user') {
 const nextMsg = asurMessages[idx + 1];
 if (nextMsg && nextMsg.sender === 'asur') {
 msgsToDelete.add(idx + 1);
 if (nextMsg.actions) {
 nextMsg.actions.forEach((act: any) => {
 if (act.type === 'ADD_BACKGROUND_TASK' && act.task) {
 tasksToRemove.push(act.task);
 }
 });
 }
 }
 }
 }
 });

 // Make API calls to remove tasks
 for (const task of tasksToRemove) {
 try {
 await fetch('/api/asur/remove_task', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ task })
 });
 } catch (e) {
 console.error("Failed to remove task:", e);
 }
 }

 setAsurMessages(prev => prev.filter((_, i) => !msgsToDelete.has(i)));
 setAsurSelectionMode(false);
 setAsurSelectedMsgs([]);
 };

 const [asurIsProcessing, setAsurIsProcessing] = useState(false);
 const asurChatEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 localStorage.setItem('asur_admin_chat', JSON.stringify(asurMessages));
 if (asurChatEndRef.current) {
 asurChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [asurMessages]);

 const handleAsurSubmit = async () => {
 if (!asurInput.trim() || asurIsProcessing) return;
 
 const userCmd = asurInput.trim();
 setAsurInput('');
 const newMessages = [...asurMessages, { sender: 'user', text: userCmd }];
 setAsurMessages(newMessages);
 setAsurIsProcessing(true);

 const safeSliceMap = (arr: any[], mapper: (v: any) => string) => arr && arr.length > 0 ? arr.slice(0, 50).map(mapper).join(', ') : 'None';
 
 const contextPayload = `
 --- LIVE UI DETAILS ---
 - Pending Approvals (${pendingApprovals.length}): ${safeSliceMap(pendingApprovals, r => `${r.type === 'Seller' ? (r.seller_name || 'Seller') : (r.rider_name || 'Rider')} (${r.status})`)}
 - Rider Payables (${adminRiderPayableList.length}): ${safeSliceMap(adminRiderPayableList, r => `${r.rider_name} (₹${r.balance || 0})`)}
 - Seller Payables (${sellerPayableList.length}): ${safeSliceMap(sellerPayableList, s => `${s.seller_name} (₹${s.balance || 0})`)}
 - Hub Manager Payables (${adminHmPayableList.length}): ${safeSliceMap(adminHmPayableList, h => `${h.name || h.full_name} (₹${h.balance || 0})`)}
 - Cluster Payables (${adminClusterPayableList.length}): ${safeSliceMap(adminClusterPayableList, c => `${c.name || c.full_name} (₹${c.balance || 0})`)}
 - Customer Payables (${adminCustomerPayableList.length}): ${safeSliceMap(adminCustomerPayableList, c => `${c.full_name} (₹${c.balance || 0})`)}
 - Online Cash Riders: ${cashRidersList.length}
 - Online Cash Hub Managers: ${cashHubManagersList.length}
 - Online Cash Clusters: ${cashClustersList.length}
 `;

 try {
 const res = await fetch('/api/admin/ai-command', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ prompt: userCmd, context: contextPayload, history: newMessages.slice(-10) }) // Send last 10 messages for memory
 });
 
 const data = await res.json();
 
 if (data.actions && data.actions.length > 0) {
 // Execute actions sequentially
 for (const action of data.actions) {
 if (!action || !action.type) continue;
 
 if (action.type === 'APPROVE_IDS') {
 const toApprove = pendingApprovals.slice(0, 10);
 for (const req of toApprove) {
 await handleApproveRequest(req);
 }
 }
 else if (action.type === 'REJECT_IDS') {
 const toReject = pendingApprovals.slice(0, 10);
 for (const req of toReject) {
 await handleRejectRequest(req);
 }
 }
 else if (action.type === 'CREATE_USER') {
 const role = action.role || 'customer';
 let tableName = 'customers';
 let payload = {};
 const fakeAddress = "123 AI Auto Gen Street, Mumbai";
 const fakePincode = "400001";
 const fakeBank = "123456789012";
 const fakeIfsc = "HDFC0001234";
 const fakeUpi = "ai@upi";
 const fakeAadhar = "123456789012";
 const fakePan = "ABCDE1234F";
 
 if (role === 'seller') {
 tableName = 'sellers';
 payload = { 
 seller_name: action.name || 'AI Generated Seller', 
 registered_mobile_number: action.phone || '9999999999', 
 registered_email: action.email || 'seller@ai.com', 
 password: action.password || 'password123', 
 shop_name: action.shop_name || (action.name ? action.name + ' Store' : 'AI Generated Shop'),
 registered_full_address: action.address || fakeAddress,
 registered_pincode: fakePincode,
 gstin: action.gstin || '27XXXXX1234X1ZX',
 bank_name: 'HDFC Bank',
 account_no: action.bank_account || fakeBank,
 ifsc_code: action.ifsc || fakeIfsc,
 upi_id: action.upi || fakeUpi,
 aadhaar_card: fakeAadhar,
 pan_card: fakePan,
 shop_establishment: 'AI_SHOP_123',
 trust_years_in_business: 1
 };
 } else if (role === 'rider') {
 tableName = 'riders';
 payload = { 
 rider_name: action.name || 'AI Generated Rider', 
 registered_mobile_number: action.phone || '9999999999', 
 registered_email: action.email || 'rider@ai.com', 
 password: action.password || 'password123',
 registered_full_address: action.address || fakeAddress,
 registered_pincode: fakePincode,
 vehicle_no: action.vehicle_number || 'MH01AB1234',
 driving_licence: action.driving_license || 'MH1234567890123',
 aadhaar_card: action.aadhar || fakeAadhar,
 pan_card: fakePan,
 bank_name: 'HDFC Bank',
 account_no: action.bank_account || fakeBank,
 ifsc_code: action.ifsc || fakeIfsc,
 upi_id: action.upi || fakeUpi
 };
 } else if (role === 'hub_manager') {
 tableName = 'hub_managers';
 payload = { 
 hub_manager_name: action.name || 'AI Generated HM', 
 registered_mobile_number: action.phone || '9999999999', 
 registered_email: action.email || 'hm@ai.com', 
 password: action.password || 'password123', 
 hub_name: action.hub_name || 'AI Generated Hub',
 store_name: action.hub_name || 'AI Hub Store',
 registered_full_address: action.address || fakeAddress,
 registered_pincode: fakePincode,
 aadhaar_card: action.aadhar || fakeAadhar,
 pan_card: fakePan,
 voter_id: 'VOTER123',
 bank_name: 'HDFC Bank',
 account_no: action.bank_account || fakeBank,
 ifsc_code: action.ifsc || fakeIfsc,
 upi_id: action.upi || fakeUpi
 };
 } else if (role === 'cluster') {
 tableName = 'clusters';
 payload = { 
 cluster_name: action.name || 'AI Generated Cluster', 
 registered_mobile_number: action.phone || '9999999999', 
 registered_email: action.email || 'cluster@ai.com', 
 password: action.password || 'password123',
 registered_full_address: action.address || fakeAddress,
 registered_pincode: fakePincode,
 aadhaar_card: action.aadhar || fakeAadhar,
 pan_card: fakePan,
 voter_id: 'VOTER123',
 bank_name: 'HDFC Bank',
 account_no: action.bank_account || fakeBank,
 ifsc_code: action.ifsc || fakeIfsc,
 upi_id: action.upi || fakeUpi
 };
 } else {
 tableName = 'customers';
 payload = { 
 full_name: action.name || 'AI Generated Customer', 
 mobile_number: action.phone || '9999999999', 
 email_account: action.email || 'customer@ai.com', 
 password: action.password || 'password123',
 full_address: action.address || fakeAddress,
 pincode: fakePincode,
 bank_name: 'HDFC Bank',
 account_no: action.bank_account || fakeBank,
 ifsc_code: action.ifsc || fakeIfsc,
 upi_id: action.upi || fakeUpi
 };
 }

 const { data: insertedData, error: insErr } = await supabase.from(tableName).insert([payload]).select().single();
 if (insErr) {
 console.error("CREATE USER INSERT ERROR", insErr);
 throw new Error(insErr.message);
 }
 
 // Create auth user
 if (insertedData) {
 await fetch('/api/admin/create-user', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 id: insertedData.id,
 email: (payload as any).email_account || (payload as any).registered_email,
 password: (payload as any).password,
 user_metadata: {
 role: role,
 full_name: action.name || 'AI Generated User'
 }
 })
 }).catch(err => console.error('Auth create failed silently:', err));
 }
 
 setRefreshTrigger(prev => prev + 1);
 /* removed delay for speed */
 }
 else if (action.type === 'CREATE_ANNOUNCEMENT') {
 const audience = action.audience || 'customers';
 const updateTypes = audience === 'customers' ? ['customer_update'] 
 : audience === 'sellers' ? ['seller_update'] 
 : audience === 'riders' ? ['rider_update']
 : audience === 'hub_managers' ? ['hub_manager_update']
 : audience === 'clusters' ? ['cluster_update']
 : ['customer_update', 'seller_update', 'rider_update', 'hub_manager_update', 'cluster_update'];
 
 for (const updateType of updateTypes) {
 const messageData = {
 text: action.message || "Announcement from AI System",
 fileUrl: null,
 fileName: null,
 timestamp: new Date().toISOString()
 };
 await supabase.from('announcement_and_update').insert([{ [updateType]: JSON.stringify(messageData) } as any]);
 }
 }
 else if (action.type === 'REPLY_MESSAGES') {
 const audience = action.audience || 'customers';
 const tables = audience === 'customers' ? ['chat_for_customers'] 
 : audience === 'sellers' ? ['chat_for_sellers'] 
 : audience === 'riders' ? ['chat_for_riders']
 : audience === 'hub_managers' ? ['chat_for_hub_managers']
 : audience === 'clusters' ? ['chat_for_clusters']
 : ['chat_for_customers', 'chat_for_sellers', 'chat_for_riders', 'chat_for_hub_managers', 'chat_for_clusters'];
 
 for (const table of tables) {
 const messageData = {
 text: action.message || "Message from AI System",
 fileUrl: null,
 fileName: null,
 timestamp: new Date().toISOString(),
 senderType: 'admin',
 senderId: 'admin',
 senderName: 'Asur (Admin AI)',
 clusterId: null
 };
 await supabase.from(table).insert([{
 message: JSON.stringify(messageData),
 created_at: new Date().toISOString()
 }]);
 /* removed delay for speed */
 }
 }
 else if (action.type === 'DELETE_CHATS') {
 const audience = action.audience || 'all';
 const tables = audience === 'customers' ? ['chat_for_customers'] 
 : audience === 'sellers' ? ['chat_for_sellers'] 
 : audience === 'riders' ? ['chat_for_riders']
 : audience === 'hub_managers' ? ['chat_for_hub_managers']
 : audience === 'clusters' ? ['chat_for_clusters']
 : ['chat_for_customers', 'chat_for_sellers', 'chat_for_riders', 'chat_for_hub_managers', 'chat_for_clusters'];
 
 for (const table of tables) {
 await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
 /* removed delay for speed */
 }
 }
 else if (action.type === 'DELETE_SPECIFIC_MESSAGE') {
 const audience = action.audience || 'all';
 const textToMatch = action.message_text || '';
 
 // Check announcements
 const updateTypes = audience === 'customers' ? ['customer_update'] 
 : audience === 'sellers' ? ['seller_update'] 
 : audience === 'riders' ? ['rider_update']
 : audience === 'hub_managers' ? ['hub_manager_update']
 : audience === 'clusters' ? ['cluster_update']
 : ['customer_update', 'seller_update', 'rider_update', 'hub_manager_update', 'cluster_update'];
 
 const { data: allAnnouncements } = await supabase.from('announcement_and_update').select('*');
 if (allAnnouncements) {
 for (const row of allAnnouncements) {
 for (const uType of updateTypes) {
 if (row[uType] && typeof row[uType] === 'string' && row[uType].toLowerCase().includes(textToMatch.toLowerCase())) {
 await supabase.from('announcement_and_update').delete().eq('id', row.id);
 }
 }
 }
 }

 // Check chats
 const tables = audience === 'customers' ? ['chat_for_customers'] 
 : audience === 'sellers' ? ['chat_for_sellers'] 
 : audience === 'riders' ? ['chat_for_riders']
 : audience === 'hub_managers' ? ['chat_for_hub_managers']
 : audience === 'clusters' ? ['chat_for_clusters']
 : ['chat_for_customers', 'chat_for_sellers', 'chat_for_riders', 'chat_for_hub_managers', 'chat_for_clusters'];
 
 for (const table of tables) {
 const { data: allChats } = await supabase.from(table).select('*');
 if (allChats) {
 for (const row of allChats) {
 if (row.message && typeof row.message === 'string' && row.message.toLowerCase().includes(textToMatch.toLowerCase())) {
 await supabase.from(table).delete().eq('id', row.id);
 }
 }
 }
 }
 }
 else if (action.type.startsWith('PROCESS_PAYMENTS')) {
 let targets = [];
 if (action.type === 'PROCESS_PAYMENTS_RIDERS' || action.type === 'PROCESS_PAYMENTS_ALL') targets.push({ list: adminRiderPayableList });
 if (action.type === 'PROCESS_PAYMENTS_SELLERS' || action.type === 'PROCESS_PAYMENTS_ALL') targets.push({ list: sellerPayableList });
 if (action.type === 'PROCESS_PAYMENTS_HUB_MANAGERS' || action.type === 'PROCESS_PAYMENTS_ALL') targets.push({ list: adminHmPayableList });
 if (action.type === 'PROCESS_PAYMENTS_CLUSTERS' || action.type === 'PROCESS_PAYMENTS_ALL') targets.push({ list: adminClusterPayableList });
 
 for (const target of targets) {
 const toProcess = target.list.slice(0, 10);
 for (const req of toProcess) {
 // Real work: AI clicks the "Pay Now" and "Mark as Settled" functions just like a manual click!
 handlePayNow(req.id);
 /* removed delay for speed */ // wait for processing
 await handleMarkAsSettled(req.id); // trigger settlement logic manually
 /* removed delay for speed */
 }
 }
 setRefreshTrigger(prev => prev + 1);
 }
 else if (action.type === 'OPEN_PAGE') {
 if (action.page === 'Create ID') {
 setActiveTab('User Activity');
 setIsCreatingUserId(true);
 } else {
 setActiveTab(action.page);
 }
 }
 }
 }
 
 setAsurMessages(prev => [...prev, { 
 sender: 'asur', 
 text: data.reply || "Done.",
 type: 'report',
 actions: data.actions
 }]);

 } catch (err) {
 console.error("AI execution error", err);
 setAsurMessages(prev => [...prev, { sender: 'asur', text: "Server se sampark tut gaya hai. Kripya punah prayas karen." }]);
 } finally {
 setAsurIsProcessing(false);
 }
 };

 const handleAsurDownload = (msgText: string) => {
 const doc = new jsPDF();
 doc.setFontSize(18);
 doc.setTextColor(0, 51, 153);
 doc.text("SURIYAWAN SHOPPING System - Secure Execution Report", 14, 22);
 
 doc.setFontSize(11);
 doc.setTextColor(50, 50, 50);
 doc.text("Date: " + new Date().toLocaleString(), 14, 30);
 doc.text("Generated by: Asur", 14, 36);

 autoTable(doc, {
 startY: 45,
 head: [['Execution Details & Outcomes']],
 body: [[msgText]],
 theme: 'grid',
 styles: { fontSize: 10, cellPadding: 4 },
 headStyles: { fillColor: [0, 51, 153] },
 });

 doc.save("Asur_Secure_Execution_Report.pdf");
 };

 const [totalCashWithRiders, setTotalCashWithRiders] = useState<number | null>(null);
 const [cashRidersList, setCashRidersList] = useState<any[]>([]);
 const [showCashRidersModal, setShowCashRidersModal] = useState(false);
 const [showCashHubManagersModal, setShowCashHubManagersModal] = useState(false);
 const [totalCashWithHubManagers, setTotalCashWithHubManagers] = useState<number | null>(null);
 const [cashHubManagersList, setCashHubManagersList] = useState<any[]>([]);
 const [selectedHubManagerForCalc, setSelectedHubManagerForCalc] = useState<any | null>(null);
 const [hmCalcDenominations, setHmCalcDenominations] = useState<Record<number, number>>({});
 
 
 const [showAdminRiderPayableModal, setShowAdminRiderPayableModal] = useState(false);
 const [totalAdminRiderPayableAmount, setTotalAdminRiderPayableAmount] = useState(0);
 const [adminRiderPayableList, setAdminRiderPayableList] = useState<any[]>([]);

 const fetchAdminRiderPayableAmount = async () => {
 try {
 const { data: incomeData, error: incomeError } = await supabase.from('rider_shipment_work_flow').select('*');
 if (incomeError) {
 if (incomeError.code === 'PGRST303') {
 setTimeout(fetchAdminRiderPayableAmount, 2000);
 return;
 }
 throw incomeError;
 }
 
 const { data: riders, error: ridersError } = await supabase.from('riders').select('*');
 if (ridersError) throw ridersError;

 const riderMap = {};
 const { data: penaltyData } = await supabase.from('riders_penalty').select('*');
 const penaltyMap = {};
 (penaltyData || []).forEach(p => {
 if (!penaltyMap[p['rider id']]) penaltyMap[p['rider id']] = 0;
 penaltyMap[p['rider id']] += parseFloat(p['penalty amount'] || '0');
 });
 (riders || []).forEach(r => {
 // Only Admin appointed riders (cluster_id is null or empty)
 if (!r.cluster_id || r.cluster_id.trim() === '') {
 riderMap[r.id] = r;
 }
 });

 let total = 0;
 const aggregated = {};

 (incomeData || []).forEach(row => {
 const rId = row['rider_id'];
 if (!rId || !riderMap[rId]) return;
 const amt = parseFloat(row["Today's Earning"] || '0');
 
 
 if (!aggregated[rId]) {
 aggregated[rId] = 0;
 }
 aggregated[rId] += amt;
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

 setAdminRiderPayableList(list);
 setTotalAdminRiderPayableAmount(totalPayable);
 } catch(e: any) {
 if (e?.message === 'TypeError: Failed to fetch' || e?.details === 'TypeError: Failed to fetch') {
 setTimeout(fetchAdminRiderPayableAmount, 3000);
 } else {
 console.error("fetchAdminRiderPayableAmount err", e);
 }
 }
 };

 useEffect(() => {
 fetchAdminRiderPayableAmount();
 }, [activeTab]);

 

 
 const [showAdminHmPayableModal, setShowAdminHmPayableModal] = useState(false);
 const [totalAdminHmPayableAmount, setTotalAdminHmPayableAmount] = useState(0);
 const [adminHmPayableList, setAdminHmPayableList] = useState<any[]>([]);

 const fetchAdminHmPayableAmount = async () => {
 try {
 const { data: salaryData, error: salaryError } = await supabase.from('hub_manager_salary').select('*');
 if (salaryError) {
 if (salaryError.code === 'PGRST303') {
 setTimeout(fetchAdminHmPayableAmount, 2000);
 return;
 }
 throw salaryError;
 }
 
 const { data: hubManagers, error: hubManagersError } = await supabase.from('hub_managers').select('*');
 if (hubManagersError) throw hubManagersError;

 const hmMap: any = {};
 const { data: penaltyData } = await supabase.from('hub_managers_penalty').select('*');
 const penaltyMap: any = {};
 (penaltyData || []).forEach((p: any) => {
 if (!penaltyMap[p['hub manager id']]) penaltyMap[p['hub manager id']] = 0;
 penaltyMap[p['hub manager id']] += parseFloat(p['penalty amount'] || '0');
 });
 (hubManagers || []).forEach((hm: any) => {
 // Only Admin appointed Hub Managers (cluster_id is null or empty)
 if (!hm.cluster_id || String(hm.cluster_id).trim() === '') {
 hmMap[hm.id] = hm;
 }
 });

 // Query fixed_hub_manager_salary for fallback / default admin salary
 const { data: fixedSalaryData } = await supabase.from('fixed_hub_manager_salary').select('*').limit(1);
 const globalFixedSalary = fixedSalaryData && fixedSalaryData.length > 0 ? parseFloat(fixedSalaryData[0]['fixed salary'] || '0') : 0;

 let total = 0;
 const aggregated: any = {};
 
 // For each admin-appointed hub manager, default to fixed_hub_manager_salary
 Object.keys(hmMap).forEach(hmId => {
   aggregated[hmId] = globalFixedSalary;
 });

 // If a specific override exists in hub_manager_salary, apply it
 (salaryData || []).forEach((row: any) => {
   const hmId = row['hub manager id'];
   if (!hmId || !hmMap[hmId]) return;
   const amt = parseFloat(row["fixed salary"] || '0');
   if (amt > 0) {
     aggregated[hmId] = amt;
   }
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

 setAdminHmPayableList(list);
 setTotalAdminHmPayableAmount(totalPayable);
 } catch(e: any) {
 if (e?.message === 'TypeError: Failed to fetch' || e?.details === 'TypeError: Failed to fetch') {
 setTimeout(fetchAdminHmPayableAmount, 3000);
 } else {
 console.error("fetchAdminHmPayableAmount err", e);
 }
 }
 };

 useEffect(() => {
 fetchAdminHmPayableAmount();
 }, [activeTab]);

 
 
 const [showAdminClusterPayableModal, setShowAdminClusterPayableModal] = useState(false);

 const [showAdminClusterShipments, setShowAdminClusterShipments] = useState(false);
 const [adminClusterShipmentDetails, setAdminClusterShipmentDetails] = useState<any[]>([]);
 const [selectedAdminClusterName, setSelectedAdminClusterName] = useState("");

 const handleViewClusterShipments = async (cluster: any) => {
 setShowAdminClusterShipments(true);
 setSelectedAdminClusterName(cluster.name || cluster.id);
 setAdminClusterShipmentDetails([]);
 try {
 const { data: allData } = await supabase.from('accepted_shipments').select('*');
 const { data: riders } = await supabase.from('riders').select('id, cluster_id');
 const riderMap = new Map();
 (riders || []).forEach(r => riderMap.set(r.id, r.cluster_id));
 const valid = (allData || []).filter(s => {
 const stype = (s['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
 const stag = (s['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
 const pstatus = (s['payout status'] || '').toLowerCase();
 return stype === 'delivered' && (stag.includes('seller delivery') || stag.includes('customer delivery')) && pstatus === 'settled';
 });
 
 const myShipments: any[] = [];
 valid.forEach(s => {
 let cId = s['cluster id'];
 if (!cId && s['Rider id']) cId = riderMap.get(s['Rider id']);
 if (cId === cluster.id) {
 myShipments.push(s);
 }
 });
 setAdminClusterShipmentDetails(myShipments);
 } catch (err) {}
 };

 const [totalAdminClusterPayableAmount, setTotalAdminClusterPayableAmount] = useState(0);
 const [adminClusterPayableList, setAdminClusterPayableList] = useState<any[]>([]);

 const fetchAdminClusterPayableAmount = async () => {
 try {
 const { data: allData, error } = await supabase.from('accepted_shipments').select('*');
 
 if (error) {
 if (error.code === 'PGRST303') {
 setTimeout(fetchAdminClusterPayableAmount, 2000);
 return;
 }
 throw error;
 }
 
 const { data: riders } = await supabase.from('riders').select('id, cluster_id');
 const riderMap = new Map();
 (riders || []).forEach(r => riderMap.set(r.id, r.cluster_id));

 const valid = (allData || []).filter(s => {
 const stype = (s['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim();
 const stag = (s['shipment tag'] || '').toLowerCase().replace(/["']/g, '').trim();
 const pstatus = (s['payout status'] || '').toLowerCase();
 
 return stype === 'delivered' && 
 (stag.includes('seller delivery') || stag.includes('customer delivery')) &&
 pstatus === 'settled';
 });

 const clusterCounts: Record<string, number> = {};
 valid.forEach(s => {
 let cId = s['cluster id'];
 if (!cId && s['Rider id']) {
 cId = riderMap.get(s['Rider id']);
 }
 if (cId) {
 clusterCounts[cId] = (clusterCounts[cId] || 0) + 1;
 }
 });

 const { data: estimates } = await supabase.from('clusters_estimate').select('*');
 const estimateMap = new Map();
 (estimates || []).forEach(e => {
 if (e['cluster id']) {
 estimateMap.set(e['cluster id'], parseFloat(e['per order rate'] || '0'));
 }
 });

 const { data: clusters } = await supabase.from('clusters').select('*');
 const clusterMap = new Map();
 const { data: penaltyData } = await supabase.from('clusters_penalty').select('*');
 const penaltyMap = new Map();
 (penaltyData || []).forEach(p => {
 const cId = p['cluster id'];
 if(cId) {
 const existing = penaltyMap.get(cId) || 0;
 penaltyMap.set(cId, existing + parseFloat(p['penalty amount'] || '0'));
 }
 });
 (clusters || []).forEach(c => clusterMap.set(c.id, c));

 let totalAmount = 0;
 let totalPayableAmount = 0;
 const list = [];
 
 for (const [cId, count] of Object.entries(clusterCounts)) {
 const rate = estimateMap.get(cId) || 0;
 const clusterInfo = clusterMap.get(cId) || ({} as any);
 const sum = count * rate;
 if (sum > 0 || count > 0) { // include even if sum is 0 if they have counts, so user can see it
 
 const penaltyAmount = penaltyMap.get(cId) || 0;
 const payable = Math.max(0, sum - penaltyAmount);
 totalPayableAmount += payable;
 list.push({
 totalAmount: sum,
 penaltyAmount,
 payableAmount: payable,
 id: cId,
 short_id: cId.substring(0, 8),
 name: clusterInfo.cluster_name || 'Unknown',
 mobile: clusterInfo.registered_mobile_number || 'Unknown',
 count: count,
 rate: rate,
 sum: payable,
 bank_name: clusterInfo.bank_name || 'N/A',
 account_no: clusterInfo.account_no || 'N/A',
 ifsc_code: clusterInfo.ifsc_code || 'N/A',
 upi_id: clusterInfo.upi_id || 'N/A'
 });
 }
 }
 
 setAdminClusterPayableList(list);
 setTotalAdminClusterPayableAmount(totalPayableAmount);

 } catch (err) {
 if (err?.message === 'TypeError: Failed to fetch' || err?.details === 'TypeError: Failed to fetch') {
 setTimeout(fetchAdminClusterPayableAmount, 3000);
 } else {
 console.error("fetchAdminClusterPayableAmount err", err);
 }
 }
 };

 useEffect(() => {
 fetchAdminClusterPayableAmount();
 }, [activeTab]);

 const [showAdminCustomerPayableModal, setShowAdminCustomerPayableModal] = useState(false);
 const [totalAdminCustomerPayableAmount, setTotalAdminCustomerPayableAmount] = useState(0);
 const [adminCustomerPayableList, setAdminCustomerPayableList] = useState<any[]>([]);

 const fetchAdminCustomerPayableAmount = async () => {
 try {
 // Get the refund settings first
 const { data: refundSettingData } = await supabase.from('customer_refund_setting').select('*').limit(1);
 const refundSettings = refundSettingData && refundSettingData.length > 0 ? refundSettingData[0] : null;
 const useSellingPrice = refundSettings ? refundSettings['refund with total selling price'] : false;
 const useTotalAmount = refundSettings ? refundSettings['refund with total amount'] : false;

 const { data, error } = await supabase.from('customer_orders')
 .select('*')
 .ilike('order status', '%returned successfully%');
 
 if (error) {
 if (error.code === 'PGRST303') {
 setTimeout(fetchAdminCustomerPayableAmount, 2000);
 return;
 }
 throw error;
 }
 
 let total = 0;
 const { data: customers } = await supabase.from('customers').select('*');
 const customerMap = {};
 (customers || []).forEach(c => {
 customerMap[c.id] = c;
 });
 const list = (data || []).filter((row: any) => (row['payout status'] || '').toLowerCase() !== 'settled').map((row: any) => {
 const custInfo = customerMap[row['customer id']] || ({} as any);
 const sellingPrice = parseFloat(row['total selling price'] || '0');
 const totalAmount = parseFloat(row['total amount'] || '0');
 
 let sum = 0;
 if (useSellingPrice && !useTotalAmount) {
 sum = sellingPrice;
 } else if (useTotalAmount && !useSellingPrice) {
 sum = totalAmount;
 } else if (useSellingPrice && useTotalAmount) {
 sum = sellingPrice + totalAmount;
 } else {
 sum = sellingPrice + totalAmount; // Default fallback if none checked
 }

 total += sum;
 return {
 id: row.id,
 customer_id: row['customer id'] || 'Unknown',
 short_id: (row['customer id'] || '').substring(0, 8),
 name: row['full name'] || custInfo.full_name || custInfo.name || 'Customer',
 mobile: row['mobile number'] || custInfo.mobile_number || custInfo.registered_mobile_number || 'N/A',
 total_selling_price: sellingPrice,
 total_amount: totalAmount,
 sum: sum,
 bank_name: custInfo.bank_name || 'N/A',
 account_no: custInfo.account_no || 'N/A',
 ifsc_code: custInfo.ifsc_code || 'N/A',
 upi_id: custInfo.upi_id || 'N/A'
 };
 }).filter(item => item.sum > 0);

 setAdminCustomerPayableList(list);
 setTotalAdminCustomerPayableAmount(total);
 } catch (err: any) {
 if (err?.message === 'TypeError: Failed to fetch' || err?.details === 'TypeError: Failed to fetch') {
 setTimeout(fetchAdminCustomerPayableAmount, 3000);
 } else {
 console.error("fetchAdminCustomerPayableAmount err", err);
 }
 }
 };

 useEffect(() => {
 fetchAdminCustomerPayableAmount();
 }, [activeTab]);

  const [showSellerPayableModal, setShowSellerPayableModal] = useState(false);
  const [totalSellerPayableAmount, setTotalSellerPayableAmount] = useState(0);
  const [sellerPayableList, setSellerPayableList] = useState<any[]>([]);
  const [sellerPayablesByCluster, setSellerPayablesByCluster] = useState<{
    clusterId: string;
    clusterName: string;
    clusterShortId: string;
    clusterMobile: string;
    sellerCount: number;
    totalAmount: number;
    sellers: any[];
  }[]>([]);

  // Secure Transaction Configuration & Constants
  type PaymentMethodType = { id: string, name: string, link: string };

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

  const parseRatio = (ratioStr: string): { hours: number; days: number } => {
    if (!ratioStr) return { hours: 1, days: 2 };
    const parts = ratioStr.split(':').map(p => parseFloat(p.trim()));
    const hours = isNaN(parts[0]) || parts[0] <= 0 ? 1 : parts[0];
    const days = isNaN(parts[1]) || parts[1] <= 0 ? 2 : parts[1];
    return { hours, days };
  };

  const getSavedAdminSecureTx = () => {
    try {
      const data = typeof window !== 'undefined' ? localStorage.getItem('ss_secure_tx_settings_admin') : null;
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  const savedAdminTx = getSavedAdminSecureTx();

  const [paymentMethodsList, setPaymentMethodsList] = useState<PaymentMethodType[]>(
    savedAdminTx?.paymentMethodsList || [
      { id: '1', name: 'Google Pay', link: 'tez://upi/pay?pa=merchant@upi&pn=Asuryawan&cu=INR' },
      { id: '2', name: 'PhonePe', link: 'phonepe://pay?pa=merchant@upi&pn=Asuryawan&cu=INR' },
      { id: '3', name: 'Paytm', link: 'paytmmp://pay?pa=merchant@upi&pn=Asuryawan&cu=INR' }
    ]
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<'UPI ID' | 'Bank Account'>(
    savedAdminTx?.selectedPaymentType || 'Bank Account'
  );
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodLink, setNewMethodLink] = useState('');
  const [secureSaveSuccess, setSecureSaveSuccess] = useState(false);

  // Customer Settings
  const [secureCustomerLockState, setSecureCustomerLockState] = useState<'Lock' | 'Release'>(
    savedAdminTx?.customerLockState || 'Lock'
  );
  const [secureCustomerAutoMode, setSecureCustomerAutoMode] = useState<boolean>(
    savedAdminTx?.customerAutoMode ?? false
  );
  const [secureCustomerAutoActiveTime, setSecureCustomerAutoActiveTime] = useState<string | null>(
    savedAdminTx?.customerAutoActiveTime || null
  );
  const [secureCustomerSchedule, setSecureCustomerSchedule] = useState<string>(
    savedAdminTx?.customerSchedule || '0 Days'
  );
  const [secureCustomerRatio, setSecureCustomerRatio] = useState<string>(
    savedAdminTx?.customerRatio || '1:2'
  );
  const [secureCustomerLockedSnapshotIds, setSecureCustomerLockedSnapshotIds] = useState<string[] | null>(
    savedAdminTx?.customerLockedSnapshotIds || null
  );
  const [secureCustomerLockedAt, setSecureCustomerLockedAt] = useState<number | null>(
    savedAdminTx?.customerLockedAt || null
  );
  const [secureCustomerReleasedAt, setSecureCustomerReleasedAt] = useState<number | null>(
    savedAdminTx?.customerReleasedAt || null
  );

  // Seller Settings
  const [secureSellerLockState, setSecureSellerLockState] = useState<'Lock' | 'Release'>(
    savedAdminTx?.sellerLockState || 'Lock'
  );
  const [secureSellerAutoMode, setSecureSellerAutoMode] = useState<boolean>(
    savedAdminTx?.sellerAutoMode ?? false
  );
  const [secureSellerAutoActiveTime, setSecureSellerAutoActiveTime] = useState<string | null>(
    savedAdminTx?.sellerAutoActiveTime || null
  );
  const [secureSellerSchedule, setSecureSellerSchedule] = useState<string>(
    savedAdminTx?.sellerSchedule || '0 Days'
  );
  const [secureSellerRatio, setSecureSellerRatio] = useState<string>(
    savedAdminTx?.sellerRatio || '1:2'
  );
  const [secureSellerLockedSnapshotIds, setSecureSellerLockedSnapshotIds] = useState<string[] | null>(
    savedAdminTx?.sellerLockedSnapshotIds || null
  );
  const [secureSellerLockedAt, setSecureSellerLockedAt] = useState<number | null>(
    savedAdminTx?.sellerLockedAt || null
  );
  const [secureSellerReleasedAt, setSecureSellerReleasedAt] = useState<number | null>(
    savedAdminTx?.sellerReleasedAt || null
  );

  // Rider Settings
  const [secureRiderLockState, setSecureRiderLockState] = useState<'Lock' | 'Release'>(
    savedAdminTx?.riderLockState || 'Lock'
  );
  const [secureRiderAutoMode, setSecureRiderAutoMode] = useState<boolean>(
    savedAdminTx?.riderAutoMode ?? false
  );
  const [secureRiderAutoActiveTime, setSecureRiderAutoActiveTime] = useState<string | null>(
    savedAdminTx?.riderAutoActiveTime || null
  );
  const [secureRiderSchedule, setSecureRiderSchedule] = useState<string>(
    savedAdminTx?.riderSchedule || '0 Days'
  );
  const [secureRiderRatio, setSecureRiderRatio] = useState<string>(
    savedAdminTx?.riderRatio || '1:2'
  );
  const [secureRiderLockedSnapshotIds, setSecureRiderLockedSnapshotIds] = useState<string[] | null>(
    savedAdminTx?.riderLockedSnapshotIds || null
  );
  const [secureRiderLockedAt, setSecureRiderLockedAt] = useState<number | null>(
    savedAdminTx?.riderLockedAt || null
  );
  const [secureRiderReleasedAt, setSecureRiderReleasedAt] = useState<number | null>(
    savedAdminTx?.riderReleasedAt || null
  );

  // Hub Manager Settings
  const [secureHmLockState, setSecureHmLockState] = useState<'Lock' | 'Release'>(
    savedAdminTx?.hmLockState || 'Lock'
  );
  const [secureHmAutoMode, setSecureHmAutoMode] = useState<boolean>(
    savedAdminTx?.hmAutoMode ?? false
  );
  const [secureHmAutoActiveTime, setSecureHmAutoActiveTime] = useState<string | null>(
    savedAdminTx?.hmAutoActiveTime || null
  );
  const [secureHmSchedule, setSecureHmSchedule] = useState<string>(
    savedAdminTx?.hmSchedule || '0 Days'
  );
  const [secureHmRatio, setSecureHmRatio] = useState<string>(
    savedAdminTx?.hmRatio || '1:2'
  );
  const [secureHmLockedSnapshotIds, setSecureHmLockedSnapshotIds] = useState<string[] | null>(
    savedAdminTx?.hmLockedSnapshotIds || null
  );
  const [secureHmLockedAt, setSecureHmLockedAt] = useState<number | null>(
    savedAdminTx?.hmLockedAt || null
  );
  const [secureHmReleasedAt, setSecureHmReleasedAt] = useState<number | null>(
    savedAdminTx?.hmReleasedAt || null
  );

  // Cluster Settings
  const [secureClusterLockState, setSecureClusterLockState] = useState<'Lock' | 'Release'>(
    savedAdminTx?.clusterLockState || 'Lock'
  );
  const [secureClusterAutoMode, setSecureClusterAutoMode] = useState<boolean>(
    savedAdminTx?.clusterAutoMode ?? false
  );
  const [secureClusterAutoActiveTime, setSecureClusterAutoActiveTime] = useState<string | null>(
    savedAdminTx?.clusterAutoActiveTime || null
  );
  const [secureClusterSchedule, setSecureClusterSchedule] = useState<string>(
    savedAdminTx?.clusterSchedule || '0 Days'
  );
  const [secureClusterRatio, setSecureClusterRatio] = useState<string>(
    savedAdminTx?.clusterRatio || '1:2'
  );
  const [secureClusterLockedSnapshotIds, setSecureClusterLockedSnapshotIds] = useState<string[] | null>(
    savedAdminTx?.clusterLockedSnapshotIds || null
  );
  const [secureClusterLockedAt, setSecureClusterLockedAt] = useState<number | null>(
    savedAdminTx?.clusterLockedAt || null
  );
  const [secureClusterReleasedAt, setSecureClusterReleasedAt] = useState<number | null>(
    savedAdminTx?.clusterReleasedAt || null
  );

  // Effective Lists based on Lock/Release state
  const effectiveAdminCustomerPayableList = (secureCustomerLockState === 'Lock' && secureCustomerLockedSnapshotIds)
    ? adminCustomerPayableList.filter(c => secureCustomerLockedSnapshotIds.includes(c.id))
    : adminCustomerPayableList;

  const effectiveSellerPayableList = (secureSellerLockState === 'Lock' && secureSellerLockedSnapshotIds)
    ? sellerPayableList.filter(s => secureSellerLockedSnapshotIds.includes(s.id))
    : sellerPayableList;

  const effectiveAdminRiderPayableList = (secureRiderLockState === 'Lock' && secureRiderLockedSnapshotIds)
    ? adminRiderPayableList.filter(r => secureRiderLockedSnapshotIds.includes(r.id))
    : adminRiderPayableList;

  const effectiveAdminHmPayableList = (secureHmLockState === 'Lock' && secureHmLockedSnapshotIds)
    ? adminHmPayableList.filter(h => secureHmLockedSnapshotIds.includes(h.id))
    : adminHmPayableList;

  const effectiveAdminClusterPayableList = (secureClusterLockState === 'Lock' && secureClusterLockedSnapshotIds)
    ? adminClusterPayableList.filter(cl => secureClusterLockedSnapshotIds.includes(cl.id))
    : adminClusterPayableList;

  // Real-time Auto Mode cycle
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let updated = false;

      // Customer Auto Cycle
      if (secureCustomerAutoMode) {
        const { hours, days } = parseRatio(secureCustomerRatio);
        if (secureCustomerLockState === 'Lock') {
          const lockMs = secureCustomerSchedule === 'Instant' ? 10000 : Math.max(10000, hours * 3600 * 1000);
          const start = secureCustomerLockedAt || now;
          if (now - start >= lockMs) {
            setSecureCustomerLockState('Release');
            setSecureCustomerLockedSnapshotIds(null);
            setSecureCustomerReleasedAt(now);
            updated = true;
          }
        } else if (secureCustomerLockState === 'Release') {
          const relMs = secureCustomerSchedule === 'Instant' ? 10000 : Math.max(10000, days * 3600 * 1000);
          const start = secureCustomerReleasedAt || now;
          if (now - start >= relMs) {
            setSecureCustomerLockState('Lock');
            setSecureCustomerLockedSnapshotIds(adminCustomerPayableList.map(c => c.id));
            setSecureCustomerLockedAt(now);
            updated = true;
          }
        }
      }

      // Seller Auto Cycle
      if (secureSellerAutoMode) {
        const { hours, days } = parseRatio(secureSellerRatio);
        if (secureSellerLockState === 'Lock') {
          const lockMs = secureSellerSchedule === 'Instant' ? 10000 : Math.max(10000, hours * 3600 * 1000);
          const start = secureSellerLockedAt || now;
          if (now - start >= lockMs) {
            setSecureSellerLockState('Release');
            setSecureSellerLockedSnapshotIds(null);
            setSecureSellerReleasedAt(now);
            updated = true;
          }
        } else if (secureSellerLockState === 'Release') {
          const relMs = secureSellerSchedule === 'Instant' ? 10000 : Math.max(10000, days * 3600 * 1000);
          const start = secureSellerReleasedAt || now;
          if (now - start >= relMs) {
            setSecureSellerLockState('Lock');
            setSecureSellerLockedSnapshotIds(sellerPayableList.map(s => s.id));
            setSecureSellerLockedAt(now);
            updated = true;
          }
        }
      }

      // Rider Auto Cycle
      if (secureRiderAutoMode) {
        const { hours, days } = parseRatio(secureRiderRatio);
        if (secureRiderLockState === 'Lock') {
          const lockMs = secureRiderSchedule === 'Instant' ? 10000 : Math.max(10000, hours * 3600 * 1000);
          const start = secureRiderLockedAt || now;
          if (now - start >= lockMs) {
            setSecureRiderLockState('Release');
            setSecureRiderLockedSnapshotIds(null);
            setSecureRiderReleasedAt(now);
            updated = true;
          }
        } else if (secureRiderLockState === 'Release') {
          const relMs = secureRiderSchedule === 'Instant' ? 10000 : Math.max(10000, days * 3600 * 1000);
          const start = secureRiderReleasedAt || now;
          if (now - start >= relMs) {
            setSecureRiderLockState('Lock');
            setSecureRiderLockedSnapshotIds(adminRiderPayableList.map(r => r.id));
            setSecureRiderLockedAt(now);
            updated = true;
          }
        }
      }

      // Hub Manager Auto Cycle
      if (secureHmAutoMode) {
        const { hours, days } = parseRatio(secureHmRatio);
        if (secureHmLockState === 'Lock') {
          const lockMs = secureHmSchedule === 'Instant' ? 10000 : Math.max(10000, hours * 3600 * 1000);
          const start = secureHmLockedAt || now;
          if (now - start >= lockMs) {
            setSecureHmLockState('Release');
            setSecureHmLockedSnapshotIds(null);
            setSecureHmReleasedAt(now);
            updated = true;
          }
        } else if (secureHmLockState === 'Release') {
          const relMs = secureHmSchedule === 'Instant' ? 10000 : Math.max(10000, days * 3600 * 1000);
          const start = secureHmReleasedAt || now;
          if (now - start >= relMs) {
            setSecureHmLockState('Lock');
            setSecureHmLockedSnapshotIds(adminHmPayableList.map(h => h.id));
            setSecureHmLockedAt(now);
            updated = true;
          }
        }
      }

      // Cluster Auto Cycle
      if (secureClusterAutoMode) {
        const { hours, days } = parseRatio(secureClusterRatio);
        if (secureClusterLockState === 'Lock') {
          const lockMs = secureClusterSchedule === 'Instant' ? 10000 : Math.max(10000, hours * 3600 * 1000);
          const start = secureClusterLockedAt || now;
          if (now - start >= lockMs) {
            setSecureClusterLockState('Release');
            setSecureClusterLockedSnapshotIds(null);
            setSecureClusterReleasedAt(now);
            updated = true;
          }
        } else if (secureClusterLockState === 'Release') {
          const relMs = secureClusterSchedule === 'Instant' ? 10000 : Math.max(10000, days * 3600 * 1000);
          const start = secureClusterReleasedAt || now;
          if (now - start >= relMs) {
            setSecureClusterLockState('Lock');
            setSecureClusterLockedSnapshotIds(adminClusterPayableList.map(cl => cl.id));
            setSecureClusterLockedAt(now);
            updated = true;
          }
        }
      }

      if (updated) {
        try {
          const raw = localStorage.getItem('ss_secure_tx_settings_admin');
          if (raw) {
            const current = JSON.parse(raw);
            current.customerLockState = secureCustomerLockState;
            current.sellerLockState = secureSellerLockState;
            current.riderLockState = secureRiderLockState;
            current.hmLockState = secureHmLockState;
            current.clusterLockState = secureClusterLockState;
            localStorage.setItem('ss_secure_tx_settings_admin', JSON.stringify(current));
          }
        } catch (e) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    secureCustomerLockState, secureCustomerAutoMode, secureCustomerRatio, secureCustomerSchedule, secureCustomerLockedAt, secureCustomerReleasedAt, adminCustomerPayableList,
    secureSellerLockState, secureSellerAutoMode, secureSellerRatio, secureSellerSchedule, secureSellerLockedAt, secureSellerReleasedAt, sellerPayableList,
    secureRiderLockState, secureRiderAutoMode, secureRiderRatio, secureRiderSchedule, secureRiderLockedAt, secureRiderReleasedAt, adminRiderPayableList,
    secureHmLockState, secureHmAutoMode, secureHmRatio, secureHmSchedule, secureHmLockedAt, secureHmReleasedAt, adminHmPayableList,
    secureClusterLockState, secureClusterAutoMode, secureClusterRatio, secureClusterSchedule, secureClusterLockedAt, secureClusterReleasedAt, adminClusterPayableList
  ]);

  const [adminCustomerPayableSearch, setAdminCustomerPayableSearch] = useState('');
  const [adminSellerPayableSearch, setAdminSellerPayableSearch] = useState('');
  const [adminSellerSelectedClusterId, setAdminSellerSelectedClusterId] = useState<string | null>(null);
  const [adminRiderPayableSearch, setAdminRiderPayableSearch] = useState('');
  const [adminHmPayableSearch, setAdminHmPayableSearch] = useState('');
  const [adminClusterPayableSearch, setAdminClusterPayableSearch] = useState('');

  const filteredAdminCustomerPayableList = effectiveAdminCustomerPayableList.filter(cust => {
    if (!adminCustomerPayableSearch.trim()) return true;
    const q = adminCustomerPayableSearch.toLowerCase();
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

  const filteredAdminSellerPayableList = effectiveSellerPayableList.filter(seller => {
    if (adminSellerSelectedClusterId && adminSellerSelectedClusterId !== 'all') {
      if (seller.clusterId !== adminSellerSelectedClusterId) return false;
    }
    if (!adminSellerPayableSearch.trim()) return true;
    const q = adminSellerPayableSearch.toLowerCase();
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

  const filteredAdminRiderPayableList = effectiveAdminRiderPayableList.filter(rider => {
    if (!adminRiderPayableSearch.trim()) return true;
    const q = adminRiderPayableSearch.toLowerCase();
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

  const filteredAdminHmPayableList = effectiveAdminHmPayableList.filter(hm => {
    if (!adminHmPayableSearch.trim()) return true;
    const q = adminHmPayableSearch.toLowerCase();
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

  const filteredAdminClusterPayableList = effectiveAdminClusterPayableList.filter(cluster => {
    if (!adminClusterPayableSearch.trim()) return true;
    const q = adminClusterPayableSearch.toLowerCase();
    return (
      (cluster.name && String(cluster.name).toLowerCase().includes(q)) ||
      (cluster.short_id && String(cluster.short_id).toLowerCase().includes(q)) ||
      (cluster.id && String(cluster.id).toLowerCase().includes(q)) ||
      (cluster.mobile && String(cluster.mobile).toLowerCase().includes(q)) ||
      (cluster.bank_name && String(cluster.bank_name).toLowerCase().includes(q)) ||
      (cluster.account_no && String(cluster.account_no).toLowerCase().includes(q)) ||
      (cluster.ifsc_code && String(cluster.ifsc_code).toLowerCase().includes(q)) ||
      (cluster.upi_id && String(cluster.upi_id).toLowerCase().includes(q))
    );
  });

  const fetchSellerPayableAmount = async () => {
    try {
      const { data: incomeData, error: incomeError } = await supabase.from('selller_income_estimate').select('*').eq('payout status', 'Pending');
      if (incomeError) {
        if (incomeError.code === 'PGRST303') {
          setTimeout(fetchSellerPayableAmount, 2000);
          return;
        }
        throw incomeError;
      }
      
      const { data: sellers, error: sellersError } = await supabase.from('sellers').select('*');
      if (sellersError) throw sellersError;

      // Accurately identify cluster from accepted_shipments
      const { data: acceptedRows, error: acceptedErr } = await supabase.from('accepted_shipments').select('"selller id", "cluster id", "order ID", "awb number"');
      if (acceptedErr) console.warn("Error fetching accepted_shipments for cluster mapping:", acceptedErr);

      const { data: clustersData, error: clustersErr } = await supabase.from('clusters').select('*');
      if (clustersErr) console.warn("Error fetching clusters:", clustersErr);

      const clusterMap: Record<string, any> = {};
      (clustersData || []).forEach((c: any) => {
        clusterMap[c.id] = c;
      });

      const sellerToClusterMap: Record<string, string> = {};
      const orderToClusterMap: Record<string, string> = {};
      (acceptedRows || []).forEach((row: any) => {
        const sId = row['selller id'] || row['seller id'];
        const cId = row['cluster id'];
        const ordId = row['order ID'] || row['order id'];
        if (sId && cId) sellerToClusterMap[sId] = cId;
        if (ordId && cId) orderToClusterMap[ordId] = cId;
      });

      const sellerMap: Record<string, any> = {};
      (sellers || []).forEach((s: any) => {
        sellerMap[s.id] = s;
      });

      let total = 0;
      const aggregated: Record<string, number> = {};
      const sellerClusterResolved: Record<string, string> = {};

      (incomeData || []).forEach((row: any) => {
        const sId = row['seller id'] || row['selller id'];
        if (!sId) return;

        const amt = parseFloat(row['final payable amount'] || '0');
        total += amt;

        if (!aggregated[sId]) {
          aggregated[sId] = 0;
        }
        aggregated[sId] += amt;

        if (!sellerClusterResolved[sId]) {
          const ordId = row['order id'] || row['order ID'];
          const cIdFromOrder = ordId ? orderToClusterMap[ordId] : null;
          const cIdFromSeller = sellerToClusterMap[sId];
          sellerClusterResolved[sId] = cIdFromOrder || cIdFromSeller || '';
        }
      });

      const list = Object.keys(aggregated).map(sId => {
        const sInfo = sellerMap[sId] || ({} as any);
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
          clusterId: sellerClusterResolved[sId] || ''
        };
      });

      setSellerPayableList(list);
      setTotalSellerPayableAmount(total);

      // Group sellers based on cluster
      const groups: Record<string, {
        clusterId: string;
        clusterName: string;
        clusterShortId: string;
        clusterMobile: string;
        sellerCount: number;
        totalAmount: number;
        sellers: any[];
      }> = {};

      list.forEach(seller => {
        const cId = seller.clusterId || 'unassigned';
        if (!groups[cId]) {
          const cInfo = clusterMap[cId] || {};
          groups[cId] = {
            clusterId: cId,
            clusterName: cId === 'unassigned' ? 'Direct / Unassigned Cluster' : (cInfo.cluster_name || cInfo.name || 'Cluster Hub'),
            clusterShortId: cId === 'unassigned' ? 'DIRECT' : cId.substring(0, 8),
            clusterMobile: cInfo.registered_mobile_number || cInfo.mobile || 'N/A',
            sellerCount: 0,
            totalAmount: 0,
            sellers: []
          };
        }
        groups[cId].sellers.push(seller);
        groups[cId].sellerCount += 1;
        groups[cId].totalAmount += seller.amount;
      });

      const clusterGroupList = Object.values(groups).sort((a, b) => {
        if (a.clusterId === 'unassigned') return 1;
        if (b.clusterId === 'unassigned') return -1;
        return b.totalAmount - a.totalAmount;
      });

      setSellerPayablesByCluster(clusterGroupList);
    } catch(e: any) {
      if (e?.message === 'TypeError: Failed to fetch' || e?.details === 'TypeError: Failed to fetch') {
        setTimeout(fetchSellerPayableAmount, 3000);
      } else {
        console.error("fetchSellerPayableAmount err", e);
      }
    }
  };

  useEffect(() => {
    fetchSellerPayableAmount();

    const channel = supabase.channel('admin_cluster_seller_payables_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments' }, () => {
        fetchSellerPayableAmount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'selller_income_estimate' }, () => {
        fetchSellerPayableAmount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sellers' }, () => {
        fetchSellerPayableAmount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

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
 const results = await trackAllSearch(trackSearchTerm, activeTrackCategory, true);
 setTrackResults(results);
 setIsTracking(false);
 };

 useEffect(() => {
 // Re-run search if category changes AND we already have a valid term that was searched
 if (trackSearchTerm.length >= 3 && trackResults.length > 0) {
 handleTrackSearch();
 }
 }, [activeTrackCategory]);

  // All Orders (Upload Products) Modal States & Push Notifications
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  const [allOrdersSearchTerm, setAllOrdersSearchTerm] = useState('');
  const [allOrdersProducts, setAllOrdersProducts] = useState<any[]>([]);
  const [filteredOrdersProducts, setFilteredOrdersProducts] = useState<any[]>([]);
  const [isLoadingAllOrders, setIsLoadingAllOrders] = useState(false);
  const [pushingProductId, setPushingProductId] = useState<string | null>(null);
  const [pushedProductId, setPushedProductId] = useState<string | null>(null);
  const [allOrdersAudienceType, setAllOrdersAudienceType] = useState<'all' | 'unit'>('all');
  const [allOrdersUnitCount, setAllOrdersUnitCount] = useState<string>('');

  const applyAllOrdersFilter = (term: string, sourceList?: any[]) => {
    const list = sourceList || allOrdersProducts;
    const q = term.trim().toLowerCase();
    if (!q) {
      setFilteredOrdersProducts(list);
      return;
    }
    const filtered = list.filter(p => {
      const sellerId = String(p.seller_id || '').toLowerCase();
      const prodCode = String(p['product code'] || '').toLowerCase();
      const prodName = String(p['product name'] || '').toLowerCase();
      const prodTitle = String(p['product title name'] || '').toLowerCase();
      return sellerId.includes(q) || prodCode.includes(q) || prodName.includes(q) || prodTitle.includes(q);
    });
    setFilteredOrdersProducts(filtered);
  };

  const fetchAllOrdersProducts = async (currentTerm?: string) => {
    setIsLoadingAllOrders(true);
    try {
      const { data, error } = await supabase
        .from('upload_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllOrdersProducts(data);
        const term = currentTerm !== undefined ? currentTerm : allOrdersSearchTerm;
        applyAllOrdersFilter(term, data);
      }
    } catch (err) {
      console.error("Error fetching upload_products:", err);
    } finally {
      setIsLoadingAllOrders(false);
    }
  };

  const handleAllOrdersSearch = () => {
    applyAllOrdersFilter(allOrdersSearchTerm);
  };

  useEffect(() => {
    if (showAllOrdersModal) {
      fetchAllOrdersProducts(allOrdersSearchTerm);
      const channel = supabase.channel(`admin_all_orders_rt_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'upload_products' }, () => {
          fetchAllOrdersProducts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [showAllOrdersModal]);

  const handlePushProduct = async (item: any) => {
    if (pushingProductId) return;

    let targetCustomerIds: string[] | null = null;
    let targetCount: number | null = null;

    if (allOrdersAudienceType === 'unit') {
      const parsed = parseInt(allOrdersUnitCount, 10);
      if (isNaN(parsed) || parsed <= 0) {
        alert('Kripya unit ki sahi sankhya darj karein (Please enter a valid unit number greater than 0)');
        return;
      }
      targetCount = parsed;
    }

    setPushingProductId(item.id);

    try {
      let firstImg = '';
      const rawImgs = item['product images'];
      if (Array.isArray(rawImgs) && rawImgs.length > 0) {
        firstImg = rawImgs[0];
      } else if (typeof rawImgs === 'string') {
        try {
          const parsed = JSON.parse(rawImgs);
          if (Array.isArray(parsed) && parsed.length > 0) firstImg = parsed[0];
          else firstImg = rawImgs;
        } catch {
          firstImg = rawImgs;
        }
      }

      // If unit audience is selected, fetch exactly up to `targetCount` valid customer accounts
      if (allOrdersAudienceType === 'unit' && targetCount && targetCount > 0) {
        const { data: customerRows, error: custErr } = await supabase
          .from('customers')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(targetCount);

        if (!custErr && customerRows) {
          targetCustomerIds = customerRows.map((c: any) => c.id).filter(Boolean);
        } else {
          targetCustomerIds = [];
        }
      }

      const payload = {
        product_id: item.id,
        product_name: item['product name'] || 'Product Update',
        product_title_name: item['product title name'] || '',
        product_code: item['product code'] || '',
        product_image: firstImg,
        seller_id: item.seller_id,
        full_product: item,
        audience_mode: allOrdersAudienceType,
        unit_count: targetCount,
        target_customer_ids: targetCustomerIds,
        timestamp: new Date().toISOString()
      };

      // 1. Directly update Supabase customers table
      if (allOrdersAudienceType === 'unit' && targetCustomerIds) {
        if (targetCustomerIds.length > 0) {
          await supabase
            .from('customers')
            .update({ updated_at: new Date().toISOString() })
            .in('id', targetCustomerIds);
        }
      } else {
        await supabase
          .from('customers')
          .update({ updated_at: new Date().toISOString() })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // 2. Call backend server endpoint
      try {
        await fetch('/api/admin/push-product-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: payload })
        });
      } catch (e) {
        console.warn("Backend push notification error:", e);
      }

      // 3. Broadcast directly via Supabase Realtime channel for instant real-time delivery
      const rtChannel = supabase.channel('customers_web_push_channel');
      await rtChannel.send({
        type: 'broadcast',
        event: 'customer_web_push_notification',
        payload: payload
      });

      setPushedProductId(item.id);
      setTimeout(() => {
        setPushedProductId(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to push product notification:", err);
    } finally {
      setPushingProductId(null);
    }
  };

 const [showCashClustersModal, setShowCashClustersModal] = useState(false);
 const [totalCashWithClusters, setTotalCashWithClusters] = useState<number | null>(null);
 const [cashClustersList, setCashClustersList] = useState<any[]>([]);
 const [collectingClusterId, setCollectingClusterId] = useState<string | null>(null);

 const [adminCollectedCash, setAdminCollectedCash] = useState(0);
 const [isLoadingAdminCash, setIsLoadingAdminCash] = useState(true);
 const [adminPendingDepositsList, setAdminPendingDepositsList] = useState<any[]>([]);
 const [showAdminPendingDepositModal, setShowAdminPendingDepositModal] = useState(false);

 const fetchAdminCollectedCash = async (id?: string) => {
 try {
 const targetId = id || adminProfileId;
 if (!targetId) return;
 const { data, error } = await supabase.from('cash_with_admin').select('*').eq('admin id', targetId).order('created_at', { ascending: true });
 if (error && error.code === 'PGRST303') {
 setTimeout(() => fetchAdminCollectedCash(targetId), 2000);
 return;
 }
 if (!error && data) {
 let total = 0;
 data.forEach(row => {
 total += parseFloat(row['total cash payment'] || '0');
 });
 setAdminCollectedCash(total);
 setAdminPendingDepositsList(data);
 } else {
 setAdminCollectedCash(0);
 setAdminPendingDepositsList([]);
 }
 } catch(err) {} finally {
 setIsLoadingAdminCash(false);
 }
 };

 // Clear All Cash With Admin State & Handler
 const [isClearingAdminCash, setIsClearingAdminCash] = useState(false);

 const handleClearAllAdminCash = async () => {
 if (adminPendingDepositsList.length === 0 && adminCollectedCash === 0) {
 alert("No pending deposits found to clear.");
 return;
 }

 setIsClearingAdminCash(true);
 try {
 // 1. Delete by admin id if available
 if (adminProfileId) {
 await supabase.from('cash_with_admin').delete().eq('admin id', adminProfileId);
 }
 // 2. Delete all records matching existing IDs in list
 const ids = adminPendingDepositsList.map(d => d.id).filter(Boolean);
 if (ids.length > 0) {
 await supabase.from('cash_with_admin').delete().in('id', ids);
 }
 // 3. Ensure any remaining records in cash_with_admin are wiped cleanly
 await supabase.from('cash_with_admin').delete().neq('id', '00000000-0000-0000-0000-000000000000');

 setAdminCollectedCash(0);
 setAdminPendingDepositsList([]);

 if (adminProfileId) {
 await fetchAdminCollectedCash(adminProfileId);
 }
 } catch (err: any) {
 console.error("Error clearing cash_with_admin:", err);
 alert("Error clearing pending deposits: " + (err?.message || "Unknown error"));
 } finally {
 setIsClearingAdminCash(false);
 }
 };

 // Total Online Payments & Finished Online Payments States
 const [adminTotalOnlineAmount, setAdminTotalOnlineAmount] = useState(0);
 const [onlinePaymentsList, setOnlinePaymentsList] = useState<any[]>([]);
 const [isLoadingOnlinePayments, setIsLoadingOnlinePayments] = useState(true);
 const [showAdminOnlinePaymentsModal, setShowAdminOnlinePaymentsModal] = useState(false);
 const [showOnlinePaymentAuth, setShowOnlinePaymentAuth] = useState(false);
 const [onlinePaymentPassword, setOnlinePaymentPassword] = useState('');
 const [isVerifyingOnlinePaymentPassword, setIsVerifyingOnlinePaymentPassword] = useState(false);
 const [onlinePaymentAuthError, setOnlinePaymentAuthError] = useState('');

 const handleVerifyOnlinePaymentPassword = async () => {
   const entered = onlinePaymentPassword.trim();
   if (!entered || isVerifyingOnlinePaymentPassword) return;

   setIsVerifyingOnlinePaymentPassword(true);
   setOnlinePaymentAuthError('');

   try {
     const { data, error } = await supabase
       .from('riders_setting')
       .select('*')
       .limit(1)
       .maybeSingle();

     if (error) {
       console.error("Error fetching riders_setting for online payment verification:", error);
       setOnlinePaymentAuthError("सर्वर त्रुटि: पुनः प्रयास करें।");
       setIsVerifyingOnlinePaymentPassword(false);
       return;
     }

     const riderRuleValue = (data && data['rider rule']) ? String(data['rider rule']).trim() : '';
     let expectedPassword = riderRuleValue;
     if (riderRuleValue.includes('||')) {
       expectedPassword = riderRuleValue.split('||')[0].trim();
     }

     if (entered === expectedPassword || entered === riderRuleValue) {
       setShowOnlinePaymentAuth(false);
       setShowAdminOnlinePaymentsModal(true);
       setOnlinePaymentPassword('');
       setOnlinePaymentAuthError('');
     } else {
       setOnlinePaymentAuthError("गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें।");
     }
   } catch (err) {
     console.error("Online payment password verification error:", err);
     setOnlinePaymentAuthError("सत्यापन विफल हुआ। कृपया पुनः प्रयास करें।");
   } finally {
     setIsVerifyingOnlinePaymentPassword(false);
   }
 };

 const [finishedTotalOnlineAmount, setFinishedTotalOnlineAmount] = useState(0);
 const [finishedOnlinePaymentsList, setFinishedOnlinePaymentsList] = useState<any[]>([]);
 const [isLoadingFinishedOnlinePayments, setIsLoadingFinishedOnlinePayments] = useState(false);
 const [showFinishedOnlinePaymentsModal, setShowFinishedOnlinePaymentsModal] = useState(false);
 const [isClearingOnlinePayments, setIsClearingOnlinePayments] = useState(false);

 const fetchAdminOnlinePayments = async () => {
 try {
 setIsLoadingOnlinePayments(true);
 const { data, error } = await supabase
 .from('online_payments')
 .select('*')
 .order('created_at', { ascending: false });

 if (!error && data) {
 let sum = 0;
 data.forEach((row: any) => {
 sum += parseFloat(row['total online payment'] || '0') || 0;
 });
 setAdminTotalOnlineAmount(sum);
 setOnlinePaymentsList(data);
 } else {
 setAdminTotalOnlineAmount(0);
 setOnlinePaymentsList([]);
 }
 } catch (err) {
 console.error("Error fetching online payments in admin:", err);
 } finally {
 setIsLoadingOnlinePayments(false);
 }
 };

 const fetchAdminFinishedOnlinePayments = async () => {
 try {
 setIsLoadingFinishedOnlinePayments(true);
 const { data, error } = await supabase
 .from('finished_online_payments')
 .select('*')
 .order('created_at', { ascending: false });

 if (!error && data) {
 let sum = 0;
 data.forEach((row: any) => {
 sum += parseFloat(row['total online payment'] || '0') || 0;
 });
 setFinishedTotalOnlineAmount(sum);
 setFinishedOnlinePaymentsList(data);
 } else {
 setFinishedTotalOnlineAmount(0);
 setFinishedOnlinePaymentsList([]);
 }
 } catch (err) {
 console.error("Error fetching finished online payments in admin:", err);
 } finally {
 setIsLoadingFinishedOnlinePayments(false);
 }
 };

 useEffect(() => {
 fetchAdminOnlinePayments();
 fetchAdminFinishedOnlinePayments();

 const channel = supabase.channel('admin_online_payments_realtime_' + Math.random().toString(36).substring(7))
 .on('postgres_changes', { event: '*', schema: 'public', table: 'online_payments' }, () => {
 fetchAdminOnlinePayments();
 })
 .on('postgres_changes', { event: '*', schema: 'public', table: 'finished_online_payments' }, () => {
 fetchAdminFinishedOnlinePayments();
 })
 .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_admin' }, () => {
 if (adminProfileId) fetchAdminCollectedCash(adminProfileId);
 })
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, []);

 const handleClearAllOnlinePayments = async () => {
 try {
 setIsClearingOnlinePayments(true);

 // Fetch fresh rows directly from supabase online_payments
 const { data: dbOnlineRows, error: fetchErr } = await supabase
 .from('online_payments')
 .select('*');

 if (fetchErr) {
 console.error("Error fetching online payments to clear:", fetchErr);
 }

 const rowsToTransfer = (dbOnlineRows && dbOnlineRows.length > 0) 
 ? dbOnlineRows 
 : onlinePaymentsList;

 if (!rowsToTransfer || rowsToTransfer.length === 0) {
 setIsClearingOnlinePayments(false);
 return;
 }

 // UUID validator helper
 const isValidUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

 const currentAdmin = localStorage.getItem('ss_admin_auth') || localStorage.getItem('portal_auth_admin');
 let parsedAdminId: string | null = null;
 if (currentAdmin) {
 try {
 const parsed = JSON.parse(currentAdmin);
 parsedAdminId = parsed?.id || null;
 } catch (e) {}
 }
 const rawAdminId = parsedAdminId || adminProfileId;
 const adminId = isValidUUID(rawAdminId) ? rawAdminId : null;

 // 1. Transfer to finished_online_payments
 const transferRows = rowsToTransfer.map((item: any) => ({
 'admin id': adminId,
 'rider id': isValidUUID(item['rider id']) ? item['rider id'] : null,
 'online payment status': item['online payment status'] || '',
 'total online payment': item['total online payment'] !== undefined && item['total online payment'] !== null ? String(item['total online payment']) : '0',
 created_at: item.created_at || new Date().toISOString(),
 updated_at: new Date().toISOString()
 }));

 for (let i = 0; i < transferRows.length; i += 50) {
 const batch = transferRows.slice(i, i + 50);
 const { error: insertError } = await supabase
 .from('finished_online_payments')
 .insert(batch);

 if (insertError) {
 console.error("Error inserting into finished_online_payments:", insertError);
 throw insertError;
 }
 }

 // 2. Delete transferred rows from online_payments
 const idsToDelete = rowsToTransfer.map((item: any) => item.id).filter(Boolean);
 if (idsToDelete.length > 0) {
 for (let i = 0; i < idsToDelete.length; i += 50) {
 const batch = idsToDelete.slice(i, i + 50);
 await supabase.from('online_payments').delete().in('id', batch);
 }
 }
 await supabase.from('online_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

 setOnlinePaymentsList([]);
 setAdminTotalOnlineAmount(0);
 await Promise.all([fetchAdminOnlinePayments(), fetchAdminFinishedOnlinePayments()]);

 // Open Finished Online Payments modal so user immediately sees all transferred details
 setShowFinishedOnlinePaymentsModal(true);
 } catch (err: any) {
 console.error("Error clearing online payments:", err);
 } finally {
 setIsClearingOnlinePayments(false);
 }
 };

 useEffect(() => {
 if (adminProfileId && (activeTab === 'Payments' || activeTab === 'Dashboard')) {
 fetchAdminCollectedCash(adminProfileId);
 }
 }, [adminProfileId, activeTab]);

 useEffect(() => {
 if (activeTab === 'Payments') {
 fetchCashClusters();
 fetchCashWithRiders();
 fetchCashWithHubManagers();
 fetchAdminHmPayableAmount();

 const pmtChannel = supabase.channel(`admin_pmt_rt_${Date.now()}`)
   .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_riders' }, () => {
     fetchCashWithRiders();
   })
   .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_live_work_flow' }, () => {
     fetchCashWithRiders();
   })
   .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_hub_managers' }, () => {
     fetchCashWithHubManagers();
   })
   .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_hub_manager_salary' }, () => {
     fetchAdminHmPayableAmount();
   })
   .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_managers' }, () => {
     fetchAdminHmPayableAmount();
   })
   .subscribe();

 return () => {
   supabase.removeChannel(pmtChannel);
 };
 }
 }, [activeTab]);

 const fetchCashWithRiders = async () => {
 try {
 const [{ data: cwrData, error: cwrError }, { data: wfData }, { data: ridersData }] = await Promise.all([
   supabase.from('cash_with_riders').select('*').order('created_at', { ascending: true }),
   supabase.from('rider_live_work_flow').select('*'),
   supabase.from('riders').select('id, rider_name, registered_mobile_number, cluster_id')
 ]);
 if (cwrError) throw cwrError;

 const allRiderIds = new Set<string>();
 (cwrData || []).forEach((c: any) => { if (c['rider id']) allRiderIds.add(c['rider id']); });
 (wfData || []).forEach((w: any) => { if (w.rider_id) allRiderIds.add(w.rider_id); });

 let total = 0;
 const list: any[] = [];

 allRiderIds.forEach((riderId: string) => {
   const records = (cwrData || []).filter((c: any) => c['rider id'] === riderId);
   const cwrPayment = records.reduce((acc: number, curr: any) => acc + (Number(curr['total cash payment']) || 0), 0);

   const wfRecords = (wfData || []).filter((w: any) => w.rider_id === riderId);
   const wfPayment = wfRecords.reduce((acc: number, curr: any) => Math.max(acc, Number(curr['Total Cash']) || 0), 0);

   const totalPayment = Math.max(cwrPayment, wfPayment);
   const riderInfo = (ridersData || []).find((r: any) => r.id === riderId) || ({} as any);

   if (totalPayment > 0) {
     total += totalPayment;
     list.push({
       id: riderId,
       rider_name: riderInfo.rider_name || 'Unknown Rider',
       registered_mobile_number: riderInfo.registered_mobile_number || 'N/A',
       cluster_id: riderInfo.cluster_id || null,
       cash: totalPayment,
       rawRecords: records
     });
   }
 });
 setCashRidersList(list);
 setTotalCashWithRiders(total);
 } catch (err: any) {
 if (err?.message === 'TypeError: Failed to fetch' || err?.details === 'TypeError: Failed to fetch') {
 setTimeout(fetchCashWithRiders, 3000);
 } else {
 console.error("Error fetching cash riders:", err);
 }
 }
 };

 const fetchCashWithHubManagers = async () => {
 try {
 const { data: chmData, error: chmError } = await supabase.from('cash_with_hub_managers').select('*').order('created_at', { ascending: true });
 if (chmError) throw chmError;
 if (chmData && chmData.length > 0) {
 const hubManagerIds = [...new Set(chmData.map((i: any) => i['hub manager id']).filter(Boolean))];
 const { data: hmData } = await supabase.from('hub_managers').select('id, hub_name, hub_manager_name, registered_mobile_number, cluster_id').in('id', hubManagerIds);
 
 let total = 0;
 const list: any[] = [];
 
 hubManagerIds.forEach((hmId: any) => {
 const records = chmData.filter((c: any) => c['hub manager id'] === hmId);
 const totalPayment = records.reduce((acc: number, curr: any) => acc + (Number(curr['total cash payment']) || 0), 0);
 const hmInfo = (hmData || []).find((h: any) => h.id === hmId) || ({} as any);
 
 if (totalPayment > 0) {
 total += totalPayment;
 list.push({
 id: hmId,
 hub_name: hmInfo.hub_name || 'Unknown Hub',
 hub_manager_name: hmInfo.hub_manager_name || 'Unknown Manager',
 registered_mobile_number: hmInfo.registered_mobile_number || 'N/A',
 cluster_id: hmInfo.cluster_id || null,
 cash: totalPayment,
 rawRecords: records
 });
 }
 });
 setCashHubManagersList(list);
 setTotalCashWithHubManagers(total);
 } else {
 setCashHubManagersList([]);
 setTotalCashWithHubManagers(0);
 }
 } catch (err: any) {
 if (err?.message === 'TypeError: Failed to fetch' || err?.details === 'TypeError: Failed to fetch') {
 setTimeout(fetchCashWithHubManagers, 3000);
 } else {
 console.error("Error fetching cash hub managers:", err);
 }
 }
 };

 // Fetch cash clusters for Admin
 const fetchCashClusters = async () => {
 try {
 const { data: cashData, error: cashError } = await supabase.from('cash_with_clusters').select('*').order('created_at', { ascending: true });
 if (cashError) {
 if (cashError.code === 'PGRST303' || cashError.message.includes('JWT issued at future')) {
 setTimeout(fetchCashClusters, 2000);
 return;
 }
 throw cashError;
 }
 
 let total = 0;
 const list: any[] = [];
 const { data: clustersData } = await supabase.from('clusters').select('id, cluster_name, registered_mobile_number');
 
 const clusterIds = [...new Set((cashData || []).map((i: any) => i['cluster id']).filter(Boolean))];
 
 clusterIds.forEach((cid: any) => {
 const records = (cashData || []).filter((c: any) => c['cluster id'] === cid);
 const clusterTotal = records.reduce((acc: number, curr: any) => acc + (Number(curr['total cash payment']) || 0), 0);
 const clusterInfo = (clustersData || []).find((c: any) => c.id === cid) || ({} as any);
 if (clusterTotal > 0) {
 total += clusterTotal;
 list.push({
 id: cid,
 cluster_name: clusterInfo.cluster_name || 'Unknown',
 registered_mobile_number: clusterInfo.registered_mobile_number || 'N/A',
 cash: clusterTotal,
 rawRecords: records
 });
 }
 });
 
 setCashClustersList(list);
 setTotalCashWithClusters(total);
 } catch (err: any) {
 if (err?.message === 'TypeError: Failed to fetch' || err?.details === 'TypeError: Failed to fetch') {
 setTimeout(fetchCashClusters, 3000);
 } else {
 console.error("Error fetching cash clusters:", err);
 }
 }
 };

 useEffect(() => {
 fetchCashClusters();
 fetchCashWithRiders();
 fetchCashWithHubManagers();
 }, [showCashClustersModal, showCashRidersModal, showCashHubManagersModal]);

 const [selectedClusterForCalc, setSelectedClusterForCalc] = useState<any | null>(null);
 const [clusterCalcDenominations, setClusterCalcDenominations] = useState<Record<number, number>>({});
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
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(() => {
    try {
      const data = typeof window !== 'undefined' ? localStorage.getItem('ss_secure_tx_settings_admin') : null;
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.selectedPaymentMethods) && parsed.selectedPaymentMethods.length > 0) {
          return parsed.selectedPaymentMethods;
        }
      }
    } catch (e) {}
    return ['1'];
  });
 const [paymentStates, setPaymentStates] = useState<Record<string, { status: 'pending' | 'processing' | 'hold' | 'settled' | 'failed', failedAt?: number }>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('admin_payable_payment_states') : null;
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_payable_payment_states', JSON.stringify(paymentStates));
      }
    } catch (e) {}
  }, [paymentStates]);

  const [adminDisbursementBalance, setAdminDisbursementBalance] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('admin_disbursement_balance') : null;
    return saved ? parseFloat(saved) : 250000;
  });

  const handlePayNow = (_userId?: string) => {
    if (!_userId) return;
    const target =
      adminCustomerPayableList.find(c => c.id === _userId) ||
      sellerPayableList.find(s => s.id === _userId) ||
      adminRiderPayableList.find(r => r.id === _userId) ||
      adminHmPayableList.find(h => h.id === _userId) ||
      adminClusterPayableList.find(cl => cl.id === _userId);

    if (!target) return;

    let savedTx: any = null;
    try {
      const raw = localStorage.getItem('ss_secure_tx_settings_admin');
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
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Deep link invocation error:", e);
    }
  };
 const handleHoldAmount = (userId: string) => {
 setPaymentStates(prev => ({ ...prev, [userId]: { status: 'hold' } }));
 };

 const handleMarkAsSettled = async (userId: string) => {
    if (paymentStates[userId]?.status === 'hold') return;
    setPaymentStates(prev => {
      const updated = { ...prev, [userId]: { status: 'settled' } };
      try {
        localStorage.setItem('admin_payable_payment_states', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
 
 // Check if it's a customer order
 const custOrder = adminCustomerPayableList.find(c => c.id === userId);
 if (custOrder) {
 try {
 await supabase.from('customer_orders').update({
 'payout status': 'settled'
 }).eq('id', custOrder.id);

 await supabase.from('finished_customers_payable_amount').insert([{
 'customer id': isValidUUID(custOrder.customer_id) ? custOrder.customer_id : null,
 'total amount': (custOrder.sum || 0).toString(),
 'bank name': custOrder.bank_name || 'N/A',
 'account no': custOrder.account_no || 'N/A',
 'ifsc code': custOrder.ifsc_code || 'N/A',
 'upi id': custOrder.upi_id || 'N/A',
 'total settled amount': (custOrder.sum || 0).toString(),
 'penalty amount': '0',
 'penalty status': 'N/A',
 'final Settlement status': 'settled'
 }]);

 fetchAdminCustomerPayableAmount();
 } catch (e) {
 console.error(e);
 }
 }

 // Check if it's a seller
 const sellerOrder = sellerPayableList.find(s => s.id === userId);
 if (sellerOrder) {
 try {
 // Fetch all pending income estimates for this seller
 const { data: incomeData } = await supabase.from('selller_income_estimate')
 .select('*')
 .eq('seller id', sellerOrder.id)
 .eq('payout status', 'Pending');
 
 if (incomeData && incomeData.length > 0) {
 const mappedEstimates = incomeData.map(row => {
 const { id, created_at, ...rest } = row;
 return {
 ...rest,
 'payout status': 'settled'
 };
 });
 
 // Insert into settled_selller_income_estimate
 await supabase.from('settled_selller_income_estimate').insert(mappedEstimates);

 // Update selller_income_estimate
 await supabase.from('selller_income_estimate')
 .update({ 'payout status': 'settled' })
 .eq('seller id', sellerOrder.id)
 .eq('payout status', 'Pending');
 
 // Update accepted_shipments
 const awbNumbers = incomeData.map(r => r['awb number']).filter(Boolean);
 if (awbNumbers.length > 0) {
 // Batch update in chunks of 100 if necessary, but typically < 100
 await supabase.from('accepted_shipments')
 .update({ 'payout status': 'settled' })
 .in('awb number', awbNumbers);

 // Process gift cash donation from customer orders
 const { data: customerOrdersData } = await supabase.from('customer_orders')
 .select('customer id, gift cash donation')
 .in('awb number', awbNumbers);
 
 if (customerOrdersData && customerOrdersData.length > 0) {
 const giftCashByCustomer: Record<string, number> = {};
 for (const order of customerOrdersData) {
 const gd = parseFloat(order['gift cash donation']) || 0;
 if (gd > 0 && order['customer id']) {
 giftCashByCustomer[order['customer id']] = (giftCashByCustomer[order['customer id']] || 0) + gd;
 }
 }
 
 for (const custId of Object.keys(giftCashByCustomer)) {
 const amountToAdd = giftCashByCustomer[custId];
 const { data: existingGiftCash } = await supabase.from('gift_cash')
 .select('received gift cash')
 .eq('customer id', custId)
 .maybeSingle();
 
 if (existingGiftCash) {
 const currentVal = parseFloat(existingGiftCash['received gift cash']) || 0;
 const newVal = currentVal + amountToAdd;
 await supabase.from('gift_cash')
 .update({ 'received gift cash': newVal.toString() })
 .eq('customer id', custId);
 } else {
 await supabase.from('gift_cash')
 .insert({ 
 'customer id': custId, 
 'received gift cash': amountToAdd.toString(),
 'claimed gift cash': '0',
 'used gift cash': '0'
 });
 }
 }
 }
 }
 }

 // Insert into finished_sellers_payable_amount
 await supabase.from('finished_sellers_payable_amount').insert([{
 'seller id': isValidUUID(sellerOrder.id) ? sellerOrder.id : null,
 'total amount': (sellerOrder.amount || 0).toString(),
 'bank name': sellerOrder.bank_name || 'N/A',
 'account no': sellerOrder.account_no || 'N/A',
 'ifsc code': sellerOrder.ifsc_code || 'N/A',
 'upi id': sellerOrder.upi_id || 'N/A',
 'total settled amount': (sellerOrder.amount || 0).toString(),
 'penalty amount': '0',
 'penalty status': 'N/A',
 'final Settlement status': 'settled'
 }]);

 fetchSellerPayableAmount();
 } catch (e) {
 console.error(e);
 }
 }

 // Check if it's a Rider
 const riderOrder = adminRiderPayableList.find(r => r.id === userId);
 if (riderOrder) {
 try {
 const { data: riderData } = await supabase.from('rider_shipment_work_flow')
 .select('*')
 .eq('rider_id', riderOrder.id);
 
 if (riderData && riderData.length > 0) {
 const mappedRider = riderData.map(row => {
 const { id, created_at, ...rest } = row;
 return {
 ...rest,
 'payout status': 'settled'
 };
 });
 
 await supabase.from('settled_rider_shipments').insert(mappedRider);

 await supabase.from('rider_shipment_work_flow')
 .delete()
 .eq('rider_id', riderOrder.id);
 }

 // Delete from riders_penalty
 await supabase.from('riders_penalty').delete().eq('rider id', riderOrder.id);

 await supabase.from('finished_riders_payable_amount').insert([{
 'rider id': isValidUUID(riderOrder.id) ? riderOrder.id : null,
 'total amount': (riderOrder.totalAmount || riderOrder.amount || 0).toString(),
 'bank name': riderOrder.bank_name || 'N/A',
 'account no': riderOrder.account_no || 'N/A',
 'ifsc code': riderOrder.ifsc_code || 'N/A',
 'upi id': riderOrder.upi_id || 'N/A',
 'total settled amount': (riderOrder.amount || 0).toString(),
 'penalty amount': (riderOrder.penaltyAmount || 0).toString(),
 'penalty status': 'N/A',
 'final Settlement status': 'settled'
 }]);

 fetchAdminRiderPayableAmount();
 } catch (e) {
 console.error(e);
 }
 }

 // Check if it's a Hub Manager
 const hmOrder = adminHmPayableList.find(h => h.id === userId);
 if (hmOrder) {
 try {
 const { data: hmData } = await supabase.from('hub_manager_salary')
 .select('*')
 .eq('hub manager id', hmOrder.id);
 
 if (hmData && hmData.length > 0) {
 const mappedHm = hmData.map(row => {
 const { id, created_at, ...rest } = row;
 return {
 ...rest,
 'hub manager id': isValidUUID(hmOrder.id) ? hmOrder.id : (isValidUUID(row['hub manager id']) ? row['hub manager id'] : null),
 'payout status': 'settled'
 };
 });
 
  const { error: insertHmErr } = await supabase.from('settled_hub_manager_salary').insert(mappedHm);
  if (insertHmErr) {
    console.error("Error inserting settled_hub_manager_salary:", insertHmErr);
  } else {
    await supabase.from('hub_manager_salary').delete().eq('hub manager id', hmOrder.id);
  }
  } else {
  // Hub Manager appointed by Admin using fixed_hub_manager_salary
  const { error: insertFixedErr } = await supabase.from('settled_hub_manager_salary').insert([{
  'hub manager id': isValidUUID(hmOrder.id) ? hmOrder.id : null,
  'fixed salary': (hmOrder.totalAmount || hmOrder.amount || 0).toString(),
  'payout status': 'settled'
  }]);
  if (insertFixedErr) {
    console.error("Error inserting fixed settled_hub_manager_salary:", insertFixedErr);
  }
  }

 // Delete from hub_managers_penalty
 await supabase.from('hub_managers_penalty').delete().eq('hub manager id', hmOrder.id);

 await supabase.from('finished_hub_managers_payable_amount').insert([{
 'hub manager id': isValidUUID(hmOrder.id) ? hmOrder.id : null,
 'total amount': (hmOrder.totalAmount || hmOrder.amount || 0).toString(),
 'bank name': hmOrder.bank_name || 'N/A',
 'account no': hmOrder.account_no || 'N/A',
 'ifsc code': hmOrder.ifsc_code || 'N/A',
 'upi id': hmOrder.upi_id || 'N/A',
 'total settled amount': (hmOrder.amount || 0).toString(),
 'penalty amount': (hmOrder.penaltyAmount || 0).toString(),
 'penalty status': 'N/A',
 'final Settlement status': 'settled'
 }]);

 fetchAdminHmPayableAmount();
 } catch (e) {
 console.error(e);
 }
 }

 // Check if it's a Cluster
 const clusterOrder = adminClusterPayableList.find(c => c.id === userId);
 if (clusterOrder) {
 try {
 // await supabase.from('finished_shipments').delete().eq('cluster id', clusterOrder.id);
 
 await supabase.from('clusters_penalty').delete().eq('cluster id', clusterOrder.id);

 await supabase.from('finished_clusters_payable_amount').insert([{
 'cluster id': isValidUUID(clusterOrder.id) ? clusterOrder.id : null,
 'total amount': (clusterOrder.totalAmount || 0).toString(),
 'bank name': clusterOrder.bank_name || 'N/A',
 'account no': clusterOrder.account_no || 'N/A',
 'ifsc code': clusterOrder.ifsc_code || 'N/A',
 'upi id': clusterOrder.upi_id || 'N/A',
 'total settled amount': (clusterOrder.payableAmount || 0).toString(),
 'penalty amount': (clusterOrder.penaltyAmount || 0).toString(),
 'penalty status': 'N/A',
 'final Settlement status': 'settled'
 }]);

 // Transfer to finished_shipments intentionally disabled per policy
    fetchAdminClusterPayableAmount();
 } catch (e) {
 console.error(e);
 }
 }
 };

 const [settlingAllUserType, setSettlingAllUserType] = useState<string | null>(null);
 const [settlingProgress, setSettlingProgress] = useState<{ current: number; total: number } | null>(null);

 const handleMarkAllSettledForType = async (type: 'Customer' | 'Seller' | 'Rider' | 'Hub Manager' | 'Cluster') => {
   let listToSettle: any[] = [];
   if (type === 'Customer') listToSettle = filteredAdminCustomerPayableList;
   else if (type === 'Seller') listToSettle = filteredAdminSellerPayableList;
   else if (type === 'Rider') listToSettle = filteredAdminRiderPayableList;
   else if (type === 'Hub Manager') listToSettle = filteredAdminHmPayableList;
   else if (type === 'Cluster') listToSettle = filteredAdminClusterPayableList;

   const eligibleItems = listToSettle.filter(item => paymentStates[item.id]?.status !== 'hold' && paymentStates[item.id]?.status !== 'settled');
   if (eligibleItems.length === 0) return;

   setSettlingAllUserType(type);
   setSettlingProgress({ current: 0, total: eligibleItems.length });

   for (let i = 0; i < eligibleItems.length; i++) {
     const item = eligibleItems[i];
     setSettlingProgress({ current: i + 1, total: eligibleItems.length });
     try {
       await handleMarkAsSettled(item.id);
     } catch (err) {
       console.error(`Error settling ${type} ${item.id}:`, err);
     }
     await new Promise(r => setTimeout(r, 120));
   }

   setSettlingAllUserType(null);
   setSettlingProgress(null);
 };

 const activePayableList = [...adminCustomerPayableList, ...sellerPayableList, ...adminRiderPayableList, ...adminHmPayableList, ...adminClusterPayableList];

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
 const [showLogoutModal, setShowLogoutModal] = useState(false);
 const [profileSavedToast, setProfileSavedToast] = useState(false);
 const [originalEmail, setOriginalEmail] = useState('');
 const [isLoadingProfile, setIsLoadingProfile] = useState(false);
 
 // Admin Profile State
 const [adminProfile, setAdminProfile] = useState<AdminProfileData>({
 name: 'SURIYAWAN SHOPPING Master Admin',
 mobile: '',
 email: '',
 address: '',
 gstNo: ''
 });

 useEffect(() => {
 async function fetchAdminProfile() {
 setIsLoadingProfile(true);
 const { data, error } = await supabase.from('admins').select('*').limit(1).single();
 if (!error && data) {
 setAdminProfileId(data.id);
 setOriginalEmail(data.email_address || '');
 setAdminProfile({
 name: data.admin_name || '',
 mobile: data.mobile_number || '',
 email: data.email_address || '',
 address: data.address || '',
 gstNo: data.gstin || ''
 });
 }
 setIsLoadingProfile(false);
 }
 
 if (showProfile || !adminProfileId) {
 fetchAdminProfile();
 }
 }, [showProfile, adminProfileId]);

 const [isSavingProfile, setIsSavingProfile] = useState(false);

 const handleSaveRiderPenalty = async () => {
 if (!riderPenaltyForm.userId || !riderPenaltyForm.amount) return alert('Select rider and amount');
 setIsSavingRiderPenalty(true);
 
 // Check if rider already has penalty
 const existing = riderPenalties.find(p => p.rider_id === riderPenaltyForm.userId || p["rider id"] === riderPenaltyForm.userId);
 
 // Find cluster_id
 const rider = penaltyRiders.find(r => r.id === riderPenaltyForm.userId);
 const clusterId = rider?.cluster_id || null;
 
 const payload: any = {
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
 
 const hm = penaltyHubManagers.find(r => r.id === hmPenaltyForm.userId);
 const clusterId = hm?.cluster_id || null;
 
 const payload: any = {
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

 const handleSaveClusterPenalty = async () => {
 if (!clusterPenaltyForm.userId || !clusterPenaltyForm.amount) return alert('Select Cluster and amount');
 setIsSavingClusterPenalty(true);
 
 const existing = clusterPenalties.find(p => p["cluster id"] === clusterPenaltyForm.userId);
 
 const payload: any = {
 "cluster id": clusterPenaltyForm.userId,
 "penalty amount": clusterPenaltyForm.amount,
 "penalty status": clusterPenaltyForm.status,
 "updated_at": new Date().toISOString()
 };
 
 try {
 if (existing) {
 await supabase.from('clusters_penalty').update(payload).eq('id', existing.id);
 } else {
 payload.created_at = new Date().toISOString();
 await supabase.from('clusters_penalty').insert([payload]);
 }
 setClusterPenaltyForm({ userId: '', amount: '', status: '' });
 await fetchClusterPenalties();
 } finally {
 setIsSavingClusterPenalty(false);
 }
 };

 const handleRemoveClusterPenalty = async (id: string) => {
 setRemovingClusterPenaltyId(id);
 try {
 await supabase.from('clusters_penalty').delete().eq('id', id);
 await fetchClusterPenalties();
 } finally {
 setRemovingClusterPenaltyId(null);
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

 let currentAdminId = adminProfileId;
 if (adminProfileId) {
 const { error } = await supabase.from('admins').update(updateData).eq('id', adminProfileId);
 if (error) throw error;
 } else {
 const { data, error } = await supabase.from('admins').insert([updateData]).select().single();
 if (error) throw error;
 if (data) {
 setAdminProfileId(data.id);
 currentAdminId = data.id;
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
 const [activeUserType, setActiveUserType] = useState<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID' | 'Cluster ID'>('Customer ID');
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

 // 1. Create auth user with the same ID so they can log in via Supabase Auth
 await fetch('/api/admin/create-user', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 id: req.id,
 email: data.registered_email || data.email,
 password: data.password,
 user_metadata: {
 role: targetTable.replace('s', ''), // 'seller' or 'rider'
 full_name: data.seller_name || data.rider_name || 'Approved User'
 }
 })
 }).catch(err => console.error('Auth create failed silently:', err));

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
 if (activeTab === 'Message & Approval') {
 const { data: sellers } = await supabase.from('sellers_for_approval').select('*');
 const { data: riders } = await supabase.from('riders_for_approval').select('*');
 const formatted = [
 ...(sellers || []).map(s => ({ ...s, type: 'Seller' })),
 ...(riders || []).map(r => ({ ...r, type: 'Rider' }))
 ];
 setPendingApprovals(formatted);
 }
 }
 fetchPendingApprovals();
 }, [activeTab, showFullApprovals]);

 
 useEffect(() => {
 async function fetchUsers() {
 setIsUsersLoading(true);
 let tableName = '';
 if (activeUserType === 'Customer ID') tableName = 'customers';
 else if (activeUserType === 'Seller ID') tableName = 'sellers';
 else if (activeUserType === 'Hub Manager ID') tableName = 'hub_managers';
 else if (activeUserType === 'Rider ID') tableName = 'riders';
 else if (activeUserType === 'Cluster ID') tableName = 'clusters';

 if (!tableName) return;

 let data = [];
 let error = null;
 try {
 const res = await fetch(`/api/admin/get-users?table=${tableName}`, { cache: 'no-store' });
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
 } else if (activeUserType === 'Cluster ID') {
 name = row.cluster_name || 'No Name';
 phone = row.registered_mobile_number || '';
 secondary = '';
 
 }
 
 let avatar = '';
 if (activeUserType === 'Hub Manager ID' || activeUserType === 'Rider ID' || activeUserType === 'Cluster ID') {
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
 if (activeUserType === 'Customer ID') channelName = 'customers';
 else if (activeUserType === 'Seller ID') channelName = 'sellers';
 else if (activeUserType === 'Hub Manager ID') channelName = 'hub_managers';
 else if (activeUserType === 'Rider ID') channelName = 'riders';
 else if (activeUserType === 'Cluster ID') channelName = 'clusters';

 let channel: any = null;
 if (channelName) {
   channel = supabase.channel('admin_users_list_updates_' + Math.random().toString(36).substring(7))
     .on('postgres_changes', { event: '*', schema: 'public', table: channelName }, () => {
       fetchUsers();
     })
     .subscribe();
 }

 return () => {
   if (channel) {
     supabase.removeChannel(channel);
   }
 };
 }, [activeUserType, selectedUserIdSetup, refreshTrigger]);

 const handleToggleFreeze = async (user: UserItem) => {
   let tableName = '';
   if (user.type === 'Customer ID') tableName = 'customers';
   else if (user.type === 'Seller ID') tableName = 'sellers';
   else if (user.type === 'Hub Manager ID') tableName = 'hub_managers';
   else if (user.type === 'Rider ID') tableName = 'riders';
   else if (user.type === 'Cluster ID') tableName = 'clusters';

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
       console.warn('Supabase client update warning, using server fallback:', error);
     }

     await fetch('/api/admin/toggle-freeze', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ userId: user.id, table: tableName, freeze: newFreezeVal })
     });
   } catch (err) {
     console.error('Error in handleToggleFreeze:', err);
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
 const validTypes: Array<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID' | 'Cluster ID'> = [
 'Customer ID',
 'Seller ID',
 'Hub Manager ID',
 'Rider ID',
 'Cluster ID'
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

 
 
  

  const [showCustomerAdditionalSettings, setShowCustomerAdditionalSettings] = useState(false);
  const [additionalSettingsData, setAdditionalSettingsData] = useState<{logoUrl: string; promoBanners: any[]}>({
    logoUrl: '',
    promoBanners: []
  });
  
  useEffect(() => {
    if (showCustomerAdditionalSettings) {
      try {
        const stored = localStorage.getItem('ss_customer_additional_settings');
        if (stored) {
          setAdditionalSettingsData(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, [showCustomerAdditionalSettings]);

  const handleSaveAdditionalSettings = () => {
    try {
      localStorage.setItem('ss_customer_additional_settings', JSON.stringify(additionalSettingsData));
    } catch (e) {}
    setShowCustomerAdditionalSettings(false);
  };

  const handleLogoUploadSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalSettingsData(prev => ({...prev, logoUrl: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };

  const [showCustomerRefundSetting, setShowCustomerRefundSetting] = useState(false);
 const [showContactLinkModal, setShowContactLinkModal] = useState(false);
 const [contactInputValue, setContactInputValue] = useState('');
 const [isSavingContactLink, setIsSavingContactLink] = useState(false);

 useEffect(() => {
 const fetchContactLink = async () => {
 if (showContactLinkModal) {
 const { data, error } = await supabase.from('contact_link').select('*').limit(1).maybeSingle();
 if (!error && data) {
 setContactInputValue(data.contact_link || '');
 }
 }
 };
 fetchContactLink();
 }, [showContactLinkModal]);

 const handleSaveContactLink = async () => {
 setIsSavingContactLink(true);
 const { data: existing } = await supabase.from('contact_link').select('*').limit(1).maybeSingle();
 
 if (existing) {
 await supabase.from('contact_link').update({ contact_link: contactInputValue, updated_at: new Date().toISOString() }).eq('id', existing.id);
 } else {
 await supabase.from('contact_link').insert([{ contact_link: contactInputValue }]);
 }
 
 setIsSavingContactLink(false);
 setShowContactLinkModal(false);
 };
 const [refundWithTotalSellingPrice, setRefundWithTotalSellingPrice] = useState(false);
 const [refundWithTotalAmount, setRefundWithTotalAmount] = useState(false);
 const [isSavingRefundSettings, setIsSavingRefundSettings] = useState(false);
 const [refundSettingId, setRefundSettingId] = useState<string | null>(null);

 useEffect(() => {
 const fetchRefundSettings = async () => {
 if (showCustomerRefundSetting) {
 const { data, error } = await supabase.from('customer_refund_setting').select('*').limit(1);
 if (!error && data && data.length > 0) {
 setRefundSettingId(data[0].id);
 setRefundWithTotalSellingPrice(data[0]['refund with total selling price'] || false);
 setRefundWithTotalAmount(data[0]['refund with total amount'] || false);
 }
 }
 };
 fetchRefundSettings();
 }, [showCustomerRefundSetting]);

 const handleSaveRefundSettings = async () => {
 setIsSavingRefundSettings(true);
 try {
 if (refundSettingId) {
 await supabase.from('customer_refund_setting').update({
 'refund with total selling price': refundWithTotalSellingPrice,
 'refund with total amount': refundWithTotalAmount
 }).eq('id', refundSettingId);
 } else {
 const { data } = await supabase.from('customer_refund_setting').insert({
 'refund with total selling price': refundWithTotalSellingPrice,
 'refund with total amount': refundWithTotalAmount
 }).select();
 if (data && data.length > 0) {
 setRefundSettingId(data[0].id);
 }
 }
 } catch (e) {
 console.error(e);
 }
 setIsSavingRefundSettings(false);
 setShowCustomerRefundSetting(false);
 fetchAdminCustomerPayableAmount();
 };

 // State for Portal Setup modal
 const [selectedPortalSetup, setSelectedPortalSetup] = useState<string | null>(null);

 // Secure Transaction State
 const [showSecureTransactionModal, setShowSecureTransactionModal] = useState<string | null>(null);
 const [showRiderPenaltyModal, setShowRiderPenaltyModal] = useState(false);

 const [showHubManagerPenaltyModal, setShowHubManagerPenaltyModal] = useState(false);
 const [showClusterPenaltyModal, setShowClusterPenaltyModal] = useState(false);

 // Handle device / browser back button within AdminPortal sub-pages
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
 if (showClusterPenaltyModal) {
 setShowClusterPenaltyModal(false);
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
 showClusterPenaltyModal,
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
 const [isSavingClusterPenalty, setIsSavingClusterPenalty] = useState(false);

 const [removingRiderPenaltyId, setRemovingRiderPenaltyId] = useState<string | null>(null);
 const [removingHmPenaltyId, setRemovingHmPenaltyId] = useState<string | null>(null);
 const [removingClusterPenaltyId, setRemovingClusterPenaltyId] = useState<string | null>(null);

 const [penaltyHubManagers, setPenaltyHubManagers] = useState<any[]>([]);
 const [penaltyClusters, setPenaltyClusters] = useState<any[]>([]);

 const [riderPenaltyForm, setRiderPenaltyForm] = useState({ userId: '', amount: '', status: '' });
 const [riderPenalties, setRiderPenalties] = useState<any[]>([]);
 
 const [hmPenaltyForm, setHmPenaltyForm] = useState({ userId: '', amount: '', status: '' });
 const [hmPenalties, setHmPenalties] = useState<any[]>([]);
 
 const [clusterPenaltyForm, setClusterPenaltyForm] = useState({ userId: '', amount: '', status: '' });
 const [clusterPenalties, setClusterPenalties] = useState<any[]>([]);

 const fetchRiderPenalties = async () => {
 const { data } = await supabase.from('riders_penalty').select('*').order('created_at', { ascending: false });
 setRiderPenalties(data || []);
 };
 const fetchHmPenalties = async () => {
 const { data } = await supabase.from('hub_managers_penalty').select('*').order('created_at', { ascending: false });
 setHmPenalties(data || []);
 };
 const fetchClusterPenalties = async () => {
 const { data } = await supabase.from('clusters_penalty').select('*').order('created_at', { ascending: false });
 setClusterPenalties(data || []);
 };

 
 useEffect(() => {
 if (showRiderPenaltyModal) {
 supabase.from('riders').select('*').then(({data}) => setPenaltyRiders(data || []));
 fetchRiderPenalties();
 fetchRiderPenalties();
 }
 }, [showRiderPenaltyModal]);
 
 useEffect(() => {
 if (showHubManagerPenaltyModal || showHubManagerSalarySetup) {
 supabase.from('hub_managers').select('*').then(({data}) => setPenaltyHubManagers(data || []));
 fetchHmPenalties();
 fetchHmPenalties();
 }
 }, [showHubManagerPenaltyModal]);
 
 useEffect(() => {
 if (showClusterPenaltyModal) {
 supabase.from('clusters').select('*').then(({data}) => setPenaltyClusters(data || []));
 }
 }, [showClusterPenaltyModal]);
 
  const handleSaveSecureSettings = () => {
    try {
      const now = Date.now();
      const custSnapshot = secureCustomerLockState === "Lock"
        ? (secureCustomerLockedSnapshotIds || adminCustomerPayableList.map(c => c.id))
        : null;
      const sellerSnapshot = secureSellerLockState === "Lock"
        ? (secureSellerLockedSnapshotIds || sellerPayableList.map(s => s.id))
        : null;
      const riderSnapshot = secureRiderLockState === "Lock"
        ? (secureRiderLockedSnapshotIds || adminRiderPayableList.map(r => r.id))
        : null;
      const hmSnapshot = secureHmLockState === "Lock"
        ? (secureHmLockedSnapshotIds || adminHmPayableList.map(h => h.id))
        : null;
      const clusterSnapshot = secureClusterLockState === "Lock"
        ? (secureClusterLockedSnapshotIds || adminClusterPayableList.map(cl => cl.id))
        : null;

      setSecureCustomerLockedSnapshotIds(custSnapshot);
      if (secureCustomerLockState === "Lock" && !secureCustomerLockedAt) setSecureCustomerLockedAt(now);
      if (secureCustomerLockState === "Release" && !secureCustomerReleasedAt) setSecureCustomerReleasedAt(now);

      setSecureSellerLockedSnapshotIds(sellerSnapshot);
      if (secureSellerLockState === "Lock" && !secureSellerLockedAt) setSecureSellerLockedAt(now);
      if (secureSellerLockState === "Release" && !secureSellerReleasedAt) setSecureSellerReleasedAt(now);

      setSecureRiderLockedSnapshotIds(riderSnapshot);
      if (secureRiderLockState === "Lock" && !secureRiderLockedAt) setSecureRiderLockedAt(now);
      if (secureRiderLockState === "Release" && !secureRiderReleasedAt) setSecureRiderReleasedAt(now);

      setSecureHmLockedSnapshotIds(hmSnapshot);
      if (secureHmLockState === "Lock" && !secureHmLockedAt) setSecureHmLockedAt(now);
      if (secureHmLockState === "Release" && !secureHmReleasedAt) setSecureHmReleasedAt(now);

      setSecureClusterLockedSnapshotIds(clusterSnapshot);
      if (secureClusterLockState === "Lock" && !secureClusterLockedAt) setSecureClusterLockedAt(now);
      if (secureClusterLockState === "Release" && !secureClusterReleasedAt) setSecureClusterReleasedAt(now);

      const payload = {
        customerLockState: secureCustomerLockState,
        customerAutoMode: secureCustomerAutoMode,
        customerAutoActiveTime: secureCustomerAutoActiveTime,
        customerSchedule: secureCustomerSchedule,
        customerRatio: secureCustomerRatio,
        customerLockedSnapshotIds: custSnapshot,
        customerLockedAt: secureCustomerLockedAt || now,
        customerReleasedAt: secureCustomerReleasedAt || now,

        sellerLockState: secureSellerLockState,
        sellerAutoMode: secureSellerAutoMode,
        sellerAutoActiveTime: secureSellerAutoActiveTime,
        sellerSchedule: secureSellerSchedule,
        sellerRatio: secureSellerRatio,
        sellerLockedSnapshotIds: sellerSnapshot,
        sellerLockedAt: secureSellerLockedAt || now,
        sellerReleasedAt: secureSellerReleasedAt || now,

        riderLockState: secureRiderLockState,
        riderAutoMode: secureRiderAutoMode,
        riderAutoActiveTime: secureRiderAutoActiveTime,
        riderSchedule: secureRiderSchedule,
        riderRatio: secureRiderRatio,
        riderLockedSnapshotIds: riderSnapshot,
        riderLockedAt: secureRiderLockedAt || now,
        riderReleasedAt: secureRiderReleasedAt || now,

        hmLockState: secureHmLockState,
        hmAutoMode: secureHmAutoMode,
        hmAutoActiveTime: secureHmAutoActiveTime,
        hmSchedule: secureHmSchedule,
        hmRatio: secureHmRatio,
        hmLockedSnapshotIds: hmSnapshot,
        hmLockedAt: secureHmLockedAt || now,
        hmReleasedAt: secureHmReleasedAt || now,

        clusterLockState: secureClusterLockState,
        clusterAutoMode: secureClusterAutoMode,
        clusterAutoActiveTime: secureClusterAutoActiveTime,
        clusterSchedule: secureClusterSchedule,
        clusterRatio: secureClusterRatio,
        clusterLockedSnapshotIds: clusterSnapshot,
        clusterLockedAt: secureClusterLockedAt || now,
        clusterReleasedAt: secureClusterReleasedAt || now,

        selectedPaymentType,
        paymentMethodsList,
        selectedPaymentMethods,
      };
      localStorage.setItem("ss_secure_tx_settings_admin", JSON.stringify(payload));
      setSecureSaveSuccess(true);
      setTimeout(() => {
        setSecureSaveSuccess(false);
        setShowSecureTransactionModal(null);
      }, 700);
    } catch (e) {
      console.error("Error saving admin secure tx settings:", e);
      setShowSecureTransactionModal(null);
    }
  };
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
 'Rider Portal Setup': { enabled: true, autoSync: true, pushAlerts: true },
 'Cluster Portal Setup': { enabled: true, autoSync: true, pushAlerts: true }
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


 
 // Cluster Estimate State
 const [showClusterEstimateModal, setShowClusterEstimateModal] = useState(false);
 const [clusterEstimateList, setClusterEstimateList] = useState<any[]>([]);
 const [selectedClusterForEstimate, setSelectedClusterForEstimate] = useState('');
 const [perOrderRate, setPerOrderRate] = useState('');
 const [isSavingClusterEstimate, setIsSavingClusterEstimate] = useState(false);

 // Transfer to Cluster State
 const [showTransferClusterModal, setShowTransferClusterModal] = useState(false);
 const [transferHmList, setTransferHmList] = useState<any[]>([]);
 const [transferClusterList, setTransferClusterList] = useState<any[]>([]);
 const [selectedHmForTransfer, setSelectedHmForTransfer] = useState('');
 const [selectedClusterForTransfer, setSelectedClusterForTransfer] = useState('');
 const [isSavingTransfer, setIsSavingTransfer] = useState(false);

 useEffect(() => {
 if (showClusterEstimateModal || showTransferClusterModal) {
 const fetchData = async () => {
 const { data: clus } = await supabase.from('clusters').select('*');
 if (clus) {
 setClusterEstimateList(clus);
 setTransferClusterList(clus);
 }
 if (showTransferClusterModal) {
 const { data: hms } = await supabase.from('hub_managers').select('*');
 if (hms) setTransferHmList(hms);
 }
 };
 fetchData();
 }
 }, [showClusterEstimateModal, showTransferClusterModal]);

 const handleSaveClusterEstimate = async () => {
 if (!selectedClusterForEstimate || !perOrderRate) return;
 setIsSavingClusterEstimate(true);
 try {
 await supabase.from('clusters_estimate').insert({
 'cluster id': selectedClusterForEstimate,
 'per order rate': perOrderRate
 });
 setPerOrderRate('');
 setSelectedClusterForEstimate('');
 setShowClusterEstimateModal(false);
 } catch (err) {
 console.error(err);
 }
 setIsSavingClusterEstimate(false);
 };

 const handleSaveTransfer = async () => {
 if (!selectedHmForTransfer || !selectedClusterForTransfer) return;
 setIsSavingTransfer(true);
 try {
 await supabase.from('hub_managers').update({ cluster_id: selectedClusterForTransfer }).eq('id', selectedHmForTransfer);
 setSelectedHmForTransfer('');
 setSelectedClusterForTransfer('');
 setShowTransferClusterModal(false);
 } catch (err) {
 console.error(err);
 }
 setIsSavingTransfer(false);
 };

 // Hub Manager Pincode Service State
 // Hub Manager Pincode Service State
 const [showHubManagersPincodeService, setShowHubManagersPincodeService] = useState(false);
 const [showHubManagerSalarySetup, setShowHubManagerSalarySetup] = useState(false);
 const [hmSalaryValue, setHmSalaryValue] = useState('');
 const [isSavingHmSalary, setIsSavingHmSalary] = useState(false);
 const [isEditingHmSalary, setIsEditingHmSalary] = useState(true);

 const fetchFixedHmSalary = async () => {
 try {
 const { data, error } = await supabase.from('fixed_hub_manager_salary').select('*').limit(1);
 if (error) {
 console.error("Error fetching fixed hm salary:", error);
 return;
 }
 if (data && data.length > 0 && data[0]['fixed salary'] !== null && data[0]['fixed salary'] !== undefined) {
 setHmSalaryValue(data[0]['fixed salary'].toString());
 setIsEditingHmSalary(false);
 } else {
 setHmSalaryValue('');
 setIsEditingHmSalary(true);
 }
 } catch (e) {
 console.error("Error fetching fixed hm salary", e);
 }
 };

 useEffect(() => {
 fetchFixedHmSalary();
 }, []);

 useEffect(() => {
 if (showHubManagerSalarySetup) {
 fetchFixedHmSalary();
 }
 }, [showHubManagerSalarySetup]);

 const handleSaveHmSalaryFixed = async () => {
 if (!hmSalaryValue || isNaN(Number(hmSalaryValue))) {
 alert("Please enter a valid amount");
 return;
 }
 setIsSavingHmSalary(true);
 try {
 const { data: fixedExisting, error: fetchErr } = await supabase.from('fixed_hub_manager_salary').select('*').limit(1);
 if (fetchErr) throw fetchErr;
 const salaryStr = String(hmSalaryValue).trim();
 if (fixedExisting && fixedExisting.length > 0) {
 const { error: updErr } = await supabase.from('fixed_hub_manager_salary').update({ 
 'fixed salary': salaryStr,
 updated_at: new Date().toISOString()
 }).eq('id', fixedExisting[0].id);
 if (updErr) throw updErr;
 } else {
 const { error: insErr } = await supabase.from('fixed_hub_manager_salary').insert({
 'fixed salary': salaryStr,
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString()
 });
 if (insErr) throw insErr;
 }
 setIsEditingHmSalary(false);
 alert('Salary updated successfully!');
 fetchFixedHmSalary();
 fetchAdminHmPayableAmount();
 } catch (error) {
 console.error('Error saving salary:', error);
 alert('Failed to save salary.');
 } finally {
 setIsSavingHmSalary(false);
 }
 };

 const [hubManagersList, setHubManagersList] = useState<any[]>([]);
 const [selectedHubManagerForPincode, setSelectedHubManagerForPincode] = useState('');
 const [newPincodeValue, setNewPincodeValue] = useState('');
 const [addedPincodesList, setAddedPincodesList] = useState<any[]>([]);
 const [isSavingPincode, setIsSavingPincode] = useState(false);
 const [currentManagerPincodes, setCurrentManagerPincodes] = useState<string[]>([]);

 const fetchHubManagersAndPincodes = async () => {
 try {
 
 const hubManagersRes = await fetch('/api/admin/get-users?table=hub_managers', { cache: 'no-store' }).then(r => r.json()).then(d => ({ data: d.data, error: null })).catch(e => ({ error: e }));
 const pincodesRes = await supabase.from('added_pincode').select('id, "hub manager id", "cluster id", "added pincode", created_at').order('created_at', { ascending: false });


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
 }, [showHubManagersPincodeService]);

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
 finalClusterId = selectedManager ? (selectedManager.cluster_id || selectedManager['cluster id']) : null;
 }

 const insertData = toInsert.map(p => {
 const payload: any = {
 "hub manager id": selectedHubManagerForPincode,
 "added pincode": p,
 "hub name": hubName
 };
 // Only explicitly set cluster id if we have a valid one, avoiding overwriting with null
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

 // Rider Setting (Image + Pattern Lock)
 const [showRiderSettingModal, setShowRiderSettingModal] = useState(false);
 const [riderSettingImage, setRiderSettingImage] = useState<string>("");
 const [riderSettingMode, setRiderSettingMode] = useState<"view" | "verify" | "new" | "confirm">("view");
 const [savedRiderPattern, setSavedRiderPattern] = useState<number[]>([]);
 const [tempVerifyPattern, setTempVerifyPattern] = useState<number[]>([]);
 const [tempNewPattern, setTempNewPattern] = useState<number[]>([]);
 const [patternError, setPatternError] = useState("");
 const [activePatternPath, setActivePatternPath] = useState<number[]>([]);
 const [isDrawingPattern, setIsDrawingPattern] = useState(false);
 const [showRiderSettingAuth, setShowRiderSettingAuth] = useState(false);
 const [authPasswordInput, setAuthPasswordInput] = useState("");
 const [authError, setAuthError] = useState("");
 const [actualRiderSettingPassword, setActualRiderSettingPassword] = useState("");
 const [riderSettingRowId, setRiderSettingRowId] = useState<string>("");
 const [isImageUnlocked, setIsImageUnlocked] = useState(false);
 const [showFullImage, setShowFullImage] = useState(false);
 const [newPasswordInput, setNewPasswordInput] = useState("");
 const [showRiderVisualSettingModal, setShowRiderVisualSettingModal] = useState(false);
 const [localVisualSettingState, setLocalVisualSettingState] = useState(false);
 const [isSavingRiderSetting, setIsSavingRiderSetting] = useState(false);

 useEffect(() => {
 async function fetchGlobalSettings() {
 const { data } = await supabase.from('rider_rate_setting').select('*').limit(1).maybeSingle();
 if (data) {
 setRiderSettingMultipleQtyHalfRate(data['multiple quantity half rate'] || false);
 setRiderSettingPerformanceBasedRate(data['performance based proportional rate'] || false);
 }
 }
 if (showRiderRateSettings) {
 fetchGlobalSettings();
 }
 }, [showRiderRateSettings]);


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
 // Fetch all riders
 const { data: ridersData } = await supabase.from('riders').select('*');
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
 const { data: activeRates } = await supabase.from('active_service_rate').select('*');
 if (activeRates) {
 const newRates = {
 'Regular': { pickup: '', delivery: '', return: '' },
 'Premium': { pickup: '', delivery: '', return: '' },
 'Ultra': { pickup: '', delivery: '', return: '' },
 };
 activeRates.forEach(rate => {
 if (rate.tag && (newRates as any)[rate.tag]) {
 (newRates as any)[rate.tag] = {
 pickup: rate.pickup_rate || '',
 delivery: rate.delivery_rate || '',
 return: rate.return_delivery_rate || ''
 };
 }
 });
 setDefaultRates(newRates);
 }
 }
 }
 fetchRidersForRates();
 }, [showRiderServiceRate]);
 
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
 const { data: sellersData } = await supabase.from('sellers').select('id, shop_name, seller_name, upload_service_visible');
 const { data: visualData } = await supabase.from('services_visual').select('*');
 
 if (sellersData) {
 const mergedData = sellersData.map(seller => {
 const visualRecord = visualData?.find(v => v['seller id'] === seller.id);
 return {
 ...seller,
 upload_service_visible: visualRecord ? (visualRecord['visual model'] === 'show') : seller.upload_service_visible
 };
 });
 setAllSellers(mergedData);
 if (mergedData.length > 0) {
 setVisualSelectedSeller(mergedData[0].id);
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
 let currentAdminId = adminProfileId;
 if (!currentAdminId) {
 const { data: adminData } = await supabase.from('admins').select('id').limit(1).maybeSingle();
 if (adminData && adminData.id) {
 currentAdminId = adminData.id;
 }
 }
 
 // Update services_visual table
 if (currentAdminId) {
 const { data: existingVisual } = await supabase.from('services_visual')
 .select('id')
 .eq('admin id', currentAdminId)
 .eq('seller id', visualSelectedSeller)
 .maybeSingle();
 
 if (existingVisual && existingVisual.id) {
 await supabase.from('services_visual').update({
 "visual model": visualModelValue
 }).eq('id', existingVisual.id);
 } else {
 await supabase.from('services_visual').insert({
 "admin id": currentAdminId,
 "seller id": visualSelectedSeller,
 "visual model": visualModelValue
 });
 }
 }

 // Keep existing functionality as requested (sab kuchh jaisa hai exact waisa hi Rahane dijiye)
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
 label: 'Customer', 
 modalKey: 'Customer Portal Setup',
 icon: Users, 
 accentColor: 'text-blue-700',
 bgColor: 'bg-blue-50/90',
 iconBg: 'bg-blue-600 text-white shadow-blue-500/20',
 borderHover: 'hover:border-blue-400 hover:shadow-blue-500/10'
 },
 { 
 label: 'Seller', 
 modalKey: 'Seller Portal Setup',
 icon: Store, 
 accentColor: 'text-amber-700',
 bgColor: 'bg-amber-50/90',
 iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
 borderHover: 'hover:border-amber-400 hover:shadow-amber-500/10'
 },
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
 },
 { 
 label: 'Cluster', 
 modalKey: 'Cluster Portal Setup',
 icon: Building2, 
 accentColor: 'text-teal-700',
 bgColor: 'bg-teal-50/90',
 iconBg: 'bg-teal-600 text-white shadow-teal-500/20',
 borderHover: 'hover:border-teal-400 hover:shadow-teal-500/10'
 }
 ];

 // Premium colored User ID setup options with clean titles, no subtitles and no count badges
 const userIdSetupOptions = [
 { 
 label: 'Customer ID', 
 icon: Users, 
 color: 'text-blue-700',
 iconBg: 'bg-blue-600 text-white shadow-blue-500/20',
 badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
 borderHover: 'hover:border-blue-400 hover:shadow-blue-500/10'
 },
 { 
 label: 'Seller ID', 
 icon: Store, 
 color: 'text-amber-700',
 iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
 badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
 borderHover: 'hover:border-amber-400 hover:shadow-amber-500/10'
 },
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
 },
 { 
 label: 'Cluster ID', 
 icon: Building2, 
 color: 'text-teal-700',
 iconBg: 'bg-teal-600 text-white shadow-teal-500/20',
 badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
 borderHover: 'hover:border-teal-400 hover:shadow-teal-500/10'
 }
 ];

 const userTypeTabs: Array<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID' | 'Cluster ID'> = [
 'Customer ID',
 'Seller ID',
 'Hub Manager ID',
 'Rider ID',
 'Cluster ID'
 ];

 const handleOpenUserIdSetup = (typeLabel: string) => {
 const validTypes: Array<'Customer ID' | 'Seller ID' | 'Hub Manager ID' | 'Rider ID' | 'Cluster ID'> = [
 'Customer ID',
 'Seller ID',
 'Hub Manager ID',
 'Rider ID',
 'Cluster ID'
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

 // If Create ID is requested: Render the dedicated Create User ID page
 if (isCreatingUserId) {
 const mapToCategory = (typeStr: string): UserTypeCategory => {
 if (typeStr === 'Seller ID') return 'Seller';
 if (typeStr === 'Hub Manager ID') return 'Hub Manager';
 if (typeStr === 'Rider ID') return 'Rider';
 if (typeStr === 'Cluster ID') return 'Cluster';
 return 'Customer';
 };

 return (
 <CreateUserIdPage
 initialType={mapToCategory(activeUserType)}
 initialData={editingUser}
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
 if (showProfile) {
 return (
 <div className="fixed inset-0 h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 flex flex-col font-poppins antialiased select-none overflow-hidden">
 <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 flex items-center justify-between px-3.5 sm:px-6 min-h-[58px] sm:min-h-[64px] h-auto py-2.5 shrink-0 shadow-xs gap-2">
 <div className="flex items-center gap-2.5 min-w-0 flex-1">
 <button 
 onClick={closeAdminProfile}
 className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all cursor-pointer shrink-0"
 >
 <ArrowLeft size={16} strokeWidth={2.4} />
 </button>
 <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">Admin Profile</h1>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button 
 onClick={() => setShowLogoutModal(true)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer shadow-sm shrink-0"
 >
 <LogOut size={14} strokeWidth={2.5} />
 <span className="text-[11px] font-bold">Logout</span>
 </button>
 </div>
 </header>
 <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-5 sm:py-6 max-w-xl w-full mx-auto flex flex-col gap-4 pb-24">
 <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
 <h2 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Edit Admin Details</h2>
 
 {isLoadingProfile ? (
 <div className="py-10 text-center text-sm font-semibold text-slate-500">Loading details...</div>
 ) : (
 <form onSubmit={handleSaveProfile} className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">Admin Name</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
 <input 
 type="text" 
 required
 value={adminProfile.name}
 onChange={e => setAdminProfile({...adminProfile, name: e.target.value})}
 className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:border-indigo-500 focus:bg-white transition-all outline-none"
 placeholder="SURIYAWAN SHOPPING Master Admin"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">Mobile Number</label>
 <div className="relative">
 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
 <input 
 type="text" 
 required
 value={adminProfile.mobile}
 onChange={e => setAdminProfile({...adminProfile, mobile: e.target.value})}
 className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:border-indigo-500 focus:bg-white transition-all outline-none"
 placeholder="+91 98765 43210"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">Email Address</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
 <input 
 type="email" 
 value={adminProfile.email}
 onChange={e => setAdminProfile({...adminProfile, email: e.target.value})}
 className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:border-indigo-500 focus:bg-white transition-all outline-none"
 placeholder="admin@asuryawanshopping.com"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">Full Address</label>
 <div className="relative">
 <MapPin className="absolute left-3 top-3 text-slate-400" size={14} />
 <textarea 
 value={adminProfile.address}
 onChange={e => setAdminProfile({...adminProfile, address: e.target.value})}
 className="w-full min-h-[80px] pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:border-indigo-500 focus:bg-white transition-all outline-none resize-y"
 placeholder="Main Market Road, Asuryawan, Bhadohi, Uttar Pradesh - 221401"
 ></textarea>
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">GSTIN (Optional)</label>
 <div className="relative">
 <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
 <input 
 type="text" 
 value={adminProfile.gstNo}
 onChange={e => setAdminProfile({...adminProfile, gstNo: e.target.value})}
 className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:border-indigo-500 focus:bg-white transition-all outline-none uppercase"
 placeholder="09AAACS1234F1Z5"
 />
 </div>
 </div>

 <button 
 type="submit" 
 disabled={isSavingProfile}
 className={`w-full h-10 mt-2 text-white text-sm font-bold rounded-lg shadow-xs flex items-center justify-center transition-all ${isSavingProfile ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}`}
 >
 {isSavingProfile ? (
 <div className="flex items-center gap-1.5 text-white">
 <span>Saving</span>
 <div className="flex space-x-1 mt-1">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Save size={16} />
 <span>Save Admin Profile</span>
 </div>
 )}
 </button>
 {profileSavedToast && (
 <p className="text-xs text-emerald-600 font-semibold text-center mt-2 flex items-center justify-center gap-1">
 <CheckCircle size={12} /> Profile details saved successfully!
 </p>
 )}
 </form>
 )}
 </div>
 </main>
 {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} portalName="Admin" />}
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
 case 'Cluster ID': return { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', btn: 'bg-teal-600 hover:bg-teal-700', focusRing: 'focus:border-teal-500', iconColor: 'text-teal-500', iconBadge: 'bg-teal-50 text-teal-700 border-teal-200/60' };
 default: return { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', btn: 'bg-indigo-600 hover:bg-indigo-700', focusRing: 'focus:border-indigo-500', iconColor: 'text-indigo-500', iconBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200/60' };
 }
 };
 const activeColor = getRoleColor(activeUserType);

 return (
 <div className="fixed inset-0 h-[100dvh] w-full bg-slate-50 flex flex-col font-poppins antialiased p-3 sm:p-4 overflow-hidden">
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
 onClick={() => setUserToDelete(user)}
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
 {userToDelete && (
 <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col">
 <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 text-rose-600">
 <AlertTriangle size={20} className="shrink-0" />
 <h2 className="text-[15px] font-bold text-slate-800">Confirm Deletion</h2>
 </div>
 
 <div className="p-6 pb-8 text-center flex-1">
 <p className="text-sm font-medium text-slate-600 leading-relaxed">
 Are you sure you want to delete this user?
 <br/>
 <span className="text-rose-500 font-bold mt-2 block text-xs bg-rose-50 p-2 rounded-lg border border-rose-100">
 This action is irreversible and all related data will be permanently removed.
 </span>
 </p>
 </div>
 
 <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
 <button 
 onClick={() => !isDeletingUser && setUserToDelete(null)}
 disabled={isDeletingUser}
 className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
 >
 Cancel
 </button>
 <button 
 onClick={handleConfirmDeleteUser}
 disabled={isDeletingUser}
 className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-rose-200 flex justify-center items-center h-[42px] disabled:bg-rose-600 disabled:opacity-90"
 >
 {isDeletingUser ? (
 <div className="flex gap-1.5 items-center justify-center">
 <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
 </div>
 ) : (
 "Delete"
 )}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
 }


 const handleClusterCollect = async (cluster: any) => {
 setCollectingClusterId(cluster.id);
 try {
 const now = new Date();
 const statusText = `Collected from Cluster ${(cluster.cluster_id || cluster.id || '').substring(0, 8)} - ${cluster.cluster_name} - ${cluster.registered_mobile_number} on ${now.toLocaleString()} - Total: ₹${cluster.cash}`;

 // 1. Insert into cash_with_admin
 const { error: insertAdminErr } = await supabase.from('cash_with_admin').insert([{
 'admin id': adminProfileId,
 'cash payment status': statusText,
 'total cash payment': (cluster.cash || 0).toString(),
 created_at: now.toISOString(),
 updated_at: now.toISOString()
 }]);
 
 if (insertAdminErr) throw insertAdminErr;

 // Also delete from cash_with_clusters (since it's collected)
 await supabase.from('cash_with_clusters').delete().eq('cluster id', cluster.id);

 setCashClustersList(prev => prev.filter(c => c.id !== cluster.id));
 setTotalCashWithClusters(prev => prev - cluster.cash);
 
 alert("Cash collected successfully!");
 if (typeof fetchCashClusters === 'function') fetchCashClusters();
 if (typeof fetchAdminCollectedCash === 'function') fetchAdminCollectedCash(adminProfileId);
 setShowCashClustersModal(false);
 } catch (err) {
 console.error("Error in handleClusterCollect:", err);
 alert("Error: " + err.message);
 } finally {
 setCollectingClusterId(null);
 }
 };

 return (
 <div className="fixed inset-0 h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 flex flex-col font-poppins antialiased select-none overflow-hidden">
 
 {/* Top Header - Clear title banner with distinct console styling */}
 <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 flex items-center justify-between px-3 sm:px-5 min-h-[58px] sm:min-h-[64px] h-auto py-2.5 shrink-0 shadow-xs gap-2">
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <button
 type="button"
 onClick={onBack}
 title="Back to All Portals"
 className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
 >
 <ArrowLeft size={18} strokeWidth={2.4} />
 </button>
 <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => setActiveTab('Dashboard')}>
 <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-1.5 rounded-lg text-white shadow-xs shrink-0">
 <ShieldCheck size={16} strokeWidth={2.4} />
 </div>
 <div className="min-w-0 flex items-center gap-1.5">
 <h1 className="text-[12px] sm:text-sm font-bold text-slate-900 tracking-tight flex items-center min-w-0 gap-1.5">
 <span className="truncate">SURIYAWAN SHOPPING Admin</span>
 <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
 Console
 </span>
 </h1>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
 <button 
 type="button"
 onClick={handleDeepRefresh}
 title="Real-time Deep Refresh"
 className="p-1.5 rounded-md hover:bg-slate-100 transition-colors active:bg-slate-200 text-slate-600 border border-transparent hover:border-slate-300 cursor-pointer shrink-0"
 >
 <RefreshCw size={18} strokeWidth={2.5} className={isDeepRefreshing ? "animate-spin text-indigo-600" : ""} />
 </button>
 <button 
 type="button"
 onClick={openAdminProfile}
 id="admin-header-profile-btn"
 title="Admin Profile"
 className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 transition-all cursor-pointer shadow-2xs group shrink-0"
 >
 <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs group-hover:scale-105 transition-transform">
 <User size={10} strokeWidth={2.5} />
 </div>
 <span className="text-[10px] sm:text-xs font-bold text-indigo-950">
 Profile
 </span>
 </button>
 </div>
 </header>

 {/* Main Content Area - Generous top spacing, completely unhindered and not hidden under header */}
 <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-5 pb-24">
 {activeTab === 'Dashboard' && (
 <div className="w-full flex flex-col gap-4 sm:gap-5">
 
 {/* Section 1: Portal Setup */}
 <section className="w-full">
 <div className="flex items-center justify-between mb-2.5 px-0.5">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
 <Layers size={14} strokeWidth={2.4} />
 </div>
 <div className="flex items-center gap-2">
 <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
 Portal Setup
 </h2>
 <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60 hidden sm:inline-flex">
 Core Modules
 </span>
 </div>
 </div>
 <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
 Asuryawan Platform Portals
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
 
 {/* Section 3: Admin Collect Amount */}
 <section className="w-full">
 <div onClick={() => setShowAdminPendingDepositModal(true)} className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-24 sm:h-28 cursor-pointer hover:bg-emerald-50/60 transition-all hover:shadow-md">
 <span className="text-xs sm:text-sm uppercase tracking-wider text-emerald-600 font-extrabold flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
 Pending Deposit / Collect Amount
 </span>
 <span className="text-2xl sm:text-3xl font-black text-slate-800">
 {isLoadingAdminCash ? (
 <span className="text-slate-500 text-lg sm:text-xl font-semibold flex items-center">
 Calculating<span className="loading-ellipsis inline-block w-4"></span>
 </span>
 ) : (
 `₹ ${adminCollectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
 )}
 </span>
 </div>
 </section>

 {/* Section 4: Total Online Payments (Shifted to bottom) */}
 <section className="w-full">
 <div
 onClick={() => {
   setShowOnlinePaymentAuth(true);
   setOnlinePaymentPassword('');
   setOnlinePaymentAuthError('');
 }}
 className="bg-white border border-indigo-200/90 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
 >
 <div className="flex items-center gap-3 sm:gap-3.5">
 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
 <CreditCard size={18} strokeWidth={2.2} />
 </div>
 <div className="flex flex-col">
 <span className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider block leading-tight">
 Total Online Payments
 </span>
 <span className="text-[11px] sm:text-xs text-indigo-600 font-semibold mt-1">
 {isLoadingOnlinePayments ? 'Syncing...' : `${onlinePaymentsList.length} Active Records`}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
 </div>
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
 <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
 <Layers size={16} strokeWidth={2.4} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900">{selectedPortalSetup}</h3>
 <p className="text-[11px] text-slate-500">Live regional configuration for Asuryawan</p>
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
 
 
 {selectedPortalSetup === 'Cluster Portal Setup' && (
 <div className="flex flex-col gap-3">
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowClusterEstimateModal(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center">
 <TrendingUp size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-teal-900 block">Cluster Estimate</span>
 <span className="text-[11px] text-teal-700">Configure per order rate</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-teal-500" />
 </button>
 
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowTransferClusterModal(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
 <ArrowRight size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-indigo-900 block">Transfer to Cluster</span>
 <span className="text-[11px] text-indigo-700">Assign Hub Manager to Cluster</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-indigo-500" />
 </button>
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowClusterPenaltyModal(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
 <AlertTriangle size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-red-900 block">Cluster Penalty</span>
 <span className="text-[11px] text-red-700">Configure cluster penalties</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-red-500" />
 </button>
 </div>
 )}

 {selectedPortalSetup === 'Customer Portal Setup' && (
 <div className="flex flex-col gap-3">
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowCustomerRefundSetting(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-blue-900 block">Customer Refund Setting</span>
 <span className="text-[11px] text-blue-700">Configure customer refund rules</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-blue-500" />
 </button>
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setShowContactLinkModal(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-indigo-900 block">Contact Link for Customer</span>
 <span className="text-[11px] text-indigo-700">Configure customer contact link</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-indigo-500" />
 </button>

                <button
                  onClick={() => {
                    setSelectedPortalSetup(null);
                    setShowCustomerAdditionalSettings(true);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-fuchsia-50 border border-fuchsia-200 rounded-xl hover:bg-fuchsia-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500 text-white flex items-center justify-center">
                      <Settings size={16} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-fuchsia-900 block">Additional Setting</span>
                      <span className="text-[11px] text-fuchsia-700">Add logo, sale dates & speech</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-fuchsia-500" />
                </button>

 </div>
 )}

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
 className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
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
 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 setAuthPasswordInput('');
 setShowRiderSettingAuth(true);
 
 supabase.from('riders_setting').select('*').limit(1).maybeSingle().then(({ data }) => {
 if (data) {
 setRiderSettingRowId(data.id);
 
 const riderRuleValue = data['rider rule'] || '';
 if (riderRuleValue.includes('||')) {
 const parts = riderRuleValue.split('||');
 setActualRiderSettingPassword(parts[0] || '');
 setNewPasswordInput(parts[0] || '');
 if (parts[1]) {
 setSavedRiderPattern(parts[1].split(',').map(Number));
 } else {
 setSavedRiderPattern([]);
 }
 } else {
 setActualRiderSettingPassword(riderRuleValue);
 setNewPasswordInput(riderRuleValue);
 setSavedRiderPattern([]);
 }
 
 setRiderSettingImage(data['attendence'] || '');
 // We do not load savedRiderPattern from text setting to prevent messing up payment status
 } else {
 setActualRiderSettingPassword('');
 setNewPasswordInput('');
 setRiderSettingImage('');
 setSavedRiderPattern([]);
 }
 });
 }}
 className="w-full flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
 <Settings size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-indigo-900 block">Rider Setting</span>
 <span className="text-[11px] text-indigo-700">Configure pattern & image</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-indigo-500" />
 </button>

 <button
 onClick={() => {
 setSelectedPortalSetup(null);
 const saved = localStorage.getItem('rider_visual_online_payment');
 setLocalVisualSettingState(saved ? JSON.parse(saved) : false);
 setShowRiderVisualSettingModal(true);
 }}
 className="w-full flex items-center justify-between p-3 bg-pink-50 border border-pink-200 rounded-xl hover:bg-pink-100 transition-colors cursor-pointer"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center">
 <Settings size={16} />
 </div>
 <div className="text-left">
 <span className="text-xs font-bold text-pink-900 block">Visual Setting</span>
 <span className="text-[11px] text-pink-700">Configure visual online payment</span>
 </div>
 </div>
 <ChevronRight size={16} className="text-pink-500" />
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
 {selectedPortalSetup !== 'Seller Portal Setup' && selectedPortalSetup !== 'Services Visual Setup' && selectedPortalSetup !== 'Rider Portal Setup' && selectedPortalSetup !== 'Hub Logistic Setup' && selectedPortalSetup !== 'Customer Portal Setup' && selectedPortalSetup !== 'Cluster Portal Setup' && (
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

 
 
 {/* Cluster Estimate Modal */}
 {showClusterEstimateModal && (
 <div className="fixed inset-0 h-[100dvh] z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
 {/* Header */}
 <header className="sticky top-0 z-10 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 h-14 shrink-0 shadow-sm">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setShowClusterEstimateModal(false)}
 className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-base font-bold text-slate-900">Cluster Estimate</h2>
 </div>
 </header>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-lg mx-auto flex flex-col gap-6">
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
 
 <div className="flex flex-col gap-4">
 <div className="w-full">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Cluster ID</label>
 <CustomSelect 
 value={selectedClusterForEstimate}
 onChange={(e) => setSelectedClusterForEstimate(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
 >
 <option value="">Select Cluster</option>
 {clusterEstimateList.map((c) => (
 <option key={c.id} value={c.id}>
 {c.id.substring(0, 8)} - {c.cluster_name || 'No Name'} - {c.registered_mobile_number || 'No Mobile'}
 </option>
 ))}
 </CustomSelect>
 </div>

 <div className="w-full">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Per Order Rate</label>
 <input 
 type="text"
 placeholder="Enter rate"
 value={perOrderRate}
 onChange={(e) => setPerOrderRate(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
 />
 </div>
 </div>

 <button 
 onClick={handleSaveClusterEstimate}
 disabled={isSavingClusterEstimate || !selectedClusterForEstimate || !perOrderRate}
 className="w-full h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
 >
 {isSavingClusterEstimate ? (
 <div className="flex gap-1">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
 </div>
 ) : (
 'Save Change'
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Transfer to Cluster Modal */}
 {showTransferClusterModal && (
 <div className="fixed inset-0 h-[100dvh] z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
 {/* Header */}
 <header className="sticky top-0 z-10 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 h-14 shrink-0 shadow-sm">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setShowTransferClusterModal(false)}
 className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-base font-bold text-slate-900">Transfer to Cluster</h2>
 </div>
 </header>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-lg mx-auto flex flex-col gap-6">
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
 
 <div className="flex flex-col gap-4">
 <div className="w-full">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Hub Manager ID</label>
 <CustomSelect 
 value={selectedHmForTransfer}
 onChange={(e) => setSelectedHmForTransfer(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
 >
 <option value="">Select Hub Manager</option>
 {transferHmList.map((hm) => (
 <option key={hm.id} value={hm.id}>
 {hm.id.substring(0, 8)} - {hm.hub_name || 'No Hub Name'} - {hm.hub_manager_name || 'No Manager Name'}
 </option>
 ))}
 </CustomSelect>
 </div>

 <div className="w-full">
 <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Cluster ID</label>
 <CustomSelect 
 value={selectedClusterForTransfer}
 onChange={(e) => setSelectedClusterForTransfer(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
 >
 <option value="">Select Cluster</option>
 {transferClusterList.map((c) => (
 <option key={c.id} value={c.id}>
 {c.id.substring(0, 8)} - {c.cluster_name || 'No Name'}
 </option>
 ))}
 </CustomSelect>
 </div>
 </div>

 <button 
 onClick={handleSaveTransfer}
 disabled={isSavingTransfer || !selectedHmForTransfer || !selectedClusterForTransfer}
 className="w-full h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
 >
 {isSavingTransfer ? (
 <div className="flex gap-1">
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
 </div>
 ) : (
 'Save Change'
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 
 {/* Contact Link Setup Modal */}
 
      {/* Customer Additional Settings Modal */}
      {showCustomerAdditionalSettings && (
        <div className="fixed inset-0 h-[100dvh] z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                <Settings size={18} />
              </div>
              <h2 className="font-black text-sm text-slate-800">Additional Setting</h2>
            </div>
            <button
              onClick={() => setShowCustomerAdditionalSettings(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Add Logo</h3>
              <div className="flex flex-col items-center gap-3">
                {additionalSettingsData.logoUrl ? (
                  <img src={additionalSettingsData.logoUrl} alt="Logo Preview" className="h-20 object-contain rounded border border-slate-200 p-1" />
                ) : (
                  <div className="w-20 h-20 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <Image size={24} />
                  </div>
                )}
                <label className="cursor-pointer bg-fuchsia-50 text-fuchsia-700 px-4 py-2 rounded-xl text-xs font-bold border border-fuchsia-200 hover:bg-fuchsia-100 transition-colors">
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUploadSettings} />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800">Promotion Banners</h3>
                <button
                  onClick={() => setAdditionalSettingsData(prev => ({
                    ...prev,
                    promoBanners: [...(prev.promoBanners || []), {
                      id: Date.now().toString(),
                      imageUrl: '',
                      isActive: true,
                      scheduleType: 'date',
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0],
                      targetDay: '0',
                      showGreenSignal: false
                    }]
                  }))}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                >
                  + Add Banner
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {(additionalSettingsData.promoBanners || []).map((banner, idx) => (
                  <div key={banner.id} className="flex flex-col gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50 relative">
                    <button 
                      onClick={() => setAdditionalSettingsData(prev => ({
                        ...prev,
                        promoBanners: prev.promoBanners.filter((_, i) => i !== idx)
                      }))}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setAdditionalSettingsData(prev => {
                          const newBanners = [...prev.promoBanners];
                          newBanners[idx].isActive = !newBanners[idx].isActive;
                          return {...prev, promoBanners: newBanners};
                        })}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors ${banner.isActive ? 'bg-blue-500' : 'bg-gray-400'}`}
                      >
                        {banner.isActive ? 'Show (Active)' : 'Hide (Inactive)'}
                      </button>

                      {/* Multi-Color Signal Selector */}
                      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-full shadow-sm">
                        {[
                          { id: 'none', bg: 'bg-gray-200' },
                          { id: 'green', bg: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
                          { id: 'red', bg: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' },
                          { id: 'blue', bg: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
                          { id: 'yellow', bg: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' },
                          { id: 'purple', bg: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' },
                          { id: 'pink', bg: 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]' }
                        ].map(c => {
                          const currentColor = banner.signalColor || (banner.showGreenSignal ? 'green' : 'none');
                          const isSelected = currentColor === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setAdditionalSettingsData(prev => {
                                const newBanners = [...prev.promoBanners];
                                newBanners[idx].signalColor = c.id;
                                newBanners[idx].showGreenSignal = (c.id === 'green');
                                return {...prev, promoBanners: newBanners};
                              })}
                              title={c.id === 'none' ? 'No Signal' : `${c.id} signal`}
                              className={`w-4 h-4 rounded-full transition-all duration-200 ${c.bg} ${isSelected ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                            />
                          );
                        })}
                      </div>

                      <span className="text-xs font-bold text-slate-500">Banner #{idx + 1}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Schedule By</label>
                        <select 
                          value={banner.scheduleType}
                          onChange={(e) => setAdditionalSettingsData(prev => {
                            const newBanners = [...prev.promoBanners];
                            newBanners[idx].scheduleType = e.target.value as 'date' | 'day';
                            return {...prev, promoBanners: newBanners};
                          })}
                          className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                          <option value="date">Date Range</option>
                          <option value="day">Repeat Weekly (Every Week)</option>
                        </select>
                      </div>

                      {banner.scheduleType === 'date' ? (
                        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                              <input 
                                type="date" 
                                value={banner.startDate || banner.targetDate}
                                onChange={(e) => setAdditionalSettingsData(prev => {
                                  const newBanners = [...prev.promoBanners];
                                  newBanners[idx].startDate = e.target.value;
                                  return {...prev, promoBanners: newBanners};
                                })}
                                className="p-2 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                              <input 
                                type="date" 
                                value={banner.endDate || banner.targetDate}
                                onChange={(e) => setAdditionalSettingsData(prev => {
                                  const newBanners = [...prev.promoBanners];
                                  newBanners[idx].endDate = e.target.value;
                                  return {...prev, promoBanners: newBanners};
                                })}
                                className="p-2 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Repeat on Day</label>
                          <select 
                            value={banner.targetDay}
                            onChange={(e) => setAdditionalSettingsData(prev => {
                              const newBanners = [...prev.promoBanners];
                              newBanners[idx].targetDay = e.target.value;
                              return {...prev, promoBanners: newBanners};
                            })}
                            className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                          >
                            <option value="0">Every Sunday</option>
                            <option value="1">Every Monday</option>
                            <option value="2">Every Tuesday</option>
                            <option value="3">Every Wednesday</option>
                            <option value="4">Every Thursday</option>
                            <option value="5">Every Friday</option>
                            <option value="6">Every Saturday</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-16 w-32 shrink-0 rounded border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden">
                        {banner.imageUrl ? (
                          <img src={banner.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <Image size={20} className="text-slate-400" />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white text-fuchsia-700 px-4 py-2 rounded-lg text-xs font-bold border border-fuchsia-200 hover:bg-fuchsia-50 transition-colors w-full text-center">
                        Upload Image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAdditionalSettingsData(prev => {
                                const newBanners = [...prev.promoBanners];
                                newBanners[idx].imageUrl = reader.result as string;
                                return { ...prev, promoBanners: newBanners };
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    </div>

                  </div>
                ))}
                {(additionalSettingsData.promoBanners || []).length === 0 && (
                  <div className="text-center py-4 text-sm text-slate-500 italic">No banners added yet.</div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveAdditionalSettings}
                className="w-full h-12 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center transition-colors active:scale-95"
              >
                Save Additional Settings
              </button>
            </div>
          </div>
        </div>
      )}

  {showContactLinkModal && (
 <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
 <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shadow-xs">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
 </div>
 <h3 className="font-bold text-slate-800 text-sm">Contact Link for Customer</h3>
 </div>
 <button onClick={() => setShowContactLinkModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
 <X size={20} />
 </button>
 </div>

 <div className="space-y-4 py-2">
 <div className="flex flex-col gap-2">
 <label className="text-xs font-bold text-slate-700">Contact Link</label>
 <input
 type="text"
 placeholder="Enter contact link (e.g. WhatsApp, Telegram, etc.)"
 value={contactInputValue}
 onChange={(e) => setContactInputValue(e.target.value)}
 className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
 />
 </div>
 </div>

 <div className="pt-2 flex justify-end">
 <button
 onClick={handleSaveContactLink}
 disabled={isSavingContactLink}
 className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-70 flex items-center justify-center min-w-[120px]"
 >
 {isSavingContactLink ? (
 <div className="flex gap-1 items-center h-5">
 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
 </div>
 ) : (
 'Save Changes'
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Customer Refund Setting Modal */}
 {showCustomerRefundSetting && (
 <div className="fixed inset-0 h-[100dvh] z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
 {/* Header */}
 <header className="sticky top-0 z-10 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 h-14 shrink-0 shadow-sm">
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setShowCustomerRefundSetting(false)}
 className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-base font-bold text-slate-900">Customer Refund Setting</h2>
 </div>
 </header>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-lg mx-auto flex flex-col gap-6">
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
 
 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-800">Refund with total selling price</span>
 </div>
 <button 
 onClick={async () => { const val = !refundWithTotalSellingPrice; setRefundWithTotalSellingPrice(val); try { if (refundSettingId) { await supabase.from('customer_refund_setting').update({ 'refund with total selling price': val }).eq('id', refundSettingId); } else { const { data } = await supabase.from('customer_refund_setting').insert({ 'refund with total selling price': val, 'refund with total amount': refundWithTotalAmount }).select(); if (data && data.length > 0) setRefundSettingId(data[0].id); } } catch(e) {} }}
 className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${refundWithTotalSellingPrice ? 'bg-blue-600' : 'bg-slate-200'}`}
 >
 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${refundWithTotalSellingPrice ? 'translate-x-6' : 'translate-x-0'}`}></div>
 </button>
 </div>
 
 <div className="h-px bg-slate-100 w-full"></div>
 
 <div className="flex items-center justify-between">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-800">Refund with total amount</span>
 </div>
 <button 
 onClick={async () => { const val = !refundWithTotalAmount; setRefundWithTotalAmount(val); try { if (refundSettingId) { await supabase.from('customer_refund_setting').update({ 'refund with total amount': val }).eq('id', refundSettingId); } else { const { data } = await supabase.from('customer_refund_setting').insert({ 'refund with total amount': val, 'refund with total selling price': refundWithTotalSellingPrice }).select(); if (data && data.length > 0) setRefundSettingId(data[0].id); } } catch(e) {} }}
 className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${refundWithTotalAmount ? 'bg-blue-600' : 'bg-slate-200'}`}
 >
 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${refundWithTotalAmount ? 'translate-x-6' : 'translate-x-0'}`}></div>
 </button>
 </div>
 </div>

 
 </div>
 </div>
 </div>
 )}

 {/* Estimated Earning Chart Modal */}
 
 
 {/* Hub Manager Salary Setup Full Screen Modal */}
 {showHubManagerSalarySetup && (
 <div className="fixed inset-0 h-[100dvh] z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
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
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
 
 {/* Add / Edit Form */}
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
 <div className="flex justify-between items-center">
 <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
 Manage Salaries
 </h3>
 <button onClick={() => setIsEditingHmSalary(!isEditingHmSalary)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors" title="Edit Amount">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
 </button>
 </div>
 
 <div className="flex flex-col gap-4">
 <div className="flex flex-col gap-4 items-start">
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
 readOnly={!isEditingHmSalary}
 className={`w-full h-11 px-3 rounded-lg border ${isEditingHmSalary ? 'border-blue-300 bg-white' : 'border-slate-300 bg-slate-100'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors`}
 />
 </div>
 </div>
 
 <button 
 onClick={handleSaveHmSalaryFixed}
 disabled={isSavingHmSalary || !hmSalaryValue || (!isEditingHmSalary && hmSalaryValue !== '')}
 className="w-full sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
 </div>
 </div>
 )}

 {/* Hub Managers Pincode Service Full Screen Modal */}
 {showHubManagersPincodeService && (
 <div className="fixed inset-0 h-[100dvh] z-[70] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-200 overflow-hidden">
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
 {pincodeItem['cluster id'] ? 'Added by Cluster' : 'Added by Admin'}
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
 value={defaultRates[activeRateRank].pickup}
 onChange={(e) => {
 setDefaultRates({...defaultRates, [activeRateRank]: {...defaultRates[activeRateRank], pickup: e.target.value}});
 }}
 className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Delivery Rate (₹)</label>
 <input 
 type="number"
 value={defaultRates[activeRateRank].delivery}
 onChange={(e) => {
 setDefaultRates({...defaultRates, [activeRateRank]: {...defaultRates[activeRateRank], delivery: e.target.value}});
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
 const ratesToSave = defaultRates[activeRateRank];
 
 let error;
 const { data: existingActive } = await supabase.from('active_service_rate').select('id').eq('tag', activeRateRank).limit(1).maybeSingle();
 
 if (existingActive) {
 const res = await supabase.from('active_service_rate').update({
 pickup_rate: ratesToSave.pickup,
 delivery_rate: ratesToSave.delivery,
 tag: activeRateRank
 }).eq('id', existingActive.id);
 error = res.error;
 } else {
 const res = await supabase.from('active_service_rate').insert({
 pickup_rate: ratesToSave.pickup,
 delivery_rate: ratesToSave.delivery,
 tag: activeRateRank
 });
 error = res.error;
 }
 
 if (error) {
 throw error;
 }
 } catch (e: any) {
 alert('Error: ' + e.message);
 } finally {
 setIsSavingRiderRate(false);
 }
 }}
 disabled={isSavingRiderRate}
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
 <AdminLiveShipmentCard />
 <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-xs mt-2">
 <button onClick={() => setShowTrackAllModal(true)} className="py-2.5 border border-black rounded-none bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors text-center w-full cursor-pointer">
 Track All
 </button>
 </div>
 <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
 <button 
   type="button"
   onClick={() => setShowAllOrdersModal(true)} 
   className="py-2.5 border border-black rounded-none bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors text-center w-full cursor-pointer"
 >
   All Orders
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
            <TrackResultCard key={i} res={res} index={i} />
          ))
        )}
      </div>
    </div>
  </div>
)}

{showAllOrdersModal && (
  <div className="fixed inset-0 h-[100dvh] z-[120] bg-white flex flex-col animate-in fade-in duration-200">
    {/* Top Bar with Search & Close */}
    <div className="shrink-0 bg-white border-b border-black p-3 sm:p-4 pb-3 flex flex-col gap-2.5 w-full max-w-3xl mx-auto z-30">
      <div className="flex items-center justify-between pb-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-black shrink-0">
            All Orders
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 border border-black bg-slate-100 text-black shrink-0">
            {filteredOrdersProducts.length} Products
          </span>
        </div>

        {/* Corner Selection Box: ALL / UNIT and Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-black rounded-none bg-white h-[30px]">
            <select
              value={allOrdersAudienceType}
              onChange={(e) => {
                const val = e.target.value as 'all' | 'unit';
                setAllOrdersAudienceType(val);
                if (val === 'all') setAllOrdersUnitCount('');
              }}
              className="h-full px-2 text-[11px] sm:text-xs font-black uppercase tracking-wider bg-white text-black cursor-pointer focus:outline-none rounded-none border-none pr-1"
              title="Target Audience"
            >
              <option value="all">ALL</option>
              <option value="unit">UNIT</option>
            </select>

            {allOrdersAudienceType === 'unit' && (
              <div className="h-full flex items-center border-l border-black">
                <input
                  type="number"
                  min="1"
                  placeholder="COUNT"
                  value={allOrdersUnitCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setAllOrdersUnitCount(val);
                    }
                  }}
                  className="h-full w-14 sm:w-16 px-1.5 text-xs font-bold text-black bg-white focus:outline-none rounded-none text-center placeholder:text-gray-400"
                  title="Enter unit count"
                  autoFocus
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAllOrdersModal(false);
              setAllOrdersSearchTerm('');
            }}
            className="p-1.5 border border-black rounded-none bg-white text-black hover:bg-black hover:text-white transition-colors shrink-0 cursor-pointer h-[30px] w-[30px] flex items-center justify-center"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Search Input Box & Search Button */}
      <div className="flex items-center gap-2 w-full">
        <input 
          type="text" 
          placeholder="SEARCH BY SELLER ID, PRODUCT CODE, PRODUCT NAME, PRODUCT TITLE..." 
          value={allOrdersSearchTerm}
          onChange={(e) => {
            setAllOrdersSearchTerm(e.target.value);
            applyAllOrdersFilter(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAllOrdersSearch();
          }}
          className="w-0 flex-1 py-2 px-3 border border-black rounded-none bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black uppercase tracking-wider text-xs sm:text-sm font-bold min-w-0 text-black"
        />
        <button 
          type="button"
          onClick={handleAllOrdersSearch}
          className="px-3 sm:px-5 py-2 border border-black rounded-none bg-black text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Search size={14} />
          <span>Search</span>
        </button>
      </div>
    </div>

    {/* Scrollable Products List */}
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white">
      <div className="w-full max-w-3xl mx-auto space-y-2.5">
        {isLoadingAllOrders && allOrdersProducts.length === 0 ? (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 py-12 animate-pulse">
            Loading Products...
          </div>
        ) : filteredOrdersProducts.length === 0 ? (
          <div className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 py-12 border border-black rounded-none p-6">
            No Products Found
          </div>
        ) : (
          filteredOrdersProducts.map((item) => {
            let firstImg = '';
            const rawImgs = item['product images'];
            if (Array.isArray(rawImgs) && rawImgs.length > 0) {
              firstImg = rawImgs[0];
            } else if (typeof rawImgs === 'string') {
              try {
                const parsed = JSON.parse(rawImgs);
                if (Array.isArray(parsed) && parsed.length > 0) firstImg = parsed[0];
                else firstImg = rawImgs;
              } catch {
                firstImg = rawImgs;
              }
            }

            return (
              <div 
                key={item.id}
                className="w-full border border-black rounded-none p-2.5 sm:p-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-2.5 sm:gap-3"
              >
                {/* 1. Product Image (single or sabse pahla image) */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 border border-black rounded-none overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                  {firstImg ? (
                    <img 
                      src={firstImg} 
                      alt={item['product name'] || 'Product'} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-[9px] text-gray-400 font-bold uppercase">No Img</span>
                  )}
                </div>

                {/* 2. Product Name & 4. Product Code on the same layer, 3. Product Title Name, 5. Price Info, Selling Price, Discount % */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-black uppercase tracking-tight truncate">
                      {item['product name'] || '—'}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-gray-600 shrink-0">
                      <span className="text-gray-400 font-sans font-normal uppercase text-[9px] mr-1">Code:</span>
                      {item['product code'] || '—'}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-600 truncate mt-0.5">
                    {item['product title name'] || '—'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] mt-1 flex items-center gap-1.5 sm:gap-2">
                    <span className="text-gray-400 font-sans line-through font-normal">
                      ₹{String(item['price info'] ?? item['price_info'] ?? '0').replace(/^₹/, '')}
                    </span>
                    <span className="text-black font-sans font-bold">
                      ₹{String(item['selling price'] ?? item['selling_price'] ?? '0').replace(/^₹/, '')}
                    </span>
                    {(item['discount %'] || item['discount%'] || item['discount']) && (
                      <span className="text-emerald-700 font-sans font-bold">
                        {String(item['discount %'] || item['discount%'] || item['discount']).includes('%')
                          ? (item['discount %'] || item['discount%'] || item['discount'])
                          : `${item['discount %'] || item['discount%'] || item['discount']}%`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Blue Color Push Button (Thin cornered border, outline style) */}
                <button
                  type="button"
                  disabled={pushingProductId === item.id}
                  onClick={() => handlePushProduct(item)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-600 rounded-none bg-white text-blue-600 hover:bg-blue-50 active:bg-blue-100 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer disabled:opacity-50 shadow-none"
                  title={allOrdersAudienceType === 'unit' ? `Push Web Message to ${allOrdersUnitCount || 'N'} Customers` : "Push Web Message to All Customers"}
                >
                  {pushingProductId === item.id ? 'Pushing...' : pushedProductId === item.id ? 'Pushed ✓' : 'Push'}
                </button>
              </div>
            );
          })
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
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
 <div onClick={() => setShowCashClustersModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Cash with Clusters</span>
 <span className="text-2xl truncate font-bold text-blue-600">{totalCashWithClusters === null ? (
 <span className="flex items-center gap-1 text-sm font-medium text-slate-500 h-6">
 Calculating
 <span className="flex items-center gap-0.5 mt-1">
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </span>
 </span>
 ) : (
 `₹ ${totalCashWithClusters.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
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
 <div onClick={() => setShowAdminCustomerPayableModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Customer Payable Amount</span>
 <span className="text-2xl truncate font-bold text-emerald-600">₹ {totalAdminCustomerPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
 </div>
 <div onClick={() => setShowSellerPayableModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Seller Payable Amount</span>
 <span className="text-2xl truncate font-bold text-emerald-600">₹ {totalSellerPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
 </div>
 <div onClick={() => setShowAdminRiderPayableModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Rider Payable Amount</span>
 <span className="text-2xl truncate font-bold text-emerald-600">₹ {totalAdminRiderPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
 </div>
 <div onClick={() => { fetchAdminHmPayableAmount(); setShowAdminHmPayableModal(true); }} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Hub Manager Payable Amount</span>
 <span className="text-2xl truncate font-bold text-emerald-600">₹ {totalAdminHmPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
 </div>
 <div onClick={() => setShowAdminClusterPayableModal(true)} className="border border-slate-300 rounded-none p-4 flex flex-col justify-between gap-1 w-full cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
 <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Cluster Payable Amount</span>
 <span className="text-2xl truncate font-bold text-emerald-600">₹ {totalAdminClusterPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
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
 <button onClick={() => setShowRoleChatModal({isOpen: true, table: "chat_for_clusters", title: "Cluster Message"})} className="py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-indigo-300 hover:bg-indigo-50 transition-colors text-center w-full break-words whitespace-normal leading-tight col-span-2">Cluster Message</button>
 </div>
 </div>

 <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-3 shrink-0">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <CheckCircle size={16} className="text-amber-600" />
 Announcement & Updates
 </h3>
 <div className="grid grid-cols-2 gap-3">
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'customer_update', title: 'Customer Update'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-blue-300 hover:bg-blue-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Customer Update</button>
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'seller_update', title: 'Seller Update'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-purple-300 hover:bg-purple-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Seller Update</button>
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'rider_update', title: 'Rider Update'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-emerald-300 hover:bg-emerald-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Rider Update</button>
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'hub_manager_update', title: 'Hub Manager Update'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-orange-300 hover:bg-orange-50 transition-colors text-center w-full break-words whitespace-normal leading-tight">Hub Manager Update</button>
 <button onClick={() => setShowAnnouncementModal({isOpen: true, type: 'cluster_update', title: 'Cluster Update'})} className="relative py-4 px-2 bg-white text-slate-900 text-[11px] sm:text-xs font-bold rounded-none border border-indigo-300 hover:bg-indigo-50 transition-colors text-center w-full break-words whitespace-normal leading-tight col-span-2">Cluster Update</button>
 </div>
 </div>
 
 <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-[250px] flex flex-col shrink-0">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <CheckCircle size={16} className="text-indigo-600" />
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

 
 <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2 relative">
 {/* Chat History Area */}
 <div className="bg-white border border-slate-200 rounded-xl p-3 h-[250px] overflow-y-auto flex flex-col gap-3 shadow-sm relative">
 {asurSelectionMode && (
 <div className="sticky top-0 left-0 right-0 bg-blue-100 p-2 flex justify-between items-center z-30 text-sm rounded-lg border-b border-blue-200 shadow-sm mb-2 -mx-1">
 <div className="font-bold text-blue-800 ml-1">{asurSelectedMsgs.length} Selected</div>
 <div className="flex gap-1">
 <button onClick={handleSelectAllAsur} className="text-blue-700 font-bold px-2 py-1 hover:bg-blue-200 rounded transition-colors text-xs">Select All</button>
 <button onClick={handleDeleteSelectedAsurMsgs} className="text-white bg-red-500 font-bold px-2 py-1 hover:bg-red-600 rounded transition-colors text-xs flex items-center gap-1"><Trash2 size={12}/> Delete</button>
 <button onClick={() => { setAsurSelectionMode(false); setAsurSelectedMsgs([]); }} className="text-slate-600 font-bold px-2 py-1 hover:bg-slate-200 rounded transition-colors text-xs"><X size={14}/></button>
 </div>
 </div>
 )}
 {asurMessages.map((msg, idx) => (
 <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
 {msg.sender === 'asur' && (
 <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
 {msg.type === 'status' ? (
 <div className="flex items-center gap-[2px]">
 {[...Array(9)].map((_, i) => (
 <div key={i} className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
 ))}
 </div>
 ) : <Bot size={14} className="text-blue-600" />}
 </div>
 )}
 <div 
 onMouseDown={() => handlePressStart(idx)}
 onMouseUp={handlePressEnd}
 onMouseLeave={handlePressEnd}
 onTouchStart={() => handlePressStart(idx)}
 onTouchEnd={handlePressEnd}
 onClick={() => { if (asurSelectionMode) toggleAsurMsgSelection(idx); }}
 className={`relative px-3 py-2 rounded-xl text-[12px] max-w-[85%] select-none ${asurSelectionMode && asurSelectedMsgs.includes(idx) ? 'ring-2 ring-blue-500 opacity-90' : ''} ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : (msg.type === 'status' ? 'bg-blue-50 text-blue-700 italic border border-blue-100' : 'bg-slate-100 text-slate-800 rounded-tl-sm')} ${asurSelectionMode ? 'cursor-pointer hover:opacity-80' : ''}`}>
 {msg.text}
 {msg.type === 'report' && !asurSelectionMode && (
 <button 
 onClick={() => handleAsurDownload(msg.text)} 
 className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 shadow-sm rounded-full text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors z-10 group"
 title="Download Data Report"
 >
 <Download size={12} className="group-hover:scale-110 transition-transform" />
 </button>
 )}
 </div>
 {msg.sender === 'user' && (
 <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
 <User size={14} className="text-slate-600" />
 </div>
 )}
 </div>
 ))}
 
 {asurIsProcessing && (
 <div className="flex gap-2 justify-start">
 <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
 <Bot size={14} className="text-blue-600" />
 </div>
 <div className="px-3 py-2 rounded-xl text-[12px] max-w-[85%] bg-slate-100 text-slate-800 rounded-tl-sm flex items-center gap-1.5 h-8">
 {[...Array(9)].map((_, i) => (
 <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1s' }} />
 ))}
 </div>
 </div>
 )}
 <div ref={asurChatEndRef} />

 </div>

 {/* Chat Input Area */}
 <div className="relative bg-white border border-slate-300 rounded-xl p-2 h-[80px] flex flex-col shrink-0 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
 <textarea 
 placeholder="Command AI System..." 
 value={asurInput}
 onChange={(e) => setAsurInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleAsurSubmit();
 }
 }}
 disabled={asurIsProcessing}
 className="w-full flex-1 bg-transparent outline-none text-[13px] text-slate-700 placeholder:text-slate-400 resize-none p-1 disabled:opacity-50"
 ></textarea>
 <div className="absolute bottom-2 right-2 flex items-center gap-2">
 <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center" title="Upload Document">
 <Plus size={14} />
 </button>
 <button 
 onClick={handleAsurSubmit} 
 disabled={asurIsProcessing || !asurInput.trim()}
 className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:bg-slate-400"
 >
 {asurIsProcessing ? <Loader2 size={14} className="animate-spin" /> : "Command"}
 </button>
 </div>
 </div>
 </div>

 </div>
 )}
 </main>

 {showFullApprovals && (
 <div className="fixed inset-0 h-[100dvh] z-[100] bg-white flex flex-col animate-in fade-in duration-200">
 <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
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
 <div className="fixed inset-0 h-[100dvh] z-[100] bg-white flex flex-col animate-in fade-in duration-200">
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
 onChange={() => {
 setRiderSettingMultipleQtyHalfRate(!riderSettingMultipleQtyHalfRate);
 }}
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
 onChange={() => {
 setRiderSettingPerformanceBasedRate(!riderSettingPerformanceBasedRate);
 }}
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
 setIsSavingRiderRateSettings(true);
 try {
 const { data } = await supabase.from('rider_rate_setting').select('id').limit(1).maybeSingle();
 if (data?.id) {
 const { error } = await supabase.from('rider_rate_setting').update({
 'multiple quantity half rate': riderSettingMultipleQtyHalfRate,
 'performance based proportional rate': riderSettingPerformanceBasedRate
 }).eq('id', data.id);
 if (error) throw error;
 } else {
 const { error } = await supabase.from('rider_rate_setting').insert({
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
 <div className="fixed inset-0 h-[100dvh] z-[100] bg-white flex flex-col animate-in fade-in duration-200">
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
 isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
 }`}
 >
 <div className={`p-1 rounded-md transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
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

              {/* Card 1: Customer & Seller Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                {/* Header with Title & Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                      Customer & Seller
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Applicable to All Customers & Sellers across all channels
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {/* Lock / Release Toggle */}
                    <div className="inline-flex rounded-lg border border-black overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSecureCustomerLockState('Lock')}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          secureCustomerLockState === 'Lock'
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-slate-100'
                        }`}
                      >
                        Lock
                      </button>
                      <div className="w-[1px] bg-black"></div>
                      <button
                        type="button"
                        onClick={() => setSecureCustomerLockState('Release')}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          secureCustomerLockState === 'Release'
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-slate-100'
                        }`}
                      >
                        Release
                      </button>
                    </div>

                    {/* Auto Mode button */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !secureCustomerAutoMode;
                        setSecureCustomerAutoMode(next);
                        if (next) {
                          setSecureCustomerAutoActiveTime(new Date().toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                          }));
                        } else {
                          setSecureCustomerAutoActiveTime(null);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        secureCustomerAutoMode
                          ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse ring-2 ring-emerald-400/50'
                          : 'bg-white text-slate-800 border-black hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${secureCustomerAutoMode ? 'bg-white animate-ping' : 'bg-slate-400'}`}></span>
                      <span>Auto Mode</span>
                    </button>
                  </div>
                </div>

                {/* Auto Mode Active Banner */}
                {secureCustomerAutoMode && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3 text-xs flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Auto Mode Sakriya (Active) - Original Real-Time</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {secureCustomerAutoActiveTime}
                    </span>
                  </div>
                )}

                {/* Customer Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Customer Policy</span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">All Registered Customers</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Box 1: Customer Entity */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Entity</label>
                      <div className="flex flex-col mt-1">
                        <span className="text-sm font-black text-slate-900 leading-tight">Customer</span>
                        <span className="text-[10px] text-slate-500 font-medium">All Customers</span>
                      </div>
                    </div>

                    {/* Box 2: Schedule */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Schedule</label>
                        {secureCustomerSchedule.includes('Day') && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ≥ {secureCustomerSchedule.split(' ')[0]}D
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <select 
                          value={secureCustomerSchedule} 
                          onChange={(e) => setSecureCustomerSchedule(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                        >
                          {SECURE_SCHEDULE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Box 3: Ratio (Hours : Days) */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ratio (H:D)</label>
                        <span className="text-[9px] font-semibold text-slate-400">Hours : Days</span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-[10px] font-semibold text-slate-600">Custom:</span>
                          <input 
                            type="text" 
                            placeholder="1:2" 
                            value={secureCustomerRatio} 
                            onChange={(e) => setSecureCustomerRatio(e.target.value)} 
                            className="w-16 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-black text-slate-900 focus:outline-none border border-slate-300 focus:border-black text-center" 
                            title="Enter custom ratio (Hours : Days)"
                          />
                        </div>
                        <select 
                          value={SECURE_RATIO_TEMPLATES.some(t => t.value === secureCustomerRatio) ? secureCustomerRatio : ''} 
                          onChange={(e) => { if (e.target.value) setSecureCustomerRatio(e.target.value); }} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
                        >
                          <option value="">Quick Templates</option>
                          {SECURE_RATIO_TEMPLATES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-0.5"></div>

                {/* Seller Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Seller Policy</span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">All Registered Sellers</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Box 1: Seller Entity */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Entity</label>
                      <div className="flex flex-col mt-1">
                        <span className="text-sm font-black text-slate-900 leading-tight">Seller</span>
                        <span className="text-[10px] text-slate-500 font-medium">All Sellers</span>
                      </div>
                    </div>

                    {/* Box 2: Schedule */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Schedule</label>
                        {secureSellerSchedule.includes('Day') && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ≥ {secureSellerSchedule.split(' ')[0]}D
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <select 
                          value={secureSellerSchedule} 
                          onChange={(e) => setSecureSellerSchedule(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                        >
                          {SECURE_SCHEDULE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Box 3: Ratio (Hours : Days) */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ratio (H:D)</label>
                        <span className="text-[9px] font-semibold text-slate-400">Hours : Days</span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-[10px] font-semibold text-slate-600">Custom:</span>
                          <input 
                            type="text" 
                            placeholder="1:2" 
                            value={secureSellerRatio} 
                            onChange={(e) => setSecureSellerRatio(e.target.value)} 
                            className="w-16 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-black text-slate-900 focus:outline-none border border-slate-300 focus:border-black text-center" 
                            title="Enter custom ratio (Hours : Days)"
                          />
                        </div>
                        <select 
                          value={SECURE_RATIO_TEMPLATES.some(t => t.value === secureSellerRatio) ? secureSellerRatio : ''} 
                          onChange={(e) => { if (e.target.value) setSecureSellerRatio(e.target.value); }} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
                        >
                          <option value="">Quick Templates</option>
                          {SECURE_RATIO_TEMPLATES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Rider & Hub Manager Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                {/* Header with Title & Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                      Rider, Hub Manager & Cluster
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Applicable to All Riders, Hub Managers & Clusters
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {/* Lock / Release Toggle */}
                    <div className="inline-flex rounded-lg border border-black overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSecureRiderLockState('Lock')}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          secureRiderLockState === 'Lock'
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-slate-100'
                        }`}
                      >
                        Lock
                      </button>
                      <div className="w-[1px] bg-black"></div>
                      <button
                        type="button"
                        onClick={() => setSecureRiderLockState('Release')}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          secureRiderLockState === 'Release'
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-slate-100'
                        }`}
                      >
                        Release
                      </button>
                    </div>

                    {/* Auto Mode button */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !secureRiderAutoMode;
                        setSecureRiderAutoMode(next);
                        if (next) {
                          setSecureRiderAutoActiveTime(new Date().toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                          }));
                        } else {
                          setSecureRiderAutoActiveTime(null);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        secureRiderAutoMode
                          ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse ring-2 ring-emerald-400/50'
                          : 'bg-white text-slate-800 border-black hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${secureRiderAutoMode ? 'bg-white animate-ping' : 'bg-slate-400'}`}></span>
                      <span>Auto Mode</span>
                    </button>
                  </div>
                </div>

                {/* Auto Mode Active Banner */}
                {secureRiderAutoMode && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3 text-xs flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Auto Mode Sakriya (Active) - Original Real-Time</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {secureRiderAutoActiveTime}
                    </span>
                  </div>
                )}

                {/* Rider Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Rider Policy</span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">All Registered Riders</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Box 1: Rider Entity */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Entity</label>
                      <div className="flex flex-col mt-1">
                        <span className="text-sm font-black text-slate-900 leading-tight">Rider</span>
                        <span className="text-[10px] text-slate-500 font-medium">All Riders</span>
                      </div>
                    </div>

                    {/* Box 2: Schedule */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Schedule</label>
                        {secureRiderSchedule.includes('Day') && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ≥ {secureRiderSchedule.split(' ')[0]}D
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <select 
                          value={secureRiderSchedule} 
                          onChange={(e) => setSecureRiderSchedule(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                        >
                          {SECURE_SCHEDULE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Box 3: Ratio (Hours : Days) */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ratio (H:D)</label>
                        <span className="text-[9px] font-semibold text-slate-400">Hours : Days</span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-[10px] font-semibold text-slate-600">Custom:</span>
                          <input 
                            type="text" 
                            placeholder="1:2" 
                            value={secureRiderRatio} 
                            onChange={(e) => setSecureRiderRatio(e.target.value)} 
                            className="w-16 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-black text-slate-900 focus:outline-none border border-slate-300 focus:border-black text-center" 
                            title="Enter custom ratio (Hours : Days)"
                          />
                        </div>
                        <select 
                          value={SECURE_RATIO_TEMPLATES.some(t => t.value === secureRiderRatio) ? secureRiderRatio : ''} 
                          onChange={(e) => { if (e.target.value) setSecureRiderRatio(e.target.value); }} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
                        >
                          <option value="">Quick Templates</option>
                          {SECURE_RATIO_TEMPLATES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-0.5"></div>

                {/* Hub Manager Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Hub Manager Policy</span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">Hub, Logistics & Hotel</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Box 1: Hub Manager Entity */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Entity</label>
                      <div className="flex flex-col mt-1">
                        <span className="text-sm font-black text-slate-900 leading-tight">Hub Manager</span>
                        <span className="text-[10px] text-slate-500 font-medium">All Managers</span>
                      </div>
                    </div>

                    {/* Box 2: Schedule */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Schedule</label>
                        {secureHmSchedule.includes('Day') && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ≥ {secureHmSchedule.split(' ')[0]}D
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <select 
                          value={secureHmSchedule} 
                          onChange={(e) => setSecureHmSchedule(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                        >
                          {SECURE_SCHEDULE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Box 3: Ratio (Hours : Days) */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ratio (H:D)</label>
                        <span className="text-[9px] font-semibold text-slate-400">Hours : Days</span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-[10px] font-semibold text-slate-600">Custom:</span>
                          <input 
                            type="text" 
                            placeholder="1:2" 
                            value={secureHmRatio} 
                            onChange={(e) => setSecureHmRatio(e.target.value)} 
                            className="w-16 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-black text-slate-900 focus:outline-none border border-slate-300 focus:border-black text-center" 
                            title="Enter custom ratio (Hours : Days)"
                          />
                        </div>
                        <select 
                          value={SECURE_RATIO_TEMPLATES.some(t => t.value === secureHmRatio) ? secureHmRatio : ''} 
                          onChange={(e) => { if (e.target.value) setSecureHmRatio(e.target.value); }} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
                        >
                          <option value="">Quick Templates</option>
                          {SECURE_RATIO_TEMPLATES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              
                <div className="border-t border-slate-100 my-0.5"></div>
                {/* Cluster Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Cluster Policy</span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">All Clusters & Zones</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Box 1: Cluster Entity */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Entity</label>
                      <div className="flex flex-col mt-1">
                        <span className="text-sm font-black text-slate-900 leading-tight">Cluster</span>
                        <span className="text-[10px] text-slate-500 font-medium">All Clusters</span>
                      </div>
                    </div>
                    {/* Box 2: Schedule */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Schedule</label>
                        {secureClusterSchedule.includes('Day') && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ≥ {secureClusterSchedule.split(' ')[0]}D
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <select 
                          value={secureClusterSchedule} 
                          onChange={(e) => setSecureClusterSchedule(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                        >
                          {SECURE_SCHEDULE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Box 3: Ratio (Hours : Days) */}
                    <div className="border border-black bg-white rounded-xl p-3 flex flex-col justify-between min-h-[72px] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ratio (H:D)</label>
                        <span className="text-[9px] font-semibold text-slate-400">Hours : Days</span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-[10px] font-semibold text-slate-600">Custom:</span>
                          <input 
                            type="text" 
                            placeholder="1:2"
                            value={secureClusterRatio}
                            onChange={(e) => setSecureClusterRatio(e.target.value)}
                            className="w-16 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-black text-slate-900 focus:outline-none border border-slate-300 focus:border-black text-center"
                            title="Enter custom ratio (Hours : Days)"
                          />
                        </div>
                        <select 
                          value={SECURE_RATIO_TEMPLATES.some(t => t.value === secureClusterRatio) ? secureClusterRatio : ''}
                          onChange={(e) => { if (e.target.value) setSecureClusterRatio(e.target.value); }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer truncate"
                        >
                          <option value="">Quick Templates</option>
                          {SECURE_RATIO_TEMPLATES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Payment Category */}
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

              {/* Card 4: Select Payment Method */}
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
 {showCashRidersModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
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

 {showCashHubManagersModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
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
 <div className="text-xs text-slate-500 font-medium">Mob: {hm.registered_mobile_number || 'N/A'}</div>
 
 </div>
 ))
 )}
 </div>
 </div>
 
 {selectedHubManagerForCalc && (
 <div className="fixed inset-0 h-[100dvh] z-[70] flex flex-col bg-slate-50 overflow-hidden">
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
 
 
 
 
 
 {showAdminHmPayableModal && (
        <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Hub Manager Payable Details (Directly Appointed)
              </h3>
              <button onClick={() => setShowAdminHmPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Hub Manager"
              items={filteredAdminHmPayableList}
              count={filteredAdminHmPayableList.length}
              searchQuery={adminHmPayableSearch}
              onSearchChange={setAdminHmPayableSearch}
              defaultPurpose="Hub Manager Salary"
              onMarkAllSettled={() => handleMarkAllSettledForType('Hub Manager')}
              isSettlingAll={settlingAllUserType === 'Hub Manager'}
              settlingProgress={settlingAllUserType === 'Hub Manager' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredAdminHmPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No hub managers found with payable amounts.</div>
              ) : (
                filteredAdminHmPayableList.map(hm => (
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

      {showAdminRiderPayableModal && (
        <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Rider Payable Details (Directly Appointed)
              </h3>
              <button onClick={() => setShowAdminRiderPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Rider"
              items={filteredAdminRiderPayableList}
              count={filteredAdminRiderPayableList.length}
              searchQuery={adminRiderPayableSearch}
              onSearchChange={setAdminRiderPayableSearch}
              defaultPurpose="Rider Salary / Payout"
              onMarkAllSettled={() => handleMarkAllSettledForType('Rider')}
              isSettlingAll={settlingAllUserType === 'Rider'}
              settlingProgress={settlingAllUserType === 'Rider' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredAdminRiderPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No riders found with payable amounts.</div>
              ) : (
                filteredAdminRiderPayableList.map(rider => (
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

      {showAdminClusterPayableModal && (
        <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Cluster Payable Details
              </h3>
              <button onClick={() => setShowAdminClusterPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Cluster"
              items={filteredAdminClusterPayableList}
              count={filteredAdminClusterPayableList.length}
              searchQuery={adminClusterPayableSearch}
              onSearchChange={setAdminClusterPayableSearch}
              defaultPurpose="Cluster Payout"
              onMarkAllSettled={() => handleMarkAllSettledForType('Cluster')}
              isSettlingAll={settlingAllUserType === 'Cluster'}
              settlingProgress={settlingAllUserType === 'Cluster' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredAdminClusterPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No clusters found with payable amounts.</div>
              ) : (
                filteredAdminClusterPayableList.map(cluster => (
                  <div key={cluster.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="truncate">{cluster.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{cluster.short_id}</span>
                      </span>
                      <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Orders: {cluster.count} (Rate: ₹{cluster.rate})</span>
                        <span className="text-[10px] font-bold text-red-500">Penalty: -₹ {(cluster.penaltyAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        <span className="text-xs font-black text-emerald-600 mt-1">Total Payable: ₹ {(cluster.sum || cluster.payableAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 font-medium grid grid-cols-2 gap-2 mb-1">
                      <span><span className="text-slate-400">Mob:</span> {cluster.mobile}</span>
                    </div>
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex flex-row justify-between gap-4 text-xs mt-1">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Details</p>
                        <p className="font-semibold text-slate-700">{cluster.bank_name}</p>
                        <p className="text-slate-600">A/C: <span className="font-medium">{cluster.account_no}</span></p>
                        <p className="text-slate-600">IFSC: <span className="font-medium">{cluster.ifsc_code}</span></p>
                      </div>
                      <div className="flex-1 border-l border-slate-200 pl-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">UPI Details</p>
                        <p className="font-semibold text-slate-700 break-all">{cluster.upi_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => { if (paymentStates[cluster.id]?.status !== 'hold' && paymentStates[cluster.id]?.status !== 'settled') handlePayNow(cluster.id); }}
                        disabled={paymentStates[cluster.id]?.status === 'hold' || paymentStates[cluster.id]?.status === 'settled'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[cluster.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-blue-300 text-blue-400 bg-slate-50'
                            : paymentStates[cluster.id]?.status === 'settled'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                        }`}
                      >
                        Pay Now
                      </button>
                      <button
                        onClick={() => handleHoldAmount(cluster.id)}
                        disabled={paymentStates[cluster.id]?.status === 'settled' || paymentStates[cluster.id]?.status === 'success'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[cluster.id]?.status === 'settled' || paymentStates[cluster.id]?.status === 'success'
                            ? 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : paymentStates[cluster.id]?.status === 'hold'
                            ? 'border-2 border-yellow-400 bg-yellow-50 text-yellow-800 shadow-xs ring-2 ring-yellow-400/40 cursor-pointer font-black'
                            : 'border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[cluster.id]?.status === 'hold' ? 'On Hold' : 'Hold Amount'}
                      </button>
                      <button
                        onClick={() => { if (paymentStates[cluster.id]?.status !== 'hold') handleMarkAsSettled(cluster.id); }}
                        disabled={paymentStates[cluster.id]?.status === 'settled' || paymentStates[cluster.id]?.status === 'hold'}
                        className={`flex-1 py-2 px-2 border rounded-md text-[10px] font-bold transition-all ${
                          paymentStates[cluster.id]?.status === 'hold'
                            ? 'opacity-50 pointer-events-none cursor-not-allowed border-emerald-300 text-emerald-400 bg-slate-50'
                            : paymentStates[cluster.id]?.status === 'settled'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600 cursor-default'
                            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 cursor-pointer'
                        }`}
                      >
                        {paymentStates[cluster.id]?.status === 'settled' ? 'Settled' : 'Mark as Settled'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showAdminCustomerPayableModal && (
        <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
          <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Customer Refund & Payable Details
              </h3>
              <button onClick={() => setShowAdminCustomerPayableModal(false)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <PayableListBanner
              userType="Customer"
              items={filteredAdminCustomerPayableList}
              count={filteredAdminCustomerPayableList.length}
              searchQuery={adminCustomerPayableSearch}
              onSearchChange={setAdminCustomerPayableSearch}
              defaultPurpose="Customer Refund"
              onMarkAllSettled={() => handleMarkAllSettledForType('Customer')}
              isSettlingAll={settlingAllUserType === 'Customer'}
              settlingProgress={settlingAllUserType === 'Customer' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredAdminCustomerPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No customers found with payable refund amounts.</div>
              ) : (
                filteredAdminCustomerPayableList.map(cust => (
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
        <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
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
              items={filteredAdminSellerPayableList}
              count={filteredAdminSellerPayableList.length}
              searchQuery={adminSellerPayableSearch}
              onSearchChange={setAdminSellerPayableSearch}
              defaultPurpose="Seller Settlement / Payout"
              onMarkAllSettled={() => handleMarkAllSettledForType('Seller')}
              isSettlingAll={settlingAllUserType === 'Seller'}
              settlingProgress={settlingAllUserType === 'Seller' ? settlingProgress : null}
            />
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {filteredAdminSellerPayableList.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">No sellers found with payable amounts.</div>
              ) : (
                filteredAdminSellerPayableList.map(seller => (
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

      {showAdminPendingDepositModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-150">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 {/* Top Navigation Banner */}
 <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-3 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-2xs shrink-0">
 <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
 <button
 onClick={() => setShowAdminPendingDepositModal(false)}
 className="p-1.5 sm:p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
 title="Back"
 >
 <ArrowLeft size={20} />
 </button>
 <div className="min-w-0">
 <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2 truncate">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet text-emerald-600 shrink-0"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
 Pending Deposit Details
 </h3>
 <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
 Cash With Admin &amp; Cluster Collections
 </p>
 </div>
 </div>

 {/* Banner Right Action Buttons */}
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => setShowAdminPendingDepositModal(false)}
 className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
 title="Close"
 >
 <X size={20} />
 </button>
 </div>
 </div>

 {/* Main Scrollable Content */}
 <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-5 pb-20">
 {/* Top Total Amount Card */}
 <div className="w-full bg-white rounded-xl p-4 sm:p-5 border border-emerald-500 shadow-2xs shrink-0 flex flex-col gap-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-emerald-700 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet text-emerald-600"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
 Total Pending Collected Amount
 </span>
 <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
 {adminPendingDepositsList.length} Active Records
 </span>
 </div>
 
 <div className="flex items-baseline gap-1.5">
 <span className="text-2xl sm:text-3xl font-bold text-emerald-600 shrink-0">₹</span>
 <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
 {adminPendingDepositsList.reduce((acc, dep) => acc + (parseFloat(dep['total cash payment'] || '0') || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>

 <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5 mt-0.5">
 <span className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
 Live Status
 </span>
 <span>100% Accurate &amp; Synchronized</span>
 </div>
 </div>

 {/* Deposit Records List */}
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between px-0.5">
 <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
 <Layers size={14} className="text-emerald-600" />
 Deposit Records
 </h4>
 <span className="text-xs text-slate-500 font-medium">
 {adminPendingDepositsList.length} records found
 </span>
 </div>

 {adminPendingDepositsList.length === 0 ? (
 <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
 <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
 <CheckCircle size={24} />
 </div>
 <p className="text-sm font-bold text-slate-700">No Pending Deposits Found</p>
 <p className="text-xs text-slate-400 max-w-sm">
 All cash collected has been accounted for or cleared.
 </p>
 </div>
 ) : (
 <div className="flex flex-col gap-2.5 sm:gap-3">
 {adminPendingDepositsList.map((dep, idx) => (
 <div
 key={dep.id || idx}
 className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-emerald-200 transition-all flex flex-col gap-2"
 >
 <div className="flex items-center justify-between gap-2">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-xs font-bold text-slate-800">
 {dep.created_at ? new Date(dep.created_at).toLocaleString('en-IN') : `Record #${idx + 1}`}
 </span>
 {dep['admin id'] && (
 <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-semibold">
 Admin ID: {dep['admin id'].substring(0, 8)}...
 </span>
 )}
 </div>
 <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
 +₹{parseFloat(dep['total cash payment'] || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>

 {dep['cash payment status'] && (
 <div className="text-xs text-slate-700 bg-slate-50/80 p-2.5 sm:p-3 rounded-lg border border-slate-100 leading-relaxed break-words font-medium">
 {dep['cash payment status']}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {showCashClustersModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 <CreditCard size={18} />
 Total Cash with Clusters
 </h3>
 <button onClick={() => setShowCashClustersModal(false)} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-3">
 {cashClustersList.length === 0 ? (
 <div className="text-center text-slate-500 text-sm py-8">No clusters found with cash.</div>
 ) : (
 cashClustersList.map(cluster => (
 <div key={cluster.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-1 shadow-sm bg-white">
 <div className="flex justify-between items-start">
 <span className="font-bold text-slate-800 text-sm">{cluster.cluster_name || 'Unknown'}</span>
 <span className="font-black text-emerald-600 text-base">₹ {cluster.cash}</span>
 </div>
 <div className="text-xs text-slate-500 font-medium">ID: {cluster.id?.substring(0, 8)}</div>
 <div className="text-xs text-slate-500 font-medium">Mob: {cluster.registered_mobile_number || 'N/A'}</div>
 <div className="flex items-center justify-between border-t border-slate-200 mt-2 pt-2 gap-2">
 <button onClick={() => setSelectedClusterForCalc(cluster)} className="flex-1 py-1.5 border border-slate-300 text-xs font-bold text-slate-700 rounded-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">Calculate</button>
 <button disabled={collectingClusterId === cluster.id} onClick={() => handleClusterCollect(cluster)} className={`flex-1 h-[30px] border border-emerald-500 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-sm hover:bg-emerald-100 active:bg-emerald-200 transition-colors flex items-center justify-center ${collectingClusterId === cluster.id ? 'opacity-70 cursor-not-allowed' : ''}`}>
 {collectingClusterId === cluster.id ? (
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
 
 {selectedClusterForCalc && (
 <div className="fixed inset-0 h-[100dvh] z-[70] flex flex-col bg-slate-50 overflow-hidden">
 <div className="bg-white w-full min-h-full flex flex-col overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/><path d="M8 4v4"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M12 16h.01"/><path d="M16 16h.01"/><path d="M8 12h.01"/><path d="M8 16h.01"/></svg>
 Calculator
 </h3>
 <button onClick={() => { setSelectedClusterForCalc(null); setClusterCalcDenominations({}); }} className="text-slate-500 hover:text-slate-800">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-4">
 <div className="bg-slate-100 rounded-lg p-3 space-y-1">
 <div className="text-xs text-slate-500 font-medium">Cluster: <span className="font-bold text-slate-800">{selectedClusterForCalc.cluster_name || 'Unknown'}</span></div>
 <div className="text-xs text-slate-500 font-medium">Target Amount: <span className="font-bold text-emerald-600 text-sm">₹{selectedClusterForCalc.cash || 0}</span></div>
 <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-200 mt-1">Entered Amount: <span className="font-bold text-blue-600 text-sm">₹{Object.entries(clusterCalcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0)}</span></div>
 <div className="text-xs text-slate-500 font-medium">Remaining Amount: <span className={`font-bold text-sm ${(selectedClusterForCalc.cash || 0) - Object.entries(clusterCalcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0) < 0 ? 'text-red-600' : 'text-orange-600'}`}>₹{(selectedClusterForCalc.cash || 0) - Object.entries(clusterCalcDenominations).reduce((acc, [den, count]) => acc + (Number(den) * Number(count)), 0)}</span></div>
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
 value={clusterCalcDenominations[den] || ''}
 onChange={(e) => setClusterCalcDenominations(prev => ({ ...prev, [den]: parseInt(e.target.value) || 0 }))}
 />
 <div className="text-slate-400 font-medium text-xs">=</div>
 <div className="w-20 font-bold text-emerald-600 text-right bg-emerald-50 px-2 py-1.5 rounded">₹ {(clusterCalcDenominations[den] || 0) * den}</div>
 </div>
 ))}
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 bg-white shrink-0">
 <button onClick={() => { setSelectedClusterForCalc(null); setClusterCalcDenominations({}); }} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm">
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
 currentUserType="admin"
 currentUserId="admin"
 currentUserName="SURIYAWAN SHOPPING"
 clusterId={null}
 />
 <AnnouncementChatModal
 isOpen={showAnnouncementModal.isOpen}
 onClose={() => setShowAnnouncementModal({ ...showAnnouncementModal, isOpen: false })}
 updateType={showAnnouncementModal.type}
 title={showAnnouncementModal.title}
 />

 {showRiderPenaltyModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200">
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
 .filter(p => !riderPenaltySearch || (penaltyRiders.find(r => r.id === p["rider id"])?.rider_name || p["rider id"])?.toLowerCase().includes(riderPenaltySearch.toLowerCase()))
 .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
 .map(p => (
 <div key={p.id} className="p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-800">{(penaltyRiders.find(r => r.id === p["rider id"])?.rider_name || p["rider id"]) || 'Unknown Rider'}</span>
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
 <div className="fixed inset-0 h-[100dvh] z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200">
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
 .filter(p => !hubManagerPenaltySearch || (penaltyHubManagers.find(r => r.id === p["hub manager id"])?.hub_manager_name || p["hub manager id"])?.toLowerCase().includes(hubManagerPenaltySearch.toLowerCase()))
 .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
 .map(p => (
 <div key={p.id} className="p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-800">{(penaltyHubManagers.find(r => r.id === p["hub manager id"])?.hub_manager_name || p["hub manager id"]) || 'Unknown Hub Manager'}</span>
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
 {showClusterPenaltyModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200">
 <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 shrink-0">
 <button onClick={() => setShowClusterPenaltyModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
 <ArrowLeft size={20} />
 </button>
 <h2 className="font-bold text-slate-800">Cluster Penalty</h2>
 </div>
 
 <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Select Cluster</label>
 <CustomSelect value={clusterPenaltyForm.userId} onChange={(e) => setClusterPenaltyForm({...clusterPenaltyForm, userId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
 <option value="">Select a cluster</option>
 {penaltyClusters.map(item => (
 <option key={item.id} value={item.id}>{item.id.substring(0, 8)} - {item.cluster_name || 'No Name'} - {item.registered_pincode || item.pincode || 'N/A'}</option>
 ))}
 </CustomSelect>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Penalty Amount</label>
 <input type="number" placeholder="Enter amount" value={clusterPenaltyForm.amount} onChange={(e) => setClusterPenaltyForm({...clusterPenaltyForm, amount: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-slate-700">Penalty Status</label>
 <input type="text" placeholder="Enter status" value={clusterPenaltyForm.status} onChange={(e) => setClusterPenaltyForm({...clusterPenaltyForm, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
 </div>
 <button disabled={isSavingClusterPenalty} onClick={handleSaveClusterPenalty} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl text-sm transition-colors mt-2 flex items-center justify-center ${isSavingClusterPenalty ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}>
 {isSavingClusterPenalty ? (
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
 value={clusterPenaltySearch}
 onChange={(e) => setClusterPenaltySearch(e.target.value)}
 className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-0">
 
 {clusterPenalties.length > 0 ? (
 <div className="flex flex-col">
 {clusterPenalties
 .filter(p => !clusterPenaltySearch || (penaltyClusters.find(r => r.id === p["cluster id"])?.store_name || penaltyClusters.find(r => r.id === p["cluster id"])?.hub_manager_name || p["cluster id"] || '').toLowerCase().includes(clusterPenaltySearch.toLowerCase()))
 .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
 .map(p => (
 <div key={p.id} className="p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-800">{(penaltyClusters.find(r => r.id === p["cluster id"])?.hub_manager_name || p["cluster id"]) || 'Unknown Cluster'}</span>
 <span className="text-xs text-slate-500">₹{p["penalty amount"]} - {p["penalty status"]}</span>
 </div>
 <button disabled={removingClusterPenaltyId === p.id} onClick={() => handleRemoveClusterPenalty(p.id)} className={`px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded transition-colors flex items-center justify-center min-w-[105px] h-[26px] ${removingClusterPenaltyId === p.id ? 'opacity-80 cursor-not-allowed bg-red-50' : 'hover:bg-red-50'}`}>
 {removingClusterPenaltyId === p.id ? (
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
 {showRiderSettingAuth && (
 <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
 <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
 <h3 className="font-bold text-slate-800 text-lg">Enter Password</h3>
 <div className="flex flex-col gap-2">
 <input 
 type="password" 
 value={authPasswordInput}
 onChange={(e) => {
 setAuthPasswordInput(e.target.value);
 setAuthError('');
 }}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 if (actualRiderSettingPassword === '' || authPasswordInput === actualRiderSettingPassword) {
 setShowRiderSettingAuth(false);
 setShowRiderSettingModal(true);
 setRiderSettingMode('view');
 setIsImageUnlocked(false);
 setAuthError('');
 } else {
 setAuthError('Incorrect Password');
 }
 }
 }}
 className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 placeholder="Password"
 />
 {authError && <p className="text-xs font-bold text-rose-500 animate-in fade-in slide-in-from-top-1">{authError}</p>}
 </div>
 <div className="flex gap-3 justify-end mt-2">
 <button 
 onClick={() => {
 setShowRiderSettingAuth(false);
 setAuthError('');
 }}
 className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
 >
 Cancel
 </button>
 <button 
 onClick={() => {
 if (actualRiderSettingPassword === '' || authPasswordInput === actualRiderSettingPassword) {
 setShowRiderSettingAuth(false);
 setShowRiderSettingModal(true);
 setRiderSettingMode('view');
 setIsImageUnlocked(false);
 setAuthError('');
 } else {
 setAuthError('Incorrect Password');
 }
 }}
 className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
 >
 Enter
 </button>
 </div>
 </div>
 </div>
 )}

 {showFullImage && (
 <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4 animate-in fade-in cursor-pointer" onClick={() => setShowFullImage(false)}>
 <img src={riderSettingImage} className="max-w-full max-h-full object-contain rounded-lg" />
 </div>
 )}

 {showRiderVisualSettingModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200">
 <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 shrink-0 shadow-sm">
 <button onClick={() => setShowRiderVisualSettingModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
 <X size={20} />
 </button>
 <h2 className="font-bold text-slate-800">Visual Setting</h2>
 </div>
 
 <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col items-center justify-start mt-4 sm:mt-10">
 <div className="w-full max-w-lg bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
 <div className="p-6 sm:p-8 flex flex-row items-center justify-between gap-6 border-b border-slate-100">
 <div className="flex flex-col flex-1">
 <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">Visual Online Payment</h3>
 <p className="text-sm text-slate-500 leading-relaxed">Enable or disable online payment option for riders. This setting is specific to this device.</p>
 </div>
 <button
 onClick={() => setLocalVisualSettingState(!localVisualSettingState)}
 className={`relative shrink-0 inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${localVisualSettingState ? 'bg-indigo-600' : 'bg-slate-300'}`}
 >
 <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${localVisualSettingState ? 'translate-x-7' : 'translate-x-1'}`} />
 </button>
 </div>
 <div className="p-5 sm:p-6 bg-slate-50 flex items-center justify-end">
 <button 
 onClick={() => {
 localStorage.setItem('rider_visual_online_payment', JSON.stringify(localVisualSettingState));
 setShowRiderVisualSettingModal(false);
 }}
 className={`w-full sm:w-auto px-10 h-12 ${localVisualSettingState !== (localStorage.getItem('rider_visual_online_payment') ? JSON.parse(localStorage.getItem('rider_visual_online_payment') as string) : false) ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} font-bold text-sm rounded-xl transition-all flex items-center justify-center`}
 >
 Save Changes
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {showRiderSettingModal && (
 <div className="fixed inset-0 h-[100dvh] z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-200">
 <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 shrink-0">
 <button onClick={() => { setShowRiderSettingModal(false); setRiderSettingMode('view'); setActivePatternPath([]); setIsImageUnlocked(false); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
 <X size={20} />
 </button>
 <h2 className="font-bold text-slate-800">Rider Setting</h2>
 </div>
 
 <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-8">
 
 <div className="flex flex-col gap-2">
 <label className="text-sm font-bold text-slate-800">Upload Image (QR Code)</label>
 <div className="flex flex-col sm:flex-row items-center gap-4">
 <div 
 className={`relative w-28 h-28 shrink-0 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 ${isImageUnlocked && riderSettingImage ? 'cursor-pointer hover:border-indigo-400' : ''}`}
 onClick={() => {
 if (isImageUnlocked && riderSettingImage) setShowFullImage(true);
 }}
 >
 {riderSettingImage ? (
 <>
 <img 
 src={riderSettingImage} 
 alt="Uploaded" 
 className={`w-full h-full object-cover transition-all duration-300 ${!isImageUnlocked ? 'blur-md grayscale opacity-50' : ''}`} 
 />
 {!isImageUnlocked && (
 <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10">
 <ShieldCheck size={28} className="text-slate-700" />
 </div>
 )}
 </>
 ) : (
 <span className="text-xs font-semibold text-slate-400">No Image</span>
 )}
 </div>
 <div className="flex-1 w-full">
 <input 
 type="file" 
 accept="image/*" 
 disabled={!isImageUnlocked && !!riderSettingImage}
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onload = (ev) => {
 setRiderSettingImage(ev.target?.result as string);
 setIsImageUnlocked(true);
 };
 reader.readAsDataURL(file);
 }
 }}
 className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
 />
 {!isImageUnlocked && !!riderSettingImage && (
 <p className="text-xs text-rose-500 mt-2 font-bold tracking-tight">Draw correct pattern below to view or change image.</p>
 )}
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <label className="text-sm font-bold text-slate-800">Pattern Lock</label>
 {riderSettingMode === 'view' && (
 <button 
 onClick={() => {
 if (savedRiderPattern.length === 0) {
 setRiderSettingMode('new');
 } else {
 setRiderSettingMode('verify');
 }
 setPatternError('');
 setActivePatternPath([]);
 }}
 className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 cursor-pointer"
 >
 Change Pattern
 </button>
 )}
 </div>

 <div className="flex flex-col items-center gap-4">
 <div className="h-5 flex items-center justify-center">
 {patternError ? (
 <p className="text-xs font-bold text-rose-600 animate-in fade-in slide-in-from-top-1">{patternError}</p>
 ) : (
 <>
 {riderSettingMode === 'view' && !isImageUnlocked && <p className="text-xs font-bold text-slate-600 animate-in fade-in">Draw pattern to unlock image</p>}
 {riderSettingMode === 'view' && isImageUnlocked && <p className="text-xs font-bold text-emerald-600 animate-in fade-in">Image Unlocked</p>}
 {riderSettingMode === 'verify' && <p className="text-xs font-bold text-amber-600 animate-in fade-in">Enter old pattern to verify</p>}
 {riderSettingMode === 'new' && <p className="text-xs font-bold text-indigo-600 animate-in fade-in">Draw new pattern</p>}
 {riderSettingMode === 'confirm' && <p className="text-xs font-bold text-emerald-600 animate-in fade-in">Confirm new pattern</p>}
 </>
 )}
 </div>
 
 <div 
 className={`relative w-full max-w-[280px] mx-auto aspect-square rounded-2xl touch-none select-none overflow-hidden ${riderSettingMode === 'view' && isImageUnlocked ? 'bg-slate-50 opacity-60 pointer-events-none' : 'bg-slate-100'}`}
 onPointerDown={(e) => {
 if (riderSettingMode === 'view' && isImageUnlocked) return;
 setIsDrawingPattern(true);
 setPatternError('');
 const rect = e.currentTarget.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;
 const cellWidth = rect.width / 4;
 const cellHeight = rect.height / 4;
 const col = Math.floor(x / cellWidth);
 const row = Math.floor(y / cellHeight);
 if (col >= 0 && col < 4 && row >= 0 && row < 4) {
 const dotIndex = row * 4 + col;
 setActivePatternPath([dotIndex]);
 }
 }}
 onPointerMove={(e) => {
 if (!isDrawingPattern) return;
 // Prevent default to stop pull-to-refresh or scrolling on mobile touch
 e.preventDefault(); 
 const rect = e.currentTarget.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;
 const cellWidth = rect.width / 4;
 const cellHeight = rect.height / 4;
 const col = Math.floor(x / cellWidth);
 const row = Math.floor(y / cellHeight);
 
 if (col >= 0 && col < 4 && row >= 0 && row < 4) {
 const cx = col * cellWidth + cellWidth / 2;
 const cy = row * cellHeight + cellHeight / 2;
 const dist = Math.hypot(x - cx, y - cy);
 // Reduced hit radius for smoother tracking
 if (dist < cellWidth * 0.5) { 
 const dotIndex = row * 4 + col;
 if (!activePatternPath.includes(dotIndex)) {
 setActivePatternPath(prev => [...prev, dotIndex]);
 }
 }
 }
 }}
 onPointerLeave={() => {
 if (!isDrawingPattern) return;
 setIsDrawingPattern(false);
 if (riderSettingMode === 'view') {
 if (activePatternPath.join(',') === savedRiderPattern.join(',')) {
 setIsImageUnlocked(true);
 setPatternError('');
 setActivePatternPath([]);
 } else {
 setPatternError('Incorrect pattern.');
 setActivePatternPath([]);
 }
 } else if (riderSettingMode === 'verify') {
 if (activePatternPath.join(',') === savedRiderPattern.join(',')) {
 setRiderSettingMode('new');
 setActivePatternPath([]);
 setPatternError('');
 } else {
 setPatternError('Incorrect pattern. Try again.');
 setActivePatternPath([]);
 }
 } else if (riderSettingMode === 'new') {
 if (activePatternPath.length < 4) {
 setPatternError('Pattern must be at least 4 dots');
 setActivePatternPath([]);
 } else {
 setTempNewPattern(activePatternPath);
 setRiderSettingMode('confirm');
 setActivePatternPath([]);
 setPatternError('');
 }
 } else if (riderSettingMode === 'confirm') {
 if (activePatternPath.join(',') === tempNewPattern.join(',')) {
 setSavedRiderPattern(tempNewPattern);
 setRiderSettingMode('view');
 setIsImageUnlocked(true);
 setActivePatternPath([]);
 setPatternError('');
 } else {
 setPatternError('Pattern mismatch. Try again.');
 setRiderSettingMode('new');
 setActivePatternPath([]);
 setTempNewPattern([]);
 }
 }
 }}
 onPointerUp={() => {
 if (!isDrawingPattern) return;
 setIsDrawingPattern(false);
 if (riderSettingMode === 'view') {
 if (activePatternPath.join(',') === savedRiderPattern.join(',')) {
 setIsImageUnlocked(true);
 setPatternError('');
 setActivePatternPath([]);
 } else {
 setPatternError('Incorrect pattern.');
 setActivePatternPath([]);
 }
 } else if (riderSettingMode === 'verify') {
 if (activePatternPath.join(',') === savedRiderPattern.join(',')) {
 setRiderSettingMode('new');
 setActivePatternPath([]);
 setPatternError('');
 } else {
 setPatternError('Incorrect pattern. Try again.');
 setActivePatternPath([]);
 }
 } else if (riderSettingMode === 'new') {
 if (activePatternPath.length < 4) {
 setPatternError('Pattern must be at least 4 dots');
 setActivePatternPath([]);
 } else {
 setTempNewPattern(activePatternPath);
 setRiderSettingMode('confirm');
 setActivePatternPath([]);
 setPatternError('');
 }
 } else if (riderSettingMode === 'confirm') {
 if (activePatternPath.join(',') === tempNewPattern.join(',')) {
 setSavedRiderPattern(tempNewPattern);
 setRiderSettingMode('view');
 setIsImageUnlocked(true);
 setActivePatternPath([]);
 setPatternError('');
 } else {
 setPatternError('Pattern mismatch. Try again.');
 setRiderSettingMode('new');
 setActivePatternPath([]);
 setTempNewPattern([]);
 }
 }
 }}
 >
 <svg className="absolute inset-0 w-full h-full pointer-events-none">
 {activePatternPath.map((dot, index) => {
 if (index === 0) return null;
 const prevDot = activePatternPath[index - 1];
 const x1 = (prevDot % 4) * 25 + 12.5;
 const y1 = Math.floor(prevDot / 4) * 25 + 12.5;
 const x2 = (dot % 4) * 25 + 12.5;
 const y2 = Math.floor(dot / 4) * 25 + 12.5;
 return <line key={index} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
 })}
 </svg>
 <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
 {Array.from({length: 16}).map((_, i) => (
 <div key={i} className="flex items-center justify-center w-full h-full pointer-events-none">
 <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 z-10 ${activePatternPath.includes(i) ? 'bg-indigo-600 scale-125 shadow-md' : 'bg-slate-300'}`}></div>
 {activePatternPath.includes(i) && (
 <div className="absolute rounded-full border-2 border-indigo-200 scale-[3] animate-ping opacity-20 pointer-events-none" style={{ width: '12px', height: '12px' }}></div>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 <div className="flex flex-col gap-2 pt-6 border-t border-slate-100">
 <label className="text-sm font-bold text-slate-800">Entry Password (Edit to change)</label>
 <input 
 type="text" 
 placeholder="Enter password" 
 value={newPasswordInput}
 onChange={(e) => setNewPasswordInput(e.target.value)}
 className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
 />
 </div>

 <div className="pt-4 border-t border-slate-100">
 <button 
 onClick={async () => {
 setIsSavingRiderSetting(true);
 const payload = {
 "rider rule": newPasswordInput + "||" + savedRiderPattern.join(','),
 "attendence": riderSettingImage
 };
 
 try {
 let opError = null;
 if (riderSettingRowId) {
 const { error } = await supabase.from('riders_setting').update(payload).eq('id', riderSettingRowId);
 opError = error;
 } else {
 const { data, error } = await supabase.from('riders_setting').insert([payload]).select().single();
 opError = error;
 if (data) setRiderSettingRowId(data.id);
 }
 
 if (opError) throw opError;
 
 setActualRiderSettingPassword(newPasswordInput);
 
 
 setIsSavingRiderSetting(false);
 setShowRiderSettingModal(false);
 setRiderSettingMode('view');
 setIsImageUnlocked(false);
 
 } catch(e) {
 console.error(e);
 setIsSavingRiderSetting(false);
 alert("Error saving settings");
 }
 }}
 disabled={isSavingRiderSetting}
 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-80"
 >
 {isSavingRiderSetting ? (
 <div className="flex gap-1.5 items-center justify-center">
 <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
 </div>
 ) : (
 "Save Changes"
 )}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {userToDelete && (
 <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col">
 <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3 text-rose-600">
 <AlertTriangle size={20} className="shrink-0" />
 <h2 className="text-[15px] font-bold text-slate-800">Confirm Deletion</h2>
 </div>
 
 <div className="p-6 pb-8 text-center flex-1">
 <p className="text-sm font-medium text-slate-600 leading-relaxed">
 Are you sure you want to delete this user?
 <br/>
 <span className="text-rose-500 font-bold mt-2 block text-xs bg-rose-50 p-2 rounded-lg border border-rose-100">
 This action is irreversible and all related data will be permanently removed.
 </span>
 </p>
 </div>
 
 <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
 <button 
 onClick={() => !isDeletingUser && setUserToDelete(null)}
 disabled={isDeletingUser}
 className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
 >
 Cancel
 </button>
 <button 
 onClick={handleConfirmDeleteUser}
 disabled={isDeletingUser}
 className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shadow-rose-200 flex justify-center items-center h-[42px] disabled:bg-rose-600 disabled:opacity-90"
 >
 {isDeletingUser ? (
 <div className="flex gap-1.5 items-center justify-center">
 <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
 <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
 </div>
 ) : (
 "Delete"
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Enter Password Page for Total Online Payments */}
 {showOnlinePaymentAuth && (
   <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200 overflow-hidden">
     {/* Top Navigation Bar */}
     <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-3 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-2xs shrink-0">
       <div className="flex items-center gap-2.5 sm:gap-3">
         <button
           onClick={() => {
             setShowOnlinePaymentAuth(false);
             setOnlinePaymentPassword('');
             setOnlinePaymentAuthError('');
           }}
           className="p-1.5 sm:p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
           title="Back"
         >
           <ArrowLeft size={20} />
         </button>
         <div>
           <h1 className="text-sm sm:text-base font-extrabold text-slate-800">
             Total Online Payments
           </h1>
           <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
             Enter Password
           </p>
         </div>
       </div>
     </div>

     {/* Main Centered Content */}
     <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
       <div className="w-full max-w-sm sm:max-w-md bg-white border border-slate-200 rounded-2xl shadow-md p-6 sm:p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-150">
         <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4 shadow-xs">
           <Lock size={26} strokeWidth={2.2} />
         </div>

         <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
           Enter Password
         </h2>
         <p className="text-xs sm:text-sm text-slate-500 mb-6">
           Enter the security password to view Total Online Payments
         </p>

         <div className="w-full text-left space-y-2">
           <label className="text-xs font-bold text-slate-700 block">
             Password
           </label>
           <input
             type="password"
             value={onlinePaymentPassword}
             onChange={(e) => {
               setOnlinePaymentPassword(e.target.value);
               setOnlinePaymentAuthError('');
             }}
             onKeyDown={(e) => {
               if (e.key === 'Enter') {
                 handleVerifyOnlinePaymentPassword();
               }
             }}
             placeholder="Enter Password"
             autoFocus
             className="w-full h-12 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-medium text-base outline-none transition-all"
           />

           {onlinePaymentAuthError && (
             <p className="text-xs font-bold text-rose-500 pt-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
               <AlertTriangle size={13} className="shrink-0" />
               {onlinePaymentAuthError}
             </p>
           )}

           <button
             type="button"
             onClick={handleVerifyOnlinePaymentPassword}
             disabled={!onlinePaymentPassword.trim() || isVerifyingOnlinePaymentPassword}
             className={`w-full h-12 rounded-xl text-base font-bold transition-all duration-200 flex items-center justify-center mt-3 ${
               onlinePaymentPassword.trim().length > 0
                 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.99] cursor-pointer'
                 : 'bg-blue-500/40 text-white/80 cursor-not-allowed'
             }`}
           >
             {isVerifyingOnlinePaymentPassword ? (
               <div className="flex items-center justify-center gap-1.5 h-full">
                 <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             ) : (
               <span>Enter</span>
             )}
           </button>
         </div>
       </div>
     </div>
   </div>
 )}

 {/* Full Screen View: Total Online Payments */}
 {showAdminOnlinePaymentsModal && (
 <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200 overflow-hidden">
 {/* Top Navigation Bar */}
 <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-3 py-3 sm:px-6 sm:py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-2xs shrink-0">
 <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
 <button
 onClick={() => setShowAdminOnlinePaymentsModal(false)}
 className="p-1.5 sm:p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
 title="Back"
 >
 <ArrowLeft size={20} />
 </button>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h1 className="text-sm sm:text-base font-extrabold text-slate-800 truncate">
 Total Online Payments
 </h1>
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
 Live
 </span>
 </div>
 <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
 Supabase Real-time Active Payments
 </p>
 </div>
 </div>

 {/* Action Buttons: Clear All Online Payments & Finished Online Payments */}
 <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
 <button
 onClick={handleClearAllOnlinePayments}
 disabled={isClearingOnlinePayments || (onlinePaymentsList.length === 0 && !isLoadingOnlinePayments)}
 className="flex-1 sm:flex-none px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-95"
 title="Transfer all active records to Finished Online Payments"
 >
 {isClearingOnlinePayments ? (
 <>
 <Loader2 size={13} className="animate-spin" />
 <span>Clearing &amp; Transferring...</span>
 </>
 ) : (
 <>
 <Trash2 size={13} />
 <span>Clear All</span>
 </>
 )}
 </button>

 <button
 onClick={() => setShowFinishedOnlinePaymentsModal(true)}
 className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
 title="View finished and settled online payments"
 >
 <CheckCircle size={13} />
 <span className="hidden sm:inline">Finished Online Payments</span>
 <span className="sm:hidden">Finished</span>
 </button>
 </div>
 </div>

 {/* Main Scrollable Content */}
 <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-5 pb-20">
 {/* Top Total Amount Card */}
 <div className="w-full bg-white rounded-xl p-4 sm:p-5 border border-indigo-500 shadow-2xs shrink-0 flex flex-col gap-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-indigo-700 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
 <CreditCard size={18} className="text-indigo-600" />
 Total Active Online Amount
 </span>
 <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0">
 {onlinePaymentsList.length} Active Records
 </span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <span className="text-2xl sm:text-3xl font-bold text-indigo-600 shrink-0">₹</span>
 <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
 {adminTotalOnlineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>
 <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5 mt-0.5">
 <span className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
 Live Status
 </span>
 <span>100% Live Synchronized</span>
 </div>
 </div>

 {/* Active Records History List */}
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between px-0.5">
 <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
 <Layers size={14} className="text-indigo-600" />
 Active Online Payments List
 </h2>
 <span className="text-xs text-slate-500 font-medium">
 {onlinePaymentsList.length} records found
 </span>
 </div>

 {isLoadingOnlinePayments ? (
 <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center flex flex-col items-center justify-center gap-3 shadow-2xs">
 <Loader2 size={24} className="animate-spin text-indigo-600" />
 <span className="text-xs text-slate-500 font-medium">Loading online payments...</span>
 </div>
 ) : onlinePaymentsList.length === 0 ? (
 <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
 <CreditCard size={24} />
 </div>
 <p className="text-sm font-bold text-slate-700">No Active Online Payments</p>
 <p className="text-xs text-slate-400 max-w-sm">
 All cleared payments are preserved in Finished Online Payments. Click the &ldquo;Finished Online Payments&rdquo; button above to view past records.
 </p>
 </div>
 ) : (
 <div className="flex flex-col gap-2.5 sm:gap-3">
 {onlinePaymentsList.map((item: any, idx: number) => (
 <div
 key={item.id || idx}
 className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-indigo-200 transition-all flex flex-col gap-2.5"
 >
 <div className="flex items-center justify-between gap-2">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-xs font-bold text-slate-800">
 {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : `Payment #${idx + 1}`}
 </span>
 {item['rider id'] && (
 <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
 Rider ID: {item['rider id'].substring(0, 8)}...
 </span>
 )}
 </div>
 <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
 +₹{parseFloat(item['total online payment'] || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>

 {item['online payment status'] && (
 <div className="flex flex-col gap-1.5">
 {item['online payment status'].split('\n').filter((l: string) => l.trim().length > 0).map((line: string, lIdx: number) => {
 const parts = line.split(',').map((p: string) => p.trim()).filter(Boolean);
 const hasColons = parts.some((p: string) => p.includes(':'));
 if (hasColons) {
 return (
 <div key={lIdx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 sm:p-3 text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5">
 {parts.map((part: string, pIdx: number) => {
 const colonIdx = part.indexOf(':');
 if (colonIdx > -1) {
 const key = part.substring(0, colonIdx).trim();
 const val = part.substring(colonIdx + 1).trim();
 const isAmt = key.toLowerCase().includes('amount') || key.toLowerCase().includes('total');
 const isAwb = key.toLowerCase().includes('awb');
 const isOrder = key.toLowerCase().includes('order');
 return (
 <div key={pIdx} className="flex items-center gap-1.5">
 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{key}:</span>
 <span className={`font-semibold ${isAmt ? 'text-emerald-700 font-bold' : isAwb ? 'font-mono text-slate-800' : isOrder ? 'font-mono text-indigo-700' : 'text-slate-700'}`}>
 {val}
 </span>
 </div>
 );
 }
 return <span key={pIdx} className="text-slate-600 font-medium">{part}</span>;
 })}
 </div>
 );
 }
 return (
 <div key={lIdx} className="text-xs text-slate-700 bg-slate-50/80 p-2.5 sm:p-3 rounded-lg border border-slate-100 leading-relaxed break-words font-medium">
 {line}
 </div>
 );
 })}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Full Screen View: Finished Online Payments */}
 {showFinishedOnlinePaymentsModal && (
 <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200 overflow-hidden">
 {/* Top Navigation Bar */}
 <div className="bg-white border-b border-slate-200 px-3 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-2xs shrink-0">
 <div className="flex items-center gap-2 sm:gap-3">
 <button
 onClick={() => setShowFinishedOnlinePaymentsModal(false)}
 className="p-1.5 sm:p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
 >
 <ArrowLeft size={20} />
 </button>
 <div>
 <h1 className="text-sm sm:text-base font-extrabold text-slate-800">
 Finished Online Payments
 </h1>
 <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
 Settled & Cleared Payment History
 </p>
 </div>
 </div>

 <button
 onClick={() => setShowFinishedOnlinePaymentsModal(false)}
 className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
 >
 <X size={20} />
 </button>
 </div>

 {/* Main Scrollable Content */}
 <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-5 pb-20">
 {/* Top Total Finished Amount Card */}
 <div className="w-full bg-white rounded-xl p-4 sm:p-5 border border-teal-500 shadow-2xs shrink-0 flex flex-col gap-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-teal-700 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
 <CheckCircle size={18} className="text-teal-600" />
 Total Finished Online Amount
 </span>
 <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg shrink-0">
 {finishedOnlinePaymentsList.length} Settled Records
 </span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <span className="text-2xl sm:text-3xl font-bold text-teal-600 shrink-0">₹</span>
 <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
 {(finishedTotalOnlineAmount || finishedOnlinePaymentsList.reduce((acc, row) => acc + (parseFloat(row['total online payment'] || '0') || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>
 <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5 mt-0.5">
 <span className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
 Settled Status
 </span>
 <span>100% Accurate &amp; Persistent</span>
 </div>
 </div>

 {/* Finished History List */}
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between px-0.5">
 <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
 <FileText size={14} className="text-emerald-600" />
 Finished Online Payments History
 </h2>
 <span className="text-xs text-slate-500 font-medium">
 {finishedOnlinePaymentsList.length} records archived
 </span>
 </div>

 {isLoadingFinishedOnlinePayments ? (
 <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center flex flex-col items-center justify-center gap-3 shadow-2xs">
 <Loader2 size={24} className="animate-spin text-emerald-600" />
 <span className="text-xs text-slate-500 font-medium">Loading finished payments...</span>
 </div>
 ) : finishedOnlinePaymentsList.length === 0 ? (
 <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
 <FileText size={24} />
 </div>
 <p className="text-sm font-bold text-slate-700">No Finished Records Yet</p>
 <p className="text-xs text-slate-400 max-w-sm">
 Active online payments can be cleared from the &ldquo;Total Online Payments&rdquo; view using the &ldquo;Clear All Online Payments&rdquo; button.
 </p>
 </div>
 ) : (
 <div className="flex flex-col gap-2.5 sm:gap-3">
 {finishedOnlinePaymentsList.map((item: any, idx: number) => (
 <div
 key={item.id || idx}
 className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-emerald-200 transition-all flex flex-col gap-2.5"
 >
 <div className="flex items-center justify-between gap-2">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-xs font-bold text-slate-800">
 {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : `Archived #${idx + 1}`}
 </span>
 {item['rider id'] && (
 <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60 font-semibold">
 Rider ID: {item['rider id'].substring(0, 8)}...
 </span>
 )}
 {item['admin id'] && (
 <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
 Admin ID: {item['admin id'].substring(0, 8)}...
 </span>
 )}
 </div>
 <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
 ₹{parseFloat(item['total online payment'] || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>

 {item['online payment status'] && (
 <div className="flex flex-col gap-1.5">
 {item['online payment status'].split('\n').filter((l: string) => l.trim().length > 0).map((line: string, lIdx: number) => {
 const parts = line.split(',').map((p: string) => p.trim()).filter(Boolean);
 const hasColons = parts.some((p: string) => p.includes(':'));
 if (hasColons) {
 return (
 <div key={lIdx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 sm:p-3 text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5">
 {parts.map((part: string, pIdx: number) => {
 const colonIdx = part.indexOf(':');
 if (colonIdx > -1) {
 const key = part.substring(0, colonIdx).trim();
 const val = part.substring(colonIdx + 1).trim();
 const isAmt = key.toLowerCase().includes('amount') || key.toLowerCase().includes('total');
 const isAwb = key.toLowerCase().includes('awb');
 const isOrder = key.toLowerCase().includes('order');
 return (
 <div key={pIdx} className="flex items-center gap-1.5">
 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{key}:</span>
 <span className={`font-semibold ${isAmt ? 'text-emerald-700 font-bold' : isAwb ? 'font-mono text-slate-800' : isOrder ? 'font-mono text-indigo-700' : 'text-slate-700'}`}>
 {val}
 </span>
 </div>
 );
 }
 return <span key={pIdx} className="text-slate-600 font-medium">{part}</span>;
 })}
 </div>
 );
 }
 return (
 <div key={lIdx} className="text-xs text-slate-700 bg-slate-50/80 p-2.5 sm:p-3 rounded-lg border border-slate-100 leading-relaxed break-words font-medium">
 {line}
 </div>
 );
 })}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 
</div>
 );
};
