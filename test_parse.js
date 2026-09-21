const strings = [
  "Your order has been placed successfully on 12 Sep 2026, 09:37 pm. Order ID: 123",
  "Your order has been cancelled on 12 Sep 2026, 09:37 pm, Order ID: 123",
  "Your order has been accepted by seller on 12 Sep 2026, 09:37 pm",
  "Your order has been picked upsuccessfully on 12 Sep 2026, 09:37 pm, Tracking ID: 123",
  "Your order has been successfully received at hub on 12 Sep 2026, 09:37 pm, AWB Number: 123",
  "Your order has been successfully dispacthed from hub on 12 Sep 2026, 09:37 pm",
  "Your order has been shipped successfully on 12 Sep 2026, 09:37 pm",
  "Your order is out for delivery. You can call the delivery agent if needed on 12 Sep 2026, 09:37 pm, Rider Mobile: 123, Cancellation Code: 123",
  "Your order has been delivered successfully To download your invoice, click here. on 12 Sep 2026, 09:37 pm",
  "your return request has been submitted. on 12 Sep 2026, 09:37 pm",
  "Your order is out for return. Please keep the product safe in its original packaging. on 12 Sep 2026, 09:37 pm, Pickup ID: 123",
  "Your order has been returned successfully. on 12 Sep 2026, 09:37 pm",
  "Your return pickup has failed. on 12 Sep 2026, 09:37 pm"
];

strings.forEach(part => {
  let baseAction = part;
  const onIndex = part.indexOf(' on ');
  if (onIndex !== -1) {
      baseAction = part.substring(0, onIndex).trim().toLowerCase();
  } else {
      baseAction = part.trim().toLowerCase();
  }
  baseAction = baseAction.replace('upsuccessfully', 'up successfully');
  baseAction = baseAction.replace(' successfully', '');
  
  let title = 'Order Update';
  let color = 'blue';
  const lower = part.toLowerCase();
  if (lower.includes('placed')) { title = 'order placed'; color = 'emerald'; }
  else if (lower.includes('cancel') || lower.includes('reject') || lower.includes('fail')) { title = 'order cancelled'; color = 'red'; }
  else if (lower.includes('accept')) { title = 'order accepted'; color = 'blue'; }
  else if (lower.includes('out for pickup')) { title = 'out for pickup'; color = 'orange'; }
  else if (lower.includes('pick')) { title = 'order picked'; color = 'emerald'; }
  else if (lower.includes('hub')) { title = 'received at hub'; color = 'blue'; }
  else if (lower.includes('dispatch') || lower.includes('dispacthed')) { title = 'order dishpacthed'; color = 'blue'; }
  else if (lower.includes('ship')) { title = 'order shipped'; color = 'blue'; }
  else if (lower.includes('out for delivery')) { title = 'out for delivery'; color = 'blue'; }
  else if (lower.includes('deliver')) { title = 'delivered'; color = 'emerald'; }
  else if (lower.includes('return request')) { title = 'return requested'; color = 'orange'; }
  else if (lower.includes('out for return')) { title = 'out for return'; color = 'orange'; }
  else if (lower.includes('return')) { title = 'returned'; color = 'red'; }
  
  console.log({ baseAction, title });
});
