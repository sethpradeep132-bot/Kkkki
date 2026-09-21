import re

with open('src/components/portals/CustomerPortal.tsx', 'r') as f:
    content = f.read()

target = """                                    const now = new Date();
                                    const yy = String(now.getFullYear()).slice(-2);
                                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                                    const dd = String(now.getDate()).padStart(2, '0');
                                    const invDateString = `${yy}${mm}${dd}`;
                                    const invoiceNo = `INV-${invDateString}`;"""

new_code = """                                    const now = new Date();
                                    const yy = String(now.getFullYear()).slice(-2);
                                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                                    const dd = String(now.getDate()).padStart(2, '0');
                                    const invDateString = `${yy}${mm}${dd}`;
                                    
                                    // Generate Sequence based on order's chronological position in its year
                                    let seqCount = 1;
                                    if (invoiceShipmentData['created_at']) {
                                      const orderDate = new Date(invoiceShipmentData['created_at']);
                                      const startOfYear = new Date(orderDate.getFullYear(), 0, 1).toISOString();
                                      const { count } = await supabase
                                        .from('customer_orders')
                                        .select('*', { count: 'exact', head: true })
                                        .gte('created_at', startOfYear)
                                        .lte('created_at', invoiceShipmentData['created_at']);
                                      if (count) seqCount = count;
                                    }
                                    const paddedSeq = String(seqCount).padStart(4, '0');
                                    const invoiceNo = `INV-SS-${invDateString}-${paddedSeq}`;"""

new_content = content.replace(target, new_code)

if new_content != content:
    with open('src/components/portals/CustomerPortal.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced successfully.")
else:
    print("Target not found.")

