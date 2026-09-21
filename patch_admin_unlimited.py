import sys
import re

def patch():
    with open('src/components/portals/AdminPortal.tsx', 'r') as f:
        content = f.read()

    # 1. Update state
    state_old = """  const [additionalSettingsData, setAdditionalSettingsData] = useState<{logoUrl: string; promoImages: string[]}>({
    logoUrl: '',
    promoImages: ['', '', '', '']
  });"""
    state_new = """  const [additionalSettingsData, setAdditionalSettingsData] = useState<{logoUrl: string; promoBanners: any[]}>({
    logoUrl: '',
    promoBanners: []
  });"""
    
    if state_old in content:
        content = content.replace(state_old, state_new)
    else:
        content = re.sub(r'const \[additionalSettingsData,\s*setAdditionalSettingsData\]\s*=\s*useState<\{logoUrl:\s*string;\s*promoImages:\s*string\[\]\}>\(\{.*?\}\);', state_new, content, flags=re.DOTALL)

    # Need to handle data migration gracefully if possible, or just overwrite since it's dev.
    # The JSON.parse might bring in promoImages. We can adapt inside handleSave or useEffect if we want, but letting it be is fine if we just check promoBanners.

    # 2. Update UI
    ui_old = r'<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">\s*<h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Promotion Banner Images \(4 Images\)</h3>.*?</div>\s*</div>\s*</div>\s*<div className="pt-4">'
    
    ui_new = """            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800">Promotion Banners</h3>
                <button
                  onClick={() => setAdditionalSettingsData(prev => ({
                    ...prev,
                    promoBanners: [...(prev.promoBanners || []), {
                      id: Date.now().toString(),
                      imageUrl: '',
                      isActive: true,
                      scheduleType: 'date',
                      targetDate: new Date().toISOString().split('T')[0],
                      targetDay: '0'
                    }]
                  }))}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                >
                  + Add Banner
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {(additionalSettingsData.promoBanners || []).map((banner, idx) => (
                  <div key={banner.id} className="flex flex-col gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50 relative">
                    <button 
                      onClick={() => setAdditionalSettingsData(prev => ({
                        ...prev,
                        promoBanners: prev.promoBanners.filter((_, i) => i !== idx)
                      }))}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setAdditionalSettingsData(prev => {
                          const newBanners = [...prev.promoBanners];
                          newBanners[idx].isActive = !newBanners[idx].isActive;
                          return {...prev, promoBanners: newBanners};
                        })}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors ${banner.isActive ? 'bg-blue-500' : 'bg-gray-400'}`}
                      >
                        {banner.isActive ? 'Show (Active)' : 'Hide (Inactive)'}
                      </button>
                      <span className="text-xs font-bold text-slate-500">Banner #{idx + 1}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Schedule By</label>
                        <select 
                          value={banner.scheduleType}
                          onChange={(e) => setAdditionalSettingsData(prev => {
                            const newBanners = [...prev.promoBanners];
                            newBanners[idx].scheduleType = e.target.value as 'date' | 'day';
                            return {...prev, promoBanners: newBanners};
                          })}
                          className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                          <option value="date">Specific Date</option>
                          <option value="day">Specific Day of Week</option>
                        </select>
                      </div>

                      {banner.scheduleType === 'date' ? (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                          <input 
                            type="date" 
                            value={banner.targetDate}
                            onChange={(e) => setAdditionalSettingsData(prev => {
                              const newBanners = [...prev.promoBanners];
                              newBanners[idx].targetDate = e.target.value;
                              return {...prev, promoBanners: newBanners};
                            })}
                            className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Day of Week</label>
                          <select 
                            value={banner.targetDay}
                            onChange={(e) => setAdditionalSettingsData(prev => {
                              const newBanners = [...prev.promoBanners];
                              newBanners[idx].targetDay = e.target.value;
                              return {...prev, promoBanners: newBanners};
                            })}
                            className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                          >
                            <option value="0">Sunday</option>
                            <option value="1">Monday</option>
                            <option value="2">Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-16 w-32 shrink-0 rounded border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden">
                        {banner.imageUrl ? (
                          <img src={banner.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <Image size={20} className="text-slate-400" />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white text-fuchsia-700 px-4 py-2 rounded-lg text-xs font-bold border border-fuchsia-200 hover:bg-fuchsia-50 transition-colors w-full text-center">
                        Upload Image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAdditionalSettingsData(prev => {
                                const newBanners = [...prev.promoBanners];
                                newBanners[idx].imageUrl = reader.result as string;
                                return { ...prev, promoBanners: newBanners };
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    </div>

                  </div>
                ))}
                {(additionalSettingsData.promoBanners || []).length === 0 && (
                  <div className="text-center py-4 text-sm text-slate-500 italic">No banners added yet.</div>
                )}
              </div>
            </div>

            <div className="pt-4">"""

    content = re.sub(ui_old, ui_new, content, flags=re.DOTALL)

    with open('src/components/portals/AdminPortal.tsx', 'w') as f:
        f.write(content)

patch()
