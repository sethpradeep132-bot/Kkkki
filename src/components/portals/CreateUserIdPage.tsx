import { AvatarUpload } from "../AvatarUpload";
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  User, 
  Store, 
  Building2, 
  Truck, 
  CreditCard,
  Edit2, 
  FileText, 
  ShieldCheck, LogOut, Trash,
  Check,
  Copy, ShieldAlert
} from 'lucide-react';

export type UserTypeCategory = 'Customer' | 'Seller' | 'Hub Manager' | 'Rider' | 'Cluster';

interface CreateUserIdPageProps {
  initialType?: UserTypeCategory;
  isReadOnly?: boolean;
  isLoading?: boolean;
  initialData?: any;
  adminProfileId?: string | null;
  onBack: () => void;
  onUserCreated?: (userData: any) => void;
  onLogout?: () => void;
  onLossPenalty?: () => void;
  isApprovalMode?: boolean;
}

export const CreateUserIdPage: React.FC<CreateUserIdPageProps> = ({
  initialType = 'Customer',
  isReadOnly = false,
  isLoading = false,
  initialData,
  adminProfileId = null,
  onBack,
  onUserCreated,
  onLogout,
  onLossPenalty,
  isApprovalMode
}) => {
  const [selectedType] = useState<UserTypeCategory>(initialType);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  // Dynamic Theme according to the selected Chip color
  const getTheme = (type: UserTypeCategory) => {
    switch (type) {
      case 'Customer':
        return {
          badgeBg: 'bg-blue-600 text-white shadow-blue-500/20',
          primaryBtn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/25',
          iconBoxBg: 'bg-blue-50 text-blue-600',
          inputFocus: 'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15',
          backHover: 'hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50',
          successBadge: 'bg-blue-50 text-blue-700 border-blue-200',
          successIconBg: 'bg-blue-600 text-white',
          successText: 'text-blue-900',
          successSubText: 'text-blue-700'
        };
      case 'Seller':
        return {
          badgeBg: 'bg-amber-500 text-white shadow-amber-500/20',
          primaryBtn: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/25',
          iconBoxBg: 'bg-amber-50 text-amber-600',
          inputFocus: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15',
          backHover: 'hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50',
          successBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          successIconBg: 'bg-amber-600 text-white',
          successText: 'text-amber-900',
          successSubText: 'text-amber-700'
        };
      case 'Hub Manager':
        return {
          badgeBg: 'bg-purple-600 text-white shadow-purple-500/20',
          primaryBtn: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-purple-500/25',
          iconBoxBg: 'bg-purple-50 text-purple-600',
          inputFocus: 'focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15',
          backHover: 'hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50/50',
          successBadge: 'bg-purple-50 text-purple-700 border-purple-200',
          successIconBg: 'bg-purple-600 text-white',
          successText: 'text-purple-900',
          successSubText: 'text-purple-700'
        };
      case 'Cluster':
        return {
          badgeBg: 'bg-slate-800 text-white shadow-slate-500/20',
          primaryBtn: 'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 shadow-slate-500/25',
          iconBoxBg: 'bg-slate-100 text-slate-800',
          inputFocus: 'focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15',
          backHover: 'hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50/50',
          successBadge: 'bg-slate-100 text-slate-800 border-slate-200',
          successIconBg: 'bg-slate-800 text-white',
          successText: 'text-slate-900',
          successSubText: 'text-slate-700'
        };
      case 'Rider':
        return {
          badgeBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
          primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-500/25',
          iconBoxBg: 'bg-emerald-50 text-emerald-600',
          inputFocus: 'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15',
          backHover: 'hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50',
          successBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          successIconBg: 'bg-emerald-600 text-white',
          successText: 'text-emerald-900',
          successSubText: 'text-emerald-700'
        };
      default:
        return {
          badgeBg: 'bg-blue-600 text-white shadow-blue-500/20',
          primaryBtn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/25',
          iconBoxBg: 'bg-blue-50 text-blue-600',
          inputFocus: 'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15',
          backHover: 'hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50',
          successBadge: 'bg-blue-50 text-blue-700 border-blue-200',
          successIconBg: 'bg-blue-600 text-white',
          successText: 'text-blue-900',
          successSubText: 'text-blue-700'
        };
    }
  };

  const theme = getTheme(selectedType);
  const inputBase = `w-full h-10 px-3 bg-white border border-slate-200 hover:border-slate-300 ${theme.inputFocus} rounded-xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all`;
  const monoInput = `${inputBase} font-mono`;
  const upperInput = `${inputBase} font-mono uppercase`;
  const passwordInput = `w-full h-10 pl-3 pr-10 bg-white border border-slate-200 hover:border-slate-300 ${theme.inputFocus} rounded-xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all`;

  // 1. Customer Form State
  const isEditing = !!initialData || isReadOnly;
  const [isFormEditable, setIsFormEditable] = useState(!initialData && !isReadOnly);
  const [isBankEditing, setIsBankEditing] = useState(false);
  const [isBankSaving, setIsBankSaving] = useState(false);

  React.useEffect(() => {
    setIsFormEditable(!initialData && !isReadOnly);
  }, [initialData, isReadOnly]);

  const handleSaveBankDetails = async () => {
    if (!initialData?.id) return;
    setIsBankSaving(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase
        .from('clusters')
        .update({
          bank_name: clusterData.bankName,
          account_no: clusterData.accountNo,
          ifsc_code: clusterData.ifscCode,
          upi_id: clusterData.upiId
        })
        .eq('id', initialData.id);
        
      if (error) throw error;
      setIsBankEditing(false);
    } catch (err) {
      console.error("Error saving bank details:", err);
    } finally {
      setIsBankSaving(false);
    }
  };
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

  // 2. Seller Form State
  const [sellerData, setSellerData] = useState({
    shopName: '',
    trustYearsInBusiness: '',
    sellerName: '',
    registeredMobileNumber: '',
    registeredEmail: '',
    registeredFullAddress: '',
    registeredPincode: '',
    password: '',
    aadhaarCard: '',
    panCard: '',
    gstin: '',
    shopEstablishment: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    upiId: ''
  });

  // 3. Hub Manager Form State
  const [hubManagerData, setHubManagerData] = useState({
    avatar: initialData?.avatar || "",
    storeName: initialData?.store_name || 'Suriyawan Shopping',
    hubName: '',
    hubManagerName: '',
    registeredMobileNumber: '',
    registeredEmail: '',
    registeredFullAddress: '',
    registeredPincode: '',
    password: '',
    aadhaarCard: '',
    panCard: '',
    voterId: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    upiId: ''
  });

  // 5. Cluster Form State
  const [clusterData, setClusterData] = useState({
    avatar: initialData?.avatar || "",
    storeName: '',
    hubName: '',
    clusterName: '',
    registeredMobileNumber: '',
    registeredEmail: '',
    registeredFullAddress: '',
    registeredPincode: '',
    password: '',
    aadhaarCard: '',
    panCard: '',
    voterId: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    upiId: ''
  });

  // 4. Rider Form State
  const [riderData, setRiderData] = useState({
    avatar: initialData?.avatar || "",
    riderName: '',
    registeredMobileNumber: '',
    registeredEmail: '',
    registeredFullAddress: '',
    registeredPincode: '',
    password: '',
    aadhaarCard: '',
    panCard: '',
    drivingLicence: '',
    vehicleNo: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    upiId: ''
  });

  // Duplicate error states for same ID type validation
  const [duplicateErrors, setDuplicateErrors] = useState({
    mobile: false,
    email: false,
    aadhaar: false,
    pan: false
  });

  const getActiveValues = (type = selectedType) => {
    switch (type) {
      case 'Customer':
        return {
          mobile: customerData.mobileNumber,
          email: customerData.emailAccount,
          aadhaar: '',
          pan: ''
        };
      case 'Seller':
        return {
          mobile: sellerData.registeredMobileNumber,
          email: sellerData.registeredEmail,
          aadhaar: sellerData.aadhaarCard,
          pan: sellerData.panCard
        };
      case 'Hub Manager':
        return {
          mobile: hubManagerData.registeredMobileNumber,
          email: hubManagerData.registeredEmail,
          aadhaar: hubManagerData.aadhaarCard,
          pan: hubManagerData.panCard
        };
      case 'Cluster':
        return {
          mobile: clusterData.registeredMobileNumber,
          email: clusterData.registeredEmail,
          aadhaar: clusterData.aadhaarCard,
          pan: clusterData.panCard
        };
      case 'Rider':
        return {
          mobile: riderData.registeredMobileNumber,
          email: riderData.registeredEmail,
          aadhaar: riderData.aadhaarCard,
          pan: riderData.panCard
        };
      default:
        return { mobile: '', email: '', aadhaar: '', pan: '' };
    }
  };

  const validateFieldDuplicates = async (
    fieldValues?: { mobile?: string; email?: string; aadhaar?: string; pan?: string }
  ) => {
    const current = fieldValues || getActiveValues();
    const excludeId = isEditing && initialData?.id ? initialData.id : undefined;

    const newErrors = {
      mobile: false,
      email: false,
      aadhaar: false,
      pan: false
    };

    const hasAnyValue =
      (current.mobile && current.mobile.trim()) ||
      (current.email && current.email.trim()) ||
      (current.aadhaar && current.aadhaar.trim()) ||
      (current.pan && current.pan.trim());

    if (!hasAnyValue) {
      setDuplicateErrors(newErrors);
      return newErrors;
    }

    try {
      const res = await fetch('/api/admin/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: selectedType,
          mobile: current.mobile,
          email: current.email,
          aadhaar: current.aadhaar,
          pan: current.pan,
          excludeId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.duplicates) {
          const checked = {
            mobile: current.mobile?.trim() ? !!data.duplicates.mobile : false,
            email: current.email?.trim() ? !!data.duplicates.email : false,
            aadhaar: current.aadhaar?.trim() ? !!data.duplicates.aadhaar : false,
            pan: current.pan?.trim() ? !!data.duplicates.pan : false
          };
          setDuplicateErrors(checked);
          return checked;
        }
      }
    } catch (err) {
      console.error('Error checking duplicate details:', err);
    }
    return newErrors;
  };

  React.useEffect(() => {
    setDuplicateErrors({ mobile: false, email: false, aadhaar: false, pan: false });
  }, [selectedType]);

  React.useEffect(() => {
    const values = getActiveValues();

    // Immediately clear errors for fields that are now empty
    setDuplicateErrors(prev => {
      const updated = { ...prev };
      if (!values.mobile?.trim()) updated.mobile = false;
      if (!values.email?.trim()) updated.email = false;
      if (!values.aadhaar?.trim()) updated.aadhaar = false;
      if (!values.pan?.trim()) updated.pan = false;
      return updated;
    });

    const timer = setTimeout(() => {
      validateFieldDuplicates(values);
    }, 250);

    return () => clearTimeout(timer);
  }, [
    selectedType,
    customerData.mobileNumber,
    customerData.emailAccount,
    sellerData.registeredMobileNumber,
    sellerData.registeredEmail,
    sellerData.aadhaarCard,
    sellerData.panCard,
    hubManagerData.registeredMobileNumber,
    hubManagerData.registeredEmail,
    hubManagerData.aadhaarCard,
    hubManagerData.panCard,
    clusterData.registeredMobileNumber,
    clusterData.registeredEmail,
    clusterData.aadhaarCard,
    clusterData.panCard,
    riderData.registeredMobileNumber,
    riderData.registeredEmail,
    riderData.aadhaarCard,
    riderData.panCard
  ]);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Append a couple of characters from timestamp to guarantee uniqueness across identical ticks if ever possible
    pwd += Date.now().toString(36).slice(-2);
    return pwd;
  };

  
  React.useEffect(() => {
    if (!initialData) return;
    
    if (initialType === 'Customer') {
      setCustomerData({
        fullName: initialData.full_name || '',
        mobileNumber: initialData.mobile_number || '',
        emailAccount: initialData.email_account || '',
        fullAddress: initialData.full_address || '',
        pincode: initialData.pincode || '',
        password: initialData.password || '',
        bankName: initialData.bank_name || '',
        accountNo: initialData.account_no || '',
        ifscCode: initialData.ifsc_code || '',
        upiId: initialData.upi_id || ''
      });
    } else if (initialType === 'Seller') {
      setSellerData({
        shopName: initialData.shop_name || '',
        trustYearsInBusiness: initialData.trust_years_in_business || '',
        sellerName: initialData.seller_name || '',
        registeredMobileNumber: initialData.registered_mobile_number || '',
        registeredEmail: initialData.registered_email || '',
        registeredFullAddress: initialData.registered_full_address || '',
        registeredPincode: initialData.registered_pincode || '',
        password: initialData.password || '',
        aadhaarCard: initialData.aadhaar_card || '',
        panCard: initialData.pan_card || '',
        gstin: initialData.gstin || '',
        shopEstablishment: initialData.shop_establishment || '',
        bankName: initialData.bank_name || '',
        accountNo: initialData.account_no || '',
        ifscCode: initialData.ifsc_code || '',
        upiId: initialData.upi_id || ''
      });
    } else if (initialType === 'Hub Manager') {
      setHubManagerData({
        storeName: initialData.store_name || 'Suriyawan Shopping',
        hubName: initialData.hub_name || '',
        hubManagerName: initialData.hub_manager_name || '',
        registeredMobileNumber: initialData.registered_mobile_number || '',
        registeredEmail: initialData.registered_email || '',
        registeredFullAddress: initialData.registered_full_address || '',
        registeredPincode: initialData.registered_pincode || '',
        password: initialData.password || '',
        aadhaarCard: initialData.aadhaar_card || '',
        panCard: initialData.pan_card || '',
        voterId: initialData.voter_id || '',
        bankName: initialData.bank_name || '',
        accountNo: initialData.account_no || '',
        ifscCode: initialData.ifsc_code || '',
        upiId: initialData.upi_id || ''
      });
        } else if (initialType === 'Cluster') {
      setClusterData({
        avatar: initialData.avatar || '',
        storeName: '',
        hubName: '',
        clusterName: initialData.cluster_name || '',
        registeredMobileNumber: initialData.registered_mobile_number || '',
        registeredEmail: initialData.registered_email || '',
        registeredFullAddress: initialData.registered_full_address || '',
        registeredPincode: initialData.registered_pincode || '',
        password: initialData.password || '',
        aadhaarCard: initialData.aadhaar_card || '',
        panCard: initialData.pan_card || '',
        voterId: initialData.voter_id || '',
        bankName: initialData.bank_name || '',
        accountNo: initialData.account_no || '',
        ifscCode: initialData.ifsc_code || '',
        upiId: initialData.upi_id || ''
      });
    } else if (initialType === 'Rider') {
      setRiderData({
        avatar: initialData?.avatar || '',
        riderName: initialData?.rider_name || '',
        registeredMobileNumber: initialData?.registered_mobile_number || '',
        registeredEmail: initialData?.registered_email || '',
        registeredFullAddress: initialData?.registered_full_address || '',
        registeredPincode: initialData?.registered_pincode || '',
        password: initialData?.password || '',
        aadhaarCard: initialData?.aadhaar_card || '',
        panCard: initialData?.pan_card || '',
        drivingLicence: initialData?.driving_licence || '',
        vehicleNo: initialData?.vehicle_no || '',
        bankName: initialData?.bank_name || '',
        accountNo: initialData?.account_no || '',
        ifscCode: initialData?.ifsc_code || '',
        upiId: initialData?.upi_id || ''
      });
    }
  }, [initialData, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let prefix = 'SS-CUST';
    let name = '';
    let phone = '';
    let secondary = '';
    let email = '';
    let password = '';
    let role = 'customer';
    let formData: any = {};
    let tableName = '';

    if (selectedType === 'Customer') {
      prefix = 'SS-CUST';
      name = customerData.fullName;
      phone = customerData.mobileNumber;
      secondary = `${customerData.fullAddress || ''} (Pin: ${customerData.pincode || '221404'})`;
      email = customerData.emailAccount || `${phone}@suriyawan.in`;
      password = customerData.password;
      role = 'customer';
      tableName = 'customers';
      formData = {
        full_name: customerData.fullName,
        mobile_number: customerData.mobileNumber,
        email_account: customerData.emailAccount,
        full_address: customerData.fullAddress,
        pincode: customerData.pincode,
        password: customerData.password, // Only storing because requested in schema, avoid in real prod
        bank_name: customerData.bankName,
        account_no: customerData.accountNo,
        ifsc_code: customerData.ifscCode,
        upi_id: customerData.upiId
      };
    } else if (selectedType === 'Seller') {
      prefix = 'SS-SELL';
      name = sellerData.sellerName || sellerData.shopName;
      phone = sellerData.registeredMobileNumber;
      secondary = `${sellerData.shopName} • ${sellerData.registeredFullAddress || 'Suriyawan'}`;
      email = sellerData.registeredEmail || `${phone}@suriyawan.in`;
      password = isEditing ? (selectedType === "Seller" ? sellerData.password : selectedType === "Hub Manager" ? hubManagerData.password : selectedType === "Cluster" ? clusterData.password : selectedType === "Rider" ? riderData.password : generatePassword()) : generatePassword();
      role = 'seller';
      tableName = isApprovalMode ? 'sellers_for_approval' : 'sellers';
      formData = {
        shop_name: sellerData.shopName,
        trust_years_in_business: sellerData.trustYearsInBusiness,
        seller_name: sellerData.sellerName,
        registered_mobile_number: sellerData.registeredMobileNumber,
        registered_email: sellerData.registeredEmail,
        registered_full_address: sellerData.registeredFullAddress,
        registered_pincode: sellerData.registeredPincode,
        password: password,
        aadhaar_card: sellerData.aadhaarCard,
        pan_card: sellerData.panCard,
        gstin: sellerData.gstin,
        shop_establishment: sellerData.shopEstablishment,
        bank_name: sellerData.bankName,
        account_no: sellerData.accountNo,
        ifsc_code: sellerData.ifscCode,
        upi_id: sellerData.upiId,
        upload_service_visible: false
      };
    } else if (selectedType === 'Hub Manager') {
      prefix = 'SS-HUB';
      name = hubManagerData.hubManagerName || hubManagerData.hubName;
      phone = hubManagerData.registeredMobileNumber;
      secondary = `${hubManagerData.hubName} (${hubManagerData.storeName})`;
      email = hubManagerData.registeredEmail || `${phone}@suriyawan.in`;
      password = isEditing ? (selectedType === "Seller" ? sellerData.password : selectedType === "Hub Manager" ? hubManagerData.password : selectedType === "Cluster" ? clusterData.password : selectedType === "Rider" ? riderData.password : generatePassword()) : generatePassword();
      role = 'hub_manager';
      tableName = 'hub_managers';
      formData = {
        avatar: hubManagerData.avatar,
        store_name: hubManagerData.storeName,
        hub_name: hubManagerData.hubName,
        hub_manager_name: hubManagerData.hubManagerName,
        registered_mobile_number: hubManagerData.registeredMobileNumber,
        registered_email: hubManagerData.registeredEmail,
        registered_full_address: hubManagerData.registeredFullAddress,
        registered_pincode: hubManagerData.registeredPincode,
        password: password,
        aadhaar_card: hubManagerData.aadhaarCard,
        pan_card: hubManagerData.panCard,
        voter_id: hubManagerData.voterId,
        bank_name: hubManagerData.bankName,
        account_no: hubManagerData.accountNo,
        ifsc_code: hubManagerData.ifscCode,
        upi_id: hubManagerData.upiId
      };
    } else if (selectedType === 'Cluster') {
      prefix = 'SS-CLUS';
      name = clusterData.clusterName;
      phone = clusterData.registeredMobileNumber;
      secondary = `Cluster ${clusterData.clusterName}`;
      email = clusterData.registeredEmail || `${phone}@suriyawan.in`;
      password = isEditing ? (selectedType === "Seller" ? sellerData.password : selectedType === "Hub Manager" ? hubManagerData.password : selectedType === "Cluster" ? clusterData.password : selectedType === "Rider" ? riderData.password : generatePassword()) : generatePassword();
      role = 'cluster';
      tableName = 'clusters';
      formData = {
        avatar: clusterData.avatar,
        cluster_name: clusterData.clusterName,
        registered_mobile_number: clusterData.registeredMobileNumber,
        registered_email: clusterData.registeredEmail,
        registered_full_address: clusterData.registeredFullAddress,
        registered_pincode: clusterData.registeredPincode,
        password: password,
        aadhaar_card: clusterData.aadhaarCard,
        pan_card: clusterData.panCard,
        voter_id: clusterData.voterId,
        bank_name: clusterData.bankName,
        account_no: clusterData.accountNo,
        ifsc_code: clusterData.ifscCode,
        upi_id: clusterData.upiId
      };
    } else if (selectedType === 'Rider') {
      prefix = 'SS-RIDE';
      name = riderData.riderName;
      phone = riderData.registeredMobileNumber;
      secondary = `${riderData.vehicleNo || 'Bike'} • ${riderData.registeredFullAddress || 'Suriyawan'}`;
      email = riderData.registeredEmail || `${phone}@suriyawan.in`;
      password = isEditing ? (selectedType === "Seller" ? sellerData.password : selectedType === "Hub Manager" ? hubManagerData.password : selectedType === "Cluster" ? clusterData.password : selectedType === "Rider" ? riderData.password : generatePassword()) : generatePassword();
      role = 'rider';
      tableName = isApprovalMode ? 'riders_for_approval' : 'riders';
      formData = {
        avatar: riderData.avatar,
        rider_name: riderData.riderName,
        registered_mobile_number: riderData.registeredMobileNumber,
        registered_email: riderData.registeredEmail,
        registered_full_address: riderData.registeredFullAddress,
        registered_pincode: riderData.registeredPincode,
        password: password,
        aadhaar_card: riderData.aadhaarCard,
        pan_card: riderData.panCard,
        driving_licence: riderData.drivingLicence,
        vehicle_no: riderData.vehicleNo,
        bank_name: riderData.bankName,
        account_no: riderData.accountNo,
        ifsc_code: riderData.ifscCode,
        upi_id: riderData.upiId
      };
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newGeneratedId = `${prefix}-${randomSuffix}`;

    // Live validation for duplicate checking within same user type
    const currentValues = getActiveValues();
    const dups = await validateFieldDuplicates(currentValues);
    if (dups && (dups.mobile || dups.email || dups.aadhaar || dups.pan)) {
      setIsSubmitting(false);
      return;
    }
    
    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    // ID is returned from Auth creation, we don't save custom text IDs to profile tables
    
    try {
      // 1. Call Backend API to create Auth User (which triggers profile creation)
      
      const { supabase } = await import('../../lib/supabase');
      let authUserId = initialData?.id;

      if (!isEditing) {
        const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: authUserId, // Pass existing ID if in approval mode
            email,
            password,
            user_metadata: {
              role,
              full_name: name
            },
            userType: selectedType,
            mobile: currentValues.mobile,
            aadhaar: currentValues.aadhaar,
            pan: currentValues.pan,
            excludeId: isEditing ? initialData?.id : undefined
          })
        });
        const data = await res.json();
        if (!res.ok) {
          if (data && data.duplicates) {
            setDuplicateErrors(data.duplicates);
          }
          setIsSubmitting(false);
          return;
        }
        // If it already exists or succeeded
        if (res.ok && data.user) {
          authUserId = data.user.id;
        }
      }


      // 2. Insert into the specific role table
      
      // Only use adminProfileId if we explicitly have one passed (e.g. from ClusterPortal)
      let clusterId = adminProfileId || null;

      // Do NOT fallback to localStorage here, because Admin Portal should NOT set cluster_id
      // but might accidentally read a leftover localStorage item from a previous Cluster login.
      if (clusterId && (tableName === 'riders' || tableName === 'riders_for_approval' || tableName === 'hub_managers')) {
        formData.cluster_id = clusterId;
      }
      
      const dbPayload = isApprovalMode && !isEditing ? { ...formData } : { id: authUserId, ...formData };
      let insertError = null;
      if (isEditing) {
        const { error } = await supabase.from(tableName).update(formData).eq('id', authUserId);
        insertError = error;
      } else {
        const { error } = await supabase.from(tableName).insert([dbPayload]);
        insertError = error;
      }

        
      if (insertError) {
        throw insertError;
      }

      if (isEditing) {
        setIsSuccess(true);
        setIsSubmitting(false);
        if (onUserCreated) {
          onUserCreated({
            id: authUserId,
            type: `${selectedType} ID`,
            name: name || `${selectedType} User`,
            phone: phone || '9876543210',
            secondaryInfo: secondary,
            status: selectedType === 'Seller' ? 'Verified' : 'Active',
            createdDate: 'Just now',
            extraBadge: 'Updated ID'
          });
        }
        return;
      }

      setGeneratedId(newGeneratedId);
      setGeneratedPassword(password);
      setIsSuccess(true);
      setIsSubmitting(false);
      if (onUserCreated) {
        onUserCreated({
          id: newGeneratedId,
          type: `${selectedType} ID`,
          name: name || `${selectedType} User`,
          phone: phone || '9876543210',
          secondaryInfo: secondary,
          status: selectedType === 'Seller' ? 'Verified' : 'Active',
          createdDate: 'Just now',
          extraBadge: 'New ID'
        });
      }

    } catch (err: any) {
      alert("Error: " + err.message);
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 flex flex-col font-poppins antialiased select-none overflow-hidden">
      
      {/* ========================================================
          TOP HEADER
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 sm:px-6 min-h-[58px] sm:min-h-[64px] h-auto py-2.5 flex items-center justify-between shadow-xs shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            onClick={onBack}
            id="btn-back-from-create-id"
            className={`p-1.5 rounded-lg border border-slate-200 text-slate-600 ${theme.backHover} transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0`}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {isEditing ? 'View / Edit' : 'Create'} {selectedType} ID
            </h1>
            <span className={`shrink-0 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badgeBg} uppercase tracking-wider shadow-2xs`}>
              {selectedType} ID
            </span>
          </div>
        </div>

        
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {!isEditing && (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Admin Creation Console
            </span>
          )}
          {isEditing && (
            <div className="flex items-center gap-1.5 shrink-0">
              {!isFormEditable && !isReadOnly && selectedType !== 'Customer' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsFormEditable(true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold transition-colors cursor-pointer shadow-sm shrink-0"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          )}
        
          
          {onLossPenalty && (
            <button
              type="button"
              onClick={onLossPenalty}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <ShieldAlert size={14} strokeWidth={2.5} className="shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap">Loss & Penalty</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <LogOut size={14} strokeWidth={2.5} className="shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================
          MAIN CONTENT CONTAINER
          ======================================================== */}
      <main className="flex-1 overflow-y-auto py-5 px-3 sm:px-6 max-w-3xl w-full mx-auto relative pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm font-bold text-slate-500">Loading<span className="loading-ellipsis"></span></p>
          </div>
        ) : (
          <>
        {/* Success Modal if Submitted */}
        {isSuccess && !isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-5 flex flex-col items-center justify-center text-center bg-slate-800 text-white">
                <h3 className="font-bold text-lg">Hint</h3>
                <p className="text-white/80 text-xs mt-1">Credentials generated successfully</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">User ID</p>
                    <p className="font-mono text-sm font-bold text-slate-800">{generatedId}</p>
                  </div>
                  
                </div>
                
                {generatedPassword && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Password</p>
                      <p className="font-mono text-sm font-bold text-slate-800">{generatedPassword}</p>
                    </div>
                    
                  </div>
                )}
                
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onBack}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm text-white ${theme.primaryBtn} transition-all`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Modal for Edit */}
        {isSuccess && isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <Check size={32} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-1">Update Successful!</h3>
              <p className="text-slate-500 text-sm mb-6">User details have been updated in the database.</p>
              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            FORM CONTAINER (Direct Form for Selected Role)

            ======================================================== */}
        <form onSubmit={handleSubmit} className="space-y-4" id="create-user-id-form">
          <fieldset disabled={!isFormEditable} className="space-y-4 border-0 p-0 m-0">
          
          {/* ========================================================
              1. CUSTOMER FORM
              ======================================================== */}
          {selectedType === 'Customer' && (
            <>
              {/* Personal Details */}
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
                    {duplicateErrors.mobile && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This mobile number is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="tel" 
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={customerData.mobileNumber}
                      onChange={(e) => setCustomerData({ ...customerData, mobileNumber: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* Email Account */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Account
                    </label>
                    {duplicateErrors.email && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This email is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="email" 
                      placeholder="e.g. rahul@example.com"
                      value={customerData.emailAccount}
                      onChange={(e) => setCustomerData({ ...customerData, emailAccount: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Full Address (Address before Pincode) */}
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
                      maxLength={6}
                      placeholder="e.g. 221404"
                      value={customerData.pincode}
                      onChange={(e) => setCustomerData({ ...customerData, pincode: e.target.value.replace(/\D/g, '') })}
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
                        placeholder="Set customer account password"
                        value={customerData.password}
                        onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                        className={passwordInput}
                      />
                      <div 
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
>
  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <CreditCard size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Bank Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. State Bank of India"
                      value={customerData.bankName}
                      onChange={(e) => setCustomerData({ ...customerData, bankName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Account No. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account No.
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012"
                      value={customerData.accountNo}
                      onChange={(e) => setCustomerData({ ...customerData, accountNo: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input 
                      type="text" 
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={customerData.ifscCode}
                      onChange={(e) => setCustomerData({ ...customerData, ifscCode: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. username@okhdfcbank"
                      value={customerData.upiId}
                      onChange={(e) => setCustomerData({ ...customerData, upiId: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              2. SELLER FORM
              ======================================================== */}
          {selectedType === 'Seller' && (
            <>
              {/* Business & Personal Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <Store size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Business & Personal Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Shop Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shop Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Gupta General Store"
                      value={sellerData.shopName}
                      onChange={(e) => setSellerData({ ...sellerData, shopName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Trust Years in Business */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Trust Years in Business
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 5 Years"
                      value={sellerData.trustYearsInBusiness}
                      onChange={(e) => setSellerData({ ...sellerData, trustYearsInBusiness: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Seller Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Seller Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Manoj Gupta"
                      value={sellerData.sellerName}
                      onChange={(e) => setSellerData({ ...sellerData, sellerName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Mobile Number *
                    </label>
                    {duplicateErrors.mobile && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This mobile number is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="tel" 
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={sellerData.registeredMobileNumber}
                      onChange={(e) => setSellerData({ ...sellerData, registeredMobileNumber: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* Registered Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Email
                    </label>
                    {duplicateErrors.email && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This email is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="email" 
                      placeholder="e.g. manojgupta@shop.com"
                      value={sellerData.registeredEmail}
                      onChange={(e) => setSellerData({ ...sellerData, registeredEmail: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Full Address (Address before Pincode) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Full Address
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Main Market, Near Railway Crossing, Suriyawan"
                      value={sellerData.registeredFullAddress}
                      onChange={(e) => setSellerData({ ...sellerData, registeredFullAddress: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Pincode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Pincode
                    </label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="e.g. 221404"
                      value={sellerData.registeredPincode}
                      onChange={(e) => setSellerData({ ...sellerData, registeredPincode: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Set password"
                        value={sellerData.password}
                        onChange={(e) => setSellerData({ ...sellerData, password: e.target.value })}
                        className={monoInput}
                      />
                      <div 
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
>
  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents & KYC */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <FileText size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Documents & KYC
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Aadhaar Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aadhaar Card
                    </label>
                    {duplicateErrors.aadhaar && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This Aadhar Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={12}
                      placeholder="12-digit Aadhaar Number"
                      value={sellerData.aadhaarCard}
                      onChange={(e) => setSellerData({ ...sellerData, aadhaarCard: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* PAN Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN Card
                    </label>
                    {duplicateErrors.pan && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This PAN Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={sellerData.panCard}
                      onChange={(e) => setSellerData({ ...sellerData, panCard: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* GSTIN */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 09AAAAA0000A1Z5"
                      value={sellerData.gstin}
                      onChange={(e) => setSellerData({ ...sellerData, gstin: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* Shop Establishment */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shop Establishment
                    </label>
                    <input 
                      type="text" 
                      placeholder="Shop Act / Trade License No."
                      value={sellerData.shopEstablishment}
                      onChange={(e) => setSellerData({ ...sellerData, shopEstablishment: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <CreditCard size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Bank Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. State Bank of India"
                      value={sellerData.bankName}
                      onChange={(e) => setSellerData({ ...sellerData, bankName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Account No. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account No.
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012"
                      value={sellerData.accountNo}
                      onChange={(e) => setSellerData({ ...sellerData, accountNo: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input 
                      type="text" 
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={sellerData.ifscCode}
                      onChange={(e) => setSellerData({ ...sellerData, ifscCode: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. guptastore@upi"
                      value={sellerData.upiId}
                      onChange={(e) => setSellerData({ ...sellerData, upiId: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              3. HUB MANAGER FORM
              ======================================================== */}
          {selectedType === 'Hub Manager' && (
            <>
                            {/* Avatar Upload */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 mb-4">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 mb-2">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <User size={14} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Profile Avatar</h3>
                </div>
                <AvatarUpload 
                  url={hubManagerData.avatar} 
                  onUpload={(url) => setHubManagerData(prev => ({ ...prev, avatar: url }))} 
                  isEditable={isFormEditable}
                />
              </div>

              {/* Hub & Manager Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <Building2 size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Hub & Manager Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Store Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Store Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      readOnly
                      placeholder="e.g. Suriyawan Central Store"
                      value={hubManagerData.storeName}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, storeName: e.target.value })}
                      className={`${inputBase} bg-slate-50 text-slate-500 cursor-not-allowed`}
                    />
                  </div>

                  {/* Hub Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hub Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Suriyawan_Logistics_Hub"
                      value={hubManagerData.hubName}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, hubName: e.target.value.replace(/\s+/g, '_') })}
                      className={inputBase}
                    />
                  </div>

                  {/* Hub Manager Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hub Manager Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={hubManagerData.hubManagerName}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, hubManagerName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Mobile Number *
                    </label>
                    {duplicateErrors.mobile && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This mobile number is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="tel" 
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={hubManagerData.registeredMobileNumber}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, registeredMobileNumber: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* Registered Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Email
                    </label>
                    {duplicateErrors.email && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This email is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="email" 
                      placeholder="e.g. ramesh.hub@suriyawan.in"
                      value={hubManagerData.registeredEmail}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, registeredEmail: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Full Address (Address before Pincode) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Full Address
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Industrial Area, Station Road, Suriyawan"
                      value={hubManagerData.registeredFullAddress}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, registeredFullAddress: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Pincode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Pincode
                    </label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="e.g. 221404"
                      value={hubManagerData.registeredPincode}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, registeredPincode: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Set password"
                        value={hubManagerData.password}
                        onChange={(e) => setHubManagerData({ ...hubManagerData, password: e.target.value })}
                        className={monoInput}
                      />
                      <div 
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
>
  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity & KYC */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <ShieldCheck size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Identity & KYC
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Aadhaar Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aadhaar Card
                    </label>
                    {duplicateErrors.aadhaar && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This Aadhar Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={12}
                      placeholder="12-digit Aadhaar Number"
                      value={hubManagerData.aadhaarCard}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, aadhaarCard: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* PAN Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN Card
                    </label>
                    {duplicateErrors.pan && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This PAN Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={hubManagerData.panCard}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, panCard: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* Voter ID */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Voter ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. EPIC / Voter ID Number"
                      value={hubManagerData.voterId}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, voterId: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <CreditCard size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Bank Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. State Bank of India"
                      value={hubManagerData.bankName}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, bankName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Account No. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account No.
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012"
                      value={hubManagerData.accountNo}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, accountNo: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input 
                      type="text" 
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={hubManagerData.ifscCode}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, ifscCode: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. suriyawanhub@upi"
                      value={hubManagerData.upiId}
                      onChange={(e) => setHubManagerData({ ...hubManagerData, upiId: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              5. CLUSTER FORM
              ======================================================== */}
          {selectedType === 'Cluster' && (
            <>
                            {/* Avatar Upload */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 mb-4">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 mb-2">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <User size={14} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Profile Avatar</h3>
                </div>
                <AvatarUpload 
                  url={clusterData.avatar} 
                  onUpload={(url) => setClusterData(prev => ({ ...prev, avatar: url }))} 
                  isEditable={isFormEditable}
                />
              </div>

              {/* Cluster Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <Building2 size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Cluster Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Cluster Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cluster Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={clusterData.clusterName}
                      onChange={(e) => setClusterData({ ...clusterData, clusterName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Mobile Number *
                    </label>
                    {duplicateErrors.mobile && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This mobile number is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="tel" 
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={clusterData.registeredMobileNumber}
                      onChange={(e) => setClusterData({ ...clusterData, registeredMobileNumber: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* Registered Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Email
                    </label>
                    {duplicateErrors.email && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This email is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="email" 
                      placeholder="e.g. ramesh.hub@suriyawan.in"
                      value={clusterData.registeredEmail}
                      onChange={(e) => setClusterData({ ...clusterData, registeredEmail: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Full Address (Address before Pincode) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Full Address
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Industrial Area, Station Road, Suriyawan"
                      value={clusterData.registeredFullAddress}
                      onChange={(e) => setClusterData({ ...clusterData, registeredFullAddress: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Pincode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Pincode
                    </label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="e.g. 221404"
                      value={clusterData.registeredPincode}
                      onChange={(e) => setClusterData({ ...clusterData, registeredPincode: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Set password"
                        value={clusterData.password}
                        onChange={(e) => setClusterData({ ...clusterData, password: e.target.value })}
                        className={monoInput}
                      />
                      <div 
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
>
  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity & KYC */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <ShieldCheck size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Identity & KYC
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Aadhaar Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aadhaar Card
                    </label>
                    {duplicateErrors.aadhaar && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This Aadhar Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={12}
                      placeholder="12-digit Aadhaar Number"
                      value={clusterData.aadhaarCard}
                      onChange={(e) => setClusterData({ ...clusterData, aadhaarCard: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* PAN Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN Card
                    </label>
                    {duplicateErrors.pan && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This PAN Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={clusterData.panCard}
                      onChange={(e) => setClusterData({ ...clusterData, panCard: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* Voter ID */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Voter ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. EPIC / Voter ID Number"
                      value={clusterData.voterId}
                      onChange={(e) => setClusterData({ ...clusterData, voterId: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>
                </div>
              </div>

            </>
          )}

          {/* ========================================================
              4. RIDER FORM
              ======================================================== */}
          {selectedType === 'Rider' && (
            <>
                            {/* Avatar Upload */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 mb-4">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 mb-2">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <User size={14} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Profile Avatar</h3>
                </div>
                <AvatarUpload 
                  url={riderData.avatar} 
                  onUpload={(url) => setRiderData(prev => ({ ...prev, avatar: url }))} 
                  isEditable={isFormEditable}
                />
              </div>

              {/* Personal & Contact Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <Truck size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Personal & Contact Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Rider Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rider Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sonu Kumar Bind"
                      value={riderData.riderName}
                      onChange={(e) => setRiderData({ ...riderData, riderName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Mobile Number *
                    </label>
                    {duplicateErrors.mobile && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This mobile number is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="tel" 
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={riderData.registeredMobileNumber}
                      onChange={(e) => setRiderData({ ...riderData, registeredMobileNumber: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* Registered Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Email
                    </label>
                    {duplicateErrors.email && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This email is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="email" 
                      placeholder="e.g. sonu.rider@gmail.com"
                      value={riderData.registeredEmail}
                      onChange={(e) => setRiderData({ ...riderData, registeredEmail: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Full Address (Address before Pincode) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Full Address
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Gram - Purey Pandey, Suriyawan"
                      value={riderData.registeredFullAddress}
                      onChange={(e) => setRiderData({ ...riderData, registeredFullAddress: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Registered Pincode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Pincode
                    </label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="e.g. 221404"
                      value={riderData.registeredPincode}
                      onChange={(e) => setRiderData({ ...riderData, registeredPincode: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Set password"
                        value={riderData.password}
                        onChange={(e) => setRiderData({ ...riderData, password: e.target.value })}
                        className={monoInput}
                      />
                      <div 
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
>
  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity & KYC */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <ShieldCheck size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Identity & KYC
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Aadhaar Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aadhaar Card
                    </label>
                    {duplicateErrors.aadhaar && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This Aadhar Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={12}
                      placeholder="12-digit Aadhaar Number"
                      value={riderData.aadhaarCard}
                      onChange={(e) => setRiderData({ ...riderData, aadhaarCard: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* PAN Card */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PAN Card
                    </label>
                    {duplicateErrors.pan && (
                      <p className="text-[11px] font-normal text-red-600 mb-1 leading-tight">
                        This PAN Card is already present in another id of the same type.
                      </p>
                    )}
                    <input 
                      type="text" 
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={riderData.panCard}
                      onChange={(e) => setRiderData({ ...riderData, panCard: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* Driving Licence (DL) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driving Licence (DL)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. UP6620210001234"
                      value={riderData.drivingLicence}
                      onChange={(e) => setRiderData({ ...riderData, drivingLicence: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* Vehicle No. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vehicle No.
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. UP 66 AB 1234"
                      value={riderData.vehicleNo}
                      onChange={(e) => setRiderData({ ...riderData, vehicleNo: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                    <CreditCard size={14} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Bank Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. State Bank of India"
                      value={riderData.bankName}
                      onChange={(e) => setRiderData({ ...riderData, bankName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Account No. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account No.
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012"
                      value={riderData.accountNo}
                      onChange={(e) => setRiderData({ ...riderData, accountNo: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input 
                      type="text" 
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={riderData.ifscCode}
                      onChange={(e) => setRiderData({ ...riderData, ifscCode: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. sonubind@upi"
                      value={riderData.upiId}
                      onChange={(e) => setRiderData({ ...riderData, upiId: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          </fieldset>

          {/* ========================================================
              CLUSTER BANK DETAILS (OUTSIDE MAIN FIELDSET FOR EDITABILITY)
              ======================================================== */}
          {selectedType === 'Cluster' && (
             <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 mb-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg ${theme.iconBoxBg} flex items-center justify-center shrink-0`}>
                      <CreditCard size={14} strokeWidth={2.4} />
                    </div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                      Bank Details
                    </h2>
                  </div>
                  {isReadOnly && (
                    <button 
                      type="button"
                      onClick={() => setIsBankEditing(!isBankEditing)}
                      className="px-2 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                       Edit
                    </button>
                  )}
                </div>

                <fieldset disabled={!isFormEditable && !isBankEditing} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-0 p-0 m-0">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. State Bank of India"
                      value={clusterData.bankName}
                      onChange={(e) => setClusterData({ ...clusterData, bankName: e.target.value })}
                      className={inputBase}
                    />
                  </div>

                  {/* Account No. */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account No.
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012"
                      value={clusterData.accountNo}
                      onChange={(e) => setClusterData({ ...clusterData, accountNo: e.target.value.replace(/\D/g, '') })}
                      className={monoInput}
                    />
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input 
                      type="text" 
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={clusterData.ifscCode}
                      onChange={(e) => setClusterData({ ...clusterData, ifscCode: e.target.value.toUpperCase() })}
                      className={upperInput}
                    />
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. suriyawanhub@upi"
                      value={clusterData.upiId}
                      onChange={(e) => setClusterData({ ...clusterData, upiId: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                </fieldset>

                {isBankEditing && (
                  <div className="pt-3 w-full">
                    <button 
                      type="button"
                      onClick={handleSaveBankDetails}
                      disabled={isBankSaving}
                      className="px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold w-full transition-all hover:bg-slate-900 flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      {isBankSaving ? (
                        <div className="flex items-center gap-1.5">
                          <span>Saving</span>
                          <div className="flex space-x-1 items-center mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></span>
                          </div>
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                )}
             </div>
          )}

          {/* ========================================================
              BOTTOM ACTION BUTTON (Medium Compact Create ID Wallet Button)
              ======================================================== */}
          {isFormEditable && (
            <div className="pt-3 pb-8 flex items-center justify-center gap-3 w-full">
              <button
                type="submit"
                id="btn-submit-create-user-id"
                disabled={isSubmitting || duplicateErrors.mobile || duplicateErrors.email || duplicateErrors.aadhaar || duplicateErrors.pan}
                className={`h-9 sm:h-9.5 px-6 rounded-lg ${theme.primaryBtn} text-white text-xs font-bold shadow-sm ${isSubmitting || duplicateErrors.mobile || duplicateErrors.email || duplicateErrors.aadhaar || duplicateErrors.pan ? 'opacity-90 cursor-not-allowed' : 'active:scale-95 cursor-pointer'} transition-all flex items-center justify-center min-w-[180px] max-w-xs`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <span>Creating</span>
                    <div className="flex space-x-1 items-center mt-1">
                      <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 rounded-full bg-white animate-bounce"></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check size={15} strokeWidth={2.5} />
                    <span>{isEditing ? "Save Changes" : `Create ${selectedType} ID`}</span>
                  </div>
                )}
              </button>
              
              
            </div>
          )}

        </form>
          </>
        )}
      </main>

    </div>
  );
};
