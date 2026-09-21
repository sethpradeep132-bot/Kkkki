const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

const draggableComponent = `
const DraggableGroupItem = ({ group, isCompletedTab, setScanningGroup, getTagColor }: any) => {
    const controls = useDragControls();
    const totalQty = group.tasks.reduce((sum: number, t: any) => sum + parseInt(t['total quantity'] || t.quantity || '1', 10), 0);
    
    const innerContent = group.isCustomerTask ? (
        <div 
          onClick={() => !isCompletedTab && setScanningGroup(group)} 
          className={\`bg-white border-[1.5px] border-black shadow-sm flex flex-col rounded-none relative overflow-hidden min-h-[124px] shrink-0 \${isCompletedTab ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50 cursor-pointer active:scale-[0.99] transition-all'}\`}
        >
          <div className={\`flex flex-col h-full \${!isCompletedTab ? 'p-2.5' : 'p-3 pl-4'}\`}>
            <div className={\`flex flex-nowrap items-center gap-1.5 overflow-hidden shrink-0 \${!isCompletedTab ? 'mb-1.5' : 'mb-2'}\`}>
              <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0 max-w-[35%] min-w-0">
                {Array.from(group.orderIds || []).map((id: any) => (
                  <div key={id} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-none border border-slate-300 truncate shrink-0">
                    {id || 'C-TASK'}
                  </div>
                ))}
              </div>
              <div className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-none border border-slate-300 truncate shrink min-w-0">
                {group.firstTask['shipment type']}
              </div>
              <div className={\`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-none border truncate shrink min-w-0 \${getTagColor(group.firstTask['shipment tag'])}\`}>
                {group.firstTask['shipment tag']}
              </div>
              <div className="ml-auto bg-slate-50 text-slate-700 px-1.5 py-0.5 text-[9px] font-bold rounded-none border border-slate-200 shrink-0">
                Qty: {totalQty}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar">
              <h4 className="text-sm font-bold text-gray-800 leading-snug mb-1 shrink-0 line-clamp-1">
                {group.sellerName}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed pb-1 line-clamp-2">
                {group.address}
                {group.landmark ? \`, \${group.landmark}\` : ''}
                {group.pincode ? \`, - \${group.pincode}\` : ''}
              </p>
            </div>
            {!isCompletedTab && (
              <div className={\`flex items-center gap-2 shrink-0 \${!isCompletedTab ? 'mt-1.5' : 'mt-2'}\`}>
                <a
                   href={\`tel:\${group?.mobileNumber || group?.firstTask?.['mobile number'] || ''}\`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const dateStr = new Date().toLocaleString('en-IN');
                    group.tasks.forEach((task: any) => {
                        const currentDetails = task['call details'] || '';
                        const newAttempt = (currentDetails.match(/Call attempt/g) || []).length + 1;
                        const appendDetails = \`\\nCall attempt: \${newAttempt}, Call button clicked at \${dateStr}\`;
                        const updatedDetails = (currentDetails + appendDetails).trim();
                        task['call details'] = updatedDetails;
                        import('../../lib/supabase').then(({supabase}) => supabase.from('accepted_shipments').update({'call details': updatedDetails}).eq('id', task.id).then());
                    });
                  }}
                  className="flex-1 py-1.5 bg-green-500 text-white font-bold text-xs uppercase border border-green-700 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Call
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://maps.google.com/?q=' + encodeURIComponent(\`\${group.address || ''} \${group.pincode || ''}\`));
                  }}
                  className="flex-1 py-1.5 bg-yellow-400 text-black font-bold text-xs uppercase border border-yellow-600 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Map
                </button>
              </div>
            )}
          </div>
        </div>
    ) : (
        <div 
           onClick={() => !isCompletedTab && setScanningGroup(group)}
           className={\`bg-white border-[1.5px] border-black shadow-sm flex flex-col rounded-none relative overflow-hidden min-h-[124px] shrink-0 \${isCompletedTab ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50 cursor-pointer active:scale-[0.99] transition-all'}\`}
            >
              <div className={\`flex flex-col h-full \${!isCompletedTab ? 'p-2.5' : 'p-3 pl-4'}\`}>
            <div className={\`flex flex-nowrap items-center gap-1.5 overflow-hidden shrink-0 \${!isCompletedTab ? 'mb-1.5' : 'mb-2'}\`}>
              <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0 max-w-[35%] min-w-0">
                {Array.from(group.pickupIds || []).map((id: any) => (
                  <div key={id} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border border-slate-300 truncate shrink-0">
                    {id || group.sellerId}
                  </div>
                ))}
              </div>
              <div className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border border-slate-300 truncate shrink min-w-0">
                {group.firstTask['shipment type']}
              </div>
              <div className={\`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border truncate shrink min-w-0 \${getTagColor(group.firstTask['shipment tag'])}\`}>
                {group.firstTask['shipment tag']}
              </div>
              <div className="ml-auto bg-slate-50 text-slate-700 px-1.5 py-0.5 text-[9px] font-bold rounded-sm border border-slate-200 shrink-0">
                Qty: {totalQty}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar">
              <h4 className="text-sm font-bold text-gray-800 leading-snug mb-1 shrink-0 line-clamp-1">
                {group.shopName ? \`\${group.shopName} - \` : ''}{group.sellerName}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed pb-1 line-clamp-2">
                {group.address}
                {group.landmark ? \`, \${group.landmark}\` : ''}
                {group.pincode ? \`, \${group.pincode}\` : ''}
              </p>
            </div>
            {!isCompletedTab && (
              <div className={\`flex items-center gap-2 shrink-0 \${!isCompletedTab ? 'mt-1.5' : 'mt-2'}\`}>
                <a
                   href={\`tel:\${group?.mobileNumber || group?.firstTask?.['mobile number'] || ''}\`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const dateStr = new Date().toLocaleString('en-IN');
                    group.tasks.forEach((task: any) => {
                        const currentDetails = task['call details'] || '';
                        const newAttempt = (currentDetails.match(/Call attempt/g) || []).length + 1;
                        const appendDetails = \`\\nCall attempt: \${newAttempt}, Call button clicked at \${dateStr}\`;
                        const updatedDetails = (currentDetails + appendDetails).trim();
                        task['call details'] = updatedDetails;
                        import('../../lib/supabase').then(({supabase}) => supabase.from('accepted_shipments').update({'call details': updatedDetails}).eq('id', task.id).then());
                    });
                  }}
                  className="flex-1 py-1.5 bg-green-500 text-white font-bold text-xs uppercase border border-green-700 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Call
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://maps.google.com/?q=' + encodeURIComponent(\`\${group.address || ''} \${group.pincode || ''}\`));
                  }}
                  className="flex-1 py-1.5 bg-yellow-400 text-black font-bold text-xs uppercase border border-yellow-600 rounded-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  Map
                </button>
              </div>
            )}
          </div>
        </div>
    );

    if (isCompletedTab) {
        return innerContent;
    }

    return (
        <Reorder.Item
            value={group}
            dragListener={false}
            dragControls={controls}
            onPointerDown={(e: any) => {
                const timer = setTimeout(() => {
                    controls.start(e);
                    if (navigator.vibrate) navigator.vibrate(50);
                }, 1000);
                (e.target as any)._dragTimer = timer;
            }}
            onPointerUp={(e: any) => clearTimeout((e.target as any)._dragTimer)}
            onPointerCancel={(e: any) => clearTimeout((e.target as any)._dragTimer)}
            onContextMenu={(e: any) => e.preventDefault()}
            style={{ touchAction: 'none' }}
        >
            {innerContent}
        </Reorder.Item>
    );
};
`;

if (!code.includes("const DraggableGroupItem = ({")) {
    code = code.replace("export const RiderTasksView", draggableComponent + "\n\nexport const RiderTasksView");
    fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
}
