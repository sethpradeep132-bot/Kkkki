import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, IndianRupee } from 'lucide-react';
import { FiveDotLoader } from './FiveDotLoader';

export const SellerPaymentsView = () => {
  const [loading, setLoading] = useState(true);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [paymentStats, setPaymentStats] = useState({
    totalEarning: 0,
    totalPlatformEstimate: 0,
    finalPayable: 0
  });

  useEffect(() => {
    const fetchSellerAuth = async () => {
      try {
        const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
        const userObj = savedAuth ? JSON.parse(savedAuth) : null;
        if (userObj && userObj.id) {
          setSellerId(userObj.id);
          return;
        }
        if (userObj && userObj.email) {
          const { data: sData } = await supabase.from('sellers').select('id').eq('registered_email', userObj.email).maybeSingle();
          if (sData?.id) {
            setSellerId(sData.id);
            return;
          }
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: sData } = await supabase.from('sellers').select('id').eq('id', user.id).maybeSingle();
          if (sData?.id) setSellerId(sData.id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSellerAuth();
  }, []);

  useEffect(() => {
    if (!sellerId) return;

    const fetchPaymentStats = async () => {
      setLoading(true);
      try {
        // Auto-sync any delivered orders for this seller into selller_income_estimate if missing
        try {
          const { data: deliveredOrders } = await supabase
            .from('accepted_shipments')
            .select('*')
            .eq('selller id', sellerId)
            .ilike('shipment type', 'delivered')
            .in('shipment tag', ['Customer delivery', 'customer delivery']);

          if (deliveredOrders && deliveredOrders.length > 0) {
            const { data: existingEstimates } = await supabase
              .from('selller_income_estimate')
              .select('"order id"')
              .eq('seller id', sellerId);

            const existingOrderIds = new Set((existingEstimates || []).map(e => e['order id']));
            const missingOrders = deliveredOrders.filter(d => !existingOrderIds.has(d['order ID'] || d['order id']));

            if (missingOrders.length > 0) {
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

              for (const order of missingOrders) {
                const sp = parseFloat(order['total selling price']) || parseFloat(order['total amount']) || 0;
                const dc = parseFloat(order['total delevery charge']) || 0;
                const gd = parseFloat(order['gift cash donation']) || 0;
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
                  "admin id": order['admin id'] || '',
                  "seller id": sellerId,
                  "order id": order['order ID'] || order['order id'],
                  "product id": order['product id'] || '',
                  "awb number": order['awb number'] || '',
                  "total earning amount": totalSellerEarning.toFixed(2),
                  "total platform estimate": totalPlatformEstimate.toFixed(2),
                  "final payable amount": finalPayable.toFixed(2),
                  "payout status": "Pending",
                  "days": order['days'] || 1,
                  "created_at": order['created_at'] || new Date().toISOString()
                }]);
              }
            }
          }
        } catch (syncErr) {
          console.error("Error auto-syncing delivered orders to income estimate", syncErr);
        }

        const { data, error } = await supabase
          .from('selller_income_estimate')
          .select('"total earning amount", "total platform estimate", "final payable amount"')
          .eq('seller id', sellerId);
        
        if (error) throw error;
        
        let totalEarning = 0;
        let totalPlatformEstimate = 0;
        let finalPayable = 0;
        
        if (data && data.length > 0) {
          data.forEach(row => {
            totalEarning += parseFloat(row['total earning amount'] || '0') || 0;
            totalPlatformEstimate += parseFloat(row['total platform estimate'] || '0') || 0;
            finalPayable += parseFloat(row['final payable amount'] || '0') || 0;
          });
        }
        
        setPaymentStats({
          totalEarning,
          totalPlatformEstimate,
          finalPayable
        });

        // Fetch transaction history from settled_selller_income_estimate
        try {
          const { data: settledData } = await supabase
            .from('settled_selller_income_estimate')
            .select('*')
            .eq('seller id', sellerId)
            .order('created_at', { ascending: false })
            .limit(10);
          if (settledData) {
            setTxHistory(settledData);
          }
        } catch (settledErr) {
          console.error("Error fetching settled transaction history", settledErr);
        }

      } catch (err) {
        console.error("Error fetching payment stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStats();

    // Subscribe to real-time changes
    const channel1 = supabase
      .channel(`seller_income_channel_${sellerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'selller_income_estimate' }, () => {
        fetchPaymentStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settled_selller_income_estimate' }, () => {
        fetchPaymentStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
    };
  }, [sellerId]);

  return (
    <div className="w-full min-h-full flex flex-col pt-4 px-3 sm:px-4 pb-24">
      <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <Wallet className="text-orange-500" size={24} />
        Payment Overview
      </h2>
      
      {loading ? (
        <div className="flex justify-center p-8"><FiveDotLoader colorClass="bg-orange-500" /></div>
      ) : (
        <>
          <div className="rounded-xl p-5 sm:p-6 text-slate-800 relative overflow-hidden border-[1.5px] border-black bg-[#fdfbf7] shadow-xs">
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-orange-950/70 text-xs sm:text-sm font-bold uppercase tracking-wider">Final Payable Amount</span>
                <div className="flex items-end gap-1">
                  <IndianRupee size={28} className="text-emerald-600 mb-1 shrink-0" />
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 truncate break-all leading-none">{paymentStats.finalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="h-px w-full bg-orange-200/70"></div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Total Earning</span>
                  <div className="flex items-end gap-1">
                    <IndianRupee size={16} className="text-emerald-600 mb-0.5 shrink-0" />
                    <span className="text-lg sm:text-xl font-bold text-slate-900 truncate leading-none">{paymentStats.totalEarning.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-orange-200/70"></div>
                <div className="flex flex-col gap-1 text-right items-end">
                  <span className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Platform Est.</span>
                  <div className="flex items-end gap-1">
                    <IndianRupee size={16} className="text-red-500 mb-0.5 shrink-0" />
                    <span className="text-lg sm:text-xl font-bold text-slate-900 truncate leading-none">{paymentStats.totalPlatformEstimate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
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
              {txHistory.length > 0 ? (
                <div className="space-y-4">
                  {txHistory.map((tx: any, idx: number) => (
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
};
