import fs from 'fs';

let content = fs.readFileSync('src/utils/statusUpdater.ts', 'utf8');

content = content.replace(/Your order has been accepted successfully on \$\{formattedDateTime\}/g, "Your order has been accepted successfully on ${formattedDateTime}");
content = content.replace(/Your order has been picked upsuccessfully on \$\{formattedDateTime\} - Tracking ID: \$\{trackingId\}/g, "Your order has been picked up successfully on ${formattedDateTime}");
content = content.replace(/Your order has been cancelled on \$\{formattedDateTime\} - Order ID: \$\{orderId\}/g, "Your order has been cancelled on ${formattedDateTime}");
content = content.replace(/Your order has been successfully received at hub on \$\{formattedDateTime\} - AWB: \$\{awbNumber\}/g, "Your order has been successfully received at hub on ${formattedDateTime}");
content = content.replace(/Your order has been successfully dishpacthed from the hub on \$\{formattedDateTime\}/g, "Your order has been successfully dispatched from the hub on ${formattedDateTime}");
content = content.replace(/Your order is out for delivery on \$\{formattedDateTime\} - Rider Mobile: \$\{riderMobile\} - Cancellation Code: \$\{cancellationCode\}/g, "Your order is out for delivery on ${formattedDateTime} with Rider Mobile: ${riderMobile}, Cancellation Code: ${cancellationCode}");
content = content.replace(/Your order is out for return on \$\{formattedDateTime\} - Pickup ID: \$\{pickupId\}/g, "Your order is out for return on ${formattedDateTime} with Pickup ID: ${pickupId}");

fs.writeFileSync('src/utils/statusUpdater.ts', content);

let sellerContent = fs.readFileSync('src/components/portals/SellerOrdersView.tsx', 'utf8');
sellerContent = sellerContent.replace(/Your order has been cancelled on \$\{formattedDate\}, \$\{formattedTime\} - Order ID: \$\{orderId\}/g, "Your order has been cancelled on ${formattedDate}, ${formattedTime}");
sellerContent = sellerContent.replace(/Your order has been accepted successfully on \$\{formattedDate\}, \$\{formattedTime\} - Order ID: \$\{orderId\}/g, "Your order has been accepted successfully on ${formattedDate}, ${formattedTime}");
sellerContent = sellerContent.replace(/setOrders\(prev => prev.map\(o => o\['order ID'\] === orderId \?/g, "setOrders(prev => prev.map(o => o.id === shipmentId ?");
fs.writeFileSync('src/components/portals/SellerOrdersView.tsx', sellerContent);

let customerContent = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');
customerContent = customerContent.replace(/Your order has been cancelled on \$\{formattedDate\}, \$\{formattedTime\} - Order ID: \$\{selectedOrder\['order ID'\]\}/g, "Your order has been cancelled on ${formattedDate}, ${formattedTime}");
fs.writeFileSync('src/components/portals/CustomerPortal.tsx', customerContent);
