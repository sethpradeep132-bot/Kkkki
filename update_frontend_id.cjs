const fs = require('fs');

// 1. CustomerPortal.tsx
let cpCode = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');

const oldCpFetch = `  useEffect(() => {
    const fetchAddresses = async () => {
      if (!customerData?.mobile_number) return;
      try {
        const { supabase } = await import('../../lib/supabase');
        
        const { data } = await supabase.from('customer_address')
          .select('*')
          .eq('mobile number', customerData.mobile_number)
          .order('created_at', { ascending: false })
          .limit(2);
          
        if (data) {
          setCustomerAddresses(data);
        } else {
          setCustomerAddresses([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (activePage === 'addresses' || activePage === 'main') {
      fetchAddresses();
    }
  }, [customerData?.mobile_number, activePage]);`;

const newCpFetch = `  useEffect(() => {
    const fetchAddresses = async () => {
      if (!customerData?.id) return;
      try {
        const { supabase } = await import('../../lib/supabase');
        
        const { data } = await supabase.from('customer_address')
          .select('*')
          .eq('customer id', customerData.id)
          .order('created_at', { ascending: false })
          .limit(2);
          
        if (data) {
          setCustomerAddresses(data);
        } else {
          setCustomerAddresses([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (activePage === 'addresses' || activePage === 'main') {
      fetchAddresses();
    }
  }, [customerData?.id, activePage]);`;

if (cpCode.includes(oldCpFetch)) {
  cpCode = cpCode.replace(oldCpFetch, newCpFetch);
  fs.writeFileSync('src/components/portals/CustomerPortal.tsx', cpCode);
  console.log('CustomerPortal fetch updated');
} else {
  console.log('CustomerPortal fetch not found');
}

// 2. ProductDetailModal.tsx
let pmCode = fs.readFileSync('src/components/portals/ProductDetailModal.tsx', 'utf8');

const oldPmFetch = `    const fetchAddresses = async () => {
      // Ensure we only fetch for the specific logged-in customer
      if (!customerData?.mobile_number) {
        setSavedAddresses([]);
        return;
      }
      try {
        const { data } = await supabase.from('customer_address')
          .select('*')
          .eq('mobile number', customerData.mobile_number)
          .order('created_at', { ascending: false })
          .limit(2);`;

const newPmFetch = `    const fetchAddresses = async () => {
      // Ensure we only fetch for the specific logged-in customer
      if (!customerData?.id) {
        setSavedAddresses([]);
        return;
      }
      try {
        const { data } = await supabase.from('customer_address')
          .select('*')
          .eq('customer id', customerData.id)
          .order('created_at', { ascending: false })
          .limit(2);`;

if (pmCode.includes(oldPmFetch)) {
  pmCode = pmCode.replace(oldPmFetch, newPmFetch);
} else {
  console.log('ProductDetailModal fetch not found');
}

// Update the dependency array in ProductDetailModal
pmCode = pmCode.replace(/}, \[customerData\?.mobile_number, checkoutStep\]\);/g, `}, [customerData?.id, checkoutStep]);`);
pmCode = pmCode.replace(/}, \[customerData, checkoutStep\]\);/g, `}, [customerData, checkoutStep]);`);

// Now the payload part in ProductDetailModal
const oldPayload = `                        const payload = {
                          "full name": newAddress.fullName,
                          "mobile number": newAddress.mobileNumber,
                          "full address": newAddress.fullAddress,
                          "pincode": newAddress.pincode,
                          "landmark": newAddress.landmark || '',
                          "address type": newAddress.addressType
                        };`;

const newPayload = `                        const payload = {
                          "customer id": customerData?.id,
                          "full name": newAddress.fullName,
                          "mobile number": newAddress.mobileNumber,
                          "full address": newAddress.fullAddress,
                          "pincode": newAddress.pincode,
                          "landmark": newAddress.landmark || '',
                          "address type": newAddress.addressType
                        };`;

if (pmCode.includes(oldPayload)) {
  pmCode = pmCode.replace(oldPayload, newPayload);
  console.log('ProductDetailModal payload updated');
} else {
  console.log('ProductDetailModal payload not found');
}

fs.writeFileSync('src/components/portals/ProductDetailModal.tsx', pmCode);
console.log('Done');
