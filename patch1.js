const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

if (!code.includes("import { Reorder, useDragControls } from 'motion/react';")) {
    code = code.replace("import React, { useEffect, useState, useRef } from 'react';", "import React, { useEffect, useState, useRef } from 'react';\nimport { Reorder, useDragControls } from 'motion/react';");
}

let stateInsert = `
  const [renderedGroups, setRenderedGroups] = useState<any[]>([]);
  useEffect(() => {
      const isCompletedTab = activeChip === 'Failed/Completed';
      let filteredTasks = tasks;

      let groups: any = {};
      filteredTasks.forEach(task => {
          const sInfo = sellersInfo[task['selller id']] || {};
          const sType = task['shipment type'] || '';
          const sTag = task['shipment tag'] || '';
          const sTagLower = sTag.toLowerCase().replace(/["']/g, '').replace(/\\s+/g, ' ').trim();
          const sTypeLower = sType.toLowerCase().replace(/["']/g, '').replace(/\\s+/g, ' ').trim();
          
          const isSellerDelivery = sTagLower.includes('seller delivery') || sTagLower.includes('selller delivery');
          const isCustomerDelivery = sTagLower.includes('customer delivery') || (!isSellerDelivery && sTypeLower === 'out for delivery');
          
          const isCustomerPickup = sTagLower.includes('customer pickup');
          const isSellerPickup = sTagLower.includes('seller pickup') || sTagLower.includes('selller pickup') || (!isCustomerPickup && sTypeLower === 'out for pickup');

          let hashKey = isCompletedTab 
            ? (task.id || Math.random().toString())
            : \`\${task['full name'] || ''}|\${task['mobile number'] || ''}|\${task['full address'] || ''}|\${task['pincode'] || ''}|\${task['landmark'] || ''}|\${task['address type'] || ''}|\${task['product image'] || ''}|\${task['product name'] || ''}|\${task['product tittle name'] || ''}|\${task['product discription'] || ''}|\${task['key features'] || ''}|\${task['total quantity'] || ''}|\${task['size'] || ''}|\${task['colour'] || ''}|\${task['weight'] || ''}|\${task['total price info'] || ''}|\${task['total selling price'] || ''}|\${task['total discount'] || ''}|\${task['total delevery charge'] || ''}|\${task['total amount'] || ''}|\${task['payment method'] || ''}|\${task['gift cash donation'] || ''}\`;

          if (isCustomerDelivery || isCustomerPickup) {
            if (!groups[hashKey]) groups[hashKey] = {
              hashKey: hashKey,
              orderIds: new Set(),
              pickupIds: new Set(),
              isCustomerTask: true,
              tasks: [],
              sellerName: task['full name'] || 'Customer',
              address: task['full address'] || task.address || '',
              landmark: task.landmark || '',
              pincode: task.pincode || '',
              mobileNumber: task['mobile number'] || '',
              firstTask: task
            };
            groups[hashKey].orderIds.add(task['order ID'] || task['awb number']);
            if (isCustomerPickup) groups[hashKey].pickupIds.add(task['pickup ID'] || task['order ID'] || task['awb number']);
            groups[hashKey].tasks.push(task);
          } else {
            const sId = task['selller id'] || 'unknown';
            const sellerHashKey = isCompletedTab ? hashKey : \`\${sId}-\${hashKey}\`;
            if (!groups[sellerHashKey]) groups[sellerHashKey] = {
              hashKey: sellerHashKey,
              sellerId: sId,
              pickupIds: new Set(),
              tasks: [],
              shopName: sInfo.shop_name,
              sellerName: sInfo.seller_name,
              address: sInfo.registered_full_address || task['full address'] || task.address || '',
              landmark: task.landmark || '',
              pincode: sInfo.registered_pincode || task.pincode || '',
              mobileNumber: sInfo.registered_mobile_number || task['mobile number'] || '',
              firstTask: task
            };
            groups[sellerHashKey].pickupIds.add(task['pickup ID'] || 'unknown');
            groups[sellerHashKey].tasks.push(task);
          }
      });
      
      let groupArray = Object.values(groups);
      
      if (activeChip === 'Pending') {
          let riderId = null;
          try {
             const stored = localStorage.getItem('portal_auth_rider');
             if (stored) riderId = JSON.parse(stored).id;
          } catch(e) {}
          
          let selectedRoute: any = null;
          try {
             const stored = localStorage.getItem('rider_selected_route_' + riderId);
             if (stored) selectedRoute = JSON.parse(stored);
          } catch(e) {}
          
          let manualSort: string[] = [];
          try {
             const stored = localStorage.getItem('rider_manual_sort_' + riderId);
             if (stored) manualSort = JSON.parse(stored);
          } catch(e) {}
          
          const getVillageIndex = (group: any) => {
             if (!selectedRoute || !selectedRoute.villages) return 999999;
             const addressStr = \`\${group.address} \${group.landmark} \${group.pincode} \${group.firstTask?.['shipment tag']}\`.toLowerCase();
             let bestIndex = 999999;
             selectedRoute.villages.forEach((village: string, idx: number) => {
                if (!village.trim()) return;
                const vLower = village.trim().toLowerCase();
                if (addressStr.includes(vLower)) {
                   if (idx < bestIndex) bestIndex = idx;
                }
             });
             return bestIndex;
          };

          groupArray.sort((a: any, b: any) => {
             const idxA = manualSort.indexOf(a.hashKey);
             const idxB = manualSort.indexOf(b.hashKey);
             const isAManual = idxA !== -1;
             const isBManual = idxB !== -1;
             
             if (isAManual && isBManual) return idxA - idxB;
             if (isAManual && !isBManual) return -1;
             if (!isAManual && isBManual) return 1;
             
             const vIdxA = getVillageIndex(a);
             const vIdxB = getVillageIndex(b);
             if (vIdxA !== vIdxB) return vIdxA - vIdxB;
             
             return (a.firstTask?.id || '').localeCompare(b.firstTask?.id || '');
          });
      }

      setRenderedGroups(groupArray);
  }, [tasks, activeChip, sellersInfo]);
`;

code = code.replace("const [scanningGroup, setScanningGroup] = useState<any>(null);", "const [scanningGroup, setScanningGroup] = useState<any>(null);\n" + stateInsert);
fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
