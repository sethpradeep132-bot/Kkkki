import { AuthLogin } from "./AuthLogin";
import { LogoutModal } from './LogoutModal';
import { HubDashboardView } from './HubDashboardView';
import { HubShipmentsView } from './HubShipmentsView';
import { HubDispatchView } from './HubDispatchView';
import { CreateUserIdPage, UserTypeCategory } from './CreateUserIdPage';
import React, { useState, useEffect } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { RefreshCw, LayoutDashboard, Truck, User, Send, Eye, ArrowLeft, X, FileText, CreditCard, ChevronRight, Store, ShieldAlert, IndianRupee, AlertTriangle } from 'lucide-react';
import { FiveDotLoader } from './FiveDotLoader';
import { registerBackHandler } from '../../lib/backNavigation';

interface PortalProps {
 onBack: () => void;
}


const HubTotalOnlinePaymentDetail = ({ riderId, onBack }: { riderId: string, onBack: () => void }) => {
 const [loading, setLoading] = React.useState(true);
 const [totalOnlinePayment, setTotalOnlinePayment] = React.useState(0);
 const [payments, setPayments] = React.useState<any[]>([]);

 React.useEffect(() => {
 if (!riderId) return;
 const fetchOnlinePayments = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data, error } = await supabase
 .from('cash_with_riders')
 .select('*')
 .not('total online payment', 'is', null);
 
 if (error) throw error;
 
 const filteredData = (data || []).filter(row => {
 const isThisRider = row['rider id'] === riderId || ((row['online payment status'] || '') + (row['cash payment status'] || '')).includes(riderId);
 const hasOnline = (row['online payment status'] && row['online payment status'].trim() !== '') || (row['total online payment'] !== null && row['total online payment'] !== undefined);
 return isThisRider && hasOnline;
 });
 
 let sum = 0;
 filteredData.forEach(row => {
 sum += parseFloat(row['total online payment'] || '0') || 0;
 });
 
 setTotalOnlinePayment(sum);
 setPayments(filteredData.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
 } catch (e) {
 console.error("Error fetching online payments:", e);
 } finally {
 setLoading(false);
 }
 };
 fetchOnlinePayments();

 const sub = (async () => {
 const { supabase } = await import('../../lib/supabase');
 return supabase.channel('hub_cwr_detail_' + riderId)
 .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_riders' }, () => {
 fetchOnlinePayments();
 })
 .subscribe();
 })();

 return () => {
 sub.then(channel => {
 import('../../lib/supabase').then(({ supabase }) => {
 supabase.removeChannel(channel);
 });
 });
 };
 }, [riderId]);

 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={onBack} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Rider Online Payment</h2>
 </div>
 
 {loading ? (
 <div className="flex justify-center p-8"><FiveDotLoader colorClass="bg-emerald-500" /></div>
 ) : (
 <div className="flex flex-col gap-4">
 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
 <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
 <div className="relative z-10 space-y-4">
 <div className="flex flex-col gap-1">
 <span className="text-emerald-100 text-xs sm:text-sm font-semibold uppercase tracking-wider">Total Online Payments</span>
 <div className="flex items-end gap-1">
 <IndianRupee size={28} className="text-emerald-200 mb-1 shrink-0" />
 <span className="text-4xl sm:text-5xl font-black text-white truncate break-all leading-none">{totalOnlinePayment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-4">
 <h3 className="text-sm font-bold text-gray-800 mb-3 ml-1">Payment History</h3>
 <div className="flex flex-col gap-3">
 {payments.length === 0 ? (
 <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-center text-sm text-gray-500">
 No online payments found.
 </div>
 ) : (
 payments.map((p, i) => (
 <div key={p.id || i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
 <div className="flex justify-between items-center">
 <span className="text-xs font-semibold text-gray-500">{new Date(p.created_at).toLocaleString('en-IN')}</span>
 <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">+₹{p['total online payment'] || '0'}</span>
 </div>
 <div className="text-xs text-gray-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-line break-words font-mono">
 {p['online payment status'] || 'Online Payment Recorded'}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

const HubTotalOnlinePaymentsList = ({ hubManagerId, onBack, onSelectRider }: { hubManagerId: string, onBack: () => void, onSelectRider: (riderId: string) => void }) => {
 const [loading, setLoading] = React.useState(true);
 const [totalOnlinePayment, setTotalOnlinePayment] = React.useState(0);
 const [ridersList, setRidersList] = React.useState<any[]>([]);

 React.useEffect(() => {
 if (!hubManagerId) return;
 const fetchHubPayments = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 
 // NOTE: Moved fetching of cash_with_riders down after added_riders

 // Fetch added riders mapping
 const { data: addedRiders, error: addedError } = await supabase
 .from('added_riders')
 .select('"added rider id"')
 .eq('hub manager id', hubManagerId);
 
 if (addedError) throw addedError;
 
 const riderIds = addedRiders?.map(r => r['added rider id']).filter(Boolean) || [];
 
 // Fetch all cash_with_riders
 const { data: cwrData, error: cwrError } = await supabase
 .from('cash_with_riders')
 .select('*')
 .not('total online payment', 'is', null);
 
 if (cwrError && cwrError.code !== '42703') {
 console.warn("Table cash_with_riders error: " + cwrError.message);
 }
 
 let sum = 0;
 const validCwr = (cwrData || []).filter(row => {
 const hasData = (row['online payment status'] && row['online payment status'].trim() !== '') || (row['total online payment'] !== null && row['total online payment'] !== undefined);
 if (!hasData) return false;
 const status = (row['online payment status'] || '') + (row['cash payment status'] || '');
 return riderIds.includes(row['rider id']) || riderIds.some(rId => status.includes(rId));
 });
 validCwr.forEach(row => {
 sum += parseFloat(row['total online payment'] || '0') || 0;
 });
 setTotalOnlinePayment(sum);
 
 if (riderIds.length > 0) {
 // Fetch rider details from riders table
 const { data: ridersData, error: rError } = await supabase
 .from('riders')
 .select('id, rider_name, registered_mobile_number')
 .in('id', riderIds);
 
 if (ridersData && !rError) {
 setRidersList(ridersData);
 }
 }
 } catch (e) {
 console.error("Error fetching hub online payments:", e);
 } finally {
 setLoading(false);
 }
 };
 fetchHubPayments();

 const sub = (async () => {
 const { supabase } = await import('../../lib/supabase');
 return supabase.channel('hub_cwr_list_' + hubManagerId)
 .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_with_riders' }, () => {
 fetchHubPayments();
 })
 .subscribe();
 })();

 return () => {
 sub.then(channel => {
 import('../../lib/supabase').then(({ supabase }) => {
 supabase.removeChannel(channel);
 });
 });
 };
 }, [hubManagerId]);

 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={onBack} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Total Online Payments</h2>
 </div>
 
 {loading ? (
 <div className="flex justify-center p-8"><FiveDotLoader colorClass="bg-emerald-500" /></div>
 ) : (
 <div className="flex flex-col gap-4">
 <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
 <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
 <div className="relative z-10 space-y-4">
 <div className="flex flex-col gap-1">
 <span className="text-emerald-100 text-xs sm:text-sm font-semibold uppercase tracking-wider">Total Online Payments</span>
 <div className="flex items-end gap-1">
 <IndianRupee size={28} className="text-emerald-200 mb-1 shrink-0" />
 <span className="text-4xl sm:text-5xl font-black text-white truncate break-all leading-none">{totalOnlinePayment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-4">
 <h3 className="text-sm font-bold text-gray-800 mb-3 ml-1">Riders List</h3>
 <div className="flex flex-col gap-3">
 {ridersList.length === 0 ? (
 <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-center text-sm text-gray-500">
 No added riders found.
 </div>
 ) : (
 ridersList.map((r, i) => (
 <button 
 key={r.id || i} 
 onClick={() => onSelectRider(r.id)}
 className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
 >
 <div className="flex flex-col gap-1">
 <span className="text-sm font-bold text-gray-800">{r.rider_name || 'Unknown Rider'}</span>
 <span className="text-xs font-medium text-gray-500">{r.registered_mobile_number || 'N/A'}</span>
 <span className="text-[10px] text-gray-400 font-mono">ID: {(r.id || '').substring(0, 8)}...</span>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>
 ))
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

const HubAccountView = ({ 
 onSubPageChange,
 onLogout 
}: { 
 onSubPageChange?: (isSub: boolean) => void;
 onLogout?: () => void;
}) => {
 const [hubData, setHubData] = useState<any>(null);
 const [hubSalary, setHubSalary] = useState<any>(null);
 const [hubTxHistory, setHubTxHistory] = useState<any[]>([]);
 const [activePage, setActivePage] = useState<'main' | 'hub' | 'identity' | 'bank' | 'approval' | 'earning' | 'loss_penalty' | 'online_payment_riders_list' | 'online_payment_rider_detail'>('main');
 const [selectedRiderForOnlinePayment, setSelectedRiderForOnlinePayment] = useState<string | null>(null);
 const [penalties, setPenalties] = useState<any[]>([]);
 const [loadingPenalties, setLoadingPenalties] = useState(false);

 useEffect(() => {
 if (activePage === 'loss_penalty' && hubData?.id && hubData.id !== 'No Data Found') {
 const fetchP = async () => {
 setLoadingPenalties(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data, error } = await supabase
 .from('hub_managers_penalty')
 .select('*')
 .eq('hub manager id', hubData.id)
 .order('created_at', { ascending: false });
 
 if (!error && data) {
 setPenalties(data);
 }
 } catch (e) {
 console.error(e);
 }
 setLoadingPenalties(false);
 };
 fetchP();
 }
 }, [activePage, hubData?.id]);

 const [selectedApprovalType, setSelectedApprovalType] = useState<UserTypeCategory | null>(null);

 const [totalEarningPenalty, setTotalEarningPenalty] = useState(0);

 useEffect(() => {
 if (activePage === 'earning' && hubData?.id && hubData.id !== 'No Data Found') {
 const fetchEarningPen = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data } = await supabase
 .from('hub_managers_penalty')
 .select('penalty amount')
 .eq('hub manager id', hubData.id);
 
 let pTotal = 0;
 if (data) {
 data.forEach((p: any) => {
 pTotal += parseFloat(p['penalty amount'] || '0') || 0;
 });
 }
 
 if (hubData.cluster_id) {
 const { data: clusterPenalties } = await supabase
 .from('clusters_penalty')
 .select('penalty amount')
 .eq('cluster id', hubData.cluster_id);
 
 if (clusterPenalties) {
 clusterPenalties.forEach((p: any) => {
 pTotal += parseFloat(p['penalty amount'] || '0') || 0;
 });
 }
 }
 
 setTotalEarningPenalty(pTotal);
 } catch (e) {
 console.error(e);
 }
 };
 fetchEarningPen();
 }
 }, [activePage, hubData?.id]);


 useEffect(() => {
 const fetchHubData = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 
 let record = null;
 if (userObj?.id) {
 const { data } = await supabase
 .from('hub_managers')
 .select('*')
 .eq('id', userObj.id)
 .maybeSingle();
 record = data;
 }
 if (!record && userObj?.email) {
 const { data } = await supabase
 .from('hub_managers')
 .select('*')
 .eq('registered_email', userObj.email)
 .maybeSingle();
 record = data;
 }
 if (!record) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase
 .from('hub_managers')
 .select('*')
 .eq('id', user.id)
 .maybeSingle();
 record = data;
 }
 }
 if (!record) {
 localStorage.removeItem('portal_auth_hub');
 setHubData(null);
 return;
 }

 if (record) {
 setHubData(record);
 if (!record.cluster_id && record.admin_id) {
 const { data: salaryData } = await supabase.from('fixed_hub_manager_salary').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
 setHubSalary(salaryData);
 const { data: hist } = await supabase.from('finished_hub_managers_payable_amount').select('*').eq('hub manager id', record.id).limit(10);
 if (hist) setHubTxHistory(hist);
 } else {
 setHubSalary(null);
 }
 } else {
 setHubData({
 id: 'No Data Found',
 store_name: 'N/A',
 hub_name: 'N/A',
 hub_manager_name: 'N/A',
 registered_email: 'N/A',
 registered_mobile_number: 'N/A',
 registered_full_address: 'N/A',
 registered_pincode: 'N/A',
 password: 'N/A',
 aadhaar_card: 'N/A',
 pan_card: 'N/A',
 voter_id: 'N/A',
 bank_name: 'N/A',
 account_no: 'N/A',
 ifsc_code: 'N/A',
 upi_id: 'N/A'
 });
 }
 } catch (err) {
 console.error("Error fetching hub manager data:", err);
 }
 };
 fetchHubData();
 }, []);

 const getInitials = (name: string) => {
 if (!name || name === 'N/A' || name === 'Loading...' || name === 'No Data Found') return 'HM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
 };

 
 if (activePage === 'loss_penalty') {
 const penaltySum = penalties.reduce((sum, p) => sum + parseFloat(p['penalty amount'] || '0'), 0);

 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Loss & Penalty</h2>
 </div>

 <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center mb-6">
 <AlertTriangle size={48} className="text-red-500 mb-4 opacity-50" />
 <span className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wider">Total Loss & Penalty</span>
 <span className="text-4xl font-black text-red-700 break-words whitespace-normal">{loadingPenalties ? <span className="loading-ellipsis">Loading</span> : `₹ ${penaltySum.toLocaleString('en-IN', {maximumFractionDigits: 2})}`}</span>
 </div>
 
 {loadingPenalties ? (
 <div className="text-center text-gray-500 py-10 font-medium"><span className="loading-ellipsis">Loading</span></div>
 ) : penalties.length === 0 ? null : (
 <div className="flex flex-col gap-4">
 {penalties.map((p, i) => (
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
 );
 }


 if (activePage === 'hub') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Hub & Managers details</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Hub Manager ID</label>
 <p className="text-sm font-semibold text-gray-800 break-all">{hubData?.id || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Store Name</label>
 <p className="text-sm font-bold text-gray-900">{hubData?.store_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Hub Name</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.hub_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Hub Manager Name</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.hub_manager_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Mobile Number</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.registered_mobile_number || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Email</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.registered_email || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Full Address</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.registered_full_address || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Pincode</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.registered_pincode || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Password</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.password ? '••••••••' : 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }

 if (activePage === 'identity') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Identity & KYC</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Aadhaar Card</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.aadhaar_card || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">PAN Card</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{hubData?.pan_card || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Voter ID</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{hubData?.voter_id || 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }

 if (activePage === 'bank') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Bank & UPI details</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.bank_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Account No</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.account_no || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">IFSC Code</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{hubData?.ifsc_code || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">UPI ID</label>
 <p className="text-sm font-semibold text-gray-800">{hubData?.upi_id || 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }


 if (activePage === 'earning') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 bg-[#F8FAFC] pb-24">
 <div className="flex items-center mb-6">
 <button 
 onClick={() => setActivePage('main')}
 className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-700 mr-4"
 >
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-xl font-black text-slate-800">My Earning</h2>
 </div>
 
 
 <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center mt-4">
 {totalEarningPenalty > 0 && (
 <div className="absolute top-2 right-4 text-[10px] font-light text-red-500">
 Penalty: -₹{totalEarningPenalty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
 </div>
 )}
 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Fixed Salary</h3>
 <div className="text-4xl font-black text-emerald-600">
 ₹ {hubSalary?.['fixed salary'] ? parseFloat(hubSalary['fixed salary']).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
 </div>
 <p className="text-xs text-slate-400 mt-2 text-center">This is your current fixed salary based on hub configuration.</p>
 </div>

 {/* Transaction History Card */}
 <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
 <div className="p-4 border-b border-gray-50 bg-gray-50/50 sticky top-0 z-10">
 <h3 className="text-sm font-bold text-gray-800">Transaction History</h3>
 <p className="text-[10px] text-gray-500">Latest 10 transactions</p>
 </div>
 <div className="p-4 overflow-y-auto flex-1">
 {hubTxHistory.length > 0 ? (
 <div className="space-y-4">
 {hubTxHistory.map((tx: any, idx: number) => (
 <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-gray-800">Payout</span>
 <span className="text-[10px] text-gray-500">{tx.bank_name || 'Bank Transfer'} - {tx.account_no?.slice(-4)}</span>
 </div>
 <span className="text-sm font-black text-emerald-600">+₹{parseFloat(tx['total settled amount'] || 0).toFixed(2)}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-gray-400">
 <p className="text-xs font-medium">No transactions found</p>
 </div>
 )}
 </div>
 </div>

 </div>
 );
 }
 if (activePage === 'approval') {
 if (selectedApprovalType) {
 return (
 <CreateUserIdPage 
 initialType={selectedApprovalType}
 isApprovalMode={true}
 adminProfileId={hubData?.cluster_id}
 onBack={() => setSelectedApprovalType(null)}
 onUserCreated={() => setSelectedApprovalType(null)}
 />
 );
 }
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 bg-[#F8FAFC] pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Approvals</h2>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <button
 onClick={() => setSelectedApprovalType('Seller')}
 className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-purple-300 hover:bg-purple-50 transition-colors"
 >
 <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
 <Store size={24} />
 </div>
 <span className="font-bold text-slate-800 text-sm">For Seller ID</span>
 </button>

 <button
 onClick={() => setSelectedApprovalType('Rider')}
 className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
 >
 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
 <Truck size={24} />
 </div>
 <span className="font-bold text-slate-800 text-sm">For Rider ID</span>
 </button>
 </div>
 </div>
 );
 }

 if (activePage === 'online_payment_riders_list') {
 return <HubTotalOnlinePaymentsList 
 hubManagerId={hubData?.id} 
 onBack={() => setActivePage('main')} 
 onSelectRider={(riderId) => {
 setSelectedRiderForOnlinePayment(riderId);
 setActivePage('online_payment_rider_detail');
 }} 
 />;
 }

 if (activePage === 'online_payment_rider_detail') {
 return <HubTotalOnlinePaymentDetail 
 riderId={selectedRiderForOnlinePayment!} 
 onBack={() => setActivePage('online_payment_riders_list')} 
 />;
 }

 return (
      <div className="w-full min-h-full flex flex-col pt-4 px-4 pb-24">
 {/* Profile Card */}
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3.5 min-w-0 flex-1">
 <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl shadow-inner shrink-0 border border-purple-100">
 {getInitials(hubData?.hub_manager_name)}
 </div>
 <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
 <h2 className="text-base font-bold text-gray-800 truncate">{hubData?.store_name || 'Loading...'}</h2>
 <p className="text-xs font-medium text-gray-600 truncate">{hubData?.hub_name || 'Loading...'}</p>
 <p className="text-[11px] font-medium text-gray-500 truncate">{hubData?.hub_manager_name || 'Loading...'}</p>
 <p className="text-[11px] font-medium text-gray-500 truncate">{hubData?.registered_email || 'Loading...'}</p>
 <p className="text-[9px] text-gray-400 mt-1 truncate">ID: {hubData?.id || '...'}</p>
 </div>
 </div>
 <button 
 onClick={() => setActivePage('hub')}
 className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 active:scale-95 transition-all shrink-0 ml-1 shadow-sm border border-purple-100"
 title="View Hub & Managers details"
 >
 <Eye size={17} />
 </button>
 </div>
 </div>

 {/* Settings & Preferences */}
 <div className="mt-6 flex flex-col gap-3">
 <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">Settings & Preferences</h3>
 
 <button 
 onClick={() => setActivePage('identity')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
 <FileText size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Identity & KYC</span>
 <span className="text-[10px] text-gray-500">Aadhaar, PAN, Voter ID</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('bank')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
 <CreditCard size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Bank & UPI details</span>
 <span className="text-[10px] text-gray-500">Manage your payment methods</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('approval')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
 <User size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Approval</span>
 <span className="text-[10px] text-gray-500">Seller & Rider Approvals</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>


 <button 
 onClick={() => setActivePage('earning')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">My Earning</span>
 <span className="text-[10px] text-gray-500">View your salary details</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('online_payment_riders_list')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
 <CreditCard size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Total Online Payments</span>
 <span className="text-[10px] text-gray-500">View riders collected online payments</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('loss_penalty')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 mb-4"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
 <ShieldAlert size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Loss & Penalty</span>
 <span className="text-[10px] text-gray-500">View your penalties and deductions</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={async () => {
 if (onLogout) { onLogout(); } else {
 try {
 const { supabase } = await import('../../lib/supabase');
 await supabase.auth.signOut();
 } catch (e) {
 console.error(e);
 }
 localStorage.removeItem('portal_auth_hub');
 window.location.reload();
 }
 }}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-100 flex items-center justify-between hover:bg-red-50 transition-colors mt-6 active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-red-600">Log Out</span>
 <span className="text-[10px] text-red-400">Sign out of your account</span>
 </div>
 </div>
 </button>
 </div>
 </div>
 );
};
export const HubLogisticPortal: React.FC<PortalProps> = ({ onBack }) => {
  const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);

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
  const handleDeepRefresh = () => {
    setIsDeepRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

 const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
 if (typeof window !== 'undefined') {
 return Boolean(localStorage.getItem('portal_auth_hub'));
 }
 return false;
 });

 useEffect(() => {
   if (!isLoggedIn) return;
   const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_hub') : null;
   const userObj = savedAuth ? JSON.parse(savedAuth) : null;
   const hubIdToTrack = userObj?.id;
   const hubEmailToTrack = userObj?.email;
   if (!hubIdToTrack && !hubEmailToTrack) return;

   let channel: any = null;
   let interval: any = null;

   const performLogoutIfFrozen = (row: any) => {
     if (row && (row.freeze === 'true' || row.freeze === true || row.freeze === 'frozen')) {
       try {
         localStorage.removeItem('portal_auth_hub');
       } catch (e) {}
       setIsLoggedIn(false);
       import('../../lib/supabase').then(({ supabase }) => {
         supabase.auth.signOut().catch(() => {});
       });
     }
   };

   import('../../lib/supabase').then(({ supabase }) => {
     const query = hubIdToTrack
       ? supabase.from('hub_managers').select('id, freeze').eq('id', hubIdToTrack)
       : supabase.from('hub_managers').select('id, freeze').eq('registered_email', hubEmailToTrack);

     query.maybeSingle().then(({ data }) => {
       if (data) performLogoutIfFrozen(data);
     });

     channel = supabase.channel(`hub_freeze_rt_${hubIdToTrack || hubEmailToTrack}_${Math.random().toString(36).substring(7)}`)
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hub_managers' }, (payload) => {
         if (payload?.new) {
           if (payload.new.id === hubIdToTrack || (hubEmailToTrack && payload.new.registered_email === hubEmailToTrack)) {
             performLogoutIfFrozen(payload.new);
           }
         }
       })
       .subscribe();

     interval = setInterval(async () => {
       try {
         const q = hubIdToTrack
           ? supabase.from('hub_managers').select('id, freeze').eq('id', hubIdToTrack)
           : supabase.from('hub_managers').select('id, freeze').eq('registered_email', hubEmailToTrack);
         const { data } = await q.maybeSingle();
         if (data) performLogoutIfFrozen(data);
       } catch (e) {}
     }, 2500);
   });

   return () => {
     if (channel) {
       import('../../lib/supabase').then(({ supabase }) => supabase.removeChannel(channel));
     }
     if (interval) clearInterval(interval);
   };
 }, [isLoggedIn]);

 const handleLogout = () => {
 setShowLogoutModal(true);
 };


  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const scrollDir = useScrollDirection();

  useEffect(() => {
    return registerBackHandler(() => {
      if (showLogoutModal) {
        setShowLogoutModal(false);
        return true;
      }
      if (activeTab !== 'Dashboard') {
        setActiveTab('Dashboard');
        return true;
      }
      return false;
    });
  }, [showLogoutModal, activeTab]);

 const tabs = [
 { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
 { id: 'Shipments', label: 'Shipments', icon: Truck },
 { id: 'Dispatch', label: 'Dispatch', icon: Send },
 { id: 'Account', label: 'Account', icon: User },
 ];

 if (!isLoggedIn) {
 return <AuthLogin portalName="Hub Manager" onLoginSuccess={() => setIsLoggedIn(true)} onBack={onBack} />;
 }

 return (
 <div className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden">
 {activeTab !== 'Dispatch' && (
       <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center justify-between relative w-full h-[60px] px-4">
          
          {/* Left Actions (Logo and Brand) */}
          <div className="flex items-center gap-3 text-slate-700 z-10 h-full cursor-pointer" onClick={onBack}>
            {headerLogo ? (
              <img src={headerLogo} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain rounded drop-shadow-sm" />
            ) : (
               <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-black text-xs">Logo</div>
            )}
            
            {/* Brand Name */}
            <div className="flex flex-col items-start justify-center select-none overflow-hidden">
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center flex-nowrap gap-1 sm:gap-1.5 leading-none mt-1 whitespace-nowrap">
                <span className="text-purple-600 shrink-0">SURIYAWAN</span>
                <span className="text-black shrink-0">SHOPPING</span>
                <span className="text-purple-600 bg-purple-50 border border-purple-200 px-1 py-0.5 rounded text-[8px] sm:text-[10px] ml-0.5 sm:ml-1 shrink-0">Management</span>
              </h1>
              
              <div className="flex items-center gap-2 mt-1">
                {/* Premium Member Glow */}
              <div className="relative group inline-flex overflow-hidden rounded-full">
                <span className="text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase tracking-widest flex items-center gap-1 drop-shadow-sm">
                  <span>👑</span> Premium Member
                </span>
                {/* Smooth Shine Animation */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
              </div>
                
                {/* Refresh Button */}
                <button onClick={(e) => { e.stopPropagation(); handleDeepRefresh(); }} className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200" title="Refresh">
                  <RefreshCw size={14} className={`text-gray-500 ${isDeepRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>


        </div>
      </header>
 )}

 <main className="flex-1 overflow-y-auto pb-24">
 {activeTab === 'Dashboard' && <HubDashboardView />}
 {activeTab === 'Shipments' && <HubShipmentsView onSubPageChange={setHideNav} />}
 {activeTab === 'Dispatch' && <HubDispatchView onSubPageChange={setHideNav} />}
 {activeTab === 'Account' && <HubAccountView onSubPageChange={setHideNav} onLogout={handleLogout} />}
 </main>
 {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} portalName="Hub Manager" />}

 <nav className={`fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 transition-transform duration-300 ease-in-out ${hideNav ? 'hidden' : ''} ${scrollDir === 'down' ? 'translate-y-full' : 'translate-y-0'}`}>
 <div className="flex justify-around items-center h-[72px] pb-2 pt-1 max-w-md mx-auto px-2">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
 activeTab === tab.id ? 'text-purple-600' : 'text-gray-400 hover:text-black'
 }`}
 >
 <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
 <span className="text-[10px] font-semibold">{tab.label}</span>
 </button>
 ))}
 </div>
 </nav>
 </div>
 );
};
