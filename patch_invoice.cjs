const fs = require('fs');
const content = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf-8');

const targetStr = `                                  try {
                                    const jsPDFModule = await import('jspdf'); const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
                                    // require('jspdf-autotable'); // If using autotable, though maybe we just use basic text to be safe
                                    const doc = new jsPDF();
                                    doc.setFontSize(20);
                                    doc.text('Invoice', 14, 22);
                                    doc.setFontSize(12);
                                    doc.text(\`Order ID: \${invoiceShipmentData['order ID']}\`, 14, 32);
                                    doc.text(\`Tracking ID: \${invoiceShipmentData['tracking id number'] || 'N/A'}\`, 14, 40);
                                    doc.text(\`Date: \${new Date().toLocaleString()}\`, 14, 48);
                                    
                                    doc.text('Customer Details:', 14, 60);
                                    doc.text(\`Name: \${invoiceShipmentData['full name']}\`, 14, 68);
                                    doc.text(\`Phone: \${invoiceShipmentData['mobile number']}\`, 14, 76);
                                    doc.text(\`Address: \${invoiceShipmentData['full address']}\`, 14, 84);
                                    
                                    doc.text('Product Details:', 14, 96);
                                    doc.text(\`Product: \${invoiceShipmentData['product name']}\`, 14, 104);
                                    doc.text(\`Quantity: \${invoiceShipmentData['total quantity']}\`, 14, 112);
                                    doc.text(\`Payment Method: \${invoiceShipmentData['payment method']}\`, 14, 120);
                                    doc.text(\`Amount: ₹\${invoiceShipmentData['total amount']}\`, 14, 128);
                                    
                                    doc.save(\`Invoice_\${invoiceShipmentData['order ID']}.pdf\`);
                                  } catch (err) {`;

const newStr = `                                  try {
                                    const jsPDFModule = await import('jspdf'); 
                                    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
                                    const autoTableModule = await import('jspdf-autotable');
                                    const autoTable = autoTableModule.default;
                                    const { supabase } = await import('../../lib/supabase');
                                    
                                    // Fetch Seller and Hub details
                                    let seller = null;
                                    let hub = null;
                                    if (invoiceShipmentData['selller id'] || invoiceShipmentData['seller id']) {
                                      const { data: s } = await supabase.from('sellers').select('*').eq('id', invoiceShipmentData['selller id'] || invoiceShipmentData['seller id']).single();
                                      seller = s;
                                    }
                                    if (invoiceShipmentData['hub manager id']) {
                                      const { data: h } = await supabase.from('hub_managers').select('*').eq('id', invoiceShipmentData['hub manager id']).single();
                                      hub = h;
                                    }

                                    const doc = new jsPDF('p', 'pt', 'a4');
                                    const pageWidth = doc.internal.pageSize.getWidth();
                                    
                                    // Header
                                    doc.setFont('helvetica', 'bold');
                                    doc.setFontSize(22);
                                    doc.text('SURIYAWAN SHOPPING', 40, 60);
                                    
                                    doc.setFontSize(9);
                                    doc.setFont('helvetica', 'normal');
                                    doc.text('Mahuari Bazaar, P.O. Suriyawan, Bhadohi', 40, 78);
                                    doc.text('Uttar Pradesh - 221304, India', 40, 90);
                                    
                                    doc.setFont('helvetica', 'bold');
                                    doc.setFontSize(18);
                                    doc.text('TAX INVOICE', pageWidth - 40, 60, { align: 'right' });
                                    
                                    doc.setFontSize(9);
                                    doc.setFont('helvetica', 'normal');
                                    
                                    const now = new Date();
                                    const yy = String(now.getFullYear()).slice(-2);
                                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                                    const dd = String(now.getDate()).padStart(2, '0');
                                    const invDateString = \`\${yy}\${mm}\${dd}\`;
                                    const invoiceNo = \`INV-\${invDateString}\`;
                                    
                                    doc.text(\`Invoice No:  \${invoiceNo}\`, pageWidth - 40, 78, { align: 'right' });
                                    doc.text(\`Invoice Date:  \${dd}/\${mm}/20\${yy}\`, pageWidth - 40, 90, { align: 'right' });
                                    doc.text(\`Order ID:  \${invoiceShipmentData['order ID']}\`, pageWidth - 40, 102, { align: 'right' });
                                    
                                    doc.setLineWidth(0.5);
                                    doc.setDrawColor(0, 0, 0);
                                    doc.line(40, 120, pageWidth - 40, 120);
                                    
                                    // Addresses Section
                                    doc.setFont('helvetica', 'bold');
                                    doc.setFontSize(8);
                                    doc.setTextColor(100, 100, 100);
                                    doc.text('SOLD BY', 40, 140);
                                    doc.text('DISPATCH FROM', 180, 140);
                                    doc.text('BILLED & SHIPPED TO', pageWidth / 2 + 20, 140);
                                    
                                    doc.setTextColor(0, 0, 0);
                                    doc.setFontSize(9);
                                    
                                    // Seller
                                    doc.text(seller?.shop_name || 'Seller Store', 40, 155);
                                    doc.setFont('helvetica', 'normal');
                                    doc.text(seller?.seller_name || 'Seller Name', 40, 170);
                                    const sAddr = doc.splitTextToSize(seller?.registered_full_address || 'N/A', 130);
                                    doc.text(sAddr, 40, 185);
                                    const sAddrH = sAddr.length * 12;
                                    doc.text(\`PIN: \${seller?.registered_pincode || 'N/A'}\`, 40, 185 + sAddrH);
                                    if (seller?.gstin) doc.text(\`GSTIN: \${seller?.gstin}\`, 40, 185 + sAddrH + 15);
                                    
                                    // Hub
                                    doc.setFont('helvetica', 'bold');
                                    doc.text(hub?.store_name || 'Hub Store', 180, 155);
                                    doc.setFont('helvetica', 'normal');
                                    doc.text(hub?.hub_manager_name || 'Hub Manager', 180, 170);
                                    const hAddr = doc.splitTextToSize(hub?.registered_full_address || 'N/A', 110);
                                    doc.text(hAddr, 180, 185);
                                    const hAddrH = hAddr.length * 12;
                                    doc.text(\`PIN: \${hub?.registered_pincode || 'N/A'}\`, 180, 185 + hAddrH);
                                    
                                    // Customer
                                    doc.setFont('helvetica', 'bold');
                                    doc.text(invoiceShipmentData['full name'] || 'Customer', pageWidth / 2 + 20, 155);
                                    doc.setFont('helvetica', 'normal');
                                    const cAddr = doc.splitTextToSize(invoiceShipmentData['full address'] || 'N/A', pageWidth / 2 - 60);
                                    doc.text(cAddr, pageWidth / 2 + 20, 170);
                                    const cAddrH = cAddr.length * 12;
                                    doc.text(\`PIN: \${invoiceShipmentData['pincode'] || 'N/A'}\`, pageWidth / 2 + 20, 170 + cAddrH);
                                    doc.text(\`Ph: +91 \${invoiceShipmentData['mobile number'] || 'N/A'}\`, pageWidth / 2 + 20, 170 + cAddrH + 15);
                                    
                                    // Vertical separator
                                    doc.line(pageWidth / 2, 120, pageWidth / 2, 260);
                                    // Horizontal separator
                                    doc.line(40, 260, pageWidth - 40, 260);
                                    
                                    // Table
                                    const prodTitle = invoiceShipmentData['product name'] || '';
                                    const prodSub = invoiceShipmentData['product tittle name'] || '';
                                    const sku = invoiceShipmentData['product id'] || '';
                                    const desc = invoiceShipmentData['product discription'] || '';
                                    const colSize = \`Color: \${invoiceShipmentData['colour'] || 'N/A'} | Size: \${invoiceShipmentData['size'] || 'N/A'}\`;
                                    const tableDesc = \`\${prodTitle}\\n\${prodSub}\\nSKU: \${sku}\\n\${desc}\\n\\n\${colSize}\`;
                                    
                                    autoTable(doc, {
                                      startY: 260,
                                      head: [['Product Description', 'HSN', 'Qty', 'Gross Rate', 'CGST / SGST', 'Total Info']],
                                      body: [
                                        [
                                          tableDesc,
                                          '5407', // Generic HSN
                                          invoiceShipmentData['total quantity'] || '1',
                                          \`₹\${invoiceShipmentData['total selling price'] || '0.00'}\`,
                                          'CGST (0%): ₹0.00\\nSGST (0%): ₹0.00',
                                          \`₹\${invoiceShipmentData['total selling price'] || '0.00'}\`
                                        ]
                                      ],
                                      theme: 'plain',
                                      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0], fillColor: [250, 250, 250], lineWidth: 0.1, lineColor: [0, 0, 0] },
                                      bodyStyles: { textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
                                      styles: { fontSize: 8, cellPadding: 8, overflow: 'linebreak' },
                                      columnStyles: {
                                        0: { cellWidth: 200 },
                                        1: { cellWidth: 40, halign: 'center' },
                                        2: { cellWidth: 30, halign: 'center' },
                                        3: { cellWidth: 60, halign: 'right' },
                                        4: { cellWidth: 80, halign: 'right' },
                                        5: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
                                      },
                                      margin: { left: 40, right: 40 }
                                    });
                                    
                                    let finalY = doc.lastAutoTable.finalY || 350;
                                    
                                    // Bottom section
                                    doc.setFont('helvetica', 'bold');
                                    doc.setFontSize(9);
                                    doc.text('LOGISTICS DETAILS', 40, finalY + 25);
                                    
                                    doc.setFont('helvetica', 'normal');
                                    doc.setFontSize(9);
                                    doc.setTextColor(100, 100, 100);
                                    doc.text('Order Date:', 40, finalY + 45);
                                    doc.text('Payment Mode:', 40, finalY + 60);
                                    doc.text('Courier AWB:', 40, finalY + 75);
                                    doc.text('Tracking ID:', 40, finalY + 90);
                                    
                                    doc.setTextColor(0, 0, 0);
                                    doc.setFont('helvetica', 'bold');
                                    const oDate = invoiceShipmentData['created_at'] ? new Date(invoiceShipmentData['created_at']).toLocaleDateString('en-GB') : \`\${dd}/\${mm}/20\${yy}\`;
                                    doc.text(oDate, 120, finalY + 45);
                                    doc.text(\`\${invoiceShipmentData['payment method'] || 'Prepaid'}\`, 120, finalY + 60);
                                    doc.text(\`\${invoiceShipmentData['awb number'] || 'N/A'}\`, 120, finalY + 75);
                                    doc.text(\`\${invoiceShipmentData['tracking id number'] || 'N/A'}\`, 120, finalY + 90);
                                    
                                    doc.setFontSize(11);
                                    doc.text('THANK YOU FOR VISITING', 40, finalY + 125);
                                    doc.text('SURIYAWAN SHOPPING!', 40, finalY + 140);
                                    doc.setFont('helvetica', 'normal');
                                    doc.setFontSize(8);
                                    doc.setTextColor(100, 100, 100);
                                    doc.text('We hope you had a wonderful shopping experience.', 40, finalY + 155);
                                    
                                    // Right Bottom section (Maths)
                                    doc.line(pageWidth / 2 + 40, finalY, pageWidth / 2 + 40, finalY + 175); // Vertical split
                                    
                                    const rx = pageWidth / 2 + 60;
                                    doc.setTextColor(0, 0, 0);
                                    doc.setFontSize(9);
                                    doc.text('Total Taxable Value', rx, finalY + 25);
                                    doc.setFont('helvetica', 'bold');
                                    doc.text(\`₹\${invoiceShipmentData['total selling price'] || '0.00'}\`, pageWidth - 40, finalY + 25, { align: 'right' });
                                    
                                    doc.setFont('helvetica', 'normal');
                                    doc.text('CGST (0%)', rx, finalY + 50);
                                    doc.setFont('helvetica', 'bold');
                                    doc.text('₹0.00', pageWidth - 40, finalY + 50, { align: 'right' });
                                    
                                    doc.setFont('helvetica', 'normal');
                                    doc.text('SGST (0%)', rx, finalY + 75);
                                    doc.setFont('helvetica', 'bold');
                                    doc.text('₹0.00', pageWidth - 40, finalY + 75, { align: 'right' });
                                    
                                    doc.setFont('helvetica', 'normal');
                                    doc.text('Delivery Charge', rx, finalY + 100);
                                    doc.setFont('helvetica', 'bold');
                                    doc.text(\`₹\${invoiceShipmentData['total delevery charge'] || '0.00'}\`, pageWidth - 40, finalY + 100, { align: 'right' });
                                    
                                    doc.line(rx, finalY + 115, pageWidth - 40, finalY + 115);
                                    
                                    doc.setFontSize(11);
                                    doc.text('Grand Total', rx, finalY + 140);
                                    doc.text(\`₹\${invoiceShipmentData['total amount'] || '0.00'}\`, pageWidth - 40, finalY + 140, { align: 'right' });
                                    
                                    // Borders
                                    doc.line(40, finalY + 175, pageWidth - 40, finalY + 175); // bottom border
                                    // We can just draw the outer rect now
                                    doc.setLineWidth(0.5);
                                    doc.rect(40, 40, pageWidth - 80, finalY + 135); 
                                    
                                    doc.save(\`Invoice_\${invoiceNo}.pdf\`);
                                  } catch (err) {`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/components/portals/CustomerPortal.tsx', content.replace(targetStr, newStr));
  console.log('Patched successfully');
} else {
  console.log('Target string not found');
}
