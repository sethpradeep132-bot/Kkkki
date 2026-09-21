import { supabase } from '../lib/supabase';

export const syncShipmentStatusToCustomerOrder = async (
  shipmentId: string,
  newShipmentType: string,
  shipmentTag: string,
  orderId: string,
  productId: string,
  existingOrderStatus: string,
  trackingId: string = '',
  awbNumber: string = '',
  pickupId: string = '',
  sourcePortal: string = '',
  newPickupPin: string = ''
) => {
  const now = new Date();
  const formattedDateTime = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const lowerType = (newShipmentType || '').toLowerCase().replace(/["']/g, '').trim();
  let newStatusText = '';

  const { data: sData } = await supabase
    .from('accepted_shipments')
    .select('"shipment type", "shipment tag", "Rider id", "cancellation code", "pickup pin", "tracking id number", "awb number", "order ID", "pickup ID", "product id"')
    .eq('id', shipmentId)
    .maybeSingle();

  const origType = sData ? (sData['shipment type'] || '').toLowerCase().replace(/["']/g, '').trim() : '';
  const cleanTag = (shipmentTag || (sData ? sData['shipment tag'] : '') || '').toLowerCase().replace(/["']/g, '').trim();
  const cleanType = lowerType || origType;

  const isSellerPickup = cleanTag.includes('seller pickup') || cleanTag.includes('selller pickup') || (!cleanTag && cleanType.includes('picked up'));
  const isCustomerPickup = cleanTag.includes('customer pickup');
  const isCustomerDelivery = cleanTag.includes('customer delivery') || cleanTag.includes('seller delivery') || cleanTag.includes('selller delivery') || cleanTag.includes('seller delivery');

  const effectiveTrackingId = trackingId || (sData ? sData['tracking id number'] : '') || '';
  const effectiveAwb = awbNumber || (sData ? sData['awb number'] : '') || '';
  const effectivePickupId = pickupId || (sData ? sData['pickup ID'] : '') || '';
  const effectiveOrderId = orderId || (sData ? sData['order ID'] : '') || '';
  const effectiveProductId = productId || (sData ? sData['product id'] : '') || '';

  if (cleanType === 'picked up' && isSellerPickup) {
    newStatusText = `Your order has been picked up successfully on ${formattedDateTime}, Tracking ID: ${effectiveTrackingId}`;
  }
  else if (cleanType === 'received at hub' && (isSellerPickup || isCustomerDelivery)) {
    newStatusText = `Your order has been successfully received at hub on ${formattedDateTime}, AWB Number: ${effectiveAwb}`;
  }
  else if (cleanType === 'dispatched' && isCustomerDelivery) {
    newStatusText = `Your order has been successfully dispacthed from hub on ${formattedDateTime}`;
  }
  else if (cleanType === 'shipped' && isCustomerDelivery) {
    newStatusText = `Your order has been shipped successfully on ${formattedDateTime}`;
  }
  else if (cleanType === 'out for delivery' && isCustomerDelivery) {
    let riderMobile = 'N/A';
    let cancellationCode = sData ? (sData['cancellation code'] || 'N/A') : 'N/A';
    
    if (sData && sData['Rider id']) {
        const { data: rData } = await supabase.from('riders').select('registered_mobile_number').eq('id', sData['Rider id']).maybeSingle();
        if (rData) riderMobile = rData.registered_mobile_number || 'N/A';
    }
    
    newStatusText = `Your order is out for delivery. You can call the delivery agent if needed on ${formattedDateTime}, Cancellation Code: ${cancellationCode}, Rider Mobile: ${riderMobile}`;
  }
  else if (cleanType === 'delivered' && isCustomerDelivery) {
    // If the original order was a customer pickup, then a transition to delivered actually means the return pickup failed.
    if ((origType === 'out for pickup' || origType === 'faild pickup' || origType === 'failed pickup' || origType === 'pickup attempt faild' || origType === 'return pickup faild') && isCustomerPickup) {
        newStatusText = `Your return pickup has failed. ${formattedDateTime}`;
    } else {
        newStatusText = `Your order has been delivered successfully To download your invoice, click here. on ${formattedDateTime}`;
    }
  }
  else if ((cleanType === 'faild delivery' || cleanType === 'failed delivery' || cleanType === 'rejected by customer' || cleanType === 'delivery attempt faild') && isCustomerDelivery) {
    newStatusText = `Your order has been cancelled. on ${formattedDateTime}`;
  }
  else if (cleanType === 'out for pickup' && isCustomerPickup) {
    const pickupPin = newPickupPin || (sData ? (sData['pickup pin'] || 'N/A') : 'N/A');
    newStatusText = `Your order is out for return. Please keep the product safe in its original packaging. on ${formattedDateTime}, Pickup Pin: ${pickupPin}`;
  }
  else if (cleanType === 'picked up' && isCustomerPickup) {
    newStatusText = `Your order has been returned successfully. on ${formattedDateTime}`;
  }
  // Customer pickup fail -> Update order status with failure message
  else if ((cleanType === 'faild pickup' || cleanType === 'failed pickup' || cleanType === 'qc faild pickup' || cleanType === 'pickup attempt faild' || cleanType === 'return pickup faild') && isCustomerPickup) {
    newStatusText = `Your return pickup has failed. ${formattedDateTime}`;
  }
  else if ((cleanType === 'faild pickup' || cleanType === 'failed pickup' || cleanType === 'qc faild pickup' || cleanType === 'pickup attempt faild') && isSellerPickup) {
    if (sourcePortal === 'hub_shipments') {
      newStatusText = `Your order has been cancelled on ${formattedDateTime}`;
    } else {
      // Intentionally left blank so no status update happens, keeping order_status exactly as it was.
    }
  }

  if (!newStatusText) {
    return { orderStatus: existingOrderStatus };
  }

  let finalOrderStatus = existingOrderStatus ? `${existingOrderStatus} || ${newStatusText}` : newStatusText;

  if (effectiveOrderId) {
    const { data: coRows } = await supabase.from('customer_orders').select('*').eq('order ID', effectiveOrderId);
    if (coRows && coRows.length > 0) {
      let targetRow = effectiveProductId ? coRows.find(r => r['product id'] === effectiveProductId) : null;
      if (!targetRow) targetRow = coRows[0];
      
      const latestCoStatus = targetRow['order status'] || '';
      
      // Update finalOrderStatus based on latestCoStatus to avoid overwriting seller updates
      if (latestCoStatus) {
         if (!latestCoStatus.includes(newStatusText)) {
            finalOrderStatus = `${latestCoStatus} || ${newStatusText}`;
         } else {
            finalOrderStatus = latestCoStatus;
         }
      } else {
         finalOrderStatus = newStatusText;
      }

      const coUpdatePayload: any = { 'order status': finalOrderStatus };
      if (effectiveAwb && (!targetRow['awb number'] || targetRow['awb number'].trim() === '')) {
         coUpdatePayload['awb number'] = effectiveAwb;
      }
      if (effectiveTrackingId && (!targetRow['tracking id number'] || targetRow['tracking id number'].trim() === '')) {
         coUpdatePayload['tracking id number'] = effectiveTrackingId;
      }
      if (effectivePickupId && (!targetRow['pickup ID'] || targetRow['pickup ID'].trim() === '')) {
         coUpdatePayload['pickup ID'] = effectivePickupId;
      }

      await supabase.from('customer_orders').update(coUpdatePayload).eq('id', targetRow.id);
    }
  }

  return { orderStatus: finalOrderStatus };
};
