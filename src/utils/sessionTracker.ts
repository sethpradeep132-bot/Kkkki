import { supabase } from '../lib/supabase';

export interface DeviceInfo {
  device_type: string;
  operating_system: string;
  browser: string;
  user_agent: string;
  device_label: string;
}

export function parseClientDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      device_type: 'Unknown',
      operating_system: 'Unknown',
      browser: 'Unknown',
      user_agent: '',
      device_label: 'Unknown Device'
    };
  }

  const ua = navigator.userAgent || '';
  
  // 1. Detect Device Type
  let device_type = 'Desktop';
  if (/iPhone/i.test(ua)) {
    device_type = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    device_type = 'iPad';
  } else if (/Android/i.test(ua)) {
    device_type = 'Android';
  } else if (/Windows/i.test(ua)) {
    device_type = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device_type = 'Mac';
  } else if (/Linux/i.test(ua)) {
    device_type = 'Linux';
  }

  // 2. Detect Operating System
  let operating_system = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) {
    operating_system = 'Windows 10/11';
  } else if (/Windows NT 6.3/i.test(ua)) {
    operating_system = 'Windows 8.1';
  } else if (/Windows NT 6.1/i.test(ua)) {
    operating_system = 'Windows 7';
  } else if (/Windows/i.test(ua)) {
    operating_system = 'Windows';
  } else if (/Android\s+([\d.]+)/i.test(ua)) {
    const match = ua.match(/Android\s+([\d.]+)/i);
    operating_system = match ? `Android ${match[1]}` : 'Android';
  } else if (/OS\s+([\d_]+)\s+like Mac OS X/i.test(ua)) {
    const match = ua.match(/OS\s+([\d_]+)\s+like Mac OS X/i);
    operating_system = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Mac OS X\s+([\d_]+)/i.test(ua)) {
    const match = ua.match(/Mac OS X\s+([\d_]+)/i);
    operating_system = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/Linux/i.test(ua)) {
    operating_system = 'Linux';
  }

  // 3. Detect Browser
  let browser = 'Unknown Browser';
  if (/Edg\/([\d.]+)/i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/([\d.]+)/i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/Chrome\/([\d.]+)/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox\/([\d.]+)/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\/([\d.]+)/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  }

  // 4. Device Label
  const device_label = `${device_type} ${browser}`.trim();

  return {
    device_type,
    operating_system,
    browser,
    user_agent: ua,
    device_label
  };
}

export function generateSessionUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STORAGE_SESSION_KEY = 'app_current_session_id';

/**
 * Record a user login session in public.user_sessions
 */
export async function recordLoginSession(userId: string, userRole: string): Promise<string> {
  const sessionId = generateSessionUUID();
  const deviceInfo = parseClientDeviceInfo();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
      sessionStorage.setItem(STORAGE_SESSION_KEY, sessionId);
      localStorage.setItem('app_current_session_user_id', userId);
      localStorage.setItem('app_current_session_user_role', userRole);
    } catch (e) {}
  }

  const payload = {
    user_id: userId,
    user_role: userRole,
    session_id: sessionId,
    device_type: deviceInfo.device_type,
    operating_system: deviceInfo.operating_system,
    browser: deviceInfo.browser,
    user_agent: deviceInfo.user_agent,
    device_label: deviceInfo.device_label,
  };

  try {
    // 1. Primary: send to server endpoint which gets exact client IP address and writes to database
    const res = await fetch('/api/sessions/record-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.ip_address && typeof window !== 'undefined') {
        localStorage.setItem('app_current_client_ip', data.ip_address);
      }
    }
  } catch (err) {
    console.warn('Backend session record error:', err);
  }

  // 2. Direct client-side insert attempt to user_sessions table in Supabase
  try {
    await supabase.from('user_sessions').insert({
      user_id: userId,
      user_role: userRole,
      session_id: sessionId,
      login_at: new Date().toISOString(),
      logout_at: null,
      last_active_at: new Date().toISOString(),
      device_type: deviceInfo.device_type,
      operating_system: deviceInfo.operating_system,
      browser: deviceInfo.browser,
      user_agent: deviceInfo.user_agent,
      device_label: deviceInfo.device_label,
      is_active: true
    });
  } catch (supabaseErr) {
    // Graceful fallback if table is not yet migrated in Supabase
    console.warn('Supabase client-side user_sessions insert notice:', supabaseErr);
  }

  return sessionId;
}

/**
 * Record a user logout in public.user_sessions
 */
export async function recordLogoutSession(explicitSessionId?: string, explicitUserId?: string): Promise<void> {
  const sessionId = explicitSessionId || (typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY)) : null);
  const userId = explicitUserId || (typeof window !== 'undefined' ? localStorage.getItem('app_current_session_user_id') : null);

  if (!sessionId && !userId) return;

  try {
    // 1. Primary: Server endpoint
    await fetch('/api/sessions/record-logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, user_id: userId })
    });
  } catch (err) {
    console.warn('Backend logout session update error:', err);
  }

  try {
    // 2. Client-side update
    if (sessionId) {
      await supabase
        .from('user_sessions')
        .update({
          logout_at: new Date().toISOString(),
          is_active: false,
          last_active_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    } else if (userId) {
      await supabase
        .from('user_sessions')
        .update({
          logout_at: new Date().toISOString(),
          is_active: false,
          last_active_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);
    }
  } catch (supabaseErr) {
    console.warn('Supabase client-side logout update notice:', supabaseErr);
  } finally {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        sessionStorage.removeItem(STORAGE_SESSION_KEY);
      } catch (e) {}
    }
  }
}

/**
 * Update last_active_at timestamp for the current active session
 */
export async function pingSessionActivity(): Promise<void> {
  const sessionId = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY)) : null;
  if (!sessionId) return;

  try {
    await fetch('/api/sessions/ping-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
  } catch (e) {}
}
