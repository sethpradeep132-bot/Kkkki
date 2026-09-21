import sys

def patch():
    with open('src/components/portals/AdminPortal.tsx', 'r') as f:
        content = f.read()

    # 1. Update state
    state_old = """  const [additionalSettingsData, setAdditionalSettingsData] = useState({
    logoUrl: '',
    liveSaleStartDate: '',
    liveSaleEndDate: '',
    specialSpeech: ''
  });"""
    state_new = """  const [additionalSettingsData, setAdditionalSettingsData] = useState<{logoUrl: string; promoImages: string[]}>({
    logoUrl: '',
    promoImages: ['', '', '', '']
  });"""
    
    if state_old in content:
        content = content.replace(state_old, state_new)
    else:
        # regex
        import re
        content = re.sub(r'const \[additionalSettingsData,\s*setAdditionalSettingsData\]\s*=\s*useState\(\{.*?\}\);', state_new, content, flags=re.DOTALL)

    # 2. Update UI
    ui_old = """            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Add Live Sale Date</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">From Date</label>
                  <input
                    type="date"
                    value={additionalSettingsData.liveSaleStartDate}
                    onChange={e => setAdditionalSettingsData(prev => ({...prev, liveSaleStartDate: e.target.value}))}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">To Date</label>
                  <input
                    type="date"
                    value={additionalSettingsData.liveSaleEndDate}
                    onChange={e => setAdditionalSettingsData(prev => ({...prev, liveSaleEndDate: e.target.value}))}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Add Special Speech</h3>
              <div className="flex flex-col gap-2">
                <textarea
                  placeholder="Write a special speech here..."
                  value={additionalSettingsData.specialSpeech}
                  onChange={e => setAdditionalSettingsData(prev => ({...prev, specialSpeech: e.target.value}))}
                  rows={3}
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 text-slate-700 resize-none"
                />
              </div>
            </div>"""

    ui_new = """            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Promotion Banner Images (4 Images)</h3>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(idx => (
                  <div key={idx} className="flex flex-col items-center gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500">Banner {idx + 1}</span>
                    {additionalSettingsData.promoImages && additionalSettingsData.promoImages[idx] ? (
                      <img src={additionalSettingsData.promoImages[idx]} alt={`Promo ${idx+1}`} className="h-16 w-full object-cover rounded border border-slate-200" />
                    ) : (
                      <div className="h-16 w-full rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <Image size={20} />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white text-fuchsia-700 px-3 py-1 rounded-lg text-[10px] font-bold border border-fuchsia-200 hover:bg-fuchsia-50 transition-colors w-full text-center">
                      Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAdditionalSettingsData(prev => {
                              const newImages = [...(prev.promoImages || ['', '', '', ''])];
                              newImages[idx] = reader.result as string;
                              return { ...prev, promoImages: newImages };
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>"""

    if ui_old in content:
        content = content.replace(ui_old, ui_new)
    else:
        print("Warning: Admin UI block not found. Trying regex.")
        import re
        content = re.sub(r'<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">\s*<h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Add Live Sale Date</h3>.*?</div>\s*</div>', ui_new, content, flags=re.DOTALL)

    with open('src/components/portals/AdminPortal.tsx', 'w') as f:
        f.write(content)

patch()
