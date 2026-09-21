const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

const startIdx = code.indexOf("const handleReturnOrder = async () => {");
const endIdx = code.indexOf("    return (", startIdx);

const replacement = `const handleReturnOrder = async () => {
      if (returnReason !== 'specific_reason') {
        alert('Please select a valid reason to return.');
        return;
      }
      setIsReturning(true);
      const now = new Date();
      const formattedDate = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const formattedTime = now.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let pickupIdStr = '';
        let shipDataToUpdate = null;

        if (selectedOrder['order ID']) {
          const { data: shipData } = await supabase.from('accepted_shipments').select('*').eq('order ID', selectedOrder['order ID']).maybeSingle();
          if (shipData) {
              shipDataToUpdate = shipData;
              if (shipData['pickup ID']) {
                 pickupIdStr = \`, Pickup ID: \${shipData['pickup ID']}\`;
              }
          }
        }

        const existingStatus = selectedOrder['order status'] || '';
        const newReturnEntry = \`your return request has been submitted. on \${formattedDate}, \${formattedTime}\${pickupIdStr}\`;
        const returnStatus = existingStatus ? existingStatus + ' || ' + newReturnEntry : newReturnEntry;

        const { error: customerError } = await supabase.from('customer_orders').update({ 'order status': returnStatus }).eq('id', selectedOrder.id);
        
        if (shipDataToUpdate) {
            const payload: any = {
              'order status': returnStatus, 
              'shipment type': 'ready to pickup',
              'shipment tag': 'customer pickup'
            };
            payload['shipment status'] = await buildShipmentStatus('your return request has been submitted.', shipDataToUpdate, payload);
            await supabase
              .from('accepted_shipments')
              .update(payload)
              .eq('order ID', selectedOrder['order ID']);
        }
        
        if (!customerError) {
          alert("Your return request has been submitted successfully. Please wait for approval.");
          setSelectedOrder({ ...selectedOrder, 'order status': returnStatus });
          setCustomerOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, 'order status': returnStatus } : o));
          setActivePage('order_details');
        } else {
          console.error('Failed to request return.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsReturning(false);
      }
    };
`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
