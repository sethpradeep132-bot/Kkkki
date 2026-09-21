const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');

const oldTimeline = `                   if (lower.includes('placed')) { title = 'Order placed'; color = 'emerald'; }
                   else if (lower.includes('cancel') || lower.includes('reject') || lower.includes('fail')) { title = 'Order cancelled'; color = 'red'; }
                   else if (lower.includes('accept')) { title = 'Order accepted'; color = 'blue'; }
                   else if (lower.includes('out for pickup')) { title = 'Out for pickup'; color = 'orange'; }
                   else if (lower.includes('pick')) { title = 'Order picked up'; color = 'emerald'; }
                   else if (lower.includes('hub')) { title = 'Received at hub'; color = 'blue'; }
                   else if (lower.includes('dispatch')) { title = 'Order dispatched'; color = 'blue'; }
                   else if (lower.includes('ship')) { title = 'order shipped'; color = 'blue'; }
                   else if (lower.includes('out for delivery')) { title = 'Out for delivery'; color = 'blue'; }
                   else if (lower.includes('deliver')) { title = 'Order delivered'; color = 'emerald'; }
                   else if (lower.includes('return request')) { title = 'return requested'; color = 'orange'; }
                   else if (lower.includes('return')) { title = 'returned'; color = 'red'; }`;

const newTimeline = `                   if (lower.includes('placed')) { title = 'order placed'; color = 'emerald'; }
                   else if (lower.includes('cancel') || lower.includes('reject') || lower.includes('fail')) { title = 'order cancelled'; color = 'red'; }
                   else if (lower.includes('accept')) { title = 'order accepted'; color = 'blue'; }
                   else if (lower.includes('out for pickup')) { title = 'out for pickup'; color = 'orange'; }
                   else if (lower.includes('pick')) { title = 'order picked'; color = 'emerald'; }
                   else if (lower.includes('hub')) { title = 'received at hub'; color = 'blue'; }
                   else if (lower.includes('dispatch')) { title = 'order dishpacthed'; color = 'blue'; }
                   else if (lower.includes('ship')) { title = 'order shipped'; color = 'blue'; }
                   else if (lower.includes('out for delivery')) { title = 'out for delivery'; color = 'blue'; }
                   else if (lower.includes('deliver')) { title = 'delivered'; color = 'emerald'; }
                   else if (lower.includes('return request')) { title = 'return requested'; color = 'orange'; }
                   else if (lower.includes('out for return')) { title = 'out for return'; color = 'orange'; }
                   else if (lower.includes('return')) { title = 'returned'; color = 'red'; }`;

if (code.includes(oldTimeline)) {
  code = code.replace(oldTimeline, newTimeline);
  fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
  console.log('Replaced correctly.');
} else {
  console.log('Could not find old timeline string');
}
