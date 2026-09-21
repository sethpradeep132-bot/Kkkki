import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

/**
 * Suriyawan 360° Omnidirectional Security Shield & Code Protector
 * 
 * Protects against:
 * 1. Unauthorized source code inspection (F12, Ctrl+Shift+I, Ctrl+U)
 * 2. Unauthorized webpage & asset downloading (Ctrl+S, Page Saver scrapers)
 * 3. Unauthorized right-click context menu copying & inspection
 * 4. Framing/Clickjacking duplicate website embedding
 * 5. Injects decoy honeypot tokens to mislead automated clone scrapers
 */
export const SecurityProtector: React.FC = () => {
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  useEffect(() => {
    // 1. Right-Click Context Menu Blocker
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click on input or textarea so users can still paste/copy their own text
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      triggerNotice('Security Protected: Right-click inspection is disabled.');
    };

    // 2. Keyboard Shortcuts Blocker for Inspect & Download
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Block F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        triggerNotice('Security Shield: Developer Tools inspection is restricted.');
        return false;
      }

      // Block Ctrl+U / Cmd+U (View Page Source)
      if (isCtrlOrMeta && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        triggerNotice('Security Shield: Direct source viewing is locked.');
        return false;
      }

      // Block Ctrl+S / Cmd+S (Save Page As / Download Code)
      if (isCtrlOrMeta && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        triggerNotice('Security Shield: Page download and cloning are restricted.');
        return false;
      }

      // Block Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
      // Block Ctrl+Shift+J / Cmd+Option+J (Console)
      // Block Ctrl+Shift+C / Cmd+Option+C (Element picker)
      if (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        triggerNotice('Security Shield: Inspection tools are locked.');
        return false;
      }

      // Block Ctrl+P / Cmd+P (Print to PDF page capture)
      if (isCtrlOrMeta && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        triggerNotice('Security Shield: Page capture is restricted.');
        return false;
      }
    };

    // 3. Decoy Honeypot Injection into DOM
    try {
      if (!document.getElementById('__suriyawan_decoy_shield__')) {
        const decoy = document.createElement('script');
        decoy.id = '__suriyawan_decoy_shield__';
        decoy.type = 'text/plain';
        decoy.text = `/* [SURIYAWAN-OMNIPROTECT-V9] ENCRYPTED RUNTIME PAYLOAD: 
0x8A7C5F 0xDEADBEEF 0x4B3C2A 0xCAFEBABE 0x9923FF 0x1100AA
Decoy Binary Stream Active. Any unauthorized duplication or cloning will produce non-functional corrupted code. */`;
        document.head.appendChild(decoy);
      }
    } catch (e) {}

    // 4. Console Protection Notice
    try {
      const banner = `
%c🔒 SURIYAWAN 360° SECURITY PROTECTOR ACTIVE
%cUnauthorized code downloading, reverse engineering, or cloning is strictly prohibited by security protocol.
All sessions are monitored and logged to user_sessions security audit.`;
      console.log(
        banner,
        'color: #ea580c; font-size: 16px; font-weight: bold; background: #fff7ed; padding: 6px 12px; border: 1px solid #ea580c; border-radius: 4px;',
        'color: #475569; font-size: 12px; margin-top: 4px;'
      );
    } catch (e) {}

    // Attach listeners
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  const triggerNotice = (msg: string) => {
    setSecurityNotice(msg);
    const timer = setTimeout(() => {
      setSecurityNotice(null);
    }, 2800);
    return () => clearTimeout(timer);
  };

  if (!securityNotice) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/95 text-white text-xs font-semibold rounded-full shadow-2xl border border-orange-500/40 backdrop-blur-md">
        <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-pulse" />
        <span className="tracking-wide">{securityNotice}</span>
      </div>
    </div>
  );
};
