const getShortStatus = (statusText) => {
  if (!statusText) return 'Pending';
  const parts = statusText.split('||').map(s => s.trim()).filter(Boolean);
  const latestStatus = parts[parts.length - 1] || statusText;
  const lower = latestStatus.toLowerCase();
  
  if (lower.includes('placed')) return 'Order Placed';
  if (lower.includes('accepted by seller')) return 'Order Accepted';
  if (lower.includes('return pickup has failed')) return 'Return Pickup Faild';
  if (lower.includes('cancelled') || lower.includes('rejected') || lower.includes('failed')) return 'Order Cancelled';
  if (lower.includes('picked up')) return 'Order Picked';
  if (lower.includes('received at hub')) return 'Received At Hub';
  if (lower.includes('dispacthed') || lower.includes('dispatched')) return 'Order Dispatched';
  if (lower.includes('shipped')) return 'Order Shipped';
  if (lower.includes('out for delivery')) return 'Out For Delivery';
  if (lower.includes('delivered')) return 'Delivered';
  if (lower.includes('return request')) return 'Return Requested';
  if (lower.includes('out for return')) return 'Out For Return';
  if (lower.includes('returned')) return 'Returned';
  if (lower.includes('cancel') || lower.includes('reject') || lower.includes('fail')) return 'Order Cancelled';
  if (lower.includes('pick')) return 'Order Picked';
  
  return latestStatus.length > 15 ? latestStatus.substring(0, 15) + '...' : latestStatus;
};
console.log(getShortStatus("Your order is out for delivery"));
