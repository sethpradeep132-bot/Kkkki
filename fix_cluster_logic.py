import re

with open('src/components/portals/ClusterPortal.tsx', 'r') as f:
    content = f.read()

new_pay_now = """  const handlePayNow = async (userId: string) => {
    let amountToPay = 0;
    let upiIdToPay = '';
    let nameToPay = '';

    const rider = riderPayableList.find(x => x.id === userId);
    const hm = hmPayableList.find(x => x.id === userId);
    
    if (rider) { amountToPay = rider.amount; upiIdToPay = rider.upi_id; nameToPay = rider.rider_name || rider.name; }
    else if (hm) { amountToPay = hm.amount; upiIdToPay = hm.upi_id; nameToPay = hm.hub_manager_name || hm.name; }

    if (amountToPay <= 0) {
       alert("Transaction Cancelled: Bank/Payable amount is negative or zero.");
       setPaymentStates(prev => ({ ...prev, [userId]: { status: 'failed', failedAt: Date.now() } }));
       return;
    }

    if (paymentStates[userId]?.status === 'hold' || paymentStates[userId]?.status === 'settled' || paymentStates[userId]?.status === 'processing' || paymentStates[userId]?.status === 'success') return;
    if (paymentStates[userId]?.status === 'failed' && paymentStates[userId]?.failedAt) {
       const hoursSinceFail = (Date.now() - paymentStates[userId].failedAt) / (1000 * 60 * 60);
       if (hoursSinceFail < 4) {
          alert('Payment retry is only allowed after 4 hours of failure.');
          return;
       }
    }
    setPaymentStates(prev => ({ ...prev, [userId]: { status: 'processing' } }));

    // Execute real payment redirect
    let paymentMethodUrl = '';
    if (selectedPaymentMethods && selectedPaymentMethods.length > 0) {
       const selectedId = selectedPaymentMethods[0];
       const method = paymentMethodsList.find(m => m.id === selectedId);
       if (method) paymentMethodUrl = method.link;
    }
    
    if (!paymentMethodUrl) {
       paymentMethodUrl = 'upi://pay?pa=merchant@upi&pn=Asuryawan&cu=INR';
    }

    // Replace placeholders with real values
    const safeUpi = upiIdToPay && upiIdToPay !== 'N/A' ? upiIdToPay : 'merchant@upi';
    const safeName = nameToPay || 'User';
    
    let finalUrl = paymentMethodUrl.replace(/pa=[^&]*/, `pa=${safeUpi}`).replace(/pn=[^&]*/, `pn=${encodeURIComponent(safeName)}`);
    
    if (finalUrl.includes('am=')) {
        finalUrl = finalUrl.replace(/am=[^&]*/, `am=${amountToPay}`);
    } else {
        finalUrl += `&am=${amountToPay}`;
    }

    // Redirect to the payment application
    if (typeof window !== 'undefined') {
       window.location.href = finalUrl;
    }

    // Automatically settle assuming transaction returns success or via autoSettlement settings
    setTimeout(async () => {
       setPaymentStates(prev => ({ ...prev, [userId]: { status: 'success' } }));
       if (secureTxSettingsRef.current.autoSettlement) {
           await handleMarkAsSettled(userId);
       }
    }, 2500); 
  };"""

new_hold = """  const handleHoldAmount = async (userId: string) => {
    setPaymentStates(prev => ({ ...prev, [userId]: { status: 'hold' } }));
  };"""

new_settled = """  const handleMarkAsSettled = async (userId: string) => {
    setPaymentStates(prev => ({ ...prev, [userId]: { status: 'settled' } }));
    
    // Check if it's a Rider
    const riderOrder = riderPayableList.find(c => c.id === userId);
    if (riderOrder) {
      try {
        const { data: shipmentsToTransfer } = await supabase.from('rider_shipment_work_flow').select('*').eq('rider_id', riderOrder.id);
        if (shipmentsToTransfer && shipmentsToTransfer.length > 0) {
           const mappedRider = shipmentsToTransfer.map(s => ({
              ...s,
              id: undefined,
              status: 'settled',
           }));
           await supabase.from('settled_rider_shipments').insert(mappedRider);
           await supabase.from('rider_shipment_work_flow').delete().eq('rider_id', riderOrder.id);
        }
        await supabase.from('riders_penalty').delete().eq('rider id', riderOrder.id);
        await supabase.from('finished_riders_payable_amount').insert([{
           'rider id': riderOrder.id,
           'total amount': riderOrder.amount.toString(),
           'bank name': riderOrder.bank_name,
           'account no': riderOrder.account_no,
           'ifsc code': riderOrder.ifsc_code,
           'upi id': riderOrder.upi_id,
           'total settled amount': riderOrder.amount.toString(),
           'penalty amount': riderOrder.penaltyAmount.toString(),
           'penalty status': 'N/A',
           'final Settlement status': 'settled'
        }]);
        fetchRiderPayableAmount();
        setShowRiderPayableModal(false);
      } catch (e) {
         console.error(e);
      }
    }
    
    // Check if it's a Hub Manager
    const hmOrder = hmPayableList.find(c => c.id === userId);
    if (hmOrder) {
      try {
        const { data: salaryData } = await supabase.from('hub_manager_salary').select('*').eq('hub manager id', hmOrder.id);
        if (salaryData && salaryData.length > 0) {
            const mappedHm = salaryData.map(s => ({ ...s, id: undefined, 'salary status': 'settled' }));
            await supabase.from('settled_hub_managers_salary').insert(mappedHm);
            await supabase.from('hub_manager_salary').delete().eq('hub manager id', hmOrder.id);
        }
        await supabase.from('hub_managers_penalty').delete().eq('hub manager id', hmOrder.id);
        await supabase.from('finished_hub_managers_payable_amount').insert([{
           'hub manager id': hmOrder.id,
           'total amount': hmOrder.amount.toString(),
           'bank name': hmOrder.bank_name,
           'account no': hmOrder.account_no,
           'ifsc code': hmOrder.ifsc_code,
           'upi id': hmOrder.upi_id,
           'total settled amount': hmOrder.amount.toString(),
           'penalty amount': hmOrder.penaltyAmount.toString(),
           'penalty status': 'N/A',
           'final Settlement status': 'settled'
        }]);
        fetchHmPayableAmount();
        setShowHmPayableModal(false);
      } catch (e) {
         console.error(e);
      }
    }
  };"""

# Replace handlePayNow
pattern_paynow = re.compile(r'  const handlePayNow = async \(userId: string\) => \{.*?\}\s*};\s*const handleHoldAmount', re.DOTALL)
content = pattern_paynow.sub(new_pay_now + '\n  const handleHoldAmount', content)

# Replace handleHoldAmount and handleMarkAsSettled
pattern_settled = re.compile(r'  const handleHoldAmount = \(userId: string\) => \{.*?\}\s*};\s*const handleMarkAsSettled = \(userId: string\) => \{.*?\};', re.DOTALL)
content = pattern_settled.sub(new_hold + '\n' + new_settled, content)

# Fallback for handleHoldAmount if async was already added
pattern_settled_fallback = re.compile(r'  const handleHoldAmount = async \(userId: string\) => \{.*?\}\s*};\s*const handleMarkAsSettled = \(userId: string\) => \{.*?\};', re.DOTALL)
content = pattern_settled_fallback.sub(new_hold + '\n' + new_settled, content)

with open('src/components/portals/ClusterPortal.tsx', 'w') as f:
    f.write(content)
