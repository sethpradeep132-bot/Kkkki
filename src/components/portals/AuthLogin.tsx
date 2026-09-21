import React, { useState } from 'react';
import { Eye, EyeOff, Check, User, ArrowLeft, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { recordLoginSession } from '../../utils/sessionTracker';

interface AuthLoginProps {
  portalName: 'Customer' | 'Seller' | 'Hub Manager' | 'Rider' | 'Cluster';
  onLoginSuccess: () => void;
  onBack: () => void;
}

export const getPortalStorageKey = (portalName: 'Customer' | 'Seller' | 'Hub Manager' | 'Rider' | 'Cluster') => {
  switch (portalName) {
    case 'Customer': return 'portal_auth_customer';
    case 'Seller': return 'portal_auth_seller';
    case 'Hub Manager': return 'portal_auth_hub';
    case 'Rider': return 'portal_auth_rider';
    case 'Cluster': return 'portal_auth_cluster';
    default: return 'portal_auth_user';
  }
};

export const AuthLogin: React.FC<AuthLoginProps> = ({ portalName, onLoginSuccess, onBack }) => {
  console.log("AuthLogin rendered for portal:", portalName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Customer Signup States
  const [isSignup, setIsSignup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState({
    fullName: '',
    mobileNumber: '',
    emailAccount: '',
    fullAddress: '',
    pincode: '',
    password: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    upiId: ''
  });

  const getTheme = () => {
    switch (portalName) {
      case 'Customer': return { primary: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'focus:border-blue-500', text: 'text-blue-600', ring: 'focus:ring-blue-500/20', iconBoxBg: 'bg-blue-50 text-blue-600', inputFocus: 'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15' };
      case 'Seller': return { primary: 'bg-orange-600', hover: 'hover:bg-orange-700', border: 'focus:border-orange-500', text: 'text-orange-600', ring: 'focus:ring-orange-500/20', iconBoxBg: 'bg-orange-50 text-orange-600', inputFocus: 'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15' };
      case 'Hub Manager': return { primary: 'bg-purple-600', hover: 'hover:bg-purple-700', border: 'focus:border-purple-500', text: 'text-purple-600', ring: 'focus:ring-purple-500/20', iconBoxBg: 'bg-purple-50 text-purple-600', inputFocus: 'focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15' };
      case 'Rider': return { primary: 'bg-emerald-600', hover: 'hover:bg-emerald-700', border: 'focus:border-emerald-500', text: 'text-emerald-600', ring: 'focus:ring-emerald-500/20', iconBoxBg: 'bg-emerald-50 text-emerald-600', inputFocus: 'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15' };
      default: return { primary: 'bg-slate-800', hover: 'hover:bg-slate-900', border: 'focus:border-slate-500', text: 'text-slate-800', ring: 'focus:ring-slate-500/20', iconBoxBg: 'bg-slate-100 text-slate-600', inputFocus: 'focus:border-slate-600 focus:ring-2 focus:ring-slate-600/15' };
    }
  };
  const theme = getTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { supabase } = await import('../../lib/supabase');
      let loggedUser: any = null;

      // 1. Try Supabase Auth first
      try {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        if (!authErr && data?.user) {
          loggedUser = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata
          };
        }
      } catch (err) {
        console.warn('Supabase auth sign-in warning:', err);
      }

      // 2. If not authenticated via Supabase auth, verify credentials in portal database table
      if (!loggedUser) {
        let tableName = '';
        let emailCol = 'registered_email';
        if (portalName === 'Customer') {
          tableName = 'customers';
          emailCol = 'email_account';
        } else if (portalName === 'Seller') {
          tableName = 'sellers';
          emailCol = 'registered_email';
        } else if (portalName === 'Hub Manager') {
          tableName = 'hub_managers';
          emailCol = 'registered_email';
        } else if (portalName === 'Rider') {
          tableName = 'riders';
          emailCol = 'registered_email';
        } else if (portalName === 'Cluster') {
          tableName = 'clusters';
          emailCol = 'registered_email';
        }

        if (tableName) {
          const { data: dbUser } = await supabase
            .from(tableName)
            .select('*')
            .eq(emailCol, email.trim())
            .eq('password', password)
            .maybeSingle();

          if (dbUser) {
            loggedUser = {
              id: dbUser.id,
              email: dbUser[emailCol],
              data: dbUser
            };
          }
        }
      }

      if (loggedUser) {
        // Check if user is frozen in their portal table
        let checkTable = '';
        let checkEmailCol = 'registered_email';
        if (portalName === 'Customer') {
          checkTable = 'customers';
          checkEmailCol = 'email_account';
        } else if (portalName === 'Seller') {
          checkTable = 'sellers';
          checkEmailCol = 'registered_email';
        } else if (portalName === 'Hub Manager') {
          checkTable = 'hub_managers';
          checkEmailCol = 'registered_email';
        } else if (portalName === 'Rider') {
          checkTable = 'riders';
          checkEmailCol = 'registered_email';
        } else if (portalName === 'Cluster') {
          checkTable = 'clusters';
          checkEmailCol = 'registered_email';
        }

        if (checkTable && portalName !== 'Customer') {
          let userRecord: any = loggedUser.data;
          if (!userRecord) {
            const { data } = await supabase
              .from(checkTable)
              .select('*')
              .or(`id.eq.${loggedUser.id},${checkEmailCol}.eq.${email.trim()}`)
              .maybeSingle();
            userRecord = data;
          }

          if (userRecord && (userRecord.freeze === 'true' || userRecord.freeze === true || userRecord.freeze === 'frozen')) {
            try {
              await supabase.auth.signOut();
            } catch (e) {}
            setError('access denied');
            return;
          }
        }

        localStorage.setItem(getPortalStorageKey(portalName), JSON.stringify(loggedUser));

        // Record user login session in public.user_sessions
        try {
          const roleMapping: Record<string, string> = {
            'Cluster': 'cluster',
            'Customer': 'customer',
            'Seller': 'seller',
            'Hub Manager': 'hub_manager',
            'Rider': 'rider'
          };
          const userRole = roleMapping[portalName] || portalName.toLowerCase();
          const userId = loggedUser?.id || loggedUser?.data?.id || email.trim();
          recordLoginSession(userId, userRole).catch((err) => {
            console.warn('Session logging notice:', err);
          });
        } catch (sessionErr) {
          console.warn('Session record initiation notice:', sessionErr);
        }

        onLoginSuccess();
      } else {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.password || customerData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { supabase } = await import('../../lib/supabase');
      // Sign up user using the server-side API to bypass rate limits
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerData.emailAccount,
          password: customerData.password,
          user_metadata: {
            full_name: customerData.fullName,
            role: 'customer'
          }
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      
      const authData = { user: data.user };
      
      if (authData.user) {
        // Insert into customers table
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            full_name: customerData.fullName,
            mobile_number: customerData.mobileNumber,
            email_account: customerData.emailAccount,
            full_address: customerData.fullAddress,
            pincode: customerData.pincode,
            password: customerData.password,
            bank_name: customerData.bankName,
            account_no: customerData.accountNo,
            ifsc_code: customerData.ifscCode,
            upi_id: customerData.upiId
          });
          
        if (insertError) throw insertError;
        
        setGeneratedId(customerData.emailAccount);
        setGeneratedPassword(customerData.password);
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = `w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${theme.border} ${theme.ring}`;

  if (isSuccess && isSignup) {
    return (
      <div className="fixed inset-0 w-full bg-gray-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
            <Check size={28} className="text-white" strokeWidth={3} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Signup Successful!</h2>
        <p className="text-slate-500 text-sm font-medium mb-8 text-center max-w-xs">
          Your customer account has been created successfully. You can now login.
        </p>
        <button 
          onClick={() => {
            setIsSuccess(false);
            setIsSignup(false);
          }}
          className={`px-12 h-12 ${theme.primary} ${theme.hover} text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg`}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const monoInput = `${inputBase} font-mono`;
  const passwordInput = `w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${theme.border} ${theme.ring}`;

  if (isSignup) {
    return (
      <div className="fixed inset-0 w-full bg-[#F8FAFC] flex flex-col items-center pt-8 pb-12 px-4 overflow-y-auto">
        <div className="w-full max-w-xl mb-6 flex items-center relative">
          <button onClick={() => setIsSignup(false)} className="absolute left-0 p-2 bg-white rounded-full shadow-sm text-gray-700 hover:bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-2xl font-black text-slate-800 w-full text-center">Create Customer ID</h2>
        </div>
        
        <form onSubmit={handleSignup} className="w-full max-w-xl space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium text-center">{error}</div>}
          
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
              <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                <User size={14} strokeWidth={2.4} />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Personal Details
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerData.fullName}
                  onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                  className={inputBase}
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input 
                  type="tel" 
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={customerData.mobileNumber}
                  onChange={(e) => { e.target.setCustomValidity(""); setCustomerData({ ...customerData, mobileNumber: e.target.value.replace(/\D/g, '') }) }}
                  onInvalid={(e) => e.target.setCustomValidity("Please enter a valid 10-digit mobile number")}
                  className={monoInput}
                />
              </div>

              {/* Email Account */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Account *
                </label>
                <input 
                  type="email" 
                  pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
                  required
                  placeholder="e.g. rahul@example.com"
                  value={customerData.emailAccount}
                  onChange={(e) => { e.target.setCustomValidity(""); setCustomerData({ ...customerData, emailAccount: e.target.value }) }}
                  onInvalid={(e) => e.target.setCustomValidity("Please enter a valid email address (e.g. user@example.com). Do not use multiple @ symbols.")}
                  className={inputBase}
                />
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Address
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Ward No. 4, Station Road, Suriyawan"
                  value={customerData.fullAddress}
                  onChange={(e) => setCustomerData({ ...customerData, fullAddress: e.target.value })}
                  className={inputBase}
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="e.g. 221404"
                  value={customerData.pincode}
                  onChange={(e) => { e.target.setCustomValidity(""); setCustomerData({ ...customerData, pincode: e.target.value.replace(/\D/g, '') }) }}
                  onInvalid={(e) => e.target.setCustomValidity("Please enter a valid 6-digit pincode")}
                  className={monoInput}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    minLength={6}
                    placeholder="Set customer account password"
                    value={customerData.password}
                    onChange={(e) => { e.target.setCustomValidity(""); setCustomerData({ ...customerData, password: e.target.value }) }}
                    onInvalid={(e) => e.target.setCustomValidity("Password must be at least 6 characters long")}
                    className={passwordInput}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 rounded-xl text-white font-bold text-[15px] flex items-center justify-center transition-all shadow-lg active:scale-95 ${theme.primary} ${theme.hover} disabled:opacity-70`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-1">
                  <span>Signing Up</span>
                  <span className="flex space-x-0.5 mt-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                  </span>
                </div>
              ) : (
                'Securely Sign Up'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }


  const isCustomer = portalName === 'Customer';

  return (
    <div className={`fixed inset-0 z-50 w-full bg-gray-50 flex flex-col items-center overflow-y-auto p-4 ${
      isCustomer ? 'justify-start pt-12 sm:pt-16 pb-10' : 'justify-center'
    }`}>
      <div className={`w-full max-w-sm ${isCustomer ? 'mt-3 sm:mt-4' : ''}`}>
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 font-medium text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Portals
        </button>
        
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl ${theme.primary} text-white flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <User size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center">
              <span className={theme.text}>Welcome to Suriyawan Shopping</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Please enter your credentials</p>
          </div>
          
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold text-center">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">User ID (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputBase}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 mt-2 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-all shadow-lg active:scale-95 ${theme.primary} ${theme.hover} disabled:opacity-70`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> 
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login Securely'
              )}
            </button>
          </form>
          
          {portalName === 'Customer' && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-slate-500 text-sm mb-3">Don't have an account?</p>
              <button
                onClick={() => setIsSignup(true)}
                className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                Sign up here <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
