import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Plus, File, Trash2, CheckSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FiveDotLoader } from './FiveDotLoader';

export const AnnouncementChatModal = ({
  isOpen,
  onClose,
  updateType,
  title,
  readOnly
}: {
  isOpen: boolean;
  onClose: () => void;
  updateType: 'customer_update' | 'seller_update' | 'rider_update' | 'hub_manager_update' | 'cluster_update';
  title: string;
  readOnly?: boolean;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, updateType]);

  useEffect(() => {
    if (chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }
  }, [messages]);

  
  
  const handleTouchStart = (id: string) => {
    if (readOnly) return;
    timerRef.current = setTimeout(() => {
      setSelectedMessages(prev => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClickMessage = (id: string) => {
    if (readOnly) return;
    if (selectedMessages.length > 0) {
      setSelectedMessages(prev => 
        prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    try {
      const { error } = await supabase.from('announcement_and_update').delete().in('id', selectedMessages);
      if (error) throw error;
      setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)));
      setSelectedMessages([]);
    } catch (err) {
      console.error('Error deleting messages:', err);
      alert('Failed to delete messages');
    }
  };

  const handleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(m => m.id));
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcement_and_update')
        .select(`id, ${updateType}, created_at`)
        .not(updateType, 'is', null)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (fileUrl?: string, fileName?: string) => {
    if (!inputText.trim() && !fileUrl) return;
    
    let messageData = {
      text: inputText.trim(),
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      timestamp: new Date().toISOString()
    };
    
    const messageString = JSON.stringify(messageData);

    try {
      const { error } = await supabase
        .from('announcement_and_update')
        .insert({ [updateType]: messageString } as any);

      if (error) throw error;
      
      setInputText('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') 
        .upload(filePath, file);

      if (uploadError) {
         throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      await handleSend(data.publicUrl, file.name);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseMessage = (msgStr: string) => {
    try {
      const parsed = JSON.parse(msgStr);
      return parsed;
    } catch (e) {
      return { text: msgStr };
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      
      return () => {  };
    }
    return () => {  };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden">
      <div className="bg-white px-3 py-1.5 border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0 transition-all">
        {selectedMessages.length > 0 ? (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedMessages([])} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
              <h3 className="font-bold text-slate-800 text-base">{selectedMessages.length} Selected</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleSelectAll} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Select All">
                 <CheckSquare size={20} />
              </button>
              <button onClick={handleDeleteSelected} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete Selected">
                 <Trash2 size={20} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </>
        )}
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 text-sm font-light">Loading<span className="loading-ellipsis"></span></p>
          </div>
        ) : (
          <>
        {messages.map((msg) => {
          const content = parseMessage(msg[updateType]);
          return (
            <div 
              key={msg.id} 
              className={`relative w-full text-white rounded-2xl px-4 py-4 shadow-sm transition-all cursor-pointer ${selectedMessages.includes(msg.id) ? 'bg-blue-700 ring-2 ring-red-400 scale-[0.98]' : 'bg-blue-600'}`}
              onMouseDown={() => handleTouchStart(msg.id)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={() => handleTouchStart(msg.id)}
              onTouchEnd={handleTouchEnd}
              onClick={() => handleClickMessage(msg.id)}
            >
              {selectedMessages.includes(msg.id) && !readOnly && (
                <div className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-md z-10 animate-fade-in">
                  <CheckSquare size={16} />
                </div>
              )}
              {content.text && <p className="whitespace-pre-wrap text-sm break-words leading-relaxed">{content.text}</p>}
              {content.fileUrl && (
                <div className="mt-2">
                  {content.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <img src={content.fileUrl} alt="Uploaded" className="w-full h-auto object-contain rounded-lg border border-blue-500 bg-black/10" />
                  ) : (
                    <a href={content.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-100 hover:text-white bg-blue-700/50 p-2 rounded-lg text-sm">
                      <File size={16} />
                      <span className="truncate">{content.fileName || 'Attachment'}</span>
                    </a>
                  )}
                </div>
              )}
              <div className="text-[10px] text-blue-200 text-right mt-1 opacity-80">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!readOnly && (<div className="bg-white p-3 border-t border-slate-200 flex flex-col gap-2 shrink-0 w-full overflow-hidden">
        <div className="flex items-center gap-2 w-full">
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             className="hidden" 
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
             className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
             title="Upload Document"
           >
             {isUploading ? (
               <FiveDotLoader colorClass="bg-blue-600" />
             ) : (
               <Plus size={24} />
             )}
           </button>
           <input 
             type="text" 
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             placeholder="Type a message..."
             className="flex-1 min-w-0 border border-slate-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
           />
           <button 
             onClick={() => handleSend()}
             disabled={!inputText.trim() || isUploading}
             className="p-3 shrink-0 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
           >
             <Send size={20} />
           </button>
        </div>
      </div>
      )}
    </div>
  );
};
