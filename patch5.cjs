const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderDashboardView.tsx', 'utf-8');

const regex = /<select \s*value=\{selectedRouteId\}\s*onChange=\{\(e\) => setSelectedRouteId\(e\.target\.value\)\}\s*className="flex-1 h-12 px-3 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 focus:outline-none"\s*>\s*<option value="">Select Route<\/option>\s*\{riderRoutes\.map\(route => \(\s*<option key=\{route\.id\} value=\{route\.id\}>\{route\.name\}<\/option>\s*\)\)\}\s*<\/select>\s*<button \s*onClick=\{\(\) => setShowRouteDetails\(true\)\} \s*className="h-12 px-4 bg-indigo-600 text-white text-sm font-bold rounded-lg whitespace-nowrap active:scale-\[0\.98\] transition-all"\s*>\s*View Details\s*<\/button>/m;

const replacement = `<select 
           value={selectedRouteId}
           onChange={(e) => {
               setSelectedRouteId(e.target.value);
               setRouteSaved(false);
           }}
           className="flex-1 h-12 px-3 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 focus:outline-none"
        >
           <option value="">Select Route</option>
           {riderRoutes.map(route => (
              <option key={route.id} value={route.id}>{route.name}</option>
           ))}
        </select>
        <button 
           onClick={async () => {
              if (isSavingSelectedRoute) return;
              setIsSavingSelectedRoute(true);
              // Save to localStorage
              let rId = riderData?.id;
              if (!rId) {
                  try {
                      const stored = localStorage.getItem('portal_auth_rider');
                      if (stored) rId = JSON.parse(stored).id;
                  } catch (e) {}
              }
              await new Promise(r => setTimeout(r, 1500)); // original time simulation
              if (rId) {
                  if (selectedRouteId) {
                      const selected = riderRoutes.find(r => r.id === selectedRouteId);
                      if (selected) {
                          localStorage.setItem('rider_selected_route_' + rId, JSON.stringify(selected));
                      }
                  } else {
                      localStorage.removeItem('rider_selected_route_' + rId);
                  }
                  // clear manual sort whenever route changes
                  localStorage.removeItem('rider_manual_sort_' + rId);
              }
              setIsSavingSelectedRoute(false);
              setRouteSaved(true);
           }} 
           className={\`h-12 w-28 \${routeSaved || !selectedRouteId ? 'bg-slate-400' : 'bg-blue-600'} text-white text-sm font-bold rounded-lg flex items-center justify-center whitespace-nowrap transition-all\`}
        >
           {isSavingSelectedRoute ? (
              <div className="flex space-x-1">
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
           ) : (
              'Save Change'
           )}
        </button>
        <button 
           onClick={() => setShowRouteDetails(true)} 
           className="h-12 w-12 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors shrink-0"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        </button>`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    // Also add states
    if (!code.includes("const [isSavingSelectedRoute")) {
        code = code.replace("const [selectedRouteId, setSelectedRouteId] = useState<string>('');", "const [selectedRouteId, setSelectedRouteId] = useState<string>('');\n  const [isSavingSelectedRoute, setIsSavingSelectedRoute] = useState(false);\n  const [routeSaved, setRouteSaved] = useState(true);");
    }
    
    // Add initialization from localStorage
    if (!code.includes("rider_selected_route_")) {
        code = code.replace("if (data?.registered_pincode) {", `try {
        const storedRoute = localStorage.getItem('rider_selected_route_' + data.id);
        if (storedRoute) {
            const parsed = JSON.parse(storedRoute);
            setSelectedRouteId(parsed.id);
            setRouteSaved(true);
        }
      } catch (e) {}
      if (data?.registered_pincode) {`);
    }

    fs.writeFileSync('src/components/portals/RiderDashboardView.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find regex match.");
}
