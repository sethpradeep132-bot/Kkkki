import { AuthLogin } from "./AuthLogin";
import { RiderDashboardView } from "./RiderDashboardView";
import { RiderTasksView } from "./RiderTasksView";
import { LogoutModal } from './LogoutModal';
import React, { useState, useEffect } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { RefreshCw, LayoutDashboard, CheckSquare, User, Eye, ArrowLeft, X, FileText, CreditCard, ChevronRight, IndianRupee, ShieldAlert, AlertTriangle } from 'lucide-react';
import { FiveDotLoader } from './FiveDotLoader';
import { registerBackHandler } from '../../lib/backNavigation';

interface PortalProps {
 onBack: () => void;
}



const RiderMyEarning = ({ riderId, onBack }: { riderId: string, onBack: () => void }) => {
 const [loading, setLoading] = React.useState(true);
 const [totalEarning, setTotalEarning] = React.useState(0);

 React.useEffect(() => {
 if (!riderId) return;
 const fetchEarnings = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data, error } = await supabase
 .from('rider_shipment_work_flow')
 .select('"Today\'s Earning"')
 .eq('rider_id', riderId);
 
 if (error) {
 if (error.code === '42703') {
 console.warn("Table cash_with_riders is missing a column.");
 setLoading(false);
 return;
 }
 throw error;
 }
 
 let sum = 0;
 (data || []).forEach(row => {
 sum += parseFloat(row["Today's Earning"] || '0') || 0;
 });
 setTotalEarning(sum);
 } catch (e) {
 console.error("Error fetching rider earning:", e);
 } finally {
 setLoading(false);
 }
 };
 fetchEarnings();
 }, [riderId]);

 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={onBack} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">My Earning</h2>
 </div>
 
 {loading ? (
 <div className="flex justify-center p-8"><FiveDotLoader colorClass="bg-orange-500" /></div>
 ) : (
 <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
 <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>

 <div className="relative z-10 space-y-4">
 <div className="flex flex-col gap-1">
 <span className="text-indigo-200 text-xs sm:text-sm font-semibold uppercase tracking-wider">Total Earnings</span>
 <div className="flex items-end gap-1">
 <IndianRupee size={28} className="text-emerald-400 mb-1 shrink-0" />
 <span className="text-4xl sm:text-5xl font-black text-white truncate break-all leading-none">{totalEarning.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

const RiderTotalOnlinePayment = ({ riderId, onBack }: { riderId: string, onBack: () => void }) => {
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
 .eq('rider id', riderId)
 .not('total online payment', 'is', null);
 
 if (error) {
 if (error.code === '42703') {
 console.warn("Table cash_with_riders is missing a column.");
 setLoading(false);
 return;
 }
 throw error;
 }
 
 let sum = 0;
 const filteredData = (data || []).filter(row => {
 const isThisRider = row['rider id'] === riderId || ((row['online payment status'] || '') + (row['cash payment status'] || '')).includes(riderId);
 const hasOnline = (row['online payment status'] && row['online payment status'].trim() !== '') || (row['total online payment'] !== null && row['total online payment'] !== undefined);
 return isThisRider && hasOnline;
 });

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
 return supabase.channel('rider_cwr_realtime_' + riderId)
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
 <h2 className="text-lg font-bold ml-3 text-gray-800">Total Online Payment</h2>
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

const RiderAccountView = ({ onSubPageChange, onLogout }: { onSubPageChange?: (isSub: boolean) => void; onLogout?: () => void }) => {
 const [riderData, setRiderData] = useState<any>(null);
 const riderId = riderData?.id;
 const [activePage, setActivePage] = useState<'main' | 'personal' | 'identity' | 'bank' | 'service_rate' | 'earning' | 'loss_penalty' | 'online_payment'>('main');
 const [penalties, setPenalties] = useState<any[]>([]);
 const [loadingPenalties, setLoadingPenalties] = useState(false);
 const [globalRates, setGlobalRates] = useState<any>(null);
 const [specificRates, setSpecificRates] = useState<any>(null);
 const [isMultipleQtyHalfRate, setIsMultipleQtyHalfRate] = useState(false);
 const [isPerformanceBasedRate, setIsPerformanceBasedRate] = useState(false);

 const [totalEarning, setTotalEarning] = useState(0);
 const [loadingEarning, setLoadingEarning] = useState(false);
 const [totalEarningPenalty, setTotalEarningPenalty] = useState(0);
 const [riderTxHistory, setRiderTxHistory] = useState<any[]>([]);

 
 useEffect(() => {
 if (activePage === 'loss_penalty' && riderData.id) {
 const fetchP = async () => {
 setLoadingPenalties(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data, error } = await supabase
 .from('riders_penalty')
 .select('*')
 .eq('rider id', riderData.id)
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
 }, [activePage, riderId]);


 useEffect(() => {
 if (activePage === 'earning' && riderId) {
 const fetchEarning = async () => {
 setLoadingEarning(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data, error } = await supabase
 .from('rider_shipment_work_flow')
 .select('"Today\'s Earning"')
 .eq('rider_id', riderData.id);
 
 if (!error && data) {
 let total = 0;
 data.forEach(row => {
 total += parseFloat(row["Today's Earning"] || '0') || 0;
 });
 setTotalEarning(total);
 const { data: hist } = await supabase.from('finished_riders_payable_amount').select('*').eq('rider id', riderData.id).limit(10);
 setRiderTxHistory(hist || []);
 
 const { data: penData } = await supabase.from('riders_penalty').select('penalty amount').eq('rider id', riderData.id);
 let pTotal = 0;
 if (penData) {
 penData.forEach((p: any) => {
 pTotal += parseFloat(p['penalty amount'] || '0') || 0;
 });
 }
 setTotalEarningPenalty(pTotal);
 }
 } catch (e) {
 console.error(e);
 }
 setLoadingEarning(false);
 };
 fetchEarning();
 }
 }, [activePage, riderId]);


 useEffect(() => {
 const fetchRiderData = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_rider') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 
 let record = null;
 if (userObj?.id) {
 const { data } = await supabase
 .from('riders')
 .select('*')
 .eq('id', userObj.id)
 .maybeSingle();
 record = data;
 }
 
 if (!record && userObj?.email) {
 const { data } = await supabase
 .from('riders')
 .select('*')
 .eq('registered_email', userObj.email)
 .maybeSingle();
 record = data;
 }

 if (!record) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase
 .from('riders')
 .select('*')
 .eq('id', riderId)
 .maybeSingle();
 record = data;
 }
 } 
 
 if (!record) return;


 if (record) {
 setRiderData(record);
 // Fetch Service Rates
 try {
 const riderClusterId = record.cluster_id;
 
 let foundClusterSetting = false;
 if (riderClusterId) {
 const { data: clusterData } = await supabase.from('rider_rate_setting_with_cluster').select('*').eq('cluster id', riderClusterId).limit(1).maybeSingle();
 if (clusterData) {
 setIsMultipleQtyHalfRate(clusterData['multiple quantity half rate'] || false);
 setIsPerformanceBasedRate(clusterData['performance based proportional rate'] || false);
 foundClusterSetting = true;
 }
 }

 if (!foundClusterSetting) {
 const { data: globalSettingData } = await supabase.from('rider_rate_setting').select('*').limit(1).maybeSingle();
 if (globalSettingData) {
 setIsMultipleQtyHalfRate(globalSettingData['multiple quantity half rate'] || false);
 setIsPerformanceBasedRate(globalSettingData['performance based proportional rate'] || false);
 }
 }

 const { data: globalData } = await supabase.from('active_service_rate').select('*').limit(1).single();
 if (globalData) setGlobalRates(globalData);
 
 const { data: specificData } = await supabase.from('rider_service_rates').select('*').eq('rider_id', record.id).limit(1).single();
 if (specificData) setSpecificRates(specificData);
 } catch (err) {
 console.error("Error fetching rates", err);
 }
 } else {

 setRiderData({
 id: 'No Data Found',
 rider_name: 'N/A',
 registered_email: 'N/A',
 registered_mobile_number: 'N/A',
 registered_full_address: 'N/A',
 registered_pincode: 'N/A',
 password: 'N/A',
 aadhaar_card: 'N/A',
 pan_card: 'N/A',
 driving_licence: 'N/A',
 vehicle_no: 'N/A',
 bank_name: 'N/A',
 account_no: 'N/A',
 ifsc_code: 'N/A',
 upi_id: 'N/A'
 });
 }
 } catch (err) {
 console.error("Error fetching rider data:", err);
 }
 };
 fetchRiderData();
 }, []);

 const getInitials = (name: string) => {
 if (!name || name === 'N/A' || name === 'Loading...' || name === 'No Data Found') return 'RI';
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


 if (activePage === 'personal') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Personal & Contact details</h2>
 </div>
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Rider ID</label>
 <p className="text-sm font-semibold text-gray-800 break-all">{riderId || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Rider Name</label>
 <p className="text-sm font-bold text-gray-900">{riderData?.rider_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Mobile Number</label>
 <p className="text-sm font-semibold text-gray-800">{riderData?.registered_mobile_number || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Email</label>
 <p className="text-sm font-semibold text-gray-800">{riderData?.registered_email || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Full Address</label>
 <p className="text-sm font-semibold text-gray-800">{riderData?.registered_full_address || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Registered Pincode</label>
 <p className="text-sm font-semibold text-gray-800">{riderData?.registered_pincode || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Password</label>
 <p className="text-sm font-semibold text-gray-800">{riderData?.password ? '••••••••' : 'N/A'}</p>
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
 <p className="text-sm font-semibold text-gray-800">{riderData?.aadhaar_card || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">PAN Card</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{riderData?.pan_card || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Driving Licence (DL)</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{riderData?.driving_licence || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Vehicle No.</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{riderData?.vehicle_no || 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }



 if (activePage === 'earning') {
 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">My Earning</h2>
 </div>
 
 
 {loadingEarning ? (
 <div className="flex justify-center p-8"><FiveDotLoader colorClass="bg-emerald-500" /></div>
 ) : (
 <>
 <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
 <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl"></div>
 {totalEarningPenalty > 0 && (
 <div className="absolute top-2 right-4 text-[10px] font-light text-red-400">
 Penalty: -₹{totalEarningPenalty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
 </div>
 )}

 <div className="relative z-10 flex flex-col gap-1">
 <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Lifetime Earning</span>
 <div className="flex items-end gap-1 mt-2">
 <IndianRupee size={28} className="text-emerald-400 mb-1 shrink-0" />
 <span className="text-4xl font-black text-emerald-400 truncate break-all leading-none">
 {totalEarning.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
 </span>
 </div>
 </div>
 </div>

 {/* Transaction History Card */}
 <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
 <div className="p-4 border-b border-gray-50 bg-gray-50/50 sticky top-0 z-10">
 <h3 className="text-sm font-bold text-gray-800">Transaction History</h3>
 <p className="text-[10px] text-gray-500">Latest 10 transactions</p>
 </div>
 <div className="p-4 overflow-y-auto flex-1">
 {riderTxHistory.length > 0 ? (
 <div className="space-y-4">
 {riderTxHistory.map((tx: any, idx: number) => (
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
 </>
 )}

 </div>
 );
 }


 if (activePage === 'service_rate') {
 const isSpecific = !!specificRates;
 const currentRank = isSpecific ? (specificRates.rank || 'Regular') : 'Regular';
 const pickup = isSpecific ? (specificRates.pickup_rate || 0) : (globalRates?.pickup_rate || 0);
 const delivery = isSpecific ? (specificRates.delivery_rate || 0) : (globalRates?.delivery_rate || 0);
 const returnRate = isSpecific ? (specificRates.return_delivery_rate || 0) : (globalRates?.return_delivery_rate || 0);

 const getRankStyles = (rank: string) => {
 switch (rank) {
 case 'Premium':
 return 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 border border-yellow-400 shadow-[0_2px_15px_rgba(250,204,21,0.5)] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent';
 case 'Ultra':
 return 'bg-white/10 text-cyan-800 border border-cyan-200/50 backdrop-blur-xl shadow-[0_2px_20px_rgba(34,211,238,0.5)] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent';
 case 'Regular':
 default:
 return 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-800 border border-slate-300 shadow-[0_2px_10px_rgba(148,163,184,0.4)] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';
 }
 };

 return (
      <div className="w-full min-h-fullflex flex-col pt-4 px-4 animate-in slide-in-from-right-4 duration-300 pb-24">
 <div className="flex items-center mb-6">
 <button onClick={() => setActivePage('main')} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-gray-700">
 <ArrowLeft size={18} />
 </button>
 <h2 className="text-lg font-bold ml-3 text-gray-800">Service Rate</h2>
 </div>
 
 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-5">
 <div className="flex items-center justify-between pb-4 border-b border-gray-100">
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase">Current Rank</p>
 <p className="text-[10px] text-gray-400 mt-0.5">Your assigned rate category</p>
 </div>
 <div className={"px-3 py-1 rounded-full text-xs font-bold " + getRankStyles(currentRank)}>
 {currentRank}
 </div>
 </div>

 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold text-gray-700">Pickup Rate</span>
 <span className="text-base font-bold text-gray-900">₹ {pickup}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold text-gray-700">Delivery Rate</span>
 <span className="text-base font-bold text-gray-900">₹ {delivery}</span>
 </div>
 
 </div>
 
 {!isSpecific && (
 <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
 <p className="text-[11px] text-slate-500 text-center">You are currently on the default global rates.</p>
 </div>
 )}
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
 <p className="text-sm font-semibold text-gray-800">{riderData?.bank_name || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">Account No</label>
 <p className="text-sm font-semibold text-gray-800">{riderData?.account_no || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">IFSC Code</label>
 <p className="text-sm font-semibold text-gray-800 uppercase">{riderData?.ifsc_code || 'N/A'}</p>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase">UPI ID</label>
 <p className="text-sm font-semibold text-gray-800">{riderData?.upi_id || 'N/A'}</p>
 </div>
 </div>
 </div>
 );
 }

 if (activePage === 'online_payment') {
 return <RiderTotalOnlinePayment riderId={riderData.id} onBack={() => setActivePage('main')} />;
 }

 return (
      <div className="w-full min-h-full flex flex-col pt-4 px-4 pb-24">
 {/* Profile Card */}
 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3.5 min-w-0 flex-1">
 <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner shrink-0 border border-emerald-100">
 {getInitials(riderData?.rider_name)}
 </div>
 <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
 <h2 className="text-base font-bold text-gray-800 truncate">{riderData?.rider_name || 'Loading...'}</h2>
 <p className="text-xs font-medium text-gray-600 truncate">{riderData?.registered_mobile_number || 'Loading...'}</p>
 <p className="text-[11px] font-medium text-gray-500 truncate">{riderData?.registered_email || 'Loading...'}</p>
 <p className="text-[9px] text-gray-400 mt-1 truncate">ID: {riderId || '...'}</p>
 </div>
 </div>
 <button 
 onClick={() => setActivePage('personal')}
 className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all shrink-0 ml-1 shadow-sm border border-emerald-100"
 title="View Personal & Contact details"
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
 <span className="text-[10px] text-gray-500">Aadhaar, PAN, DL, Vehicle</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>


 <button 
 onClick={() => setActivePage('service_rate')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
 <IndianRupee size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Service Rate</span>
 <span className="text-[10px] text-gray-500">View your active rates</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>
 <button 
 onClick={() => setActivePage('earning')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
 <IndianRupee size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">My Earning</span>
 <span className="text-[10px] text-gray-500">View your earnings and history</span>
 </div>
 </div>
 <ChevronRight size={18} className="text-gray-400" />
 </button>

 <button 
 onClick={() => setActivePage('online_payment')}
 className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
 <CreditCard size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-sm font-bold text-gray-800">Total Online Payment</span>
 <span className="text-[10px] text-gray-500">View your collected online payments</span>
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
 onClick={async () => {
 if (onLogout) {
 onLogout();
 } else {
 if (onLogout) { onLogout(); } else { 
 const { supabase } = await import('../../lib/supabase');
 await supabase.auth.signOut();
 window.location.reload();
 }
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
export const RiderPortal: React.FC<PortalProps> = ({ onBack }) => {
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

 const [isLoggedIn, setIsLoggedIn] = useState(() => {
 if (typeof window !== 'undefined') {
 return !!localStorage.getItem('portal_auth_rider');
 }
 return false;
 });

 useEffect(() => {
   if (!isLoggedIn) return;
   const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_rider') : null;
   const userObj = savedAuth ? JSON.parse(savedAuth) : null;
   const riderIdToTrack = userObj?.id;
   const riderEmailToTrack = userObj?.email;
   if (!riderIdToTrack && !riderEmailToTrack) return;

   let channel: any = null;
   let interval: any = null;

   const performLogoutIfFrozen = (row: any) => {
     if (row && (row.freeze === 'true' || row.freeze === true || row.freeze === 'frozen')) {
       try {
         localStorage.removeItem('portal_auth_rider');
       } catch (e) {}
       setIsLoggedIn(false);
       import('../../lib/supabase').then(({ supabase }) => {
         supabase.auth.signOut().catch(() => {});
       });
     }
   };

   import('../../lib/supabase').then(({ supabase }) => {
     const query = riderIdToTrack
       ? supabase.from('riders').select('id, freeze').eq('id', riderIdToTrack)
       : supabase.from('riders').select('id, freeze').eq('registered_email', riderEmailToTrack);

     query.maybeSingle().then(({ data }) => {
       if (data) performLogoutIfFrozen(data);
     });

     channel = supabase.channel(`rider_freeze_rt_${riderIdToTrack || riderEmailToTrack}_${Math.random().toString(36).substring(7)}`)
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'riders' }, (payload) => {
         if (payload?.new) {
           if (payload.new.id === riderIdToTrack || (riderEmailToTrack && payload.new.registered_email === riderEmailToTrack)) {
             performLogoutIfFrozen(payload.new);
           }
         }
       })
       .subscribe();

     interval = setInterval(async () => {
       try {
         const q = riderIdToTrack
           ? supabase.from('riders').select('id, freeze').eq('id', riderIdToTrack)
           : supabase.from('riders').select('id, freeze').eq('registered_email', riderEmailToTrack);
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
 { id: 'Tasks', label: 'Tasks', icon: CheckSquare },
 { id: 'Account', label: 'Account', icon: User },
 ];

 if (!isLoggedIn) {
 return <AuthLogin portalName="Rider" onLoginSuccess={() => setIsLoggedIn(true)} onBack={onBack} />;
 }

 return (
 <div className="fixed inset-0 h-[100dvh] bg-[#fafafa] text-black flex flex-col font-poppins overflow-hidden">
 {activeTab !== 'Tasks' && (
       <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center justify-between relative w-full h-[60px] px-4">
          
          {/* Left Actions (Logo and Brand) */}
          <div className="flex items-center gap-3 text-slate-700 z-10 h-full cursor-pointer" onClick={onBack}>
            {headerLogo ? (
              <img src={headerLogo} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain rounded drop-shadow-sm" />
            ) : (
               <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">Logo</div>
            )}
            
            {/* Brand Name */}
            <div className="flex flex-col items-start justify-center select-none overflow-hidden">
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center flex-nowrap gap-1 sm:gap-1.5 leading-none mt-1 whitespace-nowrap">
                <span className="text-emerald-600 shrink-0">SURIYAWAN</span>
                <span className="text-black shrink-0">SHOPPING</span>
                <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded text-[8px] sm:text-[10px] ml-0.5 sm:ml-1 shrink-0">Work Flow</span>
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
 {activeTab === 'Dashboard' && <RiderDashboardView />}
 {activeTab === 'Tasks' && <RiderTasksView onSubPageChange={setHideNav} />}
 {activeTab === 'Account' && <RiderAccountView onSubPageChange={setHideNav} onLogout={() => setShowLogoutModal(true)} />}
 </main>
 {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} portalName="Rider" />}

 <nav className={`fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 transition-transform duration-300 ease-in-out ${hideNav ? 'hidden' : ''} ${scrollDir === 'down' ? 'translate-y-full' : 'translate-y-0'}`}>
 <div className="flex justify-around items-center h-[72px] pb-2 pt-1 max-w-md mx-auto px-2">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
 activeTab === tab.id ? 'text-emerald-600' : 'text-gray-400 hover:text-black'
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
