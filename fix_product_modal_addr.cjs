const fs = require('fs');

let pmCode = fs.readFileSync('src/components/portals/ProductDetailModal.tsx', 'utf8');

const regex = /const fetchAddresses = async \(\) => \{[\s\S]*?if \(checkoutStep === 'address_selection'\)/;

const newContent = `const fetchAddresses = async () => {
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
          .limit(2);
          
        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            fullName: d['full name'],
            mobileNumber: d['mobile number'],
            fullAddress: d['full address'],
            pincode: d.pincode,
            landmark: d.landmark,
            addressType: d['address type']
          }));
          setSavedAddresses(mapped);
          // Auto-select first address if none selected
          if (!selectedAddressId && mapped.length > 0) {
             setSelectedAddressId(mapped[0].id);
          }
        } else {
          setSavedAddresses([]);
        }
      } catch (err) {
        console.error("Failed to fetch customer addresses", err);
      }
    };
    if (checkoutStep === 'address_selection')`;

if (regex.test(pmCode)) {
  pmCode = pmCode.replace(regex, newContent);
  fs.writeFileSync('src/components/portals/ProductDetailModal.tsx', pmCode);
  console.log('ProductDetailModal.tsx updated.');
} else {
  console.log('ProductDetailModal.tsx pattern not found.');
}
