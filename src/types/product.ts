export interface ColorVariety {
  name: string;
  hex: string;
}

export interface SupabaseProduct {
  id: string;
  seller_id?: string;
  "product images"?: string[];
  "product name": string;
  "product title name"?: string;
  "product description"?: string;
  "color"?: ColorVariety[];
  "size"?: string[];
  "weight"?: string[];
  "hsn code"?: string;
  "gst %"?: string;
  "key features"?: string[];
  "upload services"?: string;
  "mobile number"?: string;
  "tags"?: string[];
  "main category"?: string;
  "middle category"?: string;
  "sub category"?: string;
  "product type chips"?: string;
  "Time Duration"?: string;
  "choose title category"?: string;
  "category tags"?: string[];
  "minimum order quantity"?: number;
  "delivery charge"?: string;
  "delivery charge type"?: string;
  "product_sku_code"?: string;
  "available_stock"?: string;
  "price info"?: string;
  "selling price"?: string;
  "gross rate"?: string;
  "discount %"?: string;
  "gst rate %"?: string;
  "product code"?: string;
  "gift cash donation"?: string;
  created_at?: string;
  updated_at?: string;
  views?: number;
}
