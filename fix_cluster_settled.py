import re

with open('src/components/portals/ClusterPortal.tsx', 'r') as f:
    content = f.read()

new_hold = """  const handleHoldAmount = (userId: string) => {
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

pattern = re.compile(r'  const handleHoldAmount = \(userId: string\) => \{\s*setPaymentStates\(prev => \(\{ \.\.\.prev, \[userId\]: \{ status: \'hold\' \} \}\)\);\s*\};\s*const handleMarkAsSettled = \(userId: string\) => \{\s*setPaymentStates\(prev => \(\{ \.\.\.prev, \[userId\]: \{ status: \'settled\' \} \}\)\);\s*\};', re.DOTALL)
content = pattern.sub(new_hold + '\n' + new_settled, content)

with open('src/components/portals/ClusterPortal.tsx', 'w') as f:
    f.write(content)
