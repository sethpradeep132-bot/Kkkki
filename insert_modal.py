import sys

with open('src/components/portals/AdminPortal.tsx', 'r') as f:
    content = f.read()

modal_ui = """
        {/* Admin Cluster Shipments Modal */}
        {showAdminClusterShipments && (
          <div className="fixed inset-0 z-[70] flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="bg-white w-full h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowAdminClusterShipments(false)} className="text-slate-500 hover:text-slate-800">
                    <ArrowRight size={20} className="rotate-180" />
                  </button>
                  <h3 className="font-bold text-slate-800">
                    Shipments: {selectedAdminClusterName}
                  </h3>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  Count: {adminClusterShipmentDetails.length.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-50 p-2 sm:p-4">
                <div className="space-y-3">
                  {adminClusterShipmentDetails.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No shipments found.</div>
                  ) : (
                    adminClusterShipmentDetails.map((s, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">AWB Number</span>
                            <span className="font-bold text-slate-900 break-all">{s['awb number'] || s['AWB Number'] || s['awb_number'] || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col">
                          <span className="text-xs text-slate-500 font-medium">Order ID</span>
                          <span className="font-semibold text-slate-800 break-all">{s['order id'] || s['Order ID'] || s['order_id'] || 'N/A'}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col">
                          <span className="text-xs text-slate-500 font-medium">Status</span>
                          <span className="font-semibold text-slate-800">{s['status'] || s['shipment type'] || 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
"""

target = "{showAdminClusterPayableModal && ("

if target in content:
    content = content.replace(target, modal_ui + "\n" + target)
    with open('src/components/portals/AdminPortal.tsx', 'w') as f:
        f.write(content)
    print("Modal injected")
else:
    print("Target not found")
