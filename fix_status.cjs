const fs = require('fs');
let code = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

const replacement = `
  if (lowerType === 'ready to pickup' && lowerTag === 'seller pickup') {
    newStatusText = \`Your order has been accepted by seller on \${formattedDateTime}\`;
    newProcessType = 'order accepted';
  } else if (lowerType === 'picked up' && lowerTag === 'seller pickup') {
    newStatusText = \`Your order has been picked upsuccessfully on \${formattedDateTime}, Tracking ID: \${trackingId}\`;
    newProcessType = 'order picked';
  } else if (lowerType === 'faild pickup' && lowerTag === 'seller pickup') {
    newStatusText = \`Your order has been cancelled on \${formattedDateTime}\`;
    newProcessType = 'order cancelled';
  } else if (lowerType === 'received at hub' && lowerTag === 'customer delivery') {
    newStatusText = \`Your order has been successfully received at hub on \${formattedDateTime}, AWB Number: \${awbNumber}\`;
    newProcessType = 'received at hub';
  } else if (lowerType === 'dishpacthed' && lowerTag === 'customer delivery') {
    newStatusText = \`Your order has been successfully dispacthed from hub on \${formattedDateTime}\`;
    newProcessType = 'order dispatched';
  } else if (lowerType === 'shipped' && lowerTag === 'customer delivery') {
    newStatusText = \`Your order has been shipped successfully on \${formattedDateTime}\`;
    newProcessType = 'order shipped';
  } else if (lowerType === 'out for delivery' && lowerTag === 'customer delivery') {
    let riderMobile = 'N/A';
    let cancellationCode = 'N/A';
    if (shipmentId) {
      const { data: shipmentData } = await supabase
        .from('accepted_shipments')
        .select('"Rider id", "cancellation code"')
        .eq('id', shipmentId)
        .single();
      
      if (shipmentData) {
        cancellationCode = shipmentData['cancellation code'] || 'N/A';
        if (shipmentData['Rider id']) {
          const { data: riderData } = await supabase
            .from('riders')
            .select('registered_mobile_number')
            .eq('id', shipmentData['Rider id'])
            .single();
          if (riderData) {
            riderMobile = riderData.registered_mobile_number || 'N/A';
          }
        }
      }
    }
    newStatusText = \`Your order is out for delivery. You can call the delivery agent if needed on \${formattedDateTime}, Rider Mobile: \${riderMobile}, Cancellation Code: \${cancellationCode}\`;
    newProcessType = 'out for delivery';
  } else if (lowerType === 'delivered' && lowerTag === 'customer delivery') {
    newStatusText = \`Your order has been delivered successfully To download your invoice, click here. on \${formattedDateTime}\`;
    newProcessType = 'delivered';
  } else if (lowerType === 'faild delivery' && lowerTag === 'customer delivery') {
    newStatusText = \`Your order has been cancelled. on \${formattedDateTime}\`;
    newProcessType = 'order cancelled';
  } else if (lowerType === 'ready to pickup' && lowerTag === 'customer pickup') {
    newStatusText = \`your return request has been submitted. on \${formattedDateTime}\`;
    newProcessType = 'return requested';
  } else if (lowerType === 'out for return' && lowerTag === 'customer pickup') {
    newStatusText = \`Your order is out for return. Please keep the product safe in its original packaging. on \${formattedDateTime}, Pickup ID: \${pickupId}\`;
    newProcessType = 'out for return';
  } else if (lowerType === 'returned' && lowerTag === 'customer pickup') {
    newStatusText = \`Your order has been returned successfully. on \${formattedDateTime}\`;
    newProcessType = 'returned';
  } else if (lowerType === 'faild pickup' && lowerTag === 'customer pickup') {
    newStatusText = \`“Your return pickup has failed. on \${formattedDateTime}\`;
    newProcessType = 'return pickup faild';
  } else if ((lowerType === 'rescheduled pickup' || lowerType === 'no responsed pickup' || lowerType === 'not attended pickup' || lowerType === 'not attanded pickup') && lowerTag === 'seller pickup') {
    newStatusText = \`Your order has been cancelled on \${formattedDateTime}\`;
    newProcessType = 'order cancelled';
  } else if ((lowerType === 'rescheduled pickup' || lowerType === 'no responsed pickup' || lowerType === 'not attended pickup' || lowerType === 'not attanded pickup') && lowerTag === 'customer pickup') {
    newStatusText = \`Your return pickup has failed. on \${formattedDateTime}\`;
    newProcessType = 'return pickup faild';
  } else if ((lowerType === 'delivery rescheduled' || lowerType === 'delivery no responsed' || lowerType === 'delivery not attended' || lowerType === 'delivery no response' || lowerType === 'delivery not attanded' || lowerType === 'rescheduled delivery') && lowerTag === 'customer delivery') {
    newStatusText = \`Your order has been cancelled on \${formattedDateTime}\`;
    newProcessType = 'order cancelled';
  }
`;

code = code.replace(/if \(lowerType === 'ready to pickup' && lowerTag === 'seller pickup'\) \{[\s\S]*?if \(!newStatusText\) \{/m, replacement + '\n  if (!newStatusText) {');

fs.writeFileSync('src/utils/statusUpdater.ts', code);
