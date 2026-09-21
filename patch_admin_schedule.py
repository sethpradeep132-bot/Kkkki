import sys

def patch():
    with open('src/components/portals/AdminPortal.tsx', 'r') as f:
        content = f.read()

    select_old = """                          <option value="date">Specific Date</option>
                          <option value="day">Specific Day of Week</option>"""
                          
    select_new = """                          <option value="date">Specific Date (One time)</option>
                          <option value="day">Repeat Weekly (Every Week)</option>"""

    content = content.replace(select_old, select_new)

    day_old = """                        <div className="flex flex-col gap-1">
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
                          </select>"""

    day_new = """                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Repeat on Day</label>
                          <select 
                            value={banner.targetDay}
                            onChange={(e) => setAdditionalSettingsData(prev => {
                              const newBanners = [...prev.promoBanners];
                              newBanners[idx].targetDay = e.target.value;
                              return {...prev, promoBanners: newBanners};
                            })}
                            className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                          >
                            <option value="0">Every Sunday</option>
                            <option value="1">Every Monday</option>
                            <option value="2">Every Tuesday</option>
                            <option value="3">Every Wednesday</option>
                            <option value="4">Every Thursday</option>
                            <option value="5">Every Friday</option>
                            <option value="6">Every Saturday</option>
                          </select>"""

    content = content.replace(day_old, day_new)

    with open('src/components/portals/AdminPortal.tsx', 'w') as f:
        f.write(content)

patch()
