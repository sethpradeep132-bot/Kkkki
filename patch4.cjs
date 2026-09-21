const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

const regex = /\(\(\) => \{\s*const isCompletedTab = activeChip === 'Failed\/Completed';\s*const filteredTasks = tasks;\s*const getTagColor = [\s\S]*?if \(Object\.keys\(groups\)\.length === 0\) return <div className="text-center py-10 text-slate-500 text-sm font-medium">No tasks found\.<\/div>;\s*return \(\s*<>\s*\{Object\.values\(groups\)\.map\(\(group: any, i: number\) => \{[\s\S]*?return \([\s\S]*?\}\)\}\s*<\/>\s*\);\s*\}\)\(\)/m;

const replacement = `(() => {
            const getTagColor = (tag: string) => {
              const t = (tag || '').toLowerCase();
              if (t.includes('customer pickup') || t.includes('customer delivery')) {
                return 'bg-blue-50 text-blue-700 border-blue-200';
              }
              if (t.includes('seller pickup') || t.includes('seller delivery')) {
                return 'bg-purple-50 text-purple-700 border-purple-200';
              }
              return 'bg-slate-100 text-slate-800 border-slate-300';
            };

            return renderedGroups.length === 0 ? (
               <div className="text-center py-10 text-slate-500 text-sm font-medium">No tasks found.</div>
            ) : activeChip === 'Pending' ? (
               <Reorder.Group axis="y" values={renderedGroups} onReorder={(newOrder) => {
                   setRenderedGroups(newOrder);
                   let riderId = null;
                   try {
                       const stored = localStorage.getItem('portal_auth_rider');
                       if (stored) riderId = JSON.parse(stored).id;
                   } catch(e) {}
                   if (riderId) {
                       const newSort = newOrder.map(g => g.hashKey);
                       localStorage.setItem('rider_manual_sort_' + riderId, JSON.stringify(newSort));
                   }
               }} className="flex flex-col gap-2 pb-[70px]">
                  {renderedGroups.map((group: any, i: number) => (
                     <DraggableGroupItem 
                        key={group.hashKey || i} 
                        group={group} 
                        isCompletedTab={false} 
                        setScanningGroup={setScanningGroup} 
                        getTagColor={getTagColor} 
                     />
                  ))}
               </Reorder.Group>
            ) : (
               <div className="flex flex-col gap-2 pb-[70px]">
                  {renderedGroups.map((group: any, i: number) => (
                     <DraggableGroupItem 
                        key={group.hashKey || i} 
                        group={group} 
                        isCompletedTab={true} 
                        setScanningGroup={setScanningGroup} 
                        getTagColor={getTagColor} 
                     />
                  ))}
               </div>
            );
          })()`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find regex match.");
}
