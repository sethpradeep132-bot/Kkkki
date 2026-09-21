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
  "{isOrdersLoading ? (\n  <div className=\"flex flex-col items-center justify-center py-20\">\n    <div className=\"text-gray-500 font-bold flex items-center gap-[2px] text-lg\">\n      <span>Loading</span>\n      <div className=\"flex items-center space-x-1 ml-1\">\n        <div className=\"w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce\" style={{ animationDelay: '0ms' }}></div>\n        <div className=\"w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce\" style={{ animationDelay: '150ms' }}></div>\n        <div className=\"w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce\" style={{ animationDelay: '300ms' }}></div>\n      </div>\n    </div>\n  </div>\n) : customerOrders.length > 0 ? ("
);

fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
