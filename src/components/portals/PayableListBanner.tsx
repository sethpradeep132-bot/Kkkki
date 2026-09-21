import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, ChevronDown, FileSpreadsheet, FileText, Printer, FileCode2, X, CheckCheck } from 'lucide-react';

export interface PayableExportItem {
  id?: string;
  order_id?: string;
  customer_id?: string;
  short_id?: string;
  name?: string;
  customer_name?: string;
  shop_name?: string;
  seller_name?: string;
  rider_name?: string;
  hub_manager_name?: string;
  cluster_name?: string;
  full_name?: string;
  mobile?: string;
  phone?: string;
  pincode?: string;
  bank_name?: string;
  account_no?: string;
  ifsc_code?: string;
  upi_id?: string;
  amount?: number;
  sum?: number;
  balance?: number;
  status?: string;
  purpose?: string;
  clusterId?: string;
  [key: string]: any;
}

interface PayableListBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  count: number;
  userType: 'Customer' | 'Seller' | 'Rider' | 'Hub Manager' | 'Cluster';
  items: PayableExportItem[];
  defaultPurpose?: string;
  placeholder?: string;
  customFilenamePrefix?: string;
  onMarkAllSettled?: () => void;
  isSettlingAll?: boolean;
  settlingProgress?: { current: number; total: number } | null;
}

export const PayableListBanner: React.FC<PayableListBannerProps> = ({
  searchQuery,
  onSearchChange,
  count,
  userType,
  items,
  defaultPurpose,
  placeholder = "Search name, ID, pincode, mobile...",
  customFilenamePrefix,
  onMarkAllSettled,
  isSettlingAll = false,
  settlingProgress = null
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPurpose = () => {
    if (defaultPurpose) return defaultPurpose;
    switch (userType) {
      case 'Seller': return 'Seller Settlement';
      case 'Customer': return 'Customer Refund / Order Settlement';
      case 'Rider': return 'Rider Delivery Settlement';
      case 'Hub Manager': return 'Hub Manager Salary';
      case 'Cluster': return 'Cluster Commission / Settlement';
      default: return 'Payout Settlement';
    }
  };

  const normalizeItem = (item: PayableExportItem, index: number) => {
    const payId = `PAY-${String(index + 1).padStart(6, '0')}`;
    const rawId = item.short_id || (item.id ? String(item.id).substring(0, 8) : `ID-${index + 1}`);

    let displayName = '';
    if (userType === 'Seller') {
      const shop = item.shop_name || '';
      const sName = item.seller_name || item.name || '';
      displayName = shop && sName && shop !== sName ? `${shop} (${sName})` : (shop || sName || 'Seller');
    } else if (userType === 'Customer') {
      displayName = item.name || item.customer_name || item.full_name || 'Customer';
    } else if (userType === 'Rider') {
      displayName = item.rider_name || item.name || item.full_name || 'Rider';
    } else if (userType === 'Hub Manager') {
      displayName = item.hub_manager_name || item.name || item.full_name || 'Hub Manager';
    } else if (userType === 'Cluster') {
      displayName = item.name || item.cluster_name || item.full_name || 'Cluster';
    } else {
      displayName = item.name || item.full_name || 'Payee';
    }

    const mobile = item.mobile || item.phone || item.registered_mobile_number || 'N/A';
    const bankName = item.bank_name || 'N/A';
    const accountNo = item.account_no || 'N/A';
    const ifsc = item.ifsc_code || 'N/A';
    const upiId = item.upi_id || 'N/A';
    const amt = Number(item.amount ?? item.sum ?? item.balance ?? 0);
    const orderRef = item.order_id || item.ref_id || (item.id ? String(item.id).substring(0, 10) : `ORD-${index + 10001}`);
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const paymentDate = `${day}-${month}-${year}`;
    const paymentStatus = item.status || 'Pending';

    return {
      paymentId: payId,
      userType,
      userId: rawId,
      name: displayName,
      mobile,
      bankName,
      accountNo,
      ifsc,
      upiId,
      amount: amt,
      purpose: getPurpose(),
      orderRef,
      paymentDate,
      paymentStatus
    };
  };

  const getFilenameBase = () => {
    const today = new Date();
    const dStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const prefix = customFilenamePrefix || `${userType.replace(/\s+/g, '_')}_Payment_List`;
    return `${prefix}_${dStr}`;
  };

  // 1. Download CSV
  const handleDownloadCSV = () => {
    setShowDropdown(false);
    const normalized = items.map((it, idx) => normalizeItem(it, idx));
    const headers = [
      "Payment ID",
      "User Type",
      "User ID",
      "Name",
      "Mobile",
      "Bank Name",
      "Account Number",
      "IFSC",
      "UPI ID",
      "Amount",
      "Payment Purpose",
      "Order/Reference ID",
      "Payment Date",
      "Payment Status"
    ];

    const escapeCSV = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = normalized.map(item => [
      item.paymentId,
      item.userType,
      item.userId,
      item.name,
      item.mobile,
      item.bankName,
      item.accountNo,
      item.ifsc,
      item.upiId,
      item.amount,
      item.purpose,
      item.orderRef,
      item.paymentDate,
      item.paymentStatus
    ].map(escapeCSV).join(','));

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${getFilenameBase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download Excel (.xlsx format via SpreadsheetML XML compatible with all Excel versions)
  const handleDownloadExcel = () => {
    setShowDropdown(false);
    const normalized = items.map((it, idx) => normalizeItem(it, idx));
    const headers = [
      "Payment ID",
      "User Type",
      "User ID",
      "Name",
      "Mobile",
      "Bank Name",
      "Account Number",
      "IFSC",
      "UPI ID",
      "Amount",
      "Payment Purpose",
      "Order/Reference ID",
      "Payment Date",
      "Payment Status"
    ];

    const escapeXml = (str: any) => {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#15803D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="AmountCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Payment List">
  <Table>
   <Row ss:Height="24">
`;

    headers.forEach(h => {
      xml += `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;

    normalized.forEach(item => {
      xml += `   <Row ss:Height="20">\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.paymentId)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.userType)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.userId)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.name)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.mobile)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.bankName)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.accountNo)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.ifsc)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.upiId)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="AmountCell"><Data ss:Type="Number">${item.amount}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.purpose)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.orderRef)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.paymentDate)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.paymentStatus)}</Data></Cell>\n`;
      xml += `   </Row>\n`;
    });

    xml += `  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${getFilenameBase()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Print / PDF Report
  const handleDownloadPDF = () => {
    setShowDropdown(false);
    const normalized = items.map((it, idx) => normalizeItem(it, idx));
    const totalSum = normalized.reduce((acc, curr) => acc + curr.amount, 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the PDF report.');
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${userType} Payout Report - ${getFilenameBase()}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 20px; color: #1e293b; font-size: 11px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { margin: 0; font-size: 18px; color: #0f172a; }
    .meta { color: #64748b; font-size: 11px; margin-top: 4px; }
    .summary-box { display: flex; gap: 24px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 16px; margin-bottom: 16px; border-radius: 4px; }
    .summary-item { font-size: 12px; }
    .summary-item span { font-weight: bold; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #0f172a; color: #ffffff; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #0f172a; }
    td { padding: 5px 8px; border: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .amount { text-align: right; font-weight: bold; color: #047857; }
    .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print {
      body { margin: 10mm; }
      th { background-color: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${userType} Bulk Payment & Settlement Report</h1>
      <div class="meta">Export Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | Time: ${new Date().toLocaleTimeString('en-IN')}</div>
    </div>
  </div>

  <div class="summary-box">
    <div class="summary-item">Total Payees: <span>${normalized.length}</span></div>
    <div class="summary-item">Total Amount: <span>₹ ${totalSum.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
    <div class="summary-item">Payment Purpose: <span>${getPurpose()}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Pay ID</th>
        <th>User ID</th>
        <th>Name</th>
        <th>Mobile</th>
        <th>Bank Name</th>
        <th>Account No.</th>
        <th>IFSC</th>
        <th>UPI ID</th>
        <th style="text-align: right;">Amount (₹)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${normalized.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><b>${item.paymentId}</b></td>
          <td>${item.userId}</td>
          <td><b>${item.name}</b></td>
          <td>${item.mobile}</td>
          <td>${item.bankName}</td>
          <td>${item.accountNo}</td>
          <td>${item.ifsc}</td>
          <td>${item.upiId}</td>
          <td class="amount">₹ ${item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
          <td>${item.paymentStatus}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    Generated from Portal • Bank Bulk Payment Ready Report
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // 4. Download Tally Export (XML)
  const handleDownloadTally = () => {
    setShowDropdown(false);
    const normalized = items.map((it, idx) => normalizeItem(it, idx));
    const escapeXml = (str: any) => {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    let xml = `<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Vouchers</REPORTNAME>
   </REQUESTDESC>
   <REQUESTDATA>
`;

    normalized.forEach(item => {
      xml += `    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <VOUCHER VCHTYPE="Payment" ACTION="Create">
      <DATE>${item.paymentDate.replace(/-/g, '')}</DATE>
      <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
      <VOUCHERNUMBER>${escapeXml(item.paymentId)}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${escapeXml(item.name)}</PARTYLEDGERNAME>
      <NARRATION>${escapeXml(item.purpose)} - Ref: ${escapeXml(item.orderRef)} - A/C: ${escapeXml(item.accountNo)} - IFSC: ${escapeXml(item.ifsc)}</NARRATION>
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>${escapeXml(item.name)}</LEDGERNAME>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <AMOUNT>-${item.amount.toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>Bank Account</LEDGERNAME>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <AMOUNT>${item.amount.toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
     </VOUCHER>
    </TALLYMESSAGE>
`;
    });

    xml += `   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;

    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${getFilenameBase()}_Tally.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-slate-50 border-b border-black/15 px-3 py-2.5 shrink-0">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full">
        {/* Box 1: Search Box (Thin Black Border, Crisp Corners) */}
        <div className="flex-1 min-w-[160px] flex items-center border border-black bg-white rounded-none px-2.5 py-1.5 shadow-2xs">
          <Search size={14} className="text-black shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs text-black font-medium focus:outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-0.5 text-slate-400 hover:text-black shrink-0"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Box 2: Count Box (Thin Black Border, Crisp Corners, handles large counts cleanly) */}
        <div className="shrink-0 flex items-center justify-center border border-black bg-white rounded-none px-3 py-1.5 shadow-2xs min-w-[90px] sm:min-w-[110px]">
          <span className="text-[11px] sm:text-xs font-bold text-black whitespace-nowrap tracking-tight">
            Count: <span className="font-mono font-extrabold text-xs sm:text-sm text-emerald-800 ml-1">{count.toLocaleString('en-IN')}</span>
          </span>
        </div>

        {/* Box 3: Mark as Settled Header Action (Safe Batch Settlement) */}
        {onMarkAllSettled && (
          <button
            type="button"
            onClick={onMarkAllSettled}
            disabled={isSettlingAll || count === 0}
            className={`shrink-0 flex items-center gap-1.5 border border-black px-3 py-1.5 text-[11px] sm:text-xs font-bold shadow-2xs transition-all cursor-pointer rounded-none whitespace-nowrap ${
              isSettlingAll
                ? 'bg-emerald-100 text-emerald-800 border-emerald-600 animate-pulse'
                : count === 0
                ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 active:scale-[0.98]'
            }`}
            title="Mark all users in this list as settled securely"
          >
            <CheckCheck size={14} className={isSettlingAll ? 'animate-spin' : 'shrink-0'} />
            <span>
              {isSettlingAll
                ? settlingProgress
                  ? `Settling ${settlingProgress.current}/${settlingProgress.total}...`
                  : 'Settling...'
                : `Mark as Settled`}
            </span>
          </button>
        )}

        {/* Box 4: Download Box (Thin Black Border, Crisp Corners with Selection Menu) */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 border border-black bg-white hover:bg-slate-100 text-black rounded-none px-3 py-1.5 text-[11px] sm:text-xs font-bold shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
          >
            <Download size={14} className="text-black shrink-0" />
            <span>Download Payment File</span>
            <ChevronDown size={14} className={`text-black shrink-0 transition-transform duration-150 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-black shadow-lg z-50 rounded-none py-1">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                Choose Format
              </div>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors"
              >
                <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="block font-bold">Excel (.xlsx)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Spreadsheet for banking / accounting</span>
                </div>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors"
              >
                <FileText size={15} className="text-blue-600 shrink-0" />
                <div>
                  <span className="block font-bold">CSV (.csv)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Bank bulk payment upload file</span>
                </div>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-rose-50 hover:text-rose-900 flex items-center gap-2.5 transition-colors"
              >
                <Printer size={15} className="text-rose-600 shrink-0" />
                <div>
                  <span className="block font-bold">PDF Report (.pdf)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Printable summary &amp; record report</span>
                </div>
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                type="button"
                onClick={handleDownloadTally}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 transition-colors"
              >
                <FileCode2 size={15} className="text-purple-600 shrink-0" />
                <div>
                  <span className="block font-bold">Tally Export</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optional Tally XML payment vouchers</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
