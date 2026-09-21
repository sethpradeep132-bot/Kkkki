import sys

with open('src/components/portals/ClusterPortal.tsx', 'r') as f:
    content = f.read()

target_str = """                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  Count: {clusterEarningShipments.length.toLocaleString('en-IN')}
                </span>"""

replacement_str = """                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    Count: {clusterEarningShipments.length.toLocaleString('en-IN')}
                  </span>
                  <button onClick={handleDownloadEarningPDF} className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer" title="Download PDF">
                    <Download size={16} />
                  </button>
                </div>"""

if target_str in content:
    content = content.replace(target_str, replacement_str)
    with open('src/components/portals/ClusterPortal.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
