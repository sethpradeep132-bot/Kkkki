import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AvatarUploadProps {
  url: string | null;
  onUpload: (url: string) => void;
  isEditable?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ url, onUpload, isEditable = true }) => {
  const [uploading, setUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      onUpload(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <div 
          className={`aspect-[4/5] w-40 sm:w-48 rounded-lg border-4 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center ${url ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={() => url && setIsPreviewOpen(true)}
        >
          {url ? (
            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon />
          )}
        </div>
        
        {isEditable && (
          <button 
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          </button>
        )}
      </div>
      
      {isPreviewOpen && url && (
        <div className="fixed inset-0 z-[100] bg-black/100 flex flex-col items-center justify-center" onClick={() => setIsPreviewOpen(false)}>
          <img src={url} alt="Avatar Fullscreen" className="w-full h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleUpload}
        disabled={!isEditable || uploading}
      />
    </div>
  );
};

const UserIcon = () => (
  <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
