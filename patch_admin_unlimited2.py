import sys
import re

def patch():
    with open('src/components/portals/AdminPortal.tsx', 'r') as f:
        content = f.read()

    # Find the UI block starting from Promotion Banner Images (4 Images)
    start_str = '<h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Promotion Banner Images (4 Images)</h3>'
    end_str = '<div className="pt-4">'
    
    start_idx = content.find(start_str)
    if start_idx != -1:
        # Step back to the containing div
        div_start = content.rfind('<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">', 0, start_idx)
        end_idx = content.find(end_str, start_idx)
        
        if div_start != -1 and end_idx != -1:
            ui_old = content[div_start:end_idx]
            
            ui_new = """<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
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
                      targetDay: '0',
                      showGreenSignal: false
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

                      {/* Green Light Toggle */}
                      <button
                        onClick={() => setAdditionalSettingsData(prev => {
                          const newBanners = [...prev.promoBanners];
                          newBanners[idx].showGreenSignal = !newBanners[idx].showGreenSignal;
                          return {...prev, promoBanners: newBanners};
                        })}
                        className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors"
                        title="Toggle Green Signal"
                      >
                        <div className={`w-3 h-3 rounded-full ${banner.showGreenSignal ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gray-300'}`}></div>
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
            </div>\n\n            """
            
            content = content.replace(ui_old, ui_new)
            
            with open('src/components/portals/AdminPortal.tsx', 'w') as f:
                f.write(content)
            print("Successfully patched AdminPortal UI.")
        else:
            print("Failed to find bounds.")

patch()
