const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

const target1 = `    const handleCancelOrder = async () => {`;
const inject1 = `    const [isRetrying, setIsRetrying] = useState(false);
    
    const handleRetryReturn = async () => {
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
    
    const handleCancelOrder = async () => {`;

code = code.replace(target1, inject1);

const target2 = `            const isReturned = (selectedOrder['order status'] || '').toLowerCase().includes('return requested');`;
const inject2 = `            const isReturned = (selectedOrder['order status'] || '').toLowerCase().includes('return requested');
            const isFailedReturn = (selectedOrder['order status'] || '').toLowerCase().includes('return pickup has failed');`;

code = code.replace(target2, inject2);

const target3 = `            const isBlue = isDelivered && !isReturned && isEligible;`;
const inject3 = `            const isBlue = (isDelivered && !isReturned && isEligible) || isFailedReturn;`;

code = code.replace(target3, inject3);

const target4 = `                onClick={() => {
                  if (isReturned) {
                    alert("Return has already been requested for this order.");
                    return;
                  }
                  if (!isDelivered) {`;
const inject4 = `                onClick={() => {
                  if (isFailedReturn) {
                    handleRetryReturn();
                    return;
                  }
                  if (isReturned) {
                    alert("Return has already been requested for this order.");
                    return;
                  }
                  if (!isDelivered) {`;

code = code.replace(target4, inject4);

const target5 = `              >
                Return Order
              </button>`;
const inject5 = `                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : (isFailedReturn ? 'Retry Return' : 'Return Order')}
              </button>`;

code = code.replace(target5, inject5);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
