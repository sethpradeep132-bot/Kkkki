import sys

def patch():
    with open('src/components/portals/AdminPortal.tsx', 'r') as f:
        content = f.read()

    old_toggle = """                      {/* Green Light Toggle */}
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
                      </button>"""

    new_toggle = """                      {/* Multi-Color Signal Selector */}
                      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-full shadow-sm">
                        {[
                          { id: 'none', bg: 'bg-gray-200' },
                          { id: 'green', bg: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
                          { id: 'red', bg: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' },
                          { id: 'blue', bg: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
                          { id: 'yellow', bg: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' },
                          { id: 'purple', bg: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' },
                          { id: 'pink', bg: 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]' }
                        ].map(c => {
                          const currentColor = banner.signalColor || (banner.showGreenSignal ? 'green' : 'none');
                          const isSelected = currentColor === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setAdditionalSettingsData(prev => {
                                const newBanners = [...prev.promoBanners];
                                newBanners[idx].signalColor = c.id;
                                newBanners[idx].showGreenSignal = (c.id === 'green');
                                return {...prev, promoBanners: newBanners};
                              })}
                              title={c.id === 'none' ? 'No Signal' : `${c.id} signal`}
                              className={`w-4 h-4 rounded-full transition-all duration-200 ${c.bg} ${isSelected ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                            />
                          );
                        })}
                      </div>"""

    content = content.replace(old_toggle, new_toggle)

    with open('src/components/portals/AdminPortal.tsx', 'w') as f:
        f.write(content)

patch()
