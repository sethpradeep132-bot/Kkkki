const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

const newGetShortStatus = `const getShortStatus = (statusText: string) => {
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

const getStatusColorClass = (status: string) => {
  if (['Order Cancelled', 'Return Pickup Faild', 'Returned'].includes(status)) return 'text-red-600 bg-red-50';
  if (['Order Placed', 'Order Picked', 'Delivered'].includes(status)) return 'text-emerald-600 bg-emerald-50';
  if (['Return Requested', 'Out For Return'].includes(status)) return 'text-orange-600 bg-orange-50';
  return 'text-blue-600 bg-blue-50';
};`;

const oldGetShortStatusRegex = /const getShortStatus = \(statusText: string\) => \{[\s\S]*?return latestStatus\.length > 15 \? latestStatus\.substring\(0, 15\) \+ '\.\.\.' : latestStatus;\n\};/;
code = code.replace(oldGetShortStatusRegex, newGetShortStatus);

const oldBadgeRegex = /<span className=\{\`text-\[10px\] font-bold px-2 py-0\.5 rounded-md w-fit \$\{\['Cancelled', 'Rejected', 'Return Pickup Faild'\]\.includes\(getShortStatus\(order\['order status'\] \|\| ''\)\) \? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'\}\`\}>/g;
code = code.replace(oldBadgeRegex, `<span className={\`text-[10px] font-bold px-2 py-0.5 rounded-md w-fit \${getStatusColorClass(getShortStatus(order['order status'] || ''))}\`}>`);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
