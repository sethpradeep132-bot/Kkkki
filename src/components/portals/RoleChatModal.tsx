import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'lucide-react';
import { X, Send, Plus, File, Trash2, CheckSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FiveDotLoader } from './FiveDotLoader';

export const RoleChatModal = ({
  isOpen,
  onClose,
  tableName,
  title,
  readOnly,
  currentUserType,
  currentUserId,
  currentUserName,
  clusterId
}: {
  isOpen: boolean;
  onClose: () => void;
  tableName: 'chat_for_customers' | 'chat_for_sellers' | 'chat_for_riders' | 'chat_for_hub_managers' | 'chat_for_clusters';
  title: string;
  readOnly?: boolean;
  currentUserType: 'admin' | 'cluster' | 'customer' | 'seller' | 'rider' | 'hub_manager';
  currentUserId: string;
  currentUserName: string;
  clusterId?: string | null;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, tableName, currentUserId, clusterId]);



  const parseMessage = (msgStr: string) => {
    try {
      return JSON.parse(msgStr);
    } catch (e) {
      return { text: msgStr };
    }
  };

  const uniqueSenders = useMemo(() => {
    if (currentUserType !== 'admin' && currentUserType !== 'cluster') return [];
    const senders = new Map();
    messages.forEach(m => {
      const content = parseMessage(m.message);
      if (content.senderId && content.senderId !== currentUserId) {
        if (tableName !== 'chat_for_clusters' && (content.senderType === 'admin' || content.senderType === 'cluster')) {
          return;
        }
        if (!senders.has(content.senderId)) {
          senders.set(content.senderId, {
            id: content.senderId,
            name: content.senderName || 'User',
            type: content.senderType,
            customer_id: m.customer_id,
            seller_id: m.seller_id,
            rider_id: m.rider_id,
            hub_manager_id: m.hub_manager_id,
            cluster_id: m.cluster_id,
            admin_id: m.admin_id
          });
        }
      }
    });
    return Array.from(senders.values());
  }, [messages, currentUserId, currentUserType]);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (!selectedSenderId) return true;
      const content = parseMessage(m.message);
      if (content.senderId === selectedSenderId) return true;
      
      if (tableName === 'chat_for_customers' && m.customer_id === selectedSenderId) return true;
      if (tableName === 'chat_for_sellers' && m.seller_id === selectedSenderId) return true;
      if (tableName === 'chat_for_riders' && m.rider_id === selectedSenderId) return true;
      if (tableName === 'chat_for_hub_managers' && m.hub_manager_id === selectedSenderId) return true;
      if (tableName === 'chat_for_clusters' && (m.admin_id === selectedSenderId)) return true;
      
      return false;
    });
  }, [messages, selectedSenderId, tableName]);


  useEffect(() => {
    if (chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }
  }, [filteredMessages]);

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
      const { error } = await supabase.from(tableName).delete().in('id', selectedMessages);
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
      let query = supabase
        .from(tableName)
        .select(
          tableName === 'chat_for_customers' ? 'id, message, created_at, cluster_id, customer_id' :
          tableName === 'chat_for_sellers' ? 'id, message, created_at, cluster_id, seller_id' :
          tableName === 'chat_for_riders' ? 'id, message, created_at, cluster_id, rider_id' :
          tableName === 'chat_for_hub_managers' ? 'id, message, created_at, cluster_id, hub_manager_id' :
          'id, message, created_at, admin_id'
        )
        .not('message', 'is', null)
        .order('created_at', { ascending: true });
        
      if (currentUserType !== 'admin') {
        if (currentUserType === 'cluster' && tableName !== 'chat_for_clusters') {
          query = query.eq('cluster_id', currentUserId);
        } else if (clusterId && tableName !== 'chat_for_clusters') {
          query = query.eq('cluster_id', clusterId);
          if (tableName === 'chat_for_customers') query = query.eq('customer_id', currentUserId);
          if (tableName === 'chat_for_sellers') query = query.eq('seller_id', currentUserId);
          if (tableName === 'chat_for_riders') query = query.eq('rider_id', currentUserId);
          if (tableName === 'chat_for_hub_managers') query = query.eq('hub_manager_id', currentUserId);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let finalData: any[] = data || [];
      
      // Filter manually if it's cluster chatting with admin and no column exists
      if (tableName === 'chat_for_clusters' && currentUserType === 'cluster') {
         finalData = finalData.filter(d => {
            const parsed = parseMessage(d.message);
            return parsed.clusterId === currentUserId || parsed.senderId === currentUserId;
         });
      }

      setMessages(finalData);
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
      timestamp: new Date().toISOString(),
      senderType: currentUserType,
      senderId: currentUserId,
      senderName: currentUserName,
      clusterId: currentUserType === 'cluster' ? currentUserId : ((selectedSenderId && tableName === 'chat_for_clusters') ? selectedSenderId : clusterId)
    };
    
    const messageString = JSON.stringify(messageData);
    
    let insertPayload: any = { message: messageString };
    
    if (tableName === 'chat_for_customers') {
      insertPayload.cluster_id = currentUserType === 'cluster' ? currentUserId : clusterId;
      if (currentUserType === 'customer') insertPayload.customer_id = currentUserId;
      else if (selectedSenderId) insertPayload.customer_id = selectedSenderId;
    } else if (tableName === 'chat_for_sellers') {
      insertPayload.cluster_id = currentUserType === 'cluster' ? currentUserId : clusterId;
      if (currentUserType === 'seller') insertPayload.seller_id = currentUserId;
      else if (selectedSenderId) insertPayload.seller_id = selectedSenderId;
    } else if (tableName === 'chat_for_riders') {
      insertPayload.cluster_id = currentUserType === 'cluster' ? currentUserId : clusterId;
      if (currentUserType === 'rider') insertPayload.rider_id = currentUserId;
      else if (selectedSenderId) insertPayload.rider_id = selectedSenderId;
    } else if (tableName === 'chat_for_hub_managers') {
      insertPayload.cluster_id = currentUserType === 'cluster' ? currentUserId : clusterId;
      if (currentUserType === 'hub_manager') insertPayload.hub_manager_id = currentUserId;
      else if (selectedSenderId) insertPayload.hub_manager_id = selectedSenderId;
    } else if (tableName === 'chat_for_clusters') {
      if (currentUserType === 'admin') insertPayload.admin_id = currentUserId;
      else if (selectedSenderId && currentUserType === 'cluster') insertPayload.admin_id = selectedSenderId;
      
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .insert([insertPayload]);

      if (error) throw error;
      
      setInputText('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chats/${fileName}`;

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

  React.useEffect(() => {
    if (isOpen) {
      
      return () => {  };
    }
    return () => {  };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden">
      <div className="bg-white px-3 py-1.5 border-b border-slate-200 flex flex-col shadow-sm shrink-0 transition-all">
        <div className="flex items-center justify-between w-full">
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
        
        {uniqueSenders.length > 0 && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
             <div 
               onClick={() => setSelectedSenderId(null)}
               className={`shrink-0 px-3 py-1.5 rounded-md border text-xs font-bold cursor-pointer transition-all flex items-center justify-center ${!selectedSenderId ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
             >
               All
             </div>
             {uniqueSenders.map(sender => {
               const isSelected = selectedSenderId === sender.id;
               const initials = sender.name.substring(0, 2).toUpperCase();
               return (
                 <div
                   key={sender.id}
                   onClick={() => setSelectedSenderId(isSelected ? null : sender.id)}
                   className={`shrink-0 w-10 h-10 rounded-md border flex flex-col items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                   title={sender.name}
                 >
                   <span className="text-[10px] font-bold leading-none">{initials}</span>
                   <span className="text-[8px] opacity-80 leading-none mt-1 max-w-[32px] truncate">{sender.type === 'admin' ? 'A' : 'U'}</span>
                 </div>
               );
             })}
          </div>
        )}
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 text-sm font-light">Loading<span className="loading-ellipsis"></span></p>
          </div>
        ) : (
          <>
        {filteredMessages.map((msg) => {
          const content = parseMessage(msg.message);
          let isMe = content.senderId === currentUserId;
          if (tableName !== 'chat_for_clusters') {
            if ((currentUserType === 'admin' || currentUserType === 'cluster') && (content.senderType === 'admin' || content.senderType === 'cluster')) {
              isMe = true;
            }
          }
          
          const isSystemSender = content.senderType === 'admin' || content.senderType === 'cluster';
          let displayName = content.senderName || 'User';
          if (content.senderType === 'admin') displayName = 'Suriyawan Shopping';
          const displayAvatar = displayName.charAt(0).toUpperCase();

          
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 mr-2 flex items-center justify-center text-xs font-bold text-slate-600 mt-auto mb-1 border border-slate-300">
                  {displayAvatar}
                </div>
              )}
              <div 
                className={`relative max-w-[85%] text-white rounded-2xl px-4 py-3 shadow-sm transition-all cursor-pointer ${selectedMessages.includes(msg.id) ? 'ring-2 ring-red-400 scale-[0.98]' : ''} ${isMe ? 'bg-blue-600' : 'bg-slate-600'}`}
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
                
                <div className="text-[10px] opacity-70 mb-1 font-medium">
                   {displayName}
                </div>
                
                {content.text && <p className="whitespace-pre-wrap text-sm break-words leading-relaxed">{content.text}</p>}
                {content.fileUrl && (
                  <div className="mt-2">
                    {content.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img src={content.fileUrl} alt="Uploaded" className="w-full h-auto object-contain rounded-lg border border-white/20 bg-black/10" />
                    ) : (
                      <a href={content.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-100 hover:text-white bg-black/20 p-2 rounded-lg text-sm">
                        <File size={16} />
                        <span className="truncate">{content.fileName || 'Attachment'}</span>
                      </a>
                    )}
                  </div>
                )}
                <div className="text-[10px] text-white/70 text-right mt-1 opacity-80">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {isMe && (
                <div className="w-8 h-8 rounded-full bg-blue-100 shrink-0 ml-2 flex items-center justify-center text-xs font-bold text-blue-600 mt-auto mb-1 border border-blue-200">
                  {displayAvatar}
                </div>
              )}
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
