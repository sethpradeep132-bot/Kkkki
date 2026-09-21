import { supabase } from '../lib/supabase';

export const processShipmentsAddresses = async (shipments: any[]) => {
  if (!shipments || shipments.length === 0) return shipments;
  
  const sellerIdsToFetch = new Set<string>();
  
  shipments.forEach(s => {
    const tag = (s['shipment tag'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
    const isSeller = tag.includes('seller pickup') || tag.includes('selller pickup') || tag.includes('seller delivery') || tag.includes('selller delivery');
    
    if (isSeller) {
      const sId = s['selller id'] || s['seller id'] || s.seller_id;
      if (sId) {
        sellerIdsToFetch.add(String(sId).trim());
      }
    }
  });

  if (sellerIdsToFetch.size === 0) return shipments;

  const { data: sellersData } = await supabase
    .from('sellers')
    .select('id, registered_full_address, registered_pincode')
    .in('id', Array.from(sellerIdsToFetch));
    
  if (!sellersData) return shipments;

  const sellerMap = new Map();
  sellersData.forEach(s => {
    const sId = String(s.id).trim();
    sellerMap.set(sId, { 
      address: s.registered_full_address, 
      pincode: s.registered_pincode 
    });
    sellerMap.set(s.id, { 
      address: s.registered_full_address, 
      pincode: s.registered_pincode 
    });
  });

  return shipments.map(s => {
    const tag = (s['shipment tag'] || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
    const isSeller = tag.includes('seller pickup') || tag.includes('selller pickup') || tag.includes('seller delivery') || tag.includes('selller delivery');
    
    // For Seller pickup or delivery
    if (isSeller) {
      const sId = String(s['selller id'] || s['seller id'] || s.seller_id || '').trim();
      if (sId && sellerMap.has(sId)) {
        const seller = sellerMap.get(sId);
        return {
          ...s,
          'full address': seller.address || s['full address'] || '',
          'pincode': seller.pincode || s['pincode'] || '',
          'landmark': '',
          'address type': 'Seller Address'
        };
      }
    }
    
    // For customer pickup or customer delivery, it remains unchanged (using accepted_shipments row data).
    // The prompt explicitly states to just show correct columns, which is the default behavior.
    
    return s;
  });
};
