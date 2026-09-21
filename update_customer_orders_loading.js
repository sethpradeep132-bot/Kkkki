const fs = require('fs');
let code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');

code = code.replace(
  "const [customerOrders, setCustomerOrders] = useState<any[]>([]);",
  "const [customerOrders, setCustomerOrders] = useState<any[]>([]);\n  const [isOrdersLoading, setIsOrdersLoading] = useState(true);"
);

code = code.replace(
  "const fetchOrders = async () => {\n if (customerData?.id && customerData.id !== 'No Data Found') {\n const { supabase } = await import('../../lib/supabase');",
  "const fetchOrders = async () => {\n setIsOrdersLoading(true);\n if (customerData?.id && customerData.id !== 'No Data Found') {\n const { supabase } = await import('../../lib/supabase');"
);

code = code.replace(
  "if (data) {\n setCustomerOrders(data);\n }\n }\n };",
  "if (data) {\n setCustomerOrders(data);\n }\n }\n setIsOrdersLoading(false);\n };"
);

code = code.replace(
  "{customerOrders.length > 0 ? (",
  "{isOrdersLoading ? (\n  <div className=\"flex flex-col items-center justify-center py-20\">\n    <div className=\"text-gray-500 font-medium flex items-center gap-1 text-sm\">Loading<span className=\"animate-pulse\">.</span><span className=\"animate-pulse delay-100\">.</span><span className=\"animate-pulse delay-200\">.</span></div>\n  </div>\n) : customerOrders.length > 0 ? ("
);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
