const fs = require('fs');
const file = 'src/components/portals/RiderTasksView.tsx';
let code = fs.readFileSync(file, 'utf8');

const newFunc = `  const generateAwbPdfDoc = () => {
    const width = 588;
    const height = 380;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [width, height]
    });
    
    // Main outer border
    doc.setLineWidth(1.5);
    doc.rect(15, 15, 558, 350);

    // Vertical center line in the top section
    doc.line(294, 15, 294, 305);

    // Horizontal line for the bottom policy section
    doc.line(15, 305, 573, 305);

    // Left Column horizontal split (Ship To vs Product Details)
    doc.line(15, 160, 294, 160);

    // Right Column horizontal split (Barcode vs Order Details)
    doc.line(294, 160, 573, 160);

    // Inner lines for Order Details Table (Right bottom section)
    let rowHeight = 145 / 3;
    doc.line(294, 160 + rowHeight, 573, 160 + rowHeight);
    doc.line(294, 160 + rowHeight*2, 573, 160 + rowHeight*2);
    // Vertical line in Order Details Table
    doc.line(294 + 100, 160, 294 + 100, 305);

    // Left Top: SHIP TO
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text("SHIP TO:", 25, 35);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(String(task['full name'] || 'Customer Name').substring(0, 40), 25, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const maskStr = (str) => {
      if (!str) return '';
      const s = String(str);
      if (s.length <= 4) return s;
      return 'X'.repeat(s.length - 4) + s.slice(-4);
    };
    
    const mobile = task['mobile number'] ? 'Mobile: ' + maskStr(task['mobile number']) : '';
    let addressStr = [task['full address'], task['landmark']].filter(Boolean).join(', ');
    if(task['address type']) {
       addressStr += \` (\${task['address type']})\`;
    }
    const addressLines = doc.splitTextToSize(addressStr, 250);
    doc.text(addressLines, 25, 75);
    let addrY = 75 + addressLines.length * 14;
    doc.text(\`PIN: \${task['pincode'] || ''}\`, 25, addrY);
    doc.text(mobile, 25, addrY + 14);

    // Left Bottom: PRODUCT DETAILS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text("PRODUCT DETAILS:", 25, 180);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(String(task['product name'] || 'Product Name').substring(0, 40), 25, 200);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let descStr = task['product description'] || 'No description available.';
    let descLines = doc.splitTextToSize(descStr, 250);
    if(descLines.length > 4) {
        descLines = descLines.slice(0, 4);
        descLines[3] += '...';
    }
    doc.text(descLines, 25, 218);
    let qtyY = 218 + descLines.length * 14;
    doc.setFont('helvetica', 'bold');
    doc.text(\`Qty: \${task['quantity'] || 1}\`, 25, qtyY + 5);

    // Right Top: Barcode
    const awbStr = String(task['awb number'] || 'AWB-UNKNOWN');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    let textWidth = doc.getTextWidth(\`AWB \${awbStr}\`);
    doc.text(\`AWB \${awbStr}\`, 294 + (279 - textWidth) / 2, 40);

    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, awbStr, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: 80,
        width: 3
      });
      const barcodeData = canvas.toDataURL('image/jpeg', 1.0);
      const bcWidth = 240;
      const bcHeight = 60;
      const bcX = 294 + (279 - bcWidth) / 2;
      doc.addImage(barcodeData, 'JPEG', bcX, 55, bcWidth, bcHeight);
    } catch(e) {
      console.error("Barcode gen error", e);
    }

    doc.setFontSize(16);
    textWidth = doc.getTextWidth(awbStr);
    doc.text(awbStr, 294 + (279 - textWidth) / 2, 140);

    // Right Bottom: Order Details Table
    const drawCell = (text, x, y, width, height, font, size) => {
        doc.setFont('helvetica', font);
        doc.setFontSize(size);
        let txt = String(text || '');
        let tw = doc.getTextWidth(txt);
        let ty = y + height / 2 + size * 0.35;
        doc.text(txt, x + 10, ty);
    };

    drawCell('Tracking ID', 294, 160, 100, rowHeight, 'bold', 12);
    drawCell(String(task['tracking id number'] || 'N/A'), 394, 160, 179, rowHeight, 'bold', 12);

    drawCell('Order ID', 294, 160 + rowHeight, 100, rowHeight, 'bold', 12);
    drawCell(maskStr(task['order ID'] || 'N/A'), 394, 160 + rowHeight, 179, rowHeight, 'bold', 12);

    drawCell('Payment Mode', 294, 160 + rowHeight*2, 100, rowHeight, 'bold', 12);
    drawCell(String(task['payment method'] || 'N/A'), 394, 160 + rowHeight*2, 179, rowHeight, 'bold', 12);

    // Bottom Box: Open Box Delivery Policy
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("OPEN BOX DELIVERY POLICY :-", 25, 325);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const policyText = "This product is under Open Box Delivery policy. Please open and check the product in front of the delivery agent. If the product is damaged or incorrect, please refuse to accept and initiate return. No return or replacement will be accepted once signed.";
    const policyLines = doc.splitTextToSize(policyText, 538);
    doc.text(policyLines, 25, 342);

    return doc;
  };`;

const regex = /  const generateAwbPdfDoc = \(\) => \{[\s\S]*?return doc;\n  \};/;
if (regex.test(code)) {
    code = code.replace(regex, newFunc);
    fs.writeFileSync(file, code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find the function to replace.");
}
