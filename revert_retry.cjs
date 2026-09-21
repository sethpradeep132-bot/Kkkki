const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

// 1. Remove useState for isRetrying
code = code.replace(`  const [isSubmittingRating, setIsSubmittingRating] = useState(false);\n  const [isRetrying, setIsRetrying] = useState(false);`, `  const [isSubmittingRating, setIsSubmittingRating] = useState(false);`);

// 2. Remove handleRetryReturn block
const target1 = `    const handleRetryReturn = async () => {
      setIsRetrying(true);
      try {
        const { supabase } = await import('../../lib/supabase');
        // Find the accepted_shipment for this order that has "return pickup faild" or "faild pickup"
        const { data: sRows } = await supabase.from('accepted_shipments').select('id, "shipment type"').eq('order ID', selectedOrder['order ID']).in('shipment tag', ['customer pickup', 'Customer pickup']);
        if (sRows && sRows.length > 0) {
           const targetShipment = sRows.find(s => ['faild pickup', 'failed pickup', 'qc faild pickup', 'pickup attempt faild', 'return pickup faild'].includes((s['shipment type'] || '').toLowerCase()));
           if (targetShipment) {
              await supabase.from('accepted_shipments').update({ 'shipment type': 'out for pickup' }).eq('id', targetShipment.id);
              alert('Return pickup has been successfully requested again.');
              setActivePage('orders');
           } else {
              alert('No failed return pickup found for this order.');
           }
        } else {
           alert('No return shipment found for this order.');
        }
      } catch(e) {
        console.error(e);
      } finally {
        setIsRetrying(false);
      }
    };
    
`;
code = code.replace(target1, ``);

// 3. Remove isFailedReturn and revert isBlue
code = code.replace(`            const isReturned = (selectedOrder['order status'] || '').toLowerCase().includes('return requested');
            const isFailedReturn = (selectedOrder['order status'] || '').toLowerCase().includes('return pickup has failed');`, 
`            const isReturned = (selectedOrder['order status'] || '').toLowerCase().includes('return requested');`);

code = code.replace(`            const isBlue = (isDelivered && !isReturned && isEligible) || isFailedReturn;`,
`            const isBlue = isDelivered && !isReturned && isEligible;`);

// 4. Revert onClick logic
const onClickTarget = `                onClick={() => {
                  if (isFailedReturn) {
                    handleRetryReturn();
                    return;
                  }
                  if (isReturned) {`;
const onClickReplace = `                onClick={() => {
                  if (isReturned) {`;
code = code.replace(onClickTarget, onClickReplace);

// 5. Revert button text and remove disabled
const btnTarget = `                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : (isFailedReturn ? 'Retry Return' : 'Return Order')}
              </button>`;
const btnReplace = `              >
                Return Order
              </button>`;
code = code.replace(btnTarget, btnReplace);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
