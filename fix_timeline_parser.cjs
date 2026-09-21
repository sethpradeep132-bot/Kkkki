const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');

const regex = /const timelineSteps = statusParts\.map\(\(part, index\) => \{[\s\S]*?return \{ title, desc: part, color \};\s*\}\);/;

const replacement = `
                const timelineSteps = statusParts.map((part, index) => {
                   const lower = part.toLowerCase();
                   let title = 'Order Update';
                   let color = 'blue';
                   
                   if (lower.includes('placed')) { title = 'order placed'; color = 'emerald'; }
                   else if (lower.includes('accepted by seller')) { title = 'order accepted'; color = 'blue'; }
                   else if (lower.includes('cancelled') || lower.includes('rejected') || lower.includes('failed')) { title = 'order cancelled'; color = 'red'; }
                   else if (lower.includes('picked up')) { title = 'order picked'; color = 'emerald'; }
                   else if (lower.includes('received at hub')) { title = 'received at hub'; color = 'blue'; }
                   else if (lower.includes('dispacthed') || lower.includes('dispatched')) { title = 'order dispatched'; color = 'blue'; }
                   else if (lower.includes('shipped')) { title = 'order shipped'; color = 'blue'; }
                   else if (lower.includes('out for delivery')) { title = 'out for delivery'; color = 'blue'; }
                   else if (lower.includes('delivered')) { title = 'delivered'; color = 'emerald'; }
                   else if (lower.includes('return request')) { title = 'return requested'; color = 'orange'; }
                   else if (lower.includes('out for return')) { title = 'out for return'; color = 'orange'; }
                   else if (lower.includes('returned')) { title = 'returned'; color = 'red'; }
                   else if (lower.includes('cancel') || lower.includes('reject') || lower.includes('fail')) { title = 'order cancelled'; color = 'red'; }
                   else if (lower.includes('pick')) { title = 'order picked'; color = 'emerald'; }
                   
                   return { title, desc: part, color };
                });
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
