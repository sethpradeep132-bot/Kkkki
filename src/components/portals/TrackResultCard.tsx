import React, { useState } from 'react';
import { isImageField, extractImageUrls } from '../../utils/trackSearch';
import { X, ZoomIn } from 'lucide-react';

interface TrackResultCardProps {
  res: any;
  index: number;
  hideAdminId?: boolean;
}

export const TrackResultCard: React.FC<TrackResultCardProps> = ({ res, index, hideAdminId }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const tableName = res.__table ? String(res.__table).replace(/_/g, ' ') : 'DETAILS';
  const entries = Object.entries(res).filter(([k]) => {
    if (k === '__table') return false;
    if (hideAdminId) {
      const normalizedKey = k.toLowerCase().replace(/[\s_-]+/g, '');
      if (normalizedKey === 'adminid') return false;
    }
    return true;
  });

  return (
    <div key={index} className="border border-black bg-gray-50 p-4 relative rounded-none shadow-xs">
      {/* Table Name Badge */}
      <div className="absolute -top-2.5 left-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 z-10">
        {tableName}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2">
        {entries.map(([k, v]) => {
          const isImg = isImageField(k, v);

          if (isImg) {
            const urls = extractImageUrls(v);
            return (
              <div key={k} className="col-span-2 flex flex-col gap-1.5 py-1 bg-white p-2.5 border border-gray-200">
                <span className="text-[9px] uppercase tracking-wider text-gray-600 font-bold flex items-center justify-between">
                  <span>{k.replace(/_/g, ' ')}</span>
                  <span className="text-[9px] text-gray-400 font-normal">IMAGE FORMAT</span>
                </span>
                <div className="flex flex-wrap gap-2.5 mt-1">
                  {urls.map((url, imgIdx) => (
                    <div 
                      key={imgIdx} 
                      className="relative group border border-gray-200 rounded overflow-hidden bg-white shadow-xs max-w-full cursor-pointer hover:border-black transition-colors"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img 
                        src={url} 
                        alt={k} 
                        className="max-h-48 max-w-full object-contain block mx-auto transition-transform duration-150 group-hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const errDiv = document.createElement('div');
                            errDiv.className = 'text-[10px] text-gray-400 p-2 italic';
                            errDiv.innerText = 'Image not available';
                            parent.appendChild(errDiv);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn size={16} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Check if value is a long timeline string (with update dividers or newlines)
          const isTimeline = typeof v === 'string' && (v.includes('-----------------------------------') || (v.length > 120 && v.includes('\n')));

          if (isTimeline) {
            return (
              <div key={k} className="col-span-2 flex flex-col py-1 bg-white p-2.5 border border-gray-200">
                <span className="text-[9px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                  {k.replace(/_/g, ' ')}
                </span>
                <div className="text-[11px] font-mono text-gray-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-gray-50 p-2 border border-gray-200 select-text">
                  {String(v)}
                </div>
              </div>
            );
          }

          // Standard key-value
          const displayVal = v === null || v === undefined || v === '' ? 'N/A' : (typeof v === 'object' ? JSON.stringify(v) : String(v));

          return (
            <div key={k} className="flex flex-col py-0.5 min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">
                {k.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-medium text-black break-words select-text">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>

      {/* Image Preview Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[90vh] bg-white p-2 border border-black shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-2 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-wider text-black">IMAGE PREVIEW</span>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center">
              <img 
                src={selectedImage} 
                alt="Full Preview" 
                className="max-h-[75vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
