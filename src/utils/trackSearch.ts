import { supabase } from '../lib/supabase';

// Helper to determine if a field contains an image
export function isImageField(key: string, val: any): boolean {
  if (!val) return false;
  const lowerKey = key.toLowerCase();
  const knownImageKeys = [
    'product image', 'product images', 'avatar', 'digital signature', 
    'captured images', 'shop_image', 'profile_image'
  ];

  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('data:image/')) return true;
    if (/^https?:\/\/.*\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(s)) return true;
    if (s.includes('/storage/v1/object/public/')) return true;
    if (knownImageKeys.includes(lowerKey) && (s.startsWith('http') || s.startsWith('data:') || s.startsWith('/'))) return true;
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr) && arr.length > 0 && isImageField(key, arr[0])) return true;
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  if (Array.isArray(val) && val.length > 0 && isImageField(key, val[0])) {
    return true;
  }

  return false;
}

// Helper to extract image URLs or base64 data URLs from any image field value
export function extractImageUrls(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.filter(v => typeof v === 'string' && v.trim().length > 0);
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.filter(v => typeof v === 'string' && v.trim().length > 0);
        }
      } catch (e) {
        // ignore
      }
    }
    if (s.includes(',') && (s.includes('http') || s.includes('data:image'))) {
      const parts = s.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length > 1 && parts.every(p => p.startsWith('http') || p.startsWith('data:image'))) {
        return parts;
      }
    }
    return [s];
  }
  return [];
}

/**
 * Dedicated function to search shipments across finished_shipments, accepted_shipments, and customer_orders,
 * pick the latest up-to-date state (finished > accepted > customer_orders),
 * and fetch all connected table details from Supabase (sellers, customers, riders, hub_managers, clusters, upload_products).
 */
export async function trackShipmentWithConnectedDetails(term: string): Promise<any[]> {
  if (!term || term.trim().length === 0) return [];
  const cleanTerm = term.trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTerm);

  const colsFinAcc = [
    'awb number', 'tracking id number', 'order ID', 'pickup ID', 
    'product SKU code', 'runsheet id', 'pickupsheet id', 'bag id', 'mobile number'
  ];
  if (isUUID) colsFinAcc.push('id');

  const colsOrd = [
    'awb number', 'tracking id number', 'order ID', 'pickup ID', 'mobile number'
  ];
  if (isUUID) colsOrd.push('id');

  const orFinAcc = colsFinAcc.map(c => `"${c}".eq."${cleanTerm}"`).join(',');
  const orOrd = colsOrd.map(c => `"${c}".eq."${cleanTerm}"`).join(',');

  // Query all three shipment tables in parallel
  const [finRes, accRes, ordRes] = await Promise.allSettled([
    supabase.from('finished_shipments').select('*').or(orFinAcc),
    supabase.from('accepted_shipments').select('*').or(orFinAcc),
    supabase.from('customer_orders').select('*').or(orOrd)
  ]);

  const finData: any[] = finRes.status === 'fulfilled' && finRes.value.data ? finRes.value.data : [];
  const accData: any[] = accRes.status === 'fulfilled' && accRes.value.data ? accRes.value.data : [];
  const ordData: any[] = ordRes.status === 'fulfilled' && ordRes.value.data ? ordRes.value.data : [];

  // Deduplicate shipments by order ID / tracking id number / awb number, picking the most updated record
  // Priority: finished_shipments (final state) > accepted_shipments (live in-transit) > customer_orders (initial placed)
  const shipmentsMap = new Map<string, any>();

  for (const row of finData) {
    const key = String(row['order ID'] || row['tracking id number'] || row['awb number'] || row['id']);
    if (!shipmentsMap.has(key)) {
      shipmentsMap.set(key, { ...row, __table: 'finished_shipments' });
    }
  }

  for (const row of accData) {
    const key = String(row['order ID'] || row['tracking id number'] || row['awb number'] || row['id']);
    if (!shipmentsMap.has(key)) {
      shipmentsMap.set(key, { ...row, __table: 'accepted_shipments' });
    }
  }

  for (const row of ordData) {
    const key = String(row['order ID'] || row['tracking id number'] || row['awb number'] || row['id']);
    if (!shipmentsMap.has(key)) {
      shipmentsMap.set(key, { ...row, __table: 'customer_orders' });
    }
  }

  const shipments = Array.from(shipmentsMap.values());
  if (shipments.length === 0) return [];

  const finalResults: any[] = [];
  const seenUnique = new Set<string>();

  for (const sh of shipments) {
    const shKey = `${sh.__table}-${sh.id || sh['order ID'] || sh['tracking id number']}`;
    if (!seenUnique.has(shKey)) {
      seenUnique.add(shKey);
      finalResults.push(sh);
    }

    // Fetch connected tables from Supabase based on foreign keys present in this shipment
    const sellerId = sh['selller id'] || sh['seller_id'];
    const custId = sh['customer id'] || sh['customer_id'];
    const riderId = sh['Rider id'] || sh['rider id'] || sh['rider_id'];
    const hubId = sh['hub manager id'] || sh['hub_manager_id'];
    const clusterId = sh['cluster id'] || sh['cluster_id'];
    const prodId = sh['product id'] || sh['product_id'];

    const fetchTasks: Promise<any>[] = [];

    if (sellerId && !seenUnique.has(`sellers-${sellerId}`)) {
      fetchTasks.push((async () => {
        try {
          const { data } = await supabase.from('sellers').select('*').eq('id', sellerId).single();
          if (data && !seenUnique.has(`sellers-${sellerId}`)) {
            seenUnique.add(`sellers-${sellerId}`);
            finalResults.push({ __table: 'sellers', ...data });
          }
        } catch {
          // ignore error
        }
      })());
    }

    if (custId && !seenUnique.has(`customers-${custId}`)) {
      fetchTasks.push((async () => {
        try {
          const { data } = await supabase.from('customers').select('*').eq('id', custId).single();
          if (data && !seenUnique.has(`customers-${custId}`)) {
            seenUnique.add(`customers-${custId}`);
            finalResults.push({ __table: 'customers', ...data });
          }
        } catch {
          // ignore error
        }
      })());
    }

    if (riderId && !seenUnique.has(`riders-${riderId}`)) {
      fetchTasks.push((async () => {
        try {
          const { data } = await supabase.from('riders').select('*').eq('id', riderId).single();
          if (data && !seenUnique.has(`riders-${riderId}`)) {
            seenUnique.add(`riders-${riderId}`);
            finalResults.push({ __table: 'riders', ...data });
          }
        } catch {
          // ignore error
        }
      })());
    }

    if (hubId && !seenUnique.has(`hub_managers-${hubId}`)) {
      fetchTasks.push((async () => {
        try {
          const { data } = await supabase.from('hub_managers').select('*').eq('id', hubId).single();
          if (data && !seenUnique.has(`hub_managers-${hubId}`)) {
            seenUnique.add(`hub_managers-${hubId}`);
            finalResults.push({ __table: 'hub_managers', ...data });
          }
        } catch {
          // ignore error
        }
      })());
    }

    if (clusterId && !seenUnique.has(`clusters-${clusterId}`)) {
      fetchTasks.push((async () => {
        try {
          const { data } = await supabase.from('clusters').select('*').eq('id', clusterId).single();
          if (data && !seenUnique.has(`clusters-${clusterId}`)) {
            seenUnique.add(`clusters-${clusterId}`);
            finalResults.push({ __table: 'clusters', ...data });
          }
        } catch {
          // ignore error
        }
      })());
    }

    if (prodId && !seenUnique.has(`upload_products-${prodId}`)) {
      fetchTasks.push((async () => {
        try {
          const { data } = await supabase.from('upload_products').select('*').eq('id', prodId).single();
          if (data && !seenUnique.has(`upload_products-${prodId}`)) {
            seenUnique.add(`upload_products-${prodId}`);
            finalResults.push({ __table: 'upload_products', ...data });
          }
        } catch {
          // ignore error
        }
      })());
    }

    if (fetchTasks.length > 0) {
      await Promise.allSettled(fetchTasks);
    }
  }

  return finalResults;
}

/**
 * Universal Track All search for Admin and Cluster portals.
 */
export const trackAllSearch = async (
  term: string, 
  category: 'User' | 'Shipments' | 'Other', 
  isAdmin: boolean
): Promise<any[]> => {
  if (!term || term.trim().length < 2) return [];
  const cleanTerm = term.trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTerm);
  const isNumeric = /^\d+$/.test(cleanTerm);

  // If user is tracking Shipments OR entered a shipment tracking/order/AWB format:
  const isShipmentCode = /^(SS-|ORD|SURI|PIC|AWB|PKG)/i.test(cleanTerm) || category === 'Shipments';

  if (isShipmentCode) {
    const shipmentResults = await trackShipmentWithConnectedDetails(cleanTerm);
    if (shipmentResults.length > 0) {
      return shipmentResults;
    }
    // If not found in shipments and category was not strictly 'Shipments', continue searching other tables below
    if (category === 'Shipments') {
      return [];
    }
  }

  const allResults: any[] = [];
  const seenIds = new Set<string>();

  const addResults = (table: string, items: any[]) => {
    for (const item of items) {
      const uKey = `${table}-${item.id || JSON.stringify(item)}`;
      if (!seenIds.has(uKey)) {
        seenIds.add(uKey);
        allResults.push({ __table: table, ...item });
      }
    }
  };

  if (category === 'User') {
    // Specific search per User table with exact known columns to avoid Postgres type mismatch
    const userQueries: Promise<void>[] = [];

    // Customers
    userQueries.push((async () => {
      let q = supabase.from('customers').select('*');
      const orCols: string[] = [];
      if (isUUID) orCols.push(`"id".eq."${cleanTerm}"`);
      if (isNumeric) {
        orCols.push(`"mobile_number".eq."${cleanTerm}"`);
        orCols.push(`"pincode".eq."${cleanTerm}"`);
      } else {
        orCols.push(`"full_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"email_account".ilike."%${cleanTerm}%"`);
      }
      if (orCols.length > 0) {
        const { data } = await q.or(orCols.join(','));
        if (data && data.length > 0) addResults('customers', data);
      }
    })());

    // Sellers
    userQueries.push((async () => {
      let q = supabase.from('sellers').select('*');
      const orCols: string[] = [];
      if (isUUID) orCols.push(`"id".eq."${cleanTerm}"`);
      if (isNumeric) {
        orCols.push(`"registered_mobile_number".eq."${cleanTerm}"`);
        orCols.push(`"registered_pincode".eq."${cleanTerm}"`);
        orCols.push(`"aadhaar_card".eq."${cleanTerm}"`);
      } else {
        orCols.push(`"seller_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"shop_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"registered_email".ilike."%${cleanTerm}%"`);
        orCols.push(`"pan_card".eq."${cleanTerm}"`);
      }
      if (orCols.length > 0) {
        const { data } = await q.or(orCols.join(','));
        if (data && data.length > 0) addResults('sellers', data);
      }
    })());

    // Riders
    userQueries.push((async () => {
      let q = supabase.from('riders').select('*');
      const orCols: string[] = [];
      if (isUUID) {
        orCols.push(`"id".eq."${cleanTerm}"`);
        orCols.push(`"cluster_id".eq."${cleanTerm}"`);
      }
      if (isNumeric) {
        orCols.push(`"registered_mobile_number".eq."${cleanTerm}"`);
        orCols.push(`"aadhaar_card".eq."${cleanTerm}"`);
      } else {
        orCols.push(`"rider_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"registered_email".ilike."%${cleanTerm}%"`);
        orCols.push(`"vehicle_no".ilike."%${cleanTerm}%"`);
        orCols.push(`"driving_licence".ilike."%${cleanTerm}%"`);
        orCols.push(`"pan_card".eq."${cleanTerm}"`);
      }
      if (orCols.length > 0) {
        const { data } = await q.or(orCols.join(','));
        if (data && data.length > 0) addResults('riders', data);
      }
    })());

    // Hub Managers
    userQueries.push((async () => {
      let q = supabase.from('hub_managers').select('*');
      const orCols: string[] = [];
      if (isUUID) {
        orCols.push(`"id".eq."${cleanTerm}"`);
        orCols.push(`"cluster_id".eq."${cleanTerm}"`);
      }
      if (isNumeric) {
        orCols.push(`"registered_mobile_number".eq."${cleanTerm}"`);
        orCols.push(`"aadhaar_card".eq."${cleanTerm}"`);
      } else {
        orCols.push(`"hub_manager_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"hub_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"store_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"registered_email".ilike."%${cleanTerm}%"`);
        orCols.push(`"pan_card".eq."${cleanTerm}"`);
        orCols.push(`"voter_id".eq."${cleanTerm}"`);
      }
      if (orCols.length > 0) {
        const { data } = await q.or(orCols.join(','));
        if (data && data.length > 0) addResults('hub_managers', data);
      }
    })());

    // Clusters
    if (isAdmin) {
      userQueries.push((async () => {
        let q = supabase.from('clusters').select('*');
        const orCols: string[] = [];
        if (isUUID) orCols.push(`"id".eq."${cleanTerm}"`);
        if (isNumeric) {
          orCols.push(`"registered_mobile_number".eq."${cleanTerm}"`);
          orCols.push(`"aadhaar_card".eq."${cleanTerm}"`);
        } else {
          orCols.push(`"cluster_name".ilike."%${cleanTerm}%"`);
          orCols.push(`"registered_email".ilike."%${cleanTerm}%"`);
          orCols.push(`"pan_card".eq."${cleanTerm}"`);
        }
        if (orCols.length > 0) {
          const { data } = await q.or(orCols.join(','));
          if (data && data.length > 0) addResults('clusters', data);
        }
      })());
    }

    // Admins
    userQueries.push((async () => {
      let q = supabase.from('admins').select('*');
      const orCols: string[] = [];
      if (isUUID) orCols.push(`"id".eq."${cleanTerm}"`);
      if (isNumeric) {
        orCols.push(`"mobile_number".eq."${cleanTerm}"`);
      } else {
        orCols.push(`"admin_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"email_address".ilike."%${cleanTerm}%"`);
      }
      if (orCols.length > 0) {
        const { data } = await q.or(orCols.join(','));
        if (data && data.length > 0) addResults('admins', data);
      }
    })());

    // Profiles
    userQueries.push((async () => {
      let q = supabase.from('profiles').select('*');
      const orCols: string[] = [];
      if (isUUID) orCols.push(`"id".eq."${cleanTerm}"`);
      if (isNumeric) {
        orCols.push(`"phone".eq."${cleanTerm}"`);
      } else {
        orCols.push(`"full_name".ilike."%${cleanTerm}%"`);
        orCols.push(`"email".ilike."%${cleanTerm}%"`);
      }
      if (orCols.length > 0) {
        const { data } = await q.or(orCols.join(','));
        if (data && data.length > 0) addResults('profiles', data);
      }
    })());

    await Promise.allSettled(userQueries);
    return allResults;
  }

  if (category === 'Other') {
    const otherTables = [
      'carts', 'cash_with_admin', 
      ...(isAdmin ? [
        'cash_with_clusters', 
        'finished_clusters_payable_amount', 
        'clusters_penalty', 
        'clusters_estimate', 
        'rider_rate_setting_with_cluster'
      ] : []), 
      'cash_with_hub_managers', 'cash_with_riders',
      'contact_link', 'customer_address', 'finished_customers_payable_amount',
      'finished_hub_managers_payable_amount', 'finished_riders_payable_amount', 'finished_sellers_payable_amount',
      'fixed_hub_manager_salary', 'gift_cash', 'hub_manager_salary', 'hub_managers_penalty', 'inactive_products',
      'rider_live_work_flow', 'rider_rate_setting', 'rider_service_rates',
      'rider_shipment_work_flow', 'riders_penalty', 'save_in_draft', 'sellers_for_approval', 'selller_income_estimate',
      'settled_hub_manager_salary', 'settled_rider_shipments', 'settled_selller_income_estimate', 'upload_products'
    ];

    const tasks = otherTables.map(table => async () => {
      try {
        const colsToCheck: string[] = [];
        if (isUUID) {
          colsToCheck.push('id', 'seller_id', 'rider_id', 'cluster_id', 'hub_manager_id');
        } else if (isNumeric) {
          colsToCheck.push('mobile number', 'mobile_number', 'pincode');
        } else {
          colsToCheck.push('product code', 'product_sku_code', 'product name');
        }

        for (const col of colsToCheck) {
          try {
            const { data } = await supabase.from(table).select('*').eq(col, cleanTerm);
            if (data && data.length > 0) {
              addResults(table, data);
            }
          } catch (e) {
            // column might not exist in this table, safely skip
          }
        }
      } catch (e) {
        // ignore
      }
    });

    for (let i = 0; i < tasks.length; i += 5) {
      await Promise.allSettled(tasks.slice(i, i + 5).map(fn => fn()));
    }

    return allResults;
  }

  return allResults;
};
