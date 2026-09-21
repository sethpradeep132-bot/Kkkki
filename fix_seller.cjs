const fs = require('fs');
let content = fs.readFileSync('src/components/portals/SellerOrdersView.tsx', 'utf8');

// For line 335, we need to set finalShipmentStatus = await buildShipmentStatus(...)
content = content.replace(/let finalShipmentStatus = existingShipmentStatus;\n        if \(currentData\) \{\n\n        \}/, "let finalShipmentStatus = existingShipmentStatus;\n        if (currentData) {\n            finalShipmentStatus = await buildShipmentStatus('Cancelled by seller', currentData, {});\n        }");

// Remove "order status": finalOrderStatus, from shipmentUpdatePayload in SellerOrdersView.tsx
content = content.replace(/\"order status\": finalOrderStatus,\n/, '');
content = content.replace(/\"order status\": finalOrderStatus\n/, '');

fs.writeFileSync('src/components/portals/SellerOrdersView.tsx', content);
