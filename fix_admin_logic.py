import re

with open('src/components/portals/AdminPortal.tsx', 'r') as f:
    content = f.read()

new_pay_now = """  const handlePayNow = async (userId: string) => {
    let amountToPay = 0;
    let upiIdToPay = '';
    let nameToPay = '';

    const hm = adminHmPayableList?.find(x => x.id === userId);
    const rider = adminRiderPayableList?.find(x => x.id === userId);
    const cluster = adminClusterPayableList?.find(x => x.id === userId);
    const cust = adminCustomerPayableList?.find(x => x.id === userId);
    const seller = sellerPayableList?.find(x => x.id === userId);
    
    if (hm) { amountToPay = hm.amount; upiIdToPay = hm.upi_id; nameToPay = hm.hub_manager_name || hm.name; }
    else if (rider) { amountToPay = rider.amount; upiIdToPay = rider.upi_id; nameToPay = rider.rider_name || rider.name; }
    else if (cluster) { amountToPay = cluster.payableAmount; upiIdToPay = cluster.upi_id; nameToPay = cluster.name; }
    else if (cust) { amountToPay = cust.sum; upiIdToPay = cust.upi_id; nameToPay = cust.full_name || cust.name; }
    else if (seller) { amountToPay = seller.amount; upiIdToPay = seller.upi_id; nameToPay = seller.seller_name || seller.name; }

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

pattern = re.compile(r'  const handlePayNow = \(userId: string\) => \{.*?\}\s*};\s*const handleHoldAmount', re.DOTALL)
content = pattern.sub(new_pay_now + '\n  const handleHoldAmount', content)

with open('src/components/portals/AdminPortal.tsx', 'w') as f:
    f.write(content)
