const fs = require('fs');
let code = fs.readFileSync('src/components/portals/RiderTasksView.tsx', 'utf-8');

const regex = /\{\(\(\) => \{[\s\S]*?if \(Object\.keys\(groups\)\.length === 0\) return <div className="text-center py-10 text-slate-500 text-sm font-medium">No tasks found\.<\/div>;\s*return \(\s*<>\s*\{Object\.values\(groups\)\.map\(\(group: any, i: number\) => \{[\s\S]*?return \([\s\S]*?\}\)\}\s*<\/>\s*\);\s*\}\)\(\)\}/m;

const replacement = `
            {renderedGroups.length === 0 ? (
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
               }} className="flex flex-col gap-2 p-2 pb-[70px]">
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
               <div className="flex flex-col gap-2 p-2 pb-[70px]">
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
            )}
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('src/components/portals/RiderTasksView.tsx', code);
