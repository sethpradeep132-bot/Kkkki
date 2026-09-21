import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Search, Wand2, Plus, Save, X, ImagePlus, Check, Crop, ChevronDown } from 'lucide-react';
import { categoryData } from '../../categories';
import { getTagColor } from '../../utils/tagColors';
import ReactCrop, { type Crop as ReactCropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const createImage = (url: string): Promise<HTMLImageElement> =>
 new Promise((resolve, reject) => {
 const image = new Image();
 image.addEventListener('load', () => resolve(image));
 image.addEventListener('error', (error) => reject(error));
 image.src = url;
 });

async function getCroppedImg(
 imageSrc: string,
 pixelCrop: { x: number; y: number; width: number; height: number },
 imageEl: HTMLImageElement
): Promise<string> {
 const canvas = document.createElement('canvas');
 const scaleX = imageEl.naturalWidth / imageEl.width;
 const scaleY = imageEl.naturalHeight / imageEl.height;
 
 const sourceWidth = pixelCrop.width * scaleX;
 const sourceHeight = pixelCrop.height * scaleY;
 
 // Cap at 1080px for optimal HD size vs quality
 const MAX_DIMENSION = 1080;
 let targetWidth = sourceWidth;
 let targetHeight = sourceHeight;
 
 if (Math.max(targetWidth, targetHeight) > MAX_DIMENSION) {
 const ratio = MAX_DIMENSION / Math.max(targetWidth, targetHeight);
 targetWidth *= ratio;
 targetHeight *= ratio;
 }
 
 canvas.width = targetWidth;
 canvas.height = targetHeight;
 const ctx = canvas.getContext('2d');

 if (!ctx) {
 return '';
 }

 // Slight enhancement for crystal clear look
 ctx.filter = 'contrast(1.05) saturate(1.05) brightness(1.02)';
 ctx.imageSmoothingEnabled = true;
 ctx.imageSmoothingQuality = 'high';

 ctx.drawImage(
 imageEl,
 pixelCrop.x * scaleX,
 pixelCrop.y * scaleY,
 sourceWidth,
 sourceHeight,
 0,
 0,
 targetWidth,
 targetHeight
 );

 // WebP at 0.85 offers exceptional quality at very low KB sizes
 return canvas.toDataURL('image/webp', 0.85);
}

const generateUniqueProductCode = async (supabase: any): Promise<string> => {
 const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 let isUnique = false;
 let code = '';
 while (!isUnique) {
 code = '';
 for (let i = 0; i < 8; i++) {
 code += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 const { data: d1 } = await supabase.from('upload_products').select('"product code"').eq('product code', code).maybeSingle();
 if (d1) continue;
 const { data: d2 } = await supabase.from('save_in_draft').select('"product code"').eq('product code', code).maybeSingle();
 if (d2) continue;
 const { data: d3 } = await supabase.from('inactive_products').select('"product code"').eq('product code', code).maybeSingle();
 if (d3) continue;
 
 isUnique = true;
 }
 return code;
};

interface UploadProps {
 onBack: () => void;
 initialProduct?: any;
 initialMode?: 'upload' | 'edit_active' | 'edit_draft' | 'edit_inactive';
 isGstVerified?: boolean;
 uploadServiceVisible?: boolean;
}

export interface FlatCategoryItem {
 mainId: string;
 midId: string;
 subId: string;
 name: string;
 nameLower: string;
 mainName: string;
 midName: string;
 searchStr: string;
}

// Pre-indexed category dataset (Computed once at module evaluation for 0ms render lag)
export const FLAT_CATEGORIES: FlatCategoryItem[] = [];
categoryData.forEach(main => {
 main.middle?.forEach(mid => {
 mid.sub?.forEach(sub => {
 FLAT_CATEGORIES.push({
 mainId: main.id,
 midId: mid.id,
 subId: sub.id,
 name: sub.name,
 nameLower: sub.name.toLowerCase(),
 mainName: main.name,
 midName: mid.name,
 searchStr: `${sub.name.toLowerCase()} ${mid.name.toLowerCase()} ${main.name.toLowerCase()}`
 });
 });
 });
});

export function getFastCategorySuggestions(query: string, maxResults = 50): FlatCategoryItem[] {
 const q = query.trim().toLowerCase();
 if (!q || q.length < 1) return [];

 const tokens = q.split(/[\s,/-]+/).filter(Boolean);
 if (tokens.length === 0) return [];

 const exactMatches: FlatCategoryItem[] = [];
 const startMatches: FlatCategoryItem[] = [];
 const wordMatches: FlatCategoryItem[] = [];
 const subMatches: FlatCategoryItem[] = [];
 const tokenMatches: FlatCategoryItem[] = [];

 // Single regex compiled once before the loop (NOT 2,739 times!)
 let wordBoundaryRegex: RegExp | null = null;
 try {
 const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 wordBoundaryRegex = new RegExp(`\\b${escaped}\\b`, 'i');
 } catch {}

 for (let i = 0; i < FLAT_CATEGORIES.length; i++) {
 const item = FLAT_CATEGORIES[i];
 const n = item.nameLower;

 if (n === q) {
 exactMatches.push(item);
 } else if (n.startsWith(q)) {
 startMatches.push(item);
 } else if (wordBoundaryRegex && wordBoundaryRegex.test(n)) {
 wordMatches.push(item);
 } else if (n.includes(q)) {
 subMatches.push(item);
 } else {
 let allFound = true;
 for (let t = 0; t < tokens.length; t++) {
 if (!item.searchStr.includes(tokens[t])) {
 allFound = false;
 break;
 }
 }
 if (allFound) {
 tokenMatches.push(item);
 }
 }

 if (exactMatches.length + startMatches.length + wordMatches.length >= maxResults) {
 break;
 }
 }

 const combined = [...exactMatches, ...startMatches, ...wordMatches, ...subMatches, ...tokenMatches];
 return combined.slice(0, maxResults);
}

interface TagType {
 name: string;
 special?: boolean;
 color?: string;
}

const tagsSource = [
 'No.1', 'Top', 'Live', 'New', 'seasonal', 'Hot', 'Best', 'Viral', 'Trendy', 'Fresh', 'Wow', 'Fab', 'Fabulous', 'Super', 'Mega', 'Ultra', 'Pro', 'Prime', 'Elite', 'Royal', 'Premium', 'Classic', 'Smart', 'Stylish', 'Unique', 'Exclusive', 'Popular', 'Famous', 'Loved', 'Favourite', 'Choice', 'Pick', 'Star', 'Must', 'Hit', 'Hero', 'Iconic', 'Amazing', 'Awesome', 'Perfect', 'Lovely', 'Cute', 'Cool', 'Latest', 'Modern', 'Elegant', 'Luxury', 'Grand', 'Magic', 'Bright', 'Bold', 'Pure', 'Real', 'Original', 'Genuine', 'Trusted', 'Verified', 'Safe', 'Quality', 'Finest', 'Superior', 'Deluxe', 'Select', 'Signature', 'Limited', 'Rare', 'Featured', 'Spotlight', 'Trending+', 'Bestseller', 'Winner', 'Champion', 'Winner+', 'Hotpick', 'Topper', 'Leader', 'Leader+', 'Value', 'Worthy', 'Saver', 'Saving', 'Deal', 'Offer', 'Sale', 'Flash', 'Rush', 'Boost', 'Steal', 'Bargain', 'Budget', 'Cheap', 'Affordable', 'Pocket', 'Easy', 'Quick', 'Fast', 'Swift', 'Speedy', 'Instant', 'Ready', 'Active', 'Fresh+', 'New+', 'Hot+', 'Top+', 'Best+', 'Super+', 'Mega+', 'Pro+', 'Prime+', 'Star+', 'Elite+', 'Royal+', 'Viral+', 'Wow+', 'Fab+', 'Live+', 'Now', 'Today', 'Mustbuy', 'Musthave', 'Go', 'Grab', 'Shop', 'Buy', 'Picked', 'Chosen', 'Loved+', 'Rated', 'Reviewed', 'Approved', 'Recommended', 'Trusted+', 'Popular+', 'Famous+', 'Wanted', 'Desired', 'Demand', 'Demand+', 'Hit+', 'Buzz', 'Buzzing', 'Hype', 'Hottest', 'Coolest', 'Finest+', 'Premium+', 'Luxury+', 'Classic+', 'Stylish+', 'Trend+', 'Fashion', 'Fashionable', 'Designer', 'Beauty', 'Grace', 'Charm', 'Shine', 'Glow', 'Spark', 'Bright+', 'Freshest', 'Newest', 'Latest+', 'Modern+', 'Smart+', 'Perfect+', 'Amazing+', 'Awesome+', 'Fantastic', 'Brilliant', 'Superb', 'Excellent', 'Outstanding', 'Remarkable', 'Wonderful', 'Incredible', 'Unbeatable', 'Ultimate', 'Supreme', 'Maximum', 'Extreme', 'Powerful', 'Strong', 'Solid', 'Genuine+', 'Authentic', 'Original+', 'Natural', 'Pure+', 'Healthy', 'Green', 'Eco', 'Organic', 'Handmade', 'Local', 'Desi', 'Indian', 'Swadeshi', 'Bharat', 'Apna', 'Local+', 'Desi+', 'India+', 'Special+', 'Exclusive+', 'Limited+', 'Rare+', 'Unique+', 'One', 'One+', 'No.1+', 'No.2', 'No.3', 'Top1', 'Top2', 'Top3', 'Rank1', 'Rank+'
];

const PREDEFINED_TAGS: TagType[] = [
 { name: 'Suriyawan Shopping Special', special: true },
 { name: 'Special', special: true },
 { name: 'Killer', color: 'bg-red-600 text-white border-transparent' }
];

tagsSource.forEach((t) => {
 PREDEFINED_TAGS.push({ name: t, color: getTagColor(t) });
});

const singularize = (word: string) => {
 if (!word) return '';
 const trimmed = word.trim();
 const lower = trimmed.toLowerCase();
 
 // Plural / uncountable words that should remain intact
 const preserveWords = [
 'jeans', 'pants', 'trousers', 'shorts', 'scissors', 'sunglasses', 'goggles', 
 'binoculars', 'glasses', 'pliers', 'tongs', 'tweezers', 'leggings', 'jeggings', 
 'culottes', 'dungarees', 'pyjamas', 'pajamas', 'briefs', 'boxers', 'trunks', 
 'thermals', 'bangles', 'earrings', 'cufflinks', 'mittens', 'booties', 'clogs', 
 'slippers', 'sandals', 'shoes', 'boots', 'sneakers', 'loafers', 'heels', 'flats', 
 'oxfords', 'chips', 'wafers', 'noodles', 'sprouts', 'beans', 'grapes', 'berries', 
 'oats', 'flakes', 'seeds', 'nuts', 'cashews', 'almonds', 'raisins', 'dates', 'walnuts'
 ];
 
 for (const item of preserveWords) {
 if (lower.endsWith(item)) return trimmed;
 }
 
 if (lower.endsWith('ss') || lower.endsWith('is') || lower.endsWith('us') || lower.endsWith('ics')) return trimmed;
 if (lower.endsWith('ies')) return trimmed.slice(0, -3) + 'y';
 if (lower.endsWith('ves')) return trimmed.slice(0, -3) + 'f';
 if (lower.endsWith('boxes') || lower.endsWith('dishes') || lower.endsWith('watches') || lower.endsWith('brushes') || lower.endsWith('torches') || lower.endsWith('pouches')) return trimmed.slice(0, -2);
 if (lower.endsWith('s') && !lower.endsWith('ss')) return trimmed.slice(0, -1);
 return trimmed;
};

const getColorName = (r: number, g: number, b: number) => {
 const colors = [
 {n: 'Black', r: 0, g: 0, b: 0},
 {n: 'White', r: 255, g: 255, b: 255},
 {n: 'Red', r: 255, g: 0, b: 0},
 {n: 'Green', r: 0, g: 255, b: 0},
 {n: 'Blue', r: 0, g: 0, b: 255},
 {n: 'Yellow', r: 255, g: 255, b: 0},
 {n: 'Cyan', r: 0, g: 255, b: 255},
 {n: 'Magenta', r: 255, g: 0, b: 255},
 {n: 'Gray', r: 128, g: 128, b: 128},
 {n: 'Maroon', r: 128, g: 0, b: 0},
 {n: 'Olive', r: 128, g: 128, b: 0},
 {n: 'Dark Green', r: 0, g: 128, b: 0},
 {n: 'Purple', r: 128, g: 0, b: 128},
 {n: 'Teal', r: 0, g: 128, b: 128},
 {n: 'Navy', r: 0, g: 0, b: 128},
 {n: 'Orange', r: 255, g: 165, b: 0},
 {n: 'Pink', r: 255, g: 192, b: 203},
 {n: 'Brown', r: 165, g: 42, b: 42},
 ];
 let minD = Infinity;
 let best = 'Custom Color';
 colors.forEach(c => {
 const d = Math.pow(c.r - r, 2) + Math.pow(c.g - g, 2) + Math.pow(c.b - b, 2);
 if (d < minD) { minD = d; best = c.n; }
 });
 return `${best} (${r},${g},${b})`;
};

const HINDI_QUOTES = [
 "Suriyawan Shopping और आपकी मेहनत का संगम, सफलता की नई उड़ान!",
 "आपका हुनर और Suriyawan Shopping का मंच, मिलकर रचेंगे नया इतिहास।",
 "एक सफल सेलर की पहचान, Suriyawan Shopping के साथ अटूट विश्वास।",
 "कदम से कदम मिलाकर चलेंगे, Suriyawan Shopping पर नया मुकाम हासिल करेंगे।",
 "आपका शानदार प्रोडक्ट और हमारा मजबूत प्लेटफार्म, यही है असली ताकत।",
 "Suriyawan Shopping पर आपका हर प्रोडक्ट आपकी कामयाबी की कहानी कहता है।",
 "हमारा प्लेटफार्म, आपकी मेहनत, सफलता की गारंटी शत प्रतिशत।",
 "Suriyawan Shopping के साथ जुड़िए, और अपने व्यापार को नई ऊंचाइयों पर ले जाइए।",
 "आपकी तरक्की में ही Suriyawan Shopping की खुशी और जीत है।",
 "Suriyawan Shopping का वादा: आपके व्यापार को मिलेगा एक नया और सुनहरा कल।"
];

export const UploadProductForm: React.FC<UploadProps> = ({ onBack, initialProduct, initialMode = 'upload', isGstVerified = false, uploadServiceVisible: initialUploadServiceVisible = true }) => {
 const [uploadServiceVisible, setUploadServiceVisible] = useState(initialUploadServiceVisible);
 useEffect(() => {
 const fetchLatestVisibility = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase.from('sellers').select('upload_service_visible').eq('id', user.id).single();
 if (data) {
 setUploadServiceVisible(data.upload_service_visible === true);
 }
 }
 } catch (e) {}
 };
 fetchLatestVisibility();
 }, []);

 const [quote, setQuote] = useState('');
 useEffect(() => {
 setQuote(HINDI_QUOTES[Math.floor(Math.random() * HINDI_QUOTES.length)]);
 }, []);

 const [productName, setProductName] = useState(initialProduct?.['product name'] || '');
 const [productCategory, setProductCategory] = useState('');
 const [productSku, setProductSku] = useState(initialProduct?.['product_sku_code'] || '');
 const [availableStock, setAvailableStock] = useState(initialProduct?.['available_stock'] !== undefined ? initialProduct['available_stock'] : '');
 const [hsnCode, setHsnCode] = useState(initialProduct?.['hsn code'] || '');
 const [gstPercent, setGstPercent] = useState(initialProduct?.['gst %'] || '');
 const [marketValue, setMarketValue] = useState(initialProduct?.['price info'] || '');
 const [sellingPrice, setSellingPrice] = useState(initialProduct?.['selling price'] || '');
 const [grossRate, setGrossRate] = useState(initialProduct?.['gross rate'] || '');
 const [discount, setDiscount] = useState(initialProduct?.['discount %'] || '');
 const [priceGst, setPriceGst] = useState(initialProduct?.['gst rate %'] || initialProduct?.['gst %'] || '');
 const [giftDonation, setGiftDonation] = useState(initialProduct?.['gift cash donation'] || '');
 const [formErrors, setFormErrors] = useState<string[]>([]);
 const [isPublishing, setIsPublishing] = useState(false);
 const [isSavingDraft, setIsSavingDraft] = useState(false);
 const [adminCharges, setAdminCharges] = useState<{ id: string; name: string; value: string; isPercentage: boolean }[]>([]);

 // Auto-calculate derived fields
 useEffect(() => {
 const sp = parseFloat(sellingPrice);
 const hasHsn = Boolean(hsnCode && hsnCode.trim() !== '');
 const hasGst = Boolean(gstPercent && gstPercent.toString().trim() !== '' && !isNaN(parseFloat(gstPercent)));
 
 // If HSN code or GST has no update / is empty, gross rate should NOT show any update (remain '')
 if (!hasHsn || !hasGst || isNaN(sp) || sp < 0) {
 setGrossRate('');
 } else {
 const gst = parseFloat(gstPercent) || 0;
 const gr = sp / (1 + (gst / 100));
 setGrossRate(gr.toFixed(2));
 }
 
 const mv = parseFloat(marketValue) || 0;
 if (mv > 0 && !isNaN(sp) && sp >= 0) {
 const diff = Math.max(0, mv - sp);
 setDiscount(((diff / mv) * 100).toFixed(2));
 } else {
 setDiscount('');
 }
 }, [marketValue, sellingPrice, gstPercent, hsnCode]);

 useEffect(() => {
 setPriceGst(gstPercent);
 }, [gstPercent]);

 const handleGiftDonationChange = (val: string) => {
 const num = parseFloat(val);
 if (!isNaN(num) && num > 5) {
 setGiftDonation('5');
 alert('Gift Cash Donation amount cannot exceed 5.');
 } else {
 setGiftDonation(val);
 }
 };

 useEffect(() => {
 const fetchEarningsConfig = async () => {
 try {
 const { supabase } = await import('../../lib/supabase');
 const { data, error } = await supabase.from('seller_estimated_earning').select('*').limit(1).maybeSingle();
 if (data && !error) {
 const parseValue = (val: string | null | undefined) => {
 if (!val) return { value: '0', isPercentage: false };
 const str = String(val);
 if (str.endsWith('%')) return { value: str.slice(0, -1), isPercentage: true };
 return { value: str, isPercentage: false };
 };

 const fetchedCharges = [
 { id: '1', name: 'Referral Fee', ...parseValue(data['Referral Fee']) },
 { id: '2', name: 'Closing Fee', ...parseValue(data['Closing Fee']) },
 { id: '3', name: 'COD Fee', ...parseValue(data['COD Fee']) },
 { id: '4', name: 'Shipping Fee', ...parseValue(data['Shipping Fee']) },
 { id: '5', name: 'C-GST', ...parseValue(data['C-GST']) },
 { id: '6', name: 'S-GST', ...parseValue(data['S-GST']) },
 { id: '7', name: 'TDS charge', ...parseValue(data['TDS charge']) },
 { id: '8', name: 'TCS charge', ...parseValue(data['TCS charge']) },
 ];
 
 if (data.other_charges && typeof data.other_charges === 'object') {
 Object.keys(data.other_charges).forEach((key, idx) => {
 fetchedCharges.push({
 id: `other_${idx}`,
 name: key,
 ...parseValue(data.other_charges[key])
 });
 });
 }
 setAdminCharges(fetchedCharges);
 } else {
 // Fallback
 const saved = localStorage.getItem('ss_admin_earning_charges');
 if (saved) {
 setAdminCharges(JSON.parse(saved));
 } else {
 setAdminCharges([
 { id: '1', name: 'Referral Fee', value: '0', isPercentage: true },
 { id: '2', name: 'Closing Fee', value: '0', isPercentage: false },
 { id: '3', name: 'COD Fee', value: '0', isPercentage: false },
 { id: '4', name: 'Shipping Fee', value: '0', isPercentage: false },
 { id: '5', name: 'C-GST', value: '0', isPercentage: true },
 { id: '6', name: 'S-GST', value: '0', isPercentage: true },
 { id: '7', name: 'TDS charge', value: '0', isPercentage: true },
 { id: '8', name: 'TCS charge', value: '0', isPercentage: true },
 ]);
 }
 }
 } catch (err) {
 console.error(err);
 }
 };
 fetchEarningsConfig();
 }, []);

 const calculateEarnings = () => {
 const sp = parseFloat(sellingPrice) || 0;
 const dc = parseFloat(deliveryCharge) || 0;
 const gd = parseFloat(giftDonation) || 0;
 
 const sellerGstPercent = parseFloat(gstPercent) || parseFloat(priceGst) || 0;
 const halfGstPercent = sellerGstPercent / 2;
 let grossRateNum = 0;
 let totalGstAmount = 0;
 if (sp > 0) {
 grossRateNum = sp / (1 + (sellerGstPercent / 100));
 totalGstAmount = sp - grossRateNum;
 }
 const sellerCgstAmount = totalGstAmount / 2;
 const sellerSgstAmount = totalGstAmount / 2;
 const totalSellerEarning = sp + dc;
 
 // First, calculate base platform earning (excluding taxes)
 let basePlatformEarning = 0;
 
 const chargesWithBaseAmount = adminCharges.map(charge => {
 const isTax = charge.name.toUpperCase().includes('GST') || 
 charge.name.toUpperCase().includes('TDS') || 
 charge.name.toUpperCase().includes('TCS');
 
 const val = parseFloat(charge.value) || 0;
 let amount = 0;
 
 if (!isTax) {
 if (charge.isPercentage) {
 amount = (sp * val) / 100;
 } else {
 amount = val;
 }
 basePlatformEarning += amount;
 }
 
 return { ...charge, val, isTax, amount };
 });

 let platformTotal = 0;
 const calculatedCharges = chargesWithBaseAmount.map(charge => {
 let finalAmount = charge.amount;
 if (charge.isTax) {
 if (charge.isPercentage) {
 finalAmount = (basePlatformEarning * charge.val) / 100;
 } else {
 finalAmount = charge.val;
 }
 }
 
 if (sp <= 0) {
 finalAmount = 0;
 }
 
 platformTotal += finalAmount;
 return { ...charge, amount: finalAmount };
 });
 
 const finalNetEarning = sp > 0 ? totalSellerEarning - platformTotal - gd : 0;
 const totalPlatformEarning = platformTotal + gd;

 return {
 sellingPrice: sp,
 deliveryCharge: dc,
 grossRateNum: sp > 0 ? grossRateNum : 0,
 halfGstPercent: sp > 0 ? halfGstPercent : 0,
 sellerCgstAmount: sp > 0 ? sellerCgstAmount : 0,
 sellerSgstAmount: sp > 0 ? sellerSgstAmount : 0,
 totalSellerEarning: sp > 0 ? totalSellerEarning : 0,
 giftDonation: gd,
 calculatedCharges,
 platformTotal,
 totalPlatformEarning: sp > 0 ? totalPlatformEarning : 0,
 finalNetEarning
 };
 };

 const [showSuggestions, setShowSuggestions] = useState(false);
 const [categoryTags, setCategoryTags] = useState<string[]>(initialProduct?.['category tags'] || []);
 
 const [titleName, setTitleName] = useState(initialProduct?.['product title name'] || '');
 const [description, setDescription] = useState(initialProduct?.['product description'] || '');
 
 const [images, setImages] = useState<string[]>(initialProduct?.['product images'] || []);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const [selectedColors, setSelectedColors] = useState<{name: string, hex: string}[]>(initialProduct?.['color'] || []);
 const [selectedSizes, setSelectedSizes] = useState<string[]>(initialProduct?.['size'] || []);
 const [selectedWeights, setSelectedWeights] = useState<string[]>(initialProduct?.['weight'] || []);

 const [featureLang, setFeatureLang] = useState<'Hindi' | 'English'>('English');
 const [featureCount, setFeatureCount] = useState<number>(5);
 const [features, setFeatures] = useState<string[]>(() => {
 if (initialProduct?.['key features'] && initialProduct['key features'].length > 0) {
 const arr = Array(10).fill('');
 initialProduct['key features'].forEach((f: string, i: number) => {
 if (i < 10) arr[i] = f;
 });
 return arr;
 }
 return Array(10).fill('');
 });
 
 const [selectedServiceCategory, setSelectedServiceCategory] = useState(initialProduct?.['upload services'] || '');
 const [mobileNumber, setMobileNumber] = useState(initialProduct?.['mobile number'] || '');
 const [selectedTags, setSelectedTags] = useState<string[]>(initialProduct?.['tags'] || []);
 
 const [mainCat, setMainCat] = useState(initialProduct?.['main category'] || '');
 const [midCat, setMidCat] = useState(initialProduct?.['middle category'] || '');
 const [subCat, setSubCat] = useState(initialProduct?.['sub category'] || '');
 const [isCategoryAutoSelected, setIsCategoryAutoSelected] = useState(false);

 const [homeFeedProductType, setHomeFeedProductType] = useState(initialProduct?.['product type chips'] || '');
 const [flashSaleDuration, setFlashSaleDuration] = useState(initialProduct?.['Time Duration'] || '');
 const [homeFeedTitleCategory, setHomeFeedTitleCategory] = useState(initialProduct?.['choose title category'] || '');

 useEffect(() => {
 if (initialProduct?.['product_sku_code']) return;
 const mainCatName = categoryData.find(c => c.id === mainCat)?.name || '';
 const mainCatPart = mainCatName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
 const productPart = productName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
 const colorPart = selectedColors.length > 0 ? selectedColors[0].name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
 const sizePart = selectedSizes.length > 0 ? selectedSizes[0].substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
 const weightPart = selectedWeights.length > 0 ? selectedWeights[0].substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
 
 const parts = [mainCatPart, productPart, colorPart, sizePart, weightPart].filter(p => p.length > 0);
 setProductSku(parts.join('-'));
 }, [mainCat, productName, selectedColors, selectedSizes, selectedWeights]);

 const [activeModal, setActiveModal] = useState<'none' | 'size' | 'size' | 'weight' | 'tag' | 'categoryTag' | 'crop'>('none');

 const [minQuantity, setMinQuantity] = useState<number>(initialProduct?.['minimum order quantity'] || 1);
 const [isCustomQty, setIsCustomQty] = useState<boolean>(false);
 const [deliveryCharge, setDeliveryCharge] = useState<string>(initialProduct?.['delivery charge'] || '');
 const [deliveryChargeType, setDeliveryChargeType] = useState<string>(initialProduct?.['delivery charge type'] || '');
 const [isDeliveryChargeDropdownOpen, setIsDeliveryChargeDropdownOpen] = useState<boolean>(false);
 const [isReturnPolicyDropdownOpen, setIsReturnPolicyDropdownOpen] = useState<boolean>(false);
 
 // Crop state
 const [tempImage, setTempImage] = useState<string | null>(null);
 const [crop, setCrop] = useState<ReactCropType>({ unit: '%', width: 40, height: 50, x: 30, y: 25 });
 const [completedCrop, setCompletedCrop] = useState<ReactCropType | null>(null);
 const imgRef = useRef<HTMLImageElement>(null);
 const [cropAspect, setCropAspect] = useState(4/5); // Default 4:5

 const cropAspectRatios = [
 { label: '1:1', value: 1 },
 { label: '4:3', value: 4/3 },
 { label: '3:4', value: 3/4 },
 { label: '16:9', value: 16/9 },
 { label: '9:16', value: 9/16 },
 { label: '3:2', value: 3/2 },
 { label: '2:3', value: 2/3 },
 { label: '5:4', value: 5/4 },
 { label: '4:5', value: 4/5 },
 { label: '21:9', value: 21/9 },
 ];

 const [customColorName, setCustomColorName] = useState('');
 const [customColorHex, setCustomColorHex] = useState('#000000');

 useEffect(() => {
 const fetchColorName = async () => {
 try {
 const hex = customColorHex.replace('#', '');
 const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);
 const data = await res.json();
 if (data.name && data.name.value) {
 setCustomColorName(data.name.value);
 }
 } catch (e) {
 setCustomColorName('Custom Color');
 }
 };
 const timer = setTimeout(fetchColorName, 300);
 return () => clearTimeout(timer);
 }, [customColorHex]);

 // Ultra-fast non-blocking category suggestions using deferred input value (runs like butter)
 const deferredProductName = React.useDeferredValue(productName);
 const suggestedCategories = React.useMemo(() => {
 return getFastCategorySuggestions(deferredProductName, 40);
 }, [deferredProductName]);

 const generateDescription = () => {
 const pName = productName || 'Product';
 const templates = [
 `Discover the ultimate experience with this ${pName}. Perfectly designed to meet your everyday needs, it combines elegant aesthetics with uncompromising quality. Upgrade your lifestyle with this exceptional offering that stands out in both performance and style.`,
 `This is a top-tier ${pName} crafted for perfection. Experience seamless functionality and modern design tailored specifically for you. Built with durability and comfort in mind, it is the perfect addition to your collection.`,
 `Introducing a revolutionary ${pName} that redefines excellence. With a focus on innovative features and a sleek look, this product guarantees satisfaction. Don't miss out on the perfect blend of utility and luxury.`,
 `Elevate your day with this premium ${pName}. Built to impress, featuring top-grade materials and an outstanding finish. Whether for personal use or a gift, it delivers exceptional value.`
 ];
 const randomDesc = templates[Math.floor(Math.random() * templates.length)];
 setDescription(randomDesc);
 };

 useEffect(() => {
 if (productName && titleName && !description) {
 generateDescription();
 }
 }, [productName, titleName]);

 const getRandomFeature = (lang: 'Hindi' | 'English', existing: string[]) => {
 const n = productName || (lang === 'Hindi' ? 'उत्पाद' : 'product');
 const t = titleName || (lang === 'Hindi' ? 'यह आइटम' : 'This item');
 
 const eng = [
 `${t} provides premium quality for all your ${n} needs.`,
 `Designed with precision, this ${n} ensures lasting durability.`,
 `Upgrade to ${t} and experience unmatched performance.`,
 `This ${n} features a modern, ergonomic design for maximum comfort.`,
 `Enjoy hassle-free usability and elegant styling with ${t}.`,
 `Built to perfection, the new ${n} stands out from the rest.`,
 `Maximize your productivity with the advanced features of ${t}.`,
 `A highly reliable ${n} crafted specifically for premium users.`,
 `With ${t}, you get the best value and superior craftsmanship.`,
 `Experience the next generation of ${n} innovation today.`,
 `${t} is lightweight and incredibly easy to handle.`,
 `Stand out with the unique styling of this ${n}.`,
 `Created using top-grade materials for ultimate strength.`,
 `A perfect addition to your collection, offering both form and function.`
 ];
 
 const hin = [
 `${t} आपके ${n} की सभी जरूरतों के लिए प्रीमियम गुणवत्ता प्रदान करता है।`,
 `सटीकता के साथ डिज़ाइन किया गया, यह ${n} लंबे समय तक चलने की गारंटी देता है।`,
 `${t} में अपग्रेड करें और बेजोड़ प्रदर्शन का अनुभव लें।`,
 `इस ${n} में अधिकतम आराम के लिए आधुनिक और एर्गोनोमिक डिज़ाइन है।`,
 `${t} के साथ परेशानी मुक्त उपयोग और शानदार स्टाइल का आनंद लें।`,
 `परफेक्शन के साथ निर्मित, नया ${n} बाकियों से अलग दिखता है।`,
 `${t} की उन्नत सुविधाओं के साथ अपनी उत्पादकता बढ़ाएं।`,
 `प्रीमियम उपयोगकर्ताओं के लिए विशेष रूप से तैयार किया गया एक अत्यधिक विश्वसनीय ${n}।`,
 `${t} के साथ, आपको सर्वोत्तम मूल्य और बेहतर शिल्प कौशल मिलता है।`,
 `आज ही ${n} नवाचार की अगली पीढ़ी का अनुभव करें।`,
 `${t} बेहद हल्का और उपयोग में आसान है।`,
 `इस ${n} की अनोखी शैली के साथ सबसे अलग दिखें।`,
 `सर्वोत्तम मजबूती के लिए उच्च श्रेणी की सामग्री का उपयोग करके बनाया गया है।`,
 `आपके संग्रह के लिए एक आदर्श विकल्प, जो उपयोगिता और रूप दोनों प्रदान करता है।`
 ];

 const templates = lang === 'Hindi' ? hin : eng;
 let available = templates.filter(s => !existing.some(e => e.includes(s)));
 if (available.length === 0) available = templates; 
 
 const flavorEng = [" Simply amazing.", " Highly recommended.", " A true masterpiece.", " Get yours now.", " Unbeatable quality.", " Trustworthy design."];
 const flavorHin = [" बिल्कुल अद्भुत।", " अत्यधिक अनुशंसित।", " एक सच्ची उत्कृष्ट कृति।", " अभी अपना लें।", " अपराजेय गुणवत्ता।", " भरोसेमंद डिज़ाइन।"];
 
 let base = available[Math.floor(Math.random() * available.length)];
 const flavors = lang === 'Hindi' ? flavorHin : flavorEng;
 if (Math.random() > 0.3) {
 base += flavors[Math.floor(Math.random() * flavors.length)];
 }
 
 return base;
 };

 useEffect(() => {
 const newFeatures = Array(10).fill('');
 const currentList: string[] = [];
 for (let i = 0; i < featureCount; i++) {
 if (i === featureCount - 1) {
 newFeatures[i] = "";
 } else {
 const feat = getRandomFeature(featureLang, currentList);
 newFeatures[i] = feat;
 currentList.push(feat);
 }
 }
 setFeatures(newFeatures);
 }, [featureLang]);

 useEffect(() => {
 const newFeatures = [...features];
 let changed = false;
 for (let i = 0; i < featureCount; i++) {
 if (i === featureCount - 1) {
 if (
 newFeatures[i] !== "" &&
 newFeatures[i] !== "Open Box Delivery with a 3-Day Return Policy — Subject to Return Eligibility" &&
 newFeatures[i] !== "Open Box Delivery with No Return Policy — Not Subject to Return Eligibility"
 ) {
 newFeatures[i] = "";
 changed = true;
 }
 } else {
 if (!newFeatures[i] || newFeatures[i].trim() === '' || newFeatures[i].includes('Open Box Delivery')) {
 newFeatures[i] = getRandomFeature(featureLang, newFeatures);
 changed = true;
 }
 }
 }
 if (changed) setFeatures(newFeatures);
 }, [featureCount]);

 const generateSingleFeature = (index: number) => {
 const newFeatures = [...features];
 newFeatures[index] = getRandomFeature(featureLang, newFeatures);
 setFeatures(newFeatures);
 };

 const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
 const { width, height } = e.currentTarget;
 const crop = centerCrop(
 makeAspectCrop(
 {
 unit: '%',
 width: 90,
 },
 4 / 5,
 width,
 height
 ),
 width,
 height
 );
 setCrop(crop);
 
 // Set completed crop so "Add Cropped Image" works without dragging
 let pixelCrop;
 if (crop.unit === '%') {
 pixelCrop = {
 x: (crop.x * width) / 100,
 y: (crop.y * height) / 100,
 width: (crop.width * width) / 100,
 height: (crop.height * height) / 100,
 unit: 'px'
 };
 } else {
 pixelCrop = crop;
 }
 setCompletedCrop(pixelCrop as any);
 }, []);

 const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file && images.length < 4) {
 const reader = new FileReader();
 reader.onload = (e) => {
 setTempImage(e.target?.result as string);
 setActiveModal('crop');
 };
 reader.readAsDataURL(file);
 }
 // reset input
 if (fileInputRef.current) fileInputRef.current.value = '';
 };

 const onCropComplete = useCallback((crop: ReactCropType) => {
 // not strictly needed since we use completedCrop state
 }, []);

 const handleSaveCrop = async () => {
 if (tempImage && completedCrop && imgRef.current) {
 try {
 const croppedImage = await getCroppedImg(tempImage, completedCrop as any, imgRef.current);
 setImages([...images, croppedImage]);
 setActiveModal('none');
 setTempImage(null);
 } catch (e) {
 console.error(e);
 }
 }
 };

 const removeImage = (index: number) => {
 setImages(images.filter((_, i) => i !== index));
 };

 const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
 if (list.includes(item)) setList(list.filter(i => i !== item));
 else setList([...list, item]);
 };

 const toggleColor = (name: string, hex: string) => {
 if (selectedColors.find(c => c.name === name)) {
 setSelectedColors(selectedColors.filter(c => c.name !== name));
 } else {
 setSelectedColors([...selectedColors, {name, hex}]);
 }
 };

 const PRESET_COLORS = [
 { name: 'Red', hex: '#ef4444' }, { name: 'Blue', hex: '#3b82f6' },
 { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#ffffff' },
 { name: 'Green', hex: '#22c55e' }, { name: 'Yellow', hex: '#eab308' },
 { name: 'Purple', hex: '#a855f7' }, { name: 'Pink', hex: '#ec4899' },
 { name: 'Orange', hex: '#f97316' }, { name: 'Brown', hex: '#78350f' },
 { name: 'Gray', hex: '#6b7280' }, { name: 'Navy', hex: '#1e3a8a' },
 ];

 const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', '28', '30', '32', '34', '36', '38', '40'];
 const PRESET_WEIGHTS = ['50g', '100g', '200g', '250g', '500g', '1kg', '2kg', '5kg', '10kg', '1L', '500ml', '250ml'];

 const isEditMode = initialMode !== 'upload';

 const isTopServices = selectedServiceCategory === 'Top Services';
 const isHomeFeedDisabled = selectedServiceCategory === 'Top Services' || selectedServiceCategory === 'Breakfast and Drink' || selectedServiceCategory === 'Suriyawan Shopping Special';

 // Count how many of Colour, Size, Weight are selected (only 2 required)
 const variantOptionsCount = (selectedColors.length > 0 ? 1 : 0) + 
 (selectedSizes.length > 0 ? 1 : 0) + 
 (selectedWeights.length > 0 ? 1 : 0);
 const hasAtLeastTwoVariants = variantOptionsCount >= 2;

 const isFormValid = isTopServices
 ? (
 images.length > 0 &&
 productName.trim() !== '' &&
 titleName.trim() !== '' &&
 description.trim() !== ''
 )
 : (
 isEditMode
 ? (
 hasAtLeastTwoVariants &&
 (!isGstVerified || (hsnCode.trim() !== '' && gstPercent !== '')) &&
 marketValue !== '' && 
 sellingPrice !== ''
 )
 : (
 images.length > 0 &&
 productName.trim() !== '' &&
 titleName.trim() !== '' &&
 description.trim() !== '' &&
 hasAtLeastTwoVariants &&
 (!isGstVerified || (hsnCode.trim() !== '' && gstPercent !== '')) &&
 features.some(f => f.trim() !== '') &&
 minQuantity !== '' &&
 marketValue !== '' &&
 sellingPrice !== '' &&
 giftDonation !== '' &&
 mainCat !== '' &&
 (!categoryData.find(c => c.id === mainCat)?.middle || midCat !== '') &&
 (!categoryData.find(c => c.id === mainCat)?.middle?.find(m => m.id === midCat)?.sub || subCat !== '')
 )
 );

 const resolveSellerId = async (supabase: any) => {
 let finalSellerId = null;
 const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_seller') : null;
 const userObj = savedAuth ? JSON.parse(savedAuth) : null;
 if (userObj?.id) {
 const { data } = await supabase.from('sellers').select('id').eq('id', userObj.id).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 if (!finalSellerId && userObj?.email) {
 const { data } = await supabase.from('sellers').select('id').eq('registered_email', userObj.email).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 if (!finalSellerId) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const { data } = await supabase.from('sellers').select('id').eq('id', user.id).maybeSingle();
 if (data) finalSellerId = data.id;
 }
 }
 return finalSellerId;
 };

 const handleSaveInDraft = async () => {
 setIsSavingDraft(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 
 const { _status, ...cleanInitialProduct } = (initialProduct || {}) as any;
 const currentSellerId = await resolveSellerId(supabase);

 const payload = isEditMode && initialProduct ? {
 ...cleanInitialProduct,
 "color": selectedColors,
 "size": selectedSizes,
 "weight": selectedWeights,
 "hsn code": hsnCode,
 "gst %": gstPercent,
 "price info": marketValue,
 "selling price": sellingPrice,
 "gross rate": grossRate,
 "discount %": discount,
 "gst rate %": priceGst || gstPercent,
 } : {
 "product images": images,
 "product name": productName,
 "product title name": titleName,
 "product description": description,
 "color": selectedColors,
 "size": selectedSizes,
 "weight": selectedWeights,
 "hsn code": hsnCode,
 "gst %": gstPercent,
 "key features": features.filter(f => f.trim() !== ''),
 "upload services": selectedServiceCategory,
 "mobile number": mobileNumber, 
 "tags": selectedTags,
 "main category": mainCat,
 "middle category": midCat,
 "sub category": subCat,
 "product type chips": homeFeedProductType,
 "choose title category": homeFeedTitleCategory,
 "category tags": categoryTags,
 "minimum order quantity": minQuantity,
 "delivery charge": deliveryCharge,
 "delivery charge type": deliveryChargeType,
 "product_sku_code": productSku,
 "available_stock": availableStock,
 "price info": marketValue,
 "selling price": sellingPrice,
 "gross rate": grossRate,
 "discount %": discount,
 "gst rate %": priceGst,
 "gift cash donation": giftDonation,
 "Time Duration": flashSaleDuration,
 seller_id: currentSellerId
 };

 if (initialMode === 'edit_draft' && initialProduct?.id) {
 const { error } = await supabase.from('save_in_draft').update(payload).eq('id', initialProduct.id);
 if (error) throw error;
 alert('Draft updated successfully!');
 } else {
 payload['product code'] = await generateUniqueProductCode(supabase);
 const { error } = await supabase.from('save_in_draft').insert([payload]);
 if (error) throw error;
 alert('Product saved in draft!');
 }
 onBack();
 } catch (err: any) {
 alert('Error saving in draft: ' + err.message);
 console.error(err);
 } finally {
 setIsSavingDraft(false);
 }
 };

 const handlePublish = async () => {
 const errors: string[] = [];
 const isTopServices = selectedServiceCategory === 'Top Services';
 
 if (isTopServices) {
 if (images.length === 0) errors.push('Please upload at least one image.');
 if (!productName.trim()) errors.push('Product Name is required.');
 if (!titleName.trim()) errors.push('Product Title Name is required.');
 if (!description.trim()) errors.push('Product Description is required.');
 } else if (!isEditMode) {
 if (images.length === 0) errors.push('Please upload at least one image.');
 if (!productName.trim()) errors.push('Product Name is required.');
 if (!titleName.trim()) errors.push('Product Title Name is required.');
 if (!description.trim()) errors.push('Product Description is required.');
 if (features.every(f => !f.trim())) errors.push('At least one key feature is required.');
 if (!minQuantity) errors.push('Minimum Order Quantity is required.');
 if (!giftDonation) errors.push('Gift Cash Donation is required.');
 }
 
 if (!isTopServices) {
 if (variantOptionsCount < 2) {
 errors.push('Please select at least two options among Colour, Size, and Weight.');
 }
 
 if (isGstVerified) {
 if (!hsnCode.trim()) errors.push('HSN Code is required.');
 if (!gstPercent) errors.push('GST % is required.');
 }
 
 if (!marketValue) errors.push('Market Value (Price Info) is required.');
 if (!sellingPrice) errors.push('Selling Price is required.');
 if (hsnCode.trim() && gstPercent && !grossRate) errors.push('Gross Rate is required.');
 if (!discount) errors.push('Discount is required.');
 }

 if (errors.length > 0) {
 setFormErrors(errors);
 window.scrollTo({ top: 0, behavior: 'smooth' });
 } else {
 setFormErrors([]);
 setIsPublishing(true);
 try {
 const { supabase } = await import('../../lib/supabase');
 const currentSellerId = await resolveSellerId(supabase);
 
 const { _status, ...cleanInitialProduct } = (initialProduct || {}) as any;

 const payload = isEditMode && initialProduct ? {
 ...cleanInitialProduct,
 "color": selectedColors,
 "size": selectedSizes,
 "weight": selectedWeights,
 "hsn code": hsnCode,
 "gst %": gstPercent,
 "price info": marketValue,
 "selling price": sellingPrice,
 "gross rate": grossRate,
 "discount %": discount,
 "gst rate %": priceGst || gstPercent,
 } : {
 "product images": images,
 "product name": productName,
 "product title name": titleName,
 "product description": description,
 "color": selectedColors,
 "size": selectedSizes,
 "weight": selectedWeights,
 "hsn code": hsnCode,
 "gst %": gstPercent,
 "key features": features.filter(f => f.trim() !== ''),
 "upload services": selectedServiceCategory,
 "mobile number": mobileNumber, 
 "tags": selectedTags,
 "main category": mainCat,
 "middle category": midCat,
 "sub category": subCat,
 "product type chips": homeFeedProductType,
 "choose title category": homeFeedTitleCategory,
 "category tags": categoryTags,
 "minimum order quantity": minQuantity,
 "delivery charge": deliveryCharge,
 "delivery charge type": deliveryChargeType,
 "product_sku_code": productSku,
 "available_stock": availableStock || '0',
 "price info": marketValue,
 "selling price": sellingPrice,
 "gross rate": grossRate,
 "discount %": discount,
 "gst rate %": priceGst,
 "gift cash donation": giftDonation,
 "Time Duration": flashSaleDuration,
 seller_id: currentSellerId
 };

 const stockNum = parseInt(availableStock || initialProduct?.available_stock || '0', 10);
 const targetTable = stockNum > 0 ? 'upload_products' : 'inactive_products';

 if (initialMode === 'edit_active' && initialProduct?.id) {
 const { error } = await supabase.from('upload_products').update(payload).eq('id', initialProduct.id);
 if (error) throw error;
 // Cascade update to carts
 try {
 await supabase.from('carts').update(payload).eq('product_id', initialProduct.id);
 } catch(e) { console.error('Cart update failed', e); }
 alert('Product details updated successfully!');
 } else if (initialMode === 'edit_inactive' && initialProduct?.id) {
 const { error } = await supabase.from('inactive_products').update(payload).eq('id', initialProduct.id);
 if (error) throw error;
 alert('Inactive product details updated successfully!');
 } else if (initialMode === 'edit_draft' && initialProduct?.id) {
 if (!payload['product code']) {
 payload['product code'] = await generateUniqueProductCode(supabase);
 }
 const { error: insErr } = await supabase.from(targetTable).insert([payload]);
 if (insErr) throw insErr;
 await supabase.from('save_in_draft').delete().eq('id', initialProduct.id);
 alert(stockNum > 0 ? 'Product Published from Draft to Active Products Successfully!' : 'Product Published to Inactive Products (Out of Stock)!');
 } else {
 payload['product code'] = await generateUniqueProductCode(supabase);
 const { error } = await supabase.from(targetTable).insert([payload]);
 if (error) throw error;
 alert(stockNum > 0 ? 'Product Published to Active Products Successfully!' : 'Product Saved to Inactive Products (Out of Stock)!');
 }

 onBack();
 } catch (err: any) {
 alert('Error saving product: ' + err.message);
 console.error(err);
 } finally {
 setIsPublishing(false);
 }
 }
 };

 return (
 <div className="fixed inset-0 z-[200] w-full bg-[#FFFBF0] flex flex-col font-poppins pb-6 overflow-y-auto">
 <div className="p-4 flex flex-col gap-4 relative">
 {deliveryCharge && !deliveryChargeType && (
 <div 
 className="fixed inset-0 z-[40]" 
 onClick={(e) => {
 e.stopPropagation();
 alert("Please select Delivery Type (Per Quantity or Per Order) first");
 }}
 ></div>
 )}
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-xl font-bold text-gray-800">Upload Product</h2>
 <button
 onClick={handleSaveInDraft}
 disabled={isSavingDraft || !isFormValid}
 className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors flex items-center justify-center gap-1.5 ${
 (!isFormValid || isSavingDraft)
 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
 : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
 }`}
 >
 <Save size={14} />
 {isSavingDraft ? 'Saving...' : 'Save in Draft'}
 </button>
 </div>

 {/* 1. Image Upload Section */}
 {!isEditMode && (
 <div className="flex flex-col gap-2">
 <label className="text-sm font-semibold text-gray-700">Product Images (Fixed Crop)</label>
 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
 
 <div className="flex flex-col gap-2">
 <button 
 onClick={() => images.length < 4 && fileInputRef.current?.click()}
 disabled={images.length >= 4}
 className="w-full py-3 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <ImagePlus size={18} /> Add Image {images.length}/4
 </button>
 <p className="text-[10px] text-gray-500 leading-tight text-center">Images will be cropped to fixed ratio with extreme quality compression.</p>
 
 <div className="grid grid-cols-4 gap-2 mt-1">
 {[0, 1, 2, 3].map(index => (
 <div key={index} className="aspect-square border border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative flex items-center justify-center">
 {images[index] ? (
 <>
 <img src={images[index]} alt={`Upload ${index}`} className="w-full h-full object-cover" />
 <button onClick={() => removeImage(index)} className="absolute top-0.5 right-0.5 p-0.5 bg-white/80 text-red-500 rounded-full hover:bg-white shadow-sm backdrop-blur-sm">
 <X size={12} />
 </button>
 {index === 0 && (
 <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 backdrop-blur-sm">MAIN</div>
 )}
 </>
 ) : (
 <div className="text-gray-300 flex flex-col items-center">
 <Plus size={20} />
 <span className="text-[8px] mt-1 font-semibold">{index === 0 ? 'MAIN' : `IMG ${index+1}`}</span>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* 2. Basic Info & Varieties */}
 <div className="flex flex-col gap-3">
 {!isEditMode && (
 <>
 <div className="flex gap-3">
 <div className="flex-1 flex flex-col gap-1 relative">
 <label className="text-xs font-semibold text-gray-700">Product Name</label>
 <input 
 type="text" 
 value={productName}
 onChange={(e) => {
 setProductName(e.target.value);
 setIsCategoryAutoSelected(false);
 setShowSuggestions(true);
 }}
 onFocus={() => setShowSuggestions(true)}
 onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
 className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
 placeholder="Enter product name (e.g. Kite, Shirt, Oil, Shoes...)" 
 />
 {showSuggestions && suggestedCategories.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-xl z-50 max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-gray-100">
 <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 shadow-2xs">
 <span>Matching Sub Categories ({suggestedCategories.length})</span>
 <span className="text-orange-600 font-semibold lowercase">tap to select</span>
 </div>
 {suggestedCategories.map((s, i) => (
 <div 
 key={`${s.subId}-${i}`} 
 className="px-3 py-2.5 hover:bg-orange-50 cursor-pointer text-sm transition-colors flex flex-col group"
 onMouseDown={(e) => {
 e.preventDefault();
 setProductName(s.name);
 setProductCategory(s.name);
 setMainCat(s.mainId);
 setMidCat(s.midId);
 setSubCat(s.subId);
 setIsCategoryAutoSelected(true);
 setShowSuggestions(false);
 }}
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{s.name}</span>
 <span className="text-[10px] font-bold text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
 </div>
 <span className="text-[10px] text-gray-400 mt-0.5">
 {s.mainName} &gt; {s.midName} &gt; <span className="text-gray-600 font-medium">{s.name}</span>
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">Product Title Name</label>
 <input 
 type="text" 
 value={titleName}
 onChange={(e) => setTitleName(e.target.value)}
 className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
 placeholder="Enter product title name" 
 />
 </div>
 <div className="flex flex-col gap-1">
 <div className="flex items-center justify-between">
 <label className="text-xs font-semibold text-gray-700">Product Description</label>
 <button 
 onClick={generateDescription}
 className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 font-bold px-2 py-1 rounded-md border border-purple-100 hover:bg-purple-100 transition-colors"
 title="Auto Generate"
 >
 <Wand2 size={12} /> Auto Generate
 </button>
 </div>
 <textarea 
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 min-h-[80px]" 
 placeholder="Enter product description" 
 />
 </div>
 </>
 )}
 
 <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 mt-1">
 <div className="flex items-center justify-between border-b border-gray-100 pb-2">
 <span className="text-xs font-bold text-gray-800">Colour, Size & Weight</span>
 <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/80">
 Any 2 Required
 </span>
 </div>

 {/* Colour */}
 <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-3">
 <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Colour</label>
 <div className="flex items-center gap-2">
 <select 
 className="flex-1 px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500" 
 value={selectedColors.length > 0 ? selectedColors[0].name : ""}
 onChange={(e) => {
 const c = PRESET_COLORS.find(pc => pc.name === e.target.value);
 if (c && !selectedColors.find(sc => sc.name === c.name)) {
 setSelectedColors([...selectedColors, {name: c.name, hex: c.hex}]);
 }
 }}
 >
 <option value="" disabled>Select Colour...</option>
 {PRESET_COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
 </select>
 <button onClick={() => setActiveModal('color')} className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-md hover:bg-orange-200 transition-colors flex items-center gap-1 border border-orange-200 shrink-0">
 <Plus size={12} /> Add Variety
 </button>
 </div>

 {selectedColors.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-1">
 {selectedColors.map(c => (
 <div key={c.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold shadow-sm">
 <div className="w-5 h-5 rounded-md border border-gray-300" style={{backgroundColor: c.hex}}></div>
 {c.name}
 <button type="button" onClick={() => setSelectedColors(selectedColors.filter(sc => sc.name !== c.name))} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Size */}
 <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-3">
 <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Size</label>
 <div className="flex items-center gap-2">
 <select 
 className="flex-1 px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-orange-500" 
 value={selectedSizes.length > 0 ? selectedSizes[0] : ""}
 onChange={(e) => toggleSelection(e.target.value, selectedSizes, setSelectedSizes)}
 >
 <option value="" disabled>Select Size...</option>
 {PRESET_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 <button onClick={() => setActiveModal('size')} className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-md hover:bg-orange-200 transition-colors flex items-center gap-1 border border-orange-200">
 <Plus size={12} /> Add Variety
 </button>
 </div>
 {selectedSizes.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-1">
 {selectedSizes.map(s => (
 <div key={s} className="flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold shadow-sm">
 {s}
 <button onClick={() => toggleSelection(s, selectedSizes, setSelectedSizes)} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Weight */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Weight</label>
 <div className="flex items-center gap-2">
 <select 
 className="flex-1 px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-orange-500" 
 value={selectedWeights.length > 0 ? selectedWeights[0] : ""}
 onChange={(e) => toggleSelection(e.target.value, selectedWeights, setSelectedWeights)}
 >
 <option value="" disabled>Select Weight...</option>
 {PRESET_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
 </select>
 <button onClick={() => setActiveModal('weight')} className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-md hover:bg-orange-200 transition-colors flex items-center gap-1 border border-orange-200">
 <Plus size={12} /> Add Variety
 </button>
 </div>
 {selectedWeights.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-1">
 {selectedWeights.map(w => (
 <div key={w} className="flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold shadow-sm">
 {w}
 <button onClick={() => toggleSelection(w, selectedWeights, setSelectedWeights)} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* 3. HSN & GST */}
 <div className={`flex flex-col gap-3 mt-2 p-3 rounded-xl border relative ${isGstVerified ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-100 border-gray-200 opacity-70'}`}>
 {!isGstVerified && (
 <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl">
 <span className="bg-white/90 text-red-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-red-100">GST Not Verified in Account</span>
 </div>
 )}
 <div className="flex justify-start">
 <a href="https://services.gst.gov.in/services/searchhsnsac" target="_blank" rel="noreferrer" className={`text-[11px] font-bold text-white px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors w-fit ${isGstVerified ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 pointer-events-none'}`}>
 <Search size={14} /> Search for HSN Code
 </a>
 </div>
 <div className="flex gap-3">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">HSN Code</label>
 <input type="text" value={hsnCode} onChange={e => setHsnCode(e.target.value)} disabled={!isGstVerified} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-400" placeholder="Enter HSN" />
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">GST %</label>
 <input type="number" value={gstPercent} onChange={e => setGstPercent(e.target.value)} disabled={!isGstVerified} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-400" placeholder="0%" />
 </div>
 </div>
 </div>

 {!isEditMode && (
 <>
 {/* 4. Key Features */}
 <div className="flex flex-col gap-2 mt-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
 <label className="text-sm font-bold text-gray-800">Key Features</label>
 
 <div className="flex flex-col mb-1 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 gap-3">
 <div className="flex justify-between items-center w-full">
 <div className="flex gap-1.5 p-0.5 bg-gray-200 rounded-md w-fit">
 <button 
 onClick={() => setFeatureLang('Hindi')} 
 className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-sm transition-colors ${featureLang === 'Hindi' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
 >
 <span className="text-[14px]">अ</span> Hindi
 </button>
 <button 
 onClick={() => setFeatureLang('English')} 
 className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-sm transition-colors ${featureLang === 'English' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
 >
 <span className="text-[14px]">A</span> English
 </button>
 </div>
 <span className="text-[10px] font-bold text-gray-600">{featureCount} Points</span>
 </div>
 
 <div className="flex items-center w-full mt-2">
 <div className="relative flex items-center h-6 w-full">
 <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
 <div className="h-full bg-blue-500 transition-all duration-300 relative" style={{ width: `${(featureCount - 1) / 9 * 100}%` }}></div>
 </div>
 {Array.from({length: 10}).map((_, i) => (
 <div key={i} className="absolute w-1 h-1 bg-white rounded-full pointer-events-none" style={{left: `${(i/9)*100}%`, transform: 'translateX(-50%)'}}></div>
 ))}
 <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow pointer-events-none z-10 transition-all duration-300" style={{ left: `calc(${(featureCount - 1) / 9 * 100}% - 8px)` }}></div>
 <input 
 type="range" min="1" max="10" 
 value={featureCount} 
 onChange={(e) => setFeatureCount(Number(e.target.value))} 
 className="w-full absolute inset-0 opacity-0 cursor-pointer z-20 h-full" 
 />
 </div>
 </div>
 </div>
 
 <div className="flex flex-col gap-2 mt-2">
 {Array.from({length: featureCount}).map((_, idx) => {
 const isLastPoint = idx === featureCount - 1;
 return (
 <div key={idx} className="flex gap-2 items-start group">
 <span className="text-xs font-bold text-gray-400 mt-2.5 w-4 text-right">{idx + 1}.</span>
 {isLastPoint ? (
 <div className="flex-1 relative">
 <div
 className={`w-full transition-colors cursor-pointer flex items-center justify-between px-3 py-2 text-[11px] sm:text-xs font-semibold border rounded-lg focus:outline-none min-h-[35px] shadow-sm ${
 !features[idx] ? 'bg-blue-100 text-blue-600 border border-blue-300 hover:bg-blue-200 animate-pulse' : 'bg-blue-50/80 text-blue-800 border-blue-200 hover:bg-blue-100'
 }`}
 onClick={() => setIsReturnPolicyDropdownOpen(!isReturnPolicyDropdownOpen)}
 >
 <span className="leading-relaxed pr-2 whitespace-normal">{features[idx] || 'Select Return Policy'}</span>
 <ChevronDown size={14} className={`shrink-0 transition-transform ${isReturnPolicyDropdownOpen ? 'rotate-180' : ''}`} />
 </div>

 {isReturnPolicyDropdownOpen && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
 <div
 className="px-3 py-3 text-[11px] sm:text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer font-semibold flex items-center justify-between leading-relaxed border-b border-gray-100"
 onClick={() => {
 const newF = [...features];
 newF[idx] = '';
 setFeatures(newF);
 setIsReturnPolicyDropdownOpen(false);
 }}
 >
 <span className="pr-2">Select Return Policy</span>
 {!features[idx] && <Check size={16} className="text-gray-500 shrink-0" />}
 </div>
 <div
 className="px-3 py-3 text-[11px] sm:text-xs hover:bg-blue-50 cursor-pointer font-semibold text-gray-700 hover:text-blue-700 flex items-center justify-between leading-relaxed border-b border-gray-100"
 onClick={() => { 
 const newF = [...features]; 
 newF[idx] = 'Open Box Delivery with a 3-Day Return Policy — Subject to Return Eligibility';
 setFeatures(newF);
 setIsReturnPolicyDropdownOpen(false); 
 }}
 >
 <span className="pr-2">Open Box Delivery with a 3-Day Return Policy — Subject to Return Eligibility</span>
 {features[idx] === 'Open Box Delivery with a 3-Day Return Policy — Subject to Return Eligibility' && <Check size={16} className="text-blue-600 shrink-0" />}
 </div>
 <div
 className="px-3 py-3 text-[11px] sm:text-xs hover:bg-blue-50 cursor-pointer font-semibold text-gray-700 hover:text-blue-700 flex items-center justify-between leading-relaxed"
 onClick={() => { 
 const newF = [...features]; 
 newF[idx] = 'Open Box Delivery with No Return Policy — Not Subject to Return Eligibility';
 setFeatures(newF);
 setIsReturnPolicyDropdownOpen(false); 
 }}
 >
 <span className="pr-2">Open Box Delivery with No Return Policy — Not Subject to Return Eligibility</span>
 {features[idx] === 'Open Box Delivery with No Return Policy — Not Subject to Return Eligibility' && <Check size={16} className="text-blue-600 shrink-0" />}
 </div>
 </div>
 )}
 </div>
 ) : (
 <>
 <textarea 
 value={features[idx] || ''}
 onChange={(e) => {
 const newF = [...features];
 newF[idx] = e.target.value;
 setFeatures(newF);
 }}
 className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 min-h-[25px] h-[30px] leading-relaxed transition-all"
 placeholder="Enter feature manually or click generate..."
 />
 <button 
 onClick={() => generateSingleFeature(idx)}
 className="p-2 mt-0.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-colors shrink-0 active:scale-95"
 title="Regenerate Feature"
 >
 <Wand2 size={16} />
 </button>
 </>
 )}
 </div>
 )})}
 </div>
 </div>

 {/* 5. Services Tab */}
 {uploadServiceVisible && (
 <div className="flex flex-col gap-2 mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
 <label className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Upload Service</label>
 
 <div className="flex flex-col gap-1 mt-1">
 <select 
 value={selectedServiceCategory}
 onChange={(e) => setSelectedServiceCategory(e.target.value)}
 className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 font-medium"
 >
 <option value="">Select Service</option>
 <option value="Top Services">Top Services</option>
 <option value="Breakfast and Drink">Breakfast and Drink</option>
 <option value="Suriyawan Shopping Special">Suriyawan Shopping Special</option>
 </select>
 </div>

 <div className="flex flex-col gap-1 mt-2">
 <label className={`text-xs font-semibold transition-colors ${selectedServiceCategory === 'Top Services' ? 'text-gray-700' : 'text-gray-400'}`}>
 Mobile Number {selectedServiceCategory === 'Top Services' && <span className="text-orange-500">*</span>}
 </label>
 <input 
 type="tel" 
 value={mobileNumber}
 onChange={(e) => setMobileNumber(e.target.value)}
 disabled={selectedServiceCategory !== 'Top Services'}
 className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${
 selectedServiceCategory === 'Top Services' 
 ? 'bg-orange-50 border-orange-300 focus:border-orange-500 ring-2 ring-orange-100' 
 : 'bg-gray-100 border-gray-200 opacity-50'
 }`} 
 placeholder="+91" 
 />
 </div>

 <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-100">
 <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tags</label>
 <div 
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:border-orange-500 text-gray-500 flex justify-between items-center transition-colors"
 onClick={() => setActiveModal('tag')}
 >
 <span>Select Tags...</span>
 <ChevronDown size={16} />
 </div>
 {selectedTags.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-1">
 {selectedTags.map(tagName => {
 const tagData: TagType = PREDEFINED_TAGS.find(t => t.name === tagName) || { name: tagName, color: 'bg-gray-800 text-gray-100 border-gray-700' };
 return (
 <div
 key={tagData.name}
 className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border shadow-sm ring-2 ring-offset-1 ring-current flex items-center ${
 tagData.special 
 ? 'bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-yellow-900 border-yellow-500 relative overflow-hidden' 
 : tagData.color
 }`}
 >
 {tagData.special && (
 <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
 )}
 <span>{tagData.name}</span>
 <button 
 onClick={() => setSelectedTags(selectedTags.includes(tagData.name) ? [] : [tagData.name])}
 className="ml-1.5 opacity-70 hover:opacity-100 flex-shrink-0"
 >
 <X size={12} />
 </button>
 </div>
 )
 })}
 </div>
 )}
 </div>
 </div>
 )}

 {/* 6. Category Selection */}
 <div className={`flex flex-col gap-2 mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm ${selectedServiceCategory === 'Top Services' ? 'pointer-events-none opacity-50' : ''}`}>
 <label className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Select Category</label>
 
 <div className="flex flex-col gap-1 mt-1">
 <label className="text-xs font-semibold text-gray-500">Main Category</label>
 <select 
 value={mainCat} 
 onChange={(e) => { setMainCat(e.target.value); setMidCat(''); setSubCat(''); }}
 disabled={isCategoryAutoSelected || selectedServiceCategory === 'Top Services'}
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <option value="">Select Main Category</option>
 {categoryData.map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>

 <div className="flex flex-col gap-1 mt-1">
 <label className="text-xs font-semibold text-gray-500">Middle Category</label>
 <select 
 value={midCat}
 onChange={(e) => { setMidCat(e.target.value); setSubCat(''); }}
 disabled={isCategoryAutoSelected || !mainCat || !categoryData.find(c => c.id === mainCat)?.middle || selectedServiceCategory === 'Top Services'}
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <option value="">Select Middle Category</option>
 {categoryData.find(c => c.id === mainCat)?.middle?.map(m => (
 <option key={m.id} value={m.id}>{m.name}</option>
 ))}
 </select>
 </div>

 <div className="flex flex-col gap-1 mt-1">
 <label className="text-xs font-semibold text-gray-500">Sub Category</label>
 <select 
 value={subCat}
 onChange={(e) => setSubCat(e.target.value)}
 disabled={isCategoryAutoSelected || !midCat || !categoryData.find(c => c.id === mainCat)?.middle?.find(m => m.id === midCat)?.sub || selectedServiceCategory === 'Top Services'}
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <option value="">Select Sub Category</option>
 {categoryData.find(c => c.id === mainCat)?.middle?.find(m => m.id === midCat)?.sub?.map(s => (
 <option key={s.id} value={s.id}>{s.name}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Home Feed Section */}
 <div className={`flex flex-col gap-2 mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm ${isHomeFeedDisabled ? 'pointer-events-none opacity-50' : ''}`}>
 <label className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Home Feed Section</label>

 <div className="flex flex-col gap-1 mt-1">
 <label className="text-xs font-semibold text-gray-500">Product Type Chips</label>
 <select 
 value={homeFeedProductType}
 onChange={(e) => {
 const val = e.target.value;
 setHomeFeedProductType(val);
 if (val !== 'Flash Sale') {
 setFlashSaleDuration('');
 if (categoryTags.includes('Flash')) {
 setCategoryTags([]);
 }
 } else {
 if (!categoryTags.includes('Flash')) {
 setCategoryTags(['Flash']);
 }
 }
 }}
 disabled={isHomeFeedDisabled}
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <option value="">Select Type</option>
 <option value="Live Sale">Live Sale</option>
 <option value="Flash Sale">Flash Sale</option>
 <option value="Trending">Trending</option>
 <option value="Best Seller">Best Seller</option>
 <option value="Seasonal">Seasonal</option>
 </select>
 </div>

 {homeFeedProductType === 'Flash Sale' && (
 <div className="flex flex-col gap-1 mt-1">
 <label className="text-xs font-semibold text-gray-500">Time Duration</label>
 <select 
 value={flashSaleDuration}
 onChange={(e) => setFlashSaleDuration(e.target.value)}
 disabled={isHomeFeedDisabled}
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <option value="">Select Duration</option>
 <option value="Every 3 hours">Every 3 hours</option>
 <option value="Every 6 hours">Every 6 hours</option>
 <option value="Every 12 hours">Every 12 hours</option>
 <option value="Every 24 hours">Every 24 hours</option>
 </select>
 </div>
 )}

 <div className="flex flex-col gap-1 mt-1">
 <label className="text-xs font-semibold text-gray-500">Choose Title Category</label>
 <select 
 value={homeFeedTitleCategory}
 onChange={(e) => setHomeFeedTitleCategory(e.target.value)}
 disabled={isHomeFeedDisabled}
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <option value="">Select Title Category</option>
 <option value="Unique Collection">Unique Collection</option>
 <option value="New Arrival">New Arrival</option>
 <option value="Recommend">Recommend</option>
 <option value="Popular Choice">Popular Choice</option>
 </select>
 </div>
 </div>

 {/* Category Tags */}
 <div className={`flex flex-col gap-2 mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm ${selectedServiceCategory === 'Top Services' ? 'pointer-events-none opacity-50' : ''}`}>
 <label className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Category Tags</label>
 <div 
 className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:border-orange-500 text-gray-500 flex justify-between items-center transition-colors mt-1"
 onClick={() => selectedServiceCategory !== 'Top Services' && setActiveModal('categoryTag')}
 >
 <span>Select Category Tags...</span>
 <ChevronDown size={16} />
 </div>
 {categoryTags.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-1">
 {categoryTags.map(tagName => {
 const tagData = PREDEFINED_TAGS.find(t => t.name === tagName) || { name: tagName, color: 'bg-gray-800 text-gray-100 border-gray-700', special: false };
 return (
 <div
 key={tagData.name}
 className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border shadow-sm ring-2 ring-offset-1 ring-current flex items-center ${
 tagData.special 
 ? 'bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-yellow-900 border-yellow-500 relative overflow-hidden' 
 : tagData.color
 }`}
 >
 {tagData.special && (
 <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
 )}
 <span>{tagData.name}</span>
 <button 
 onClick={() => {
 if (homeFeedProductType === 'Flash Sale' && tagData.name === 'Flash') {
 alert('Flash tag is compulsory for Flash Sale and cannot be removed');
 return;
 }
 setCategoryTags([]);
 }}
 className="ml-1.5 opacity-70 hover:opacity-100 flex-shrink-0"
 >
 <X size={12} />
 </button>
 </div>
 )
 })}
 </div>
 )}
 </div>

 {/* Order & Delivery Details */}
 <div className={`flex flex-col gap-3 mt-4 p-3 bg-white rounded-xl shadow-sm ${deliveryCharge && !deliveryChargeType ? 'relative z-[50] border-blue-400 ring-2 ring-blue-100' : 'border border-gray-200'} ${selectedServiceCategory === 'Top Services' ? 'pointer-events-none opacity-50' : ''}`}>
 <label className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Order & Delivery Details</label>
 
 <div className="flex flex-col gap-1 mt-1">
 <label className="text-xs font-semibold text-gray-700">Minimum Order Quantity</label>
 <div className="flex w-full rounded-lg border border-gray-200 overflow-hidden">
 {isCustomQty ? (
 <div className="flex w-full bg-white relative">
 <div className="w-[60%] px-3 py-2 text-sm text-gray-500 border-r border-gray-200 flex items-center bg-gray-50/50">
 Minimum Quantity
 </div>
 <div className="w-[40%] flex items-center">
 <input 
 type="number" 
 min="1"
 value={minQuantity === 0 ? '' : minQuantity}
 onChange={(e) => setMinQuantity(e.target.value === '' ? 0 : Number(e.target.value))}
 disabled={selectedServiceCategory === 'Top Services'}
 className="w-full h-full px-2 py-2 text-sm bg-transparent focus:outline-none placeholder-gray-400 font-bold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" 
 placeholder="Qty" 
 autoFocus
 />
 </div>
 </div>
 ) : (
 <div className="flex w-full bg-white relative">
 <div className="w-[60%] px-3 py-2 text-sm text-gray-500 border-r border-gray-200 flex items-center bg-gray-50/50">
 Minimum Quantity
 </div>
 <div className="w-[40%] relative bg-white hover:bg-gray-50 transition-colors">
 <select 
 value={minQuantity.toString()}
 onChange={(e) => {
 if (e.target.value === 'custom') {
 setIsCustomQty(true);
 setMinQuantity(0);
 } else {
 setMinQuantity(Number(e.target.value));
 }
 }}
 disabled={selectedServiceCategory === 'Top Services'}
 className="w-full h-full px-2 py-2 text-sm bg-transparent focus:outline-none appearance-none cursor-pointer text-gray-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
 <option value="custom">Custom</option>
 </select>
 <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
 <ChevronDown size={14} />
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="flex flex-col gap-1 mt-2">
 <label className="text-xs font-semibold text-gray-700">Delivery Charge</label>
 <div className="flex w-full rounded-lg border border-gray-200 overflow-visible relative shadow-sm">
 <div className="w-[50%] bg-white border-r border-gray-100 flex items-center relative">
 <span className="absolute left-3 text-gray-400 text-sm">₹</span>
 <input 
 type="number" 
 className="w-full pl-7 pr-3 py-2 text-sm bg-transparent focus:outline-none placeholder-gray-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
 placeholder="Amount"
 value={deliveryCharge}
 disabled={selectedServiceCategory === 'Top Services'}
 onChange={(e) => {
 setDeliveryCharge(e.target.value);
 if (e.target.value && !deliveryChargeType) {
 setIsDeliveryChargeDropdownOpen(true);
 }
 }}
 />
 </div>
 <div 
 className={`w-[50%] transition-colors cursor-pointer flex items-center justify-between px-3 text-sm font-semibold ${
 !deliveryChargeType ? 'bg-gray-50 text-gray-500 hover:bg-gray-100' : 'bg-blue-50/50 text-blue-700 hover:bg-blue-50'} ${selectedServiceCategory === 'Top Services' ? 'pointer-events-none opacity-50' : ''}`}
 onClick={() => selectedServiceCategory !== 'Top Services' && setIsDeliveryChargeDropdownOpen(!isDeliveryChargeDropdownOpen)}
 >
 <span>{deliveryChargeType === 'per_order' ? 'Per Order' : deliveryChargeType === 'per_quantity' ? 'Per Quantity' : 'Select Type'}</span>
 <ChevronDown size={14} className={`transition-transform ${isDeliveryChargeDropdownOpen ? 'rotate-180' : ''}`} />
 </div>
 
 {isDeliveryChargeDropdownOpen && (
 <div className="absolute top-full left-[50%] right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
 <div 
 className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer font-medium text-gray-700 hover:text-blue-600 flex items-center justify-between"
 onClick={() => { setDeliveryChargeType('per_order'); setIsDeliveryChargeDropdownOpen(false); }}
 >
 Per Order {deliveryChargeType === 'per_order' && <Check size={14} className="text-blue-500" />}
 </div>
 <div className="h-px bg-gray-100 w-full" />
 <div 
 className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer font-medium text-gray-700 hover:text-blue-600 flex items-center justify-between"
 onClick={() => { setDeliveryChargeType('per_quantity'); setIsDeliveryChargeDropdownOpen(false); }}
 >
 Per Quantity {deliveryChargeType === 'per_quantity' && <Check size={14} className="text-blue-500" />}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className={`grid grid-cols-5 gap-3 mt-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm ${selectedServiceCategory === 'Top Services' ? 'pointer-events-none opacity-50' : ''}`}>
 <div className="col-span-3 flex flex-col gap-2 min-w-0">
 <label className="text-sm font-bold text-gray-800 truncate">Product SKU Code</label>
 <input type="text" value={productSku} readOnly className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none cursor-not-allowed text-gray-600" placeholder="Auto-generated SKU" />
 </div>
 <div className="col-span-2 flex flex-col gap-2 min-w-0">
 <label className="text-sm font-bold text-gray-800 truncate" title="Available Stock">Available Stock</label>
 <input 
 type="number" 
 value={availableStock} 
 onChange={(e) => setAvailableStock(e.target.value)} 
 disabled={selectedServiceCategory === 'Top Services'}
 className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
 placeholder="Qty" 
 />
 </div>
 </div>
 </>
 )}

 {/* 8. Price Info */}
 <div className={`flex flex-col gap-3 mt-4 ${selectedServiceCategory === 'Top Services' ? 'pointer-events-none opacity-50' : ''}`}>
 <label className="text-sm font-bold text-gray-800">Price & Details</label>
 
 <div className="flex gap-3">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">Price Info (₹)</label>
 <input 
 type="number" 
 value={marketValue} 
 onChange={e => setMarketValue(e.target.value)} 
 disabled={selectedServiceCategory === 'Top Services'}
 className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
 placeholder="Market Value" 
 />
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">Selling Price (₹)</label>
 <input 
 type="number" 
 value={sellingPrice} 
 onChange={e => setSellingPrice(e.target.value)} 
 disabled={selectedServiceCategory === 'Top Services'}
 className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
 placeholder="0.00" 
 />
 </div>
 </div>

 <div className="flex gap-3">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">Gross Rate (₹)</label>
 <input type="number" value={grossRate} readOnly className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none cursor-not-allowed" placeholder="0.00" />
 </div>
 <div className="flex-1 flex flex-col gap-1 relative">
 <label className="text-xs font-semibold text-gray-700">Discount</label>
 <div className="relative flex items-center h-full">
 <input type="text" value="" readOnly className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none cursor-not-allowed pr-16 h-full" placeholder="" />
 {discount !== '' && !isNaN(parseFloat(sellingPrice)) && (
 <span className="absolute left-3 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
 {discount}% OFF
 </span>
 )}
 </div>
 </div>
 </div>
 
 <div className="flex gap-3">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">HSN Code (Repeated)</label>
 <input type="text" value={hsnCode} readOnly className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none cursor-not-allowed" placeholder="HSN" />
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-semibold text-gray-700">GST Rate (%)</label>
 <input type="number" value={gstPercent} readOnly className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none cursor-not-allowed" placeholder="0%" />
 </div>
 </div>
 </div>



 {/* 9. Gift Cash Donation */}
 {!isEditMode && (
 <div className={`flex flex-col gap-1 mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm ${selectedServiceCategory === 'Top Services' ? 'pointer-events-none opacity-50' : ''}`}>
 <label className="text-sm font-bold text-green-800 flex items-center gap-1.5">
 <span className="text-lg">🎁</span> Gift Cash Donation
 </label>
 <p className="text-[11px] text-green-700/90 mb-2 font-medium italic leading-relaxed">
 "Share a Little, Spread a Smile — A ₹1–₹5 Gift for Education, Dreams & Happiness. Make a Difference, One Smile at a Time."
 </p>
 <input 
 type="number" 
 value={giftDonation}
 onChange={(e) => handleGiftDonationChange(e.target.value)}
 disabled={selectedServiceCategory === 'Top Services'}
 className="w-full px-3 py-2.5 text-sm bg-white border border-green-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all font-bold text-green-700 disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" 
 placeholder="Enter donation amount" 
 />
 </div>
 )}

 {/* Estimated Earning Chart */}
 {selectedServiceCategory !== 'Top Services' && (() => {
 const earnings = calculateEarnings();
 return (
 <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
 <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Seller Estimated Earning</h3>
 </div>
 <div className="p-4 space-y-2">
 <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
 <span>Selling Price</span>
 <span>₹ {earnings.sellingPrice.toFixed(2)}</span>
 </div>
 <div className="pl-4 border-l-2 border-slate-100 flex flex-col gap-1.5 my-1.5">
 <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
 <span>Gross Rate</span>
 <span>₹ {earnings.grossRateNum.toFixed(2)}</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
 <span>C-GST ({earnings.halfGstPercent}%)</span>
 <span>₹ {earnings.sellerCgstAmount.toFixed(2)}</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
 <span>S-GST ({earnings.halfGstPercent}%)</span>
 <span>₹ {earnings.sellerSgstAmount.toFixed(2)}</span>
 </div>
 </div>
 <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
 <span>Delivery Charge</span>
 <span>+ ₹ {earnings.deliveryCharge.toFixed(2)}</span>
 </div>
 <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-800">
 <span>Total Earning Amount</span>
 <span>₹ {earnings.totalSellerEarning.toFixed(2)}</span>
 </div>

 <div className="pt-3 mt-3 border-t border-slate-200">
 <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Platform Estimated Earning</h4>
 {earnings.calculatedCharges.map(charge => (
 <div key={charge.id} className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1.5">
 <span>{charge.name}</span>
 <span className="text-red-500">- ₹ {charge.amount.toFixed(2)}</span>
 </div>
 ))}
 </div>

 <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-600">
 <span>Gift Cash Donation</span>
 <span className="text-red-500">- ₹ {earnings.giftDonation.toFixed(2)}</span>
 </div>
 
 <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-800">
 <span>Total Platform Estimate</span>
 <span className="text-red-500">- ₹ {earnings.totalPlatformEarning.toFixed(2)}</span>
 </div>
 </div>
 <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-between items-center">
 <span className="text-sm font-bold text-black uppercase tracking-wider">Final Net Earning</span>
 <span className="text-base font-black text-[#5a9c32] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">₹ {earnings.finalNetEarning.toFixed(2)}</span>
 </div>
 </div>
 );
 })()}



 {/* Submit Button */}
 <button 
 onClick={handlePublish} 
 disabled={!isFormValid || isPublishing}
 className={`w-full py-3.5 mt-6 font-black text-sm uppercase tracking-wider rounded-xl flex justify-center items-center gap-2 transition-colors ${!isFormValid ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : isPublishing ? 'bg-green-600 text-white shadow-lg cursor-not-allowed' : 'bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95'}`}
 >
 {isPublishing ? (
 <>Publishing<span className="flex gap-0.5 items-center ml-1"><span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="w-1 h-1 bg-current rounded-full animate-bounce"></span></span></>
 ) : (
 'Publish Product'
 )}
 </button>
 </div>

 {/* MODALS */}
 {activeModal !== 'none' && (
 <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4">
 <div className="bg-white w-full sm:w-[500px] h-[100dvh] sm:h-[80vh] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
 <h3 className="font-bold text-gray-800 capitalize">
 {activeModal === 'tag' ? 'Select Professional Tags (250+)' : `Add Variety: ${activeModal}`}
 </h3>
 <button onClick={() => setActiveModal('none')} className="p-2 rounded-full bg-white text-gray-500 hover:bg-gray-100 border border-gray-200">
 <X size={18} />
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
 
 {/* TAG MODAL */}
 {(activeModal === 'tag' || activeModal === 'categoryTag') && (
 <div className="flex flex-wrap gap-2">
 {PREDEFINED_TAGS.filter(tag => activeModal === 'tag' || (tag.name !== 'Suriyawan Shopping Special' && tag.name !== 'Special')).map((tag) => {
 const isActive = activeModal === 'tag' ? selectedTags.includes(tag.name) : categoryTags.includes(tag.name);
 return (
 <button
 key={tag.name}
 onClick={() => {
 if (activeModal === 'tag') {
 setSelectedTags(selectedTags.includes(tag.name) ? [] : [tag.name]);
 } else {
 if (homeFeedProductType === 'Flash Sale') {
 if (tag.name === 'Flash') {
 alert('Flash tag is compulsory for Flash Sale and cannot be removed');
 return;
 } else {
 alert('Only Flash tag is allowed for Flash Sale');
 return;
 }
 }
 setCategoryTags(categoryTags.includes(tag.name) ? [] : [tag.name]);
 }
 }}
 className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ring-2 ring-offset-1 ring-current ${
 tag.special 
 ? 'bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-yellow-900 border-yellow-500 relative overflow-hidden' 
 : `${tag.color}`
 } ${isActive ? 'scale-105 opacity-100 ring-2' : 'opacity-60 hover:opacity-100 ring-transparent'}`}
 >
 {tag.special && isActive && (
 <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12" />
 )}
 <span>{tag.name}</span>
 </button>
 )
 })}
 </div>
 )}

 {/* COLOR MODAL */}
 {activeModal === 'color' && (
 <>
 <div className="grid grid-cols-4 gap-2">
 {PRESET_COLORS.map(c => {
 const isSelected = selectedColors.some(sc => sc.name === c.name);
 return (
 <button 
 key={c.name}
 onClick={() => {
 if (isSelected) setSelectedColors(selectedColors.filter(sc => sc.name !== c.name));
 else setSelectedColors([...selectedColors, {name: c.name, hex: c.hex}]);
 }}
 className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-[10px] font-bold transition-all ${isSelected ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'}`}
 >
 <div className="w-6 h-6 rounded-md border border-gray-200 shadow-sm" style={{backgroundColor: c.hex}}></div>
 <span className="truncate w-full text-center">{c.name}</span>
 </button>
 )
 })}
 </div>
 <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
 <div className="flex items-center gap-2">
 <input 
 type="color" 
 value={customColorHex}
 onChange={e => {
 setCustomColorHex(e.target.value);
 // Auto generate name based on hex? Or just simple
 setCustomColorName('Color ' + e.target.value.toUpperCase());
 }}
 className="w-8 h-8 p-0 border border-gray-200 rounded-md shadow-sm shrink-0 cursor-pointer overflow-hidden" 
 />
 <input 
 type="text" 
 placeholder="Create your own colour" 
 value={customColorName}
 onChange={e => setCustomColorName(e.target.value)}
 className="flex-1 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:border-orange-500 min-w-0" 
 />
 <button 
 type="button"
 onClick={(e) => {
 e.preventDefault();
 const finalName = customColorName.trim() || 'Color ' + customColorHex.toUpperCase();
 if (!selectedColors.find(sc => sc.name === finalName)) {
 setSelectedColors([...selectedColors, {name: finalName, hex: customColorHex}]);
 setCustomColorName('');
 setCustomColorHex('#000000');
 }
 }}
 className="px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors"
 >
 Add
 </button>
 </div>
 </div>
 </>
 )}

 {/* SIZE MODAL */}
 {activeModal === 'size' && (
 <>
 <div className="grid grid-cols-4 gap-2">
 {PRESET_SIZES.map(s => {
 const isSelected = selectedSizes.includes(s);
 return (
 <button 
 key={s}
 onClick={() => toggleSelection(s, selectedSizes, setSelectedSizes)}
 className={`p-2 rounded-lg border-2 text-xs font-bold transition-all ${isSelected ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'}`}
 >
 {s}
 </button>
 )
 })}
 </div>
 <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
 <label className="text-xs font-bold text-gray-700">Manual Size Input</label>
 <div className="flex gap-2 w-full">
 <input 
 type="text" 
 placeholder="e.g. 42, 6XL" 
 id="customSizeInput"
 className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
 />
 <button 
 onClick={() => {
 const val = (document.getElementById('customSizeInput') as HTMLInputElement).value;
 if (val.trim()) {
 toggleSelection(val.trim(), selectedSizes, setSelectedSizes);
 (document.getElementById('customSizeInput') as HTMLInputElement).value = '';
 }
 }}
 className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors shrink-0"
 >
 Add
 </button>
 </div>
 </div>
 </>
 )}

 {/* WEIGHT MODAL */}
 {activeModal === 'weight' && (
 <>
 <div className="grid grid-cols-4 gap-2">
 {PRESET_WEIGHTS.map(w => {
 const isSelected = selectedWeights.includes(w);
 return (
 <button 
 key={w}
 onClick={() => toggleSelection(w, selectedWeights, setSelectedWeights)}
 className={`p-2 rounded-lg border-2 text-xs font-bold transition-all ${isSelected ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'}`}
 >
 {w}
 </button>
 )
 })}
 </div>
 <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
 <label className="text-xs font-bold text-gray-700">Manual Weight Input</label>
 <div className="flex gap-2 w-full">
 <input 
 type="text" 
 placeholder="e.g. 50kg, 2L" 
 id="customWeightInput"
 className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
 />
 <button 
 onClick={() => {
 const val = (document.getElementById('customWeightInput') as HTMLInputElement).value;
 if (val.trim()) {
 toggleSelection(val.trim(), selectedWeights, setSelectedWeights);
 (document.getElementById('customWeightInput') as HTMLInputElement).value = '';
 }
 }}
 className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors shrink-0"
 >
 Add
 </button>
 </div>
 </div>
 </>
 )}
 {/* CROP MODAL */}
 {activeModal === 'crop' && tempImage && (
 <div className="flex flex-col h-full gap-4">
 <div className="relative flex-1 w-full bg-black rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center">
 <ReactCrop
 crop={crop}
 onChange={(_, percentCrop) => setCrop(percentCrop)}
 onComplete={(c) => setCompletedCrop(c)}
 aspect={cropAspect}
 >
 <img 
 ref={imgRef}
 src={tempImage}
 alt="Crop me"
 onLoad={onImageLoad}
 style={{ maxHeight: '50vh' }}
 />
 </ReactCrop>
 </div>
 <button 
 onClick={handleSaveCrop}
 className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
 >
 <Crop size={18} /> Add Cropped Image
 </button>
 </div>
 )}
 </div>
 
 {activeModal !== 'crop' && (
 <div className="p-4 border-t border-gray-100">
 <button onClick={() => setActiveModal('none')} className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition-colors">
 Done
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
};
