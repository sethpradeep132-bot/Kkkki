import sys

with open('src/components/portals/ClusterPortal.tsx', 'r') as f:
    lines = f.readlines()

insert_code = """
  const handleDownloadEarningPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Cluster Earning Shipments', 14, 20);
    doc.setFontSize(10);
    doc.text(`Total Count: ${clusterEarningShipments.length}`, 14, 30);
    
    const tableData = clusterEarningShipments.map(s => [
      s['awb number'] || s['AWB Number'] || s['awb_number'] || 'N/A',
      s['order id'] || s['Order ID'] || s['order_id'] || 'N/A',
      s['status'] || s['shipment type'] || 'N/A'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['AWB Number', 'Order ID', 'Status']],
      body: tableData,
    });

    doc.save('Cluster_Earning_Shipments.pdf');
  };
"""

for i, line in enumerate(lines):
    if "const fetchClusterEarningAndPenalty =" in line:
        lines.insert(i, insert_code)
        break

with open('src/components/portals/ClusterPortal.tsx', 'w') as f:
    f.writelines(lines)
