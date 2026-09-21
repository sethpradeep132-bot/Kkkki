import React, { useState } from 'react';
import { LogOut, X, Monitor, MonitorSmartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { recordLogoutSession } from '../../utils/sessionTracker';

interface LogoutModalProps {
  onClose: () => void;
  onLogoutSuccess?: () => void;
  portalName: 'Customer' | 'Seller' | 'Hub Manager' | 'Rider' | 'Cluster' | 'Admin';
}

export const getPortalStorageKey = (portalName: string) => {
  switch (portalName) {
    case 'Customer': return 'portal_auth_customer';
    case 'Seller': return 'portal_auth_seller';
    case 'Hub Manager': return 'portal_auth_hub';
    case 'Rider': return 'portal_auth_rider';
    case 'Cluster': return 'portal_auth_cluster';
    case 'Admin': return 'ss_admin_auth';
    default: return '';
  }
};

export const LogoutModal: React.FC<LogoutModalProps> = ({ onClose, onLogoutSuccess, portalName }) => {
  const [selectedOption, setSelectedOption] = useState<'local' | 'global'>('local');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await recordLogoutSession();
    } catch (e) {
      console.warn('Session logout recording error:', e);
    }

    try {
      if (portalName !== 'Cluster') {
        await supabase.auth.signOut({ scope: selectedOption });
      }
    } catch (e) {
      console.error('Supabase signout error (ignoring):', e);
    }
    
    if (onLogoutSuccess) {
      onLogoutSuccess();
    } else {
      const key = getPortalStorageKey(portalName);
      if (key) {
        localStorage.removeItem(key);
      }
      try {
        localStorage.removeItem('active_selected_portal');
      } catch (e) {}
      window.location.reload();
    }
    setIsLoggingOut(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <LogOut size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Logout</h3>
              <p className="text-[10px] text-slate-500">Choose your logout preference</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedOption === 'local' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
            <input type="radio" name="logout_scope" checked={selectedOption === 'local'} onChange={() => setSelectedOption('local')} className="mt-1 accent-rose-600" />
            <div>
              <div className="flex items-center gap-1.5">
                <Monitor size={14} className={selectedOption === 'local' ? 'text-rose-600' : 'text-slate-500'} />
                <h4 className={`text-sm font-bold ${selectedOption === 'local' ? 'text-rose-700' : 'text-slate-700'}`}>Log out from this device</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">You will only be logged out from this current browser or device.</p>
            </div>
          </label>
          
          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedOption === 'global' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
            <input type="radio" name="logout_scope" checked={selectedOption === 'global'} onChange={() => setSelectedOption('global')} className="mt-1 accent-rose-600" />
            <div>
              <div className="flex items-center gap-1.5">
                <MonitorSmartphone size={14} className={selectedOption === 'global' ? 'text-rose-600' : 'text-slate-500'} />
                <h4 className={`text-sm font-bold ${selectedOption === 'global' ? 'text-rose-700' : 'text-slate-700'}`}>Log out from all devices</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">You will be securely logged out from all active sessions everywhere.</p>
            </div>
          </label>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} disabled={isLoggingOut} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoggingOut} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {isLoggingOut ? 'Logging out...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
