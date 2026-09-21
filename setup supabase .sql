-- Setup supabase.sql

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 0. PROFILES TABLE (Auto-sync with auth.users)
-- ========================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 1. UPLOAD PRODUCTS TABLE
-- ========================================================
CREATE TABLE upload_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID,
  "product images" TEXT[],
  "product name" TEXT NOT NULL,
  "product title name" TEXT,
  "product description" TEXT,
  "color" JSONB,
  "size" TEXT[],
  "weight" TEXT[],
  "hsn code" TEXT,
  "gst %" TEXT,
  "key features" TEXT[],
  "upload services" TEXT,
  "mobile number" TEXT,
  "tags" TEXT[],
  "main category" TEXT,
  "middle category" TEXT,
  "sub category" TEXT,
  "product type chips" TEXT,
  "Time Duration" TEXT,
  "choose title category" TEXT,
  "category tags" TEXT[],
  "minimum order quantity" INTEGER DEFAULT 1,
  "delivery charge" TEXT,
  "delivery charge type" TEXT,
  "product_sku_code" TEXT,
  "available_stock" TEXT,
  "price info" TEXT,
  "selling price" TEXT,
  "gross rate" TEXT,
  "discount %" TEXT,
  "gst rate %" TEXT,
  "gift cash donation" TEXT,
  "wives" TEXT,
  "product code" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 1a. SAVE IN DRAFT TABLE
-- ========================================================
CREATE TABLE save_in_draft (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID,
  "product images" TEXT[],
  "product name" TEXT NOT NULL,
  "product title name" TEXT,
  "product description" TEXT,
  "color" JSONB,
  "size" TEXT[],
  "weight" TEXT[],
  "hsn code" TEXT,
  "gst %" TEXT,
  "key features" TEXT[],
  "upload services" TEXT,
  "mobile number" TEXT,
  "tags" TEXT[],
  "main category" TEXT,
  "middle category" TEXT,
  "sub category" TEXT,
  "product type chips" TEXT,
  "Time Duration" TEXT,
  "choose title category" TEXT,
  "category tags" TEXT[],
  "minimum order quantity" INTEGER DEFAULT 1,
  "delivery charge" TEXT,
  "delivery charge type" TEXT,
  "product_sku_code" TEXT,
  "available_stock" TEXT,
  "price info" TEXT,
  "selling price" TEXT,
  "gross rate" TEXT,
  "discount %" TEXT,
  "gst rate %" TEXT,
  "gift cash donation" TEXT,
  "wives" TEXT,
  "product code" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 1b. INACTIVE PRODUCTS TABLE
-- ========================================================
CREATE TABLE inactive_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID,
  "product images" TEXT[],
  "product name" TEXT NOT NULL,
  "product title name" TEXT,
  "product description" TEXT,
  "color" JSONB,
  "size" TEXT[],
  "weight" TEXT[],
  "hsn code" TEXT,
  "gst %" TEXT,
  "key features" TEXT[],
  "upload services" TEXT,
  "mobile number" TEXT,
  "tags" TEXT[],
  "main category" TEXT,
  "middle category" TEXT,
  "sub category" TEXT,
  "product type chips" TEXT,
  "Time Duration" TEXT,
  "choose title category" TEXT,
  "category tags" TEXT[],
  "minimum order quantity" INTEGER DEFAULT 1,
  "delivery charge" TEXT,
  "delivery charge type" TEXT,
  "product_sku_code" TEXT,
  "available_stock" TEXT,
  "price info" TEXT,
  "selling price" TEXT,
  "gross rate" TEXT,
  "discount %" TEXT,
  "gst rate %" TEXT,
  "gift cash donation" TEXT,
  "wives" TEXT,
  "product code" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 2. CUSTOMERS TABLE
-- ========================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email_account TEXT,
  full_address TEXT,
  pincode TEXT,
  password TEXT NOT NULL,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  "freeze" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 3. SELLERS TABLE
-- ========================================================
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name TEXT,
  trust_years_in_business TEXT,
  seller_name TEXT,
  registered_mobile_number TEXT NOT NULL,
  registered_email TEXT,
  registered_full_address TEXT,
  registered_pincode TEXT,
  password TEXT NOT NULL,
  aadhaar_card TEXT,
  pan_card TEXT,
  GSTIN TEXT,
  shop_establishment TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  "freeze" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  upload_service_visible BOOLEAN DEFAULT true
);

-- ========================================================
-- 4. HUB MANAGERS TABLE
-- ========================================================
CREATE TABLE hub_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,
  avatar TEXT,
  store_name TEXT,
  hub_name TEXT,
  hub_manager_name TEXT,
  registered_mobile_number TEXT NOT NULL,
  registered_email TEXT,
  registered_full_address TEXT,
  registered_pincode TEXT,
  password TEXT NOT NULL,
  aadhaar_card TEXT,
  pan_card TEXT,
  voter_id TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  "freeze" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 5. RIDERS TABLE
-- ========================================================
CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,
  avatar TEXT,
  rider_name TEXT,
  registered_mobile_number TEXT NOT NULL,
  registered_email TEXT,
  registered_full_address TEXT,
  registered_pincode TEXT,
  password TEXT NOT NULL,
  aadhaar_card TEXT,
  pan_card TEXT,
  driving_licence TEXT,
  vehicle_no TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  "freeze" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 6. ADMINS TABLE
-- ========================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email_address TEXT,
  address TEXT,
  GSTIN TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 7. SELLER ESTIMATED EARNING TABLE
-- ========================================================
CREATE TABLE seller_estimated_earning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "Referral Fee" TEXT,
  "Closing Fee" TEXT,
  "COD Fee" TEXT,
  "Shipping Fee" TEXT,
  "C-GST" TEXT,
  "S-GST" TEXT,
  "TDS charge" TEXT,
  "TCS charge" TEXT,
  "other_charges" JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- TRIGGERS & FUNCTIONS
-- ========================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upload_products_updated_at BEFORE UPDATE ON upload_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_save_in_draft_updated_at BEFORE UPDATE ON save_in_draft FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inactive_products_updated_at BEFORE UPDATE ON inactive_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hub_managers_updated_at BEFORE UPDATE ON hub_managers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_estimated_earning_updated_at BEFORE UPDATE ON seller_estimated_earning FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================
-- AUTO-SYNC TRIGGER (auth.users -> profiles)
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'), -- role: admin, customer, seller, rider, hub_manager
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE save_in_draft ENABLE ROW LEVEL SECURITY;
ALTER TABLE inactive_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_estimated_earning ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted access for simplicity (In production, adjust based on auth.uid())
-- profiles
DROP POLICY IF EXISTS "Allow all select to profiles" ON profiles;
CREATE POLICY "Allow all select to profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to profiles" ON profiles;
CREATE POLICY "Allow all insert to profiles" ON profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to profiles" ON profiles;
CREATE POLICY "Allow all update to profiles" ON profiles FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to profiles" ON profiles;
CREATE POLICY "Allow all delete to profiles" ON profiles FOR DELETE USING (true);

-- upload_products
DROP POLICY IF EXISTS "Allow all select to upload_products" ON upload_products;
CREATE POLICY "Allow all select to upload_products" ON upload_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to upload_products" ON upload_products;
CREATE POLICY "Allow all insert to upload_products" ON upload_products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to upload_products" ON upload_products;
CREATE POLICY "Allow all update to upload_products" ON upload_products FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to upload_products" ON upload_products;
CREATE POLICY "Allow all delete to upload_products" ON upload_products FOR DELETE USING (true);

-- save_in_draft
DROP POLICY IF EXISTS "Allow all select to save_in_draft" ON save_in_draft;
CREATE POLICY "Allow all select to save_in_draft" ON save_in_draft FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to save_in_draft" ON save_in_draft;
CREATE POLICY "Allow all insert to save_in_draft" ON save_in_draft FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to save_in_draft" ON save_in_draft;
CREATE POLICY "Allow all update to save_in_draft" ON save_in_draft FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to save_in_draft" ON save_in_draft;
CREATE POLICY "Allow all delete to save_in_draft" ON save_in_draft FOR DELETE USING (true);

-- inactive_products
DROP POLICY IF EXISTS "Allow all select to inactive_products" ON inactive_products;
CREATE POLICY "Allow all select to inactive_products" ON inactive_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to inactive_products" ON inactive_products;
CREATE POLICY "Allow all insert to inactive_products" ON inactive_products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to inactive_products" ON inactive_products;
CREATE POLICY "Allow all update to inactive_products" ON inactive_products FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to inactive_products" ON inactive_products;
CREATE POLICY "Allow all delete to inactive_products" ON inactive_products FOR DELETE USING (true);

-- customers
DROP POLICY IF EXISTS "Allow all select to customers" ON customers;
CREATE POLICY "Allow all select to customers" ON customers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to customers" ON customers;
CREATE POLICY "Allow all insert to customers" ON customers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to customers" ON customers;
CREATE POLICY "Allow all update to customers" ON customers FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to customers" ON customers;
CREATE POLICY "Allow all delete to customers" ON customers FOR DELETE USING (true);

-- sellers
DROP POLICY IF EXISTS "Allow all select to sellers" ON sellers;
CREATE POLICY "Allow all select to sellers" ON sellers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to sellers" ON sellers;
CREATE POLICY "Allow all insert to sellers" ON sellers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to sellers" ON sellers;
CREATE POLICY "Allow all update to sellers" ON sellers FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to sellers" ON sellers;
CREATE POLICY "Allow all delete to sellers" ON sellers FOR DELETE USING (true);

-- hub_managers
DROP POLICY IF EXISTS "Allow all select to hub_managers" ON hub_managers;
CREATE POLICY "Allow all select to hub_managers" ON hub_managers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to hub_managers" ON hub_managers;
CREATE POLICY "Allow all insert to hub_managers" ON hub_managers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to hub_managers" ON hub_managers;
CREATE POLICY "Allow all update to hub_managers" ON hub_managers FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to hub_managers" ON hub_managers;
CREATE POLICY "Allow all delete to hub_managers" ON hub_managers FOR DELETE USING (true);

-- riders
DROP POLICY IF EXISTS "Allow all select to riders" ON riders;
CREATE POLICY "Allow all select to riders" ON riders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to riders" ON riders;
CREATE POLICY "Allow all insert to riders" ON riders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to riders" ON riders;
CREATE POLICY "Allow all update to riders" ON riders FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to riders" ON riders;
CREATE POLICY "Allow all delete to riders" ON riders FOR DELETE USING (true);

-- admins
DROP POLICY IF EXISTS "Allow all select to admins" ON admins;
CREATE POLICY "Allow all select to admins" ON admins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to admins" ON admins;
CREATE POLICY "Allow all insert to admins" ON admins FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to admins" ON admins;
CREATE POLICY "Allow all update to admins" ON admins FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to admins" ON admins;
CREATE POLICY "Allow all delete to admins" ON admins FOR DELETE USING (true);

-- seller_estimated_earning
DROP POLICY IF EXISTS "Allow all select to seller_estimated_earning" ON seller_estimated_earning;
CREATE POLICY "Allow all select to seller_estimated_earning" ON seller_estimated_earning FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to seller_estimated_earning" ON seller_estimated_earning;
CREATE POLICY "Allow all insert to seller_estimated_earning" ON seller_estimated_earning FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to seller_estimated_earning" ON seller_estimated_earning;
CREATE POLICY "Allow all update to seller_estimated_earning" ON seller_estimated_earning FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to seller_estimated_earning" ON seller_estimated_earning;
CREATE POLICY "Allow all delete to seller_estimated_earning" ON seller_estimated_earning FOR DELETE USING (true);

-- ========================================================
-- ENABLE REALTIME FOR ALL TABLES
-- ========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE 
  profiles, 
  upload_products, 
  save_in_draft, 
  inactive_products, 
  customers, 
  sellers, 
  hub_managers, 
  riders, 
  admins, 
  seller_estimated_earning;



-- ========================================================
-- MIGRATION: Add new columns if they are missing
-- ========================================================
ALTER TABLE upload_products ADD COLUMN IF NOT EXISTS "product_sku_code" TEXT;
ALTER TABLE upload_products ADD COLUMN IF NOT EXISTS "available_stock" TEXT;

ALTER TABLE save_in_draft ADD COLUMN IF NOT EXISTS "product_sku_code" TEXT;
ALTER TABLE save_in_draft ADD COLUMN IF NOT EXISTS "available_stock" TEXT;

ALTER TABLE inactive_products ADD COLUMN IF NOT EXISTS "product_sku_code" TEXT;
ALTER TABLE inactive_products ADD COLUMN IF NOT EXISTS "available_stock" TEXT;

-- Grant privileges to anon and authenticated roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;


-- ========================================================
-- CARTS TABLE
-- ========================================================
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID,
  seller_id UUID,
  product_id UUID,
  "product images" TEXT[],
  "product name" TEXT NOT NULL,
  "product title name" TEXT,
  "product description" TEXT,
  "color" JSONB,
  "size" TEXT[],
  "weight" TEXT[],
  "hsn code" TEXT,
  "gst %" TEXT,
  "key features" TEXT[],
  "upload services" TEXT,
  "mobile number" TEXT,
  "tags" TEXT[],
  "main category" TEXT,
  "middle category" TEXT,
  "sub category" TEXT,
  "product type chips" TEXT,
  "Time Duration" TEXT,
  "choose title category" TEXT,
  "category tags" TEXT[],
  "minimum order quantity" INTEGER DEFAULT 1,
  "delivery charge" TEXT,
  "delivery charge type" TEXT,
  "product_sku_code" TEXT,
  "available_stock" TEXT,
  "price info" TEXT,
  "selling price" TEXT,
  "gross rate" TEXT,
  "discount %" TEXT,
  "gst rate %" TEXT,
  "gift cash donation" TEXT,
  "wives" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 1. सबसे पहले पुरानी पॉलिसीज़ हटाएँ (अगर मौजूद हों)
-- ============================================

-- Drop old / Hindi / truncated policy names if they exist on storage.objects
-- Drop English policy names if they exist
-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('product-images', 'product-images', true),
  ('kyc-documents', 'kyc-documents', false),
  ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. अब सभी नई पॉलिसीज़ एक साथ बनाएँ
-- ============================================

-- ====== BUCKET 1: product-images (सार्वजनिक - प्रोडक्ट फोटो) ======

DROP POLICY IF EXISTS "Allow all select to product-images" ON storage.objects;
CREATE POLICY "Allow all select to product-images" ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow authenticated insert to product-images" ON storage.objects;
CREATE POLICY "Allow authenticated insert to product-images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow owner update to product-images" ON storage.objects;
CREATE POLICY "Allow owner update to product-images" ON storage.objects FOR UPDATE 
USING (bucket_id = 'product-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "Allow owner delete to product-images" ON storage.objects;
CREATE POLICY "Allow owner delete to product-images" ON storage.objects FOR DELETE 
USING (bucket_id = 'product-images' AND owner = auth.uid());


-- ====== BUCKET 2: kyc-documents (निजी - सिर्फ यूजर/एडमिन) ======

DROP POLICY IF EXISTS "Allow owner or admin select to kyc-documents" ON storage.objects;
CREATE POLICY "Allow owner or admin select to kyc-documents" ON storage.objects FOR SELECT 
USING (
  bucket_id = 'kyc-documents' 
  AND (
    owner = auth.uid() 
    OR 
    (auth.jwt() ->> 'role') = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow authenticated insert to kyc-documents" ON storage.objects;
CREATE POLICY "Allow authenticated insert to kyc-documents" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow owner or admin delete to kyc-documents" ON storage.objects;
CREATE POLICY "Allow owner or admin delete to kyc-documents" ON storage.objects FOR DELETE 
USING (
  bucket_id = 'kyc-documents' 
  AND (
    owner = auth.uid() 
    OR 
    (auth.jwt() ->> 'role') = 'admin'
  )
);


-- ====== BUCKET 3: signatures (सार्वजनिक - दिखे सबको, डाले सिर्फ यूजर) ======

DROP POLICY IF EXISTS "Allow all select to signatures" ON storage.objects;
CREATE POLICY "Allow all select to signatures" ON storage.objects FOR SELECT 
USING (bucket_id = 'signatures');

DROP POLICY IF EXISTS "Allow authenticated insert to signatures" ON storage.objects;
CREATE POLICY "Allow authenticated insert to signatures" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'signatures' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow owner update to signatures" ON storage.objects;
CREATE POLICY "Allow owner update to signatures" ON storage.objects FOR UPDATE 
USING (bucket_id = 'signatures' AND owner = auth.uid());

DROP POLICY IF EXISTS "Allow owner delete to signatures" ON storage.objects;
CREATE POLICY "Allow owner delete to signatures" ON storage.objects FOR DELETE 
USING (bucket_id = 'signatures' AND owner = auth.uid());


-- ========================================================
-- 3. STOCK 0 AUTO-TRANSFER TRIGGERS
-- (upload_products -> inactive_products when stock is 0/empty)
-- (inactive_products -> upload_products when stock is > 0)
-- ========================================================

-- Function to handle moving 0-stock products to inactive_products
CREATE OR REPLACE FUNCTION public.handle_zero_stock_transfer_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_num INTEGER;
BEGIN
  -- Parse stock safely
  BEGIN
    v_stock_num := NULLIF(TRIM(NEW.available_stock), '')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_stock_num := NULL;
  END;

  IF NEW.available_stock IS NULL OR TRIM(NEW.available_stock) = '' OR TRIM(NEW.available_stock) = '0' OR (v_stock_num IS NOT NULL AND v_stock_num <= 0) THEN
    -- Insert or Update in inactive_products
    INSERT INTO public.inactive_products (
      id, seller_id, "product images", "product name", "product title name", 
      "product description", "color", "size", "weight", "hsn code", "gst %", 
      "key features", "upload services", "mobile number", "tags", "main category", 
      "middle category", "sub category", "product type chips", "Time Duration", 
      "choose title category", "category tags", "minimum order quantity", 
      "delivery charge", "delivery charge type", "product_sku_code", "available_stock", 
      "price info", "selling price", "gross rate", "discount %", "gst rate %", 
      "gift cash donation", created_at, updated_at
    ) VALUES (
      NEW.id, NEW.seller_id, NEW."product images", NEW."product name", NEW."product title name", 
      NEW."product description", NEW."color", NEW."size", NEW."weight", NEW."hsn code", NEW."gst %", 
      NEW."key features", NEW."upload services", NEW."mobile number", NEW."tags", NEW."main category", 
      NEW."middle category", NEW."sub category", NEW."product type chips", NEW."Time Duration", 
      NEW."choose title category", NEW."category tags", NEW."minimum order quantity", 
      NEW."delivery charge", NEW."delivery charge type", NEW."product_sku_code", COALESCE(NEW.available_stock, '0'), 
      NEW."price info", NEW."selling price", NEW."gross rate", NEW."discount %", NEW."gst rate %", 
      NEW."gift cash donation", COALESCE(NEW.created_at, NOW()), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      seller_id = EXCLUDED.seller_id,
      "product images" = EXCLUDED."product images",
      "product name" = EXCLUDED."product name",
      "product title name" = EXCLUDED."product title name",
      "product description" = EXCLUDED."product description",
      "color" = EXCLUDED."color",
      "size" = EXCLUDED."size",
      "weight" = EXCLUDED."weight",
      "hsn code" = EXCLUDED."hsn code",
      "gst %" = EXCLUDED."gst %",
      "key features" = EXCLUDED."key features",
      "upload services" = EXCLUDED."upload services",
      "mobile number" = EXCLUDED."mobile number",
      "tags" = EXCLUDED."tags",
      "main category" = EXCLUDED."main category",
      "middle category" = EXCLUDED."middle category",
      "sub category" = EXCLUDED."sub category",
      "product type chips" = EXCLUDED."product type chips",
      "Time Duration" = EXCLUDED."Time Duration",
      "choose title category" = EXCLUDED."choose title category",
      "category tags" = EXCLUDED."category tags",
      "minimum order quantity" = EXCLUDED."minimum order quantity",
      "delivery charge" = EXCLUDED."delivery charge",
      "delivery charge type" = EXCLUDED."delivery charge type",
      "product_sku_code" = EXCLUDED."product_sku_code",
      "available_stock" = EXCLUDED."available_stock",
      "price info" = EXCLUDED."price info",
      "selling price" = EXCLUDED."selling price",
      "gross rate" = EXCLUDED."gross rate",
      "discount %" = EXCLUDED."discount %",
      "gst rate %" = EXCLUDED."gst rate %",
      "gift cash donation" = EXCLUDED."gift cash donation",
      updated_at = NOW();

    -- Remove from upload_products
    DELETE FROM public.upload_products WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_zero_stock_transfer ON public.upload_products;
CREATE TRIGGER trg_zero_stock_transfer
AFTER INSERT OR UPDATE ON public.upload_products
FOR EACH ROW
EXECUTE FUNCTION public.handle_zero_stock_transfer_fn();

-- Function to handle moving replenished stock from inactive_products to upload_products
CREATE OR REPLACE FUNCTION public.handle_restore_active_stock_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_num INTEGER;
BEGIN
  -- Parse stock safely
  BEGIN
    v_stock_num := NULLIF(TRIM(NEW.available_stock), '')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_stock_num := NULL;
  END;

  IF v_stock_num IS NOT NULL AND v_stock_num > 0 THEN
    -- Insert or Update in upload_products
    INSERT INTO public.upload_products (
      id, seller_id, "product images", "product name", "product title name", 
      "product description", "color", "size", "weight", "hsn code", "gst %", 
      "key features", "upload services", "mobile number", "tags", "main category", 
      "middle category", "sub category", "product type chips", "Time Duration", 
      "choose title category", "category tags", "minimum order quantity", 
      "delivery charge", "delivery charge type", "product_sku_code", "available_stock", 
      "price info", "selling price", "gross rate", "discount %", "gst rate %", 
      "gift cash donation", created_at, updated_at
    ) VALUES (
      NEW.id, NEW.seller_id, NEW."product images", NEW."product name", NEW."product title name", 
      NEW."product description", NEW."color", NEW."size", NEW."weight", NEW."hsn code", NEW."gst %", 
      NEW."key features", NEW."upload services", NEW."mobile number", NEW."tags", NEW."main category", 
      NEW."middle category", NEW."sub category", NEW."product type chips", NEW."Time Duration", 
      NEW."choose title category", NEW."category tags", NEW."minimum order quantity", 
      NEW."delivery charge", NEW."delivery charge type", NEW."product_sku_code", NEW.available_stock, 
      NEW."price info", NEW."selling price", NEW."gross rate", NEW."discount %", NEW."gst rate %", 
      NEW."gift cash donation", COALESCE(NEW.created_at, NOW()), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      seller_id = EXCLUDED.seller_id,
      "product images" = EXCLUDED."product images",
      "product name" = EXCLUDED."product name",
      "product title name" = EXCLUDED."product title name",
      "product description" = EXCLUDED."product description",
      "color" = EXCLUDED."color",
      "size" = EXCLUDED."size",
      "weight" = EXCLUDED."weight",
      "hsn code" = EXCLUDED."hsn code",
      "gst %" = EXCLUDED."gst %",
      "key features" = EXCLUDED."key features",
      "upload services" = EXCLUDED."upload services",
      "mobile number" = EXCLUDED."mobile number",
      "tags" = EXCLUDED."tags",
      "main category" = EXCLUDED."main category",
      "middle category" = EXCLUDED."middle category",
      "sub category" = EXCLUDED."sub category",
      "product type chips" = EXCLUDED."product type chips",
      "Time Duration" = EXCLUDED."Time Duration",
      "choose title category" = EXCLUDED."choose title category",
      "category tags" = EXCLUDED."category tags",
      "minimum order quantity" = EXCLUDED."minimum order quantity",
      "delivery charge" = EXCLUDED."delivery charge",
      "delivery charge type" = EXCLUDED."delivery charge type",
      "product_sku_code" = EXCLUDED."product_sku_code",
      "available_stock" = EXCLUDED."available_stock",
      "price info" = EXCLUDED."price info",
      "selling price" = EXCLUDED."selling price",
      "gross rate" = EXCLUDED."gross rate",
      "discount %" = EXCLUDED."discount %",
      "gst rate %" = EXCLUDED."gst rate %",
      "gift cash donation" = EXCLUDED."gift cash donation",
      updated_at = NOW();

    -- Remove from inactive_products
    DELETE FROM public.inactive_products WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_restore_active_stock ON public.inactive_products;
CREATE TRIGGER trg_restore_active_stock
AFTER UPDATE ON public.inactive_products
FOR EACH ROW
EXECUTE FUNCTION public.handle_restore_active_stock_fn();

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS upload_service_visible BOOLEAN DEFAULT true;

-- ========================================================
-- 8. RIDER SERVICE RATES TABLE
-- ========================================================
CREATE TABLE rider_service_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,
  rider_id UUID,
  rank TEXT,
  pickup_rate TEXT,
  delivery_rate TEXT,
  tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rider_service_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select to rider_service_rates" ON rider_service_rates;
CREATE POLICY "Allow all select to rider_service_rates" ON rider_service_rates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to rider_service_rates" ON rider_service_rates;
CREATE POLICY "Allow all insert to rider_service_rates" ON rider_service_rates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to rider_service_rates" ON rider_service_rates;
CREATE POLICY "Allow all update to rider_service_rates" ON rider_service_rates FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to rider_service_rates" ON rider_service_rates;
CREATE POLICY "Allow all delete to rider_service_rates" ON rider_service_rates FOR DELETE USING (true);

CREATE TRIGGER update_rider_service_rates_updated_at BEFORE UPDATE ON rider_service_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE rider_service_rates;

-- ========================================================
-- 9. ACTIVE SERVICE RATE TABLE
-- ========================================================
CREATE TABLE active_service_rate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickup_rate TEXT,
  delivery_rate TEXT,
  tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE active_service_rate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select to active_service_rate" ON active_service_rate;
CREATE POLICY "Allow all select to active_service_rate" ON active_service_rate FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to active_service_rate" ON active_service_rate;
CREATE POLICY "Allow all insert to active_service_rate" ON active_service_rate FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to active_service_rate" ON active_service_rate;
CREATE POLICY "Allow all update to active_service_rate" ON active_service_rate FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to active_service_rate" ON active_service_rate;
CREATE POLICY "Allow all delete to active_service_rate" ON active_service_rate FOR DELETE USING (true);

CREATE TRIGGER update_active_service_rate_updated_at BEFORE UPDATE ON active_service_rate FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE active_service_rate;

-- Grant privileges for new tables
GRANT ALL PRIVILEGES ON TABLE rider_service_rates TO anon;
GRANT ALL PRIVILEGES ON TABLE rider_service_rates TO authenticated;
GRANT ALL PRIVILEGES ON TABLE active_service_rate TO anon;
GRANT ALL PRIVILEGES ON TABLE active_service_rate TO authenticated;
GRANT ALL PRIVILEGES ON TABLE carts TO anon;
GRANT ALL PRIVILEGES ON TABLE carts TO authenticated;

-- CUSTOMER ADDRESS TABLE
CREATE TABLE customer_address (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "customer id" TEXT,
  "full name" TEXT,
  "mobile number" TEXT,
  "full address" TEXT,
  "pincode" TEXT,
  "landmark" TEXT,
  "address type" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE customer_address TO anon;
GRANT ALL PRIVILEGES ON TABLE customer_address TO authenticated;

-- GIFT CASH TABLE
CREATE TABLE gift_cash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "customer id" TEXT,
  "received gift cash" TEXT,
  "claimed gift cash" TEXT,
  "used gift cash" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE gift_cash TO anon;
GRANT ALL PRIVILEGES ON TABLE gift_cash TO authenticated;


ALTER TABLE customer_address ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to customer_address" ON customer_address;
CREATE POLICY "Allow all select to customer_address" ON customer_address FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to customer_address" ON customer_address;
CREATE POLICY "Allow all insert to customer_address" ON customer_address FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to customer_address" ON customer_address;
CREATE POLICY "Allow all update to customer_address" ON customer_address FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to customer_address" ON customer_address;
CREATE POLICY "Allow all delete to customer_address" ON customer_address FOR DELETE USING (true);

ALTER TABLE gift_cash ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to gift_cash" ON gift_cash;
CREATE POLICY "Allow all select to gift_cash" ON gift_cash FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to gift_cash" ON gift_cash;
CREATE POLICY "Allow all insert to gift_cash" ON gift_cash FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to gift_cash" ON gift_cash;
CREATE POLICY "Allow all update to gift_cash" ON gift_cash FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to gift_cash" ON gift_cash;
CREATE POLICY "Allow all delete to gift_cash" ON gift_cash FOR DELETE USING (true);

-- ========================================================
-- CARTS TABLE RLS & PERMISSIONS FIX
-- ========================================================
-- 1. Grant necessary permissions to bypass the permission denied error
GRANT ALL PRIVILEGES ON TABLE public.carts TO postgres, anon, authenticated, service_role;

-- 2. Setup the Row Level Security (RLS) policy so users and system can insert/update cart items
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to carts" ON public.carts;
CREATE POLICY "Allow all access to carts" ON public.carts FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- CUSTOMER ORDERS TABLE
-- ========================================================
CREATE TABLE customer_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "admin id" UUID,
  "cluster id" UUID,

  "hub manager id" UUID,
  "Rider id" UUID,
  "selller id" UUID,
  "customer id" UUID,
  "product id" UUID,
  "full name" TEXT,
  "mobile number" TEXT,
  "full address" TEXT,
  "pincode" TEXT,
  "landmark" TEXT,
  "address type" TEXT,
  "product image" TEXT,
  "product name" TEXT,
  "product tittle name" TEXT,
  "product discription" TEXT,
  "key features" JSONB,
  "total quantity" TEXT,
  "size" TEXT,
  "colour" TEXT,
  "weight" TEXT,
  "total price info" TEXT,
  "total selling price" TEXT,
  "total discount" TEXT,
  "total delevery charge" TEXT,
  "total amount" TEXT,
  "payment method" TEXT,
  "gift cash donation" TEXT,
  "order ID" TEXT,
  "pickup ID" TEXT,

  "awb number" TEXT,
  "tracking id number" TEXT,
  "cancellation code" TEXT,
  "order status" TEXT,
  "days" TEXT,
  "payout status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.customer_orders TO postgres, anon, authenticated, service_role;

ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to customer_orders" ON public.customer_orders;
CREATE POLICY "Allow all select to customer_orders" ON public.customer_orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to customer_orders" ON public.customer_orders;
CREATE POLICY "Allow all insert to customer_orders" ON public.customer_orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to customer_orders" ON public.customer_orders;
CREATE POLICY "Allow all update to customer_orders" ON public.customer_orders FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to customer_orders" ON public.customer_orders;
CREATE POLICY "Allow all delete to customer_orders" ON public.customer_orders FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE customer_orders;

-- ========================================================
-- PRODUCT RATING TABLE
-- ========================================================
CREATE TABLE product_rating (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "product id" UUID,
  "full name" TEXT,
  "rating star" TEXT,
  "rating discription" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.product_rating TO postgres, anon, authenticated, service_role;

ALTER TABLE public.product_rating ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to product_rating" ON public.product_rating;
CREATE POLICY "Allow all select to product_rating" ON public.product_rating FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to product_rating" ON public.product_rating;
CREATE POLICY "Allow all insert to product_rating" ON public.product_rating FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to product_rating" ON public.product_rating;
CREATE POLICY "Allow all update to product_rating" ON public.product_rating FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to product_rating" ON public.product_rating;
CREATE POLICY "Allow all delete to product_rating" ON public.product_rating FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE product_rating;

-- ========================================================
-- ACCEPTED SHIPMENTS TABLE
-- ========================================================
CREATE TABLE accepted_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "admin id" UUID,
  "cluster id" UUID,

  "hub manager id" UUID,
  "Rider id" UUID,
  "selller id" UUID,
  "customer id" UUID,
  "product id" UUID,
  "full name" TEXT,
  "mobile number" TEXT,
  "full address" TEXT,
  "pincode" TEXT,
  "landmark" TEXT,
  "address type" TEXT,
  "product image" TEXT,
  "product name" TEXT,
  "product tittle name" TEXT,
  "product discription" TEXT,
  "key features" JSONB,
  "size" TEXT,
  "colour" TEXT,
  "weight" TEXT,
  "total price info" TEXT,
  "total selling price" TEXT,
  "total discount" TEXT,
  "total delevery charge" TEXT,
  "total amount" TEXT,
  "payment method" TEXT,
  "gift cash donation" TEXT,
  "order ID" TEXT,
  "pickup ID" TEXT,

  "awb number" TEXT,
  "tracking id number" TEXT,
  "cancellation code" TEXT,
  "order status" TEXT,
  "shipment status" TEXT,
  "shipment type" TEXT,
  "shipment tag" TEXT,
  "pickup pin" TEXT,
  "product SKU code" TEXT,
  "HSN code" TEXT,
  "total quantity" TEXT,
  "total gross rate" TEXT,
  "total cgst" TEXT,
  "total sgst" TEXT,

  "runsheet id" TEXT,
  "pickupsheet id" TEXT,
  "attempt" TEXT,
  "call details" TEXT,
  "bag id" TEXT,
  "seal tag" TEXT,
  "vehicle number" TEXT,
  "digital signature" TEXT,
  "captured images" TEXT,
  "payment type" TEXT,
  "assignment hub name" TEXT,
  "days" TEXT,
  "payout status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.accepted_shipments TO postgres, anon, authenticated, service_role;

ALTER TABLE public.accepted_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to accepted_shipments" ON public.accepted_shipments;
CREATE POLICY "Allow all select to accepted_shipments" ON public.accepted_shipments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to accepted_shipments" ON public.accepted_shipments;
CREATE POLICY "Allow all insert to accepted_shipments" ON public.accepted_shipments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to accepted_shipments" ON public.accepted_shipments;
CREATE POLICY "Allow all update to accepted_shipments" ON public.accepted_shipments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to accepted_shipments" ON public.accepted_shipments;
CREATE POLICY "Allow all delete to accepted_shipments" ON public.accepted_shipments FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE accepted_shipments;

-- ========================================================
-- FINISHED SHIPMENTS TABLE
-- ========================================================
CREATE TABLE finished_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "admin id" UUID,
  "cluster id" UUID,

  "hub manager id" UUID,
  "Rider id" UUID,
  "selller id" UUID,
  "customer id" UUID,
  "product id" UUID,
  "full name" TEXT,
  "mobile number" TEXT,
  "full address" TEXT,
  "pincode" TEXT,
  "landmark" TEXT,
  "address type" TEXT,
  "product image" TEXT,
  "product name" TEXT,
  "product tittle name" TEXT,
  "product discription" TEXT,
  "key features" JSONB,
  "size" TEXT,
  "colour" TEXT,
  "weight" TEXT,
  "total price info" TEXT,
  "total selling price" TEXT,
  "total discount" TEXT,
  "total delevery charge" TEXT,
  "total amount" TEXT,
  "payment method" TEXT,
  "gift cash donation" TEXT,
  "order ID" TEXT,
  "pickup ID" TEXT,

  "awb number" TEXT,
  "tracking id number" TEXT,
  "cancellation code" TEXT,
  "order status" TEXT,
  "shipment status" TEXT,
  "shipment type" TEXT,
  "shipment tag" TEXT,
  "pickup pin" TEXT,
  "product SKU code" TEXT,
  "HSN code" TEXT,
  "total quantity" TEXT,
  "total gross rate" TEXT,
  "total cgst" TEXT,
  "total sgst" TEXT,

  "runsheet id" TEXT,
  "pickupsheet id" TEXT,
  "attempt" TEXT,
  "call details" TEXT,
  "bag id" TEXT,
  "seal tag" TEXT,
  "vehicle number" TEXT,
  "digital signature" TEXT,
  "captured images" TEXT,
  "payment type" TEXT,
  "assignment hub name" TEXT,
  "days" TEXT,
  "payout status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.finished_shipments TO postgres, anon, authenticated, service_role;

ALTER TABLE public.finished_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to finished_shipments" ON public.finished_shipments;
CREATE POLICY "Allow all select to finished_shipments" ON public.finished_shipments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to finished_shipments" ON public.finished_shipments;
CREATE POLICY "Allow all insert to finished_shipments" ON public.finished_shipments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to finished_shipments" ON public.finished_shipments;
CREATE POLICY "Allow all update to finished_shipments" ON public.finished_shipments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to finished_shipments" ON public.finished_shipments;
CREATE POLICY "Allow all delete to finished_shipments" ON public.finished_shipments FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE finished_shipments;


-- ========================================================
-- ADDED RIDERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS added_riders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  "hub manager id" UUID,
  "hub name" TEXT,
  "added rider id" UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.added_riders TO postgres, anon, authenticated, service_role;
ALTER TABLE public.added_riders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to added_riders" ON public.added_riders;
CREATE POLICY "Allow all select to added_riders" ON public.added_riders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to added_riders" ON public.added_riders;
CREATE POLICY "Allow all insert to added_riders" ON public.added_riders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to added_riders" ON public.added_riders;
CREATE POLICY "Allow all update to added_riders" ON public.added_riders FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to added_riders" ON public.added_riders;
CREATE POLICY "Allow all delete to added_riders" ON public.added_riders FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE added_riders;

-- ========================================================
-- ADDED PINCODE TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS added_pincode (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "cluster id" UUID,

  "hub manager id" UUID,
  "hub name" TEXT,
  "added pincode" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.added_pincode TO postgres, anon, authenticated, service_role;
ALTER TABLE public.added_pincode ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to added_pincode" ON public.added_pincode;
CREATE POLICY "Allow all select to added_pincode" ON public.added_pincode FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to added_pincode" ON public.added_pincode;
CREATE POLICY "Allow all insert to added_pincode" ON public.added_pincode FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to added_pincode" ON public.added_pincode;
CREATE POLICY "Allow all update to added_pincode" ON public.added_pincode FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to added_pincode" ON public.added_pincode;
CREATE POLICY "Allow all delete to added_pincode" ON public.added_pincode FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE added_pincode;

-- ========================================================
-- PAYMENT WITH RIDERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS cash_with_riders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "rider id" UUID,

  "cash payment status" TEXT,
  "total cash payment" TEXT,
  "online payment status" TEXT,
  "total online payment" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.cash_with_riders TO postgres, anon, authenticated, service_role;
ALTER TABLE public.cash_with_riders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to cash_with_riders" ON public.cash_with_riders;
CREATE POLICY "Allow all select to cash_with_riders" ON public.cash_with_riders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to cash_with_riders" ON public.cash_with_riders;
CREATE POLICY "Allow all insert to cash_with_riders" ON public.cash_with_riders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to cash_with_riders" ON public.cash_with_riders;
CREATE POLICY "Allow all update to cash_with_riders" ON public.cash_with_riders FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to cash_with_riders" ON public.cash_with_riders;
CREATE POLICY "Allow all delete to cash_with_riders" ON public.cash_with_riders FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE cash_with_riders;

-- ========================================================
-- PAYMENT WITH HUB MANAGERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS cash_with_hub_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  "hub manager id" UUID,
  "cash payment status" TEXT,
  "total cash payment" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.cash_with_hub_managers TO postgres, anon, authenticated, service_role;
ALTER TABLE public.cash_with_hub_managers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to cash_with_hub_managers" ON public.cash_with_hub_managers;
CREATE POLICY "Allow all select to cash_with_hub_managers" ON public.cash_with_hub_managers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to cash_with_hub_managers" ON public.cash_with_hub_managers;
CREATE POLICY "Allow all insert to cash_with_hub_managers" ON public.cash_with_hub_managers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to cash_with_hub_managers" ON public.cash_with_hub_managers;
CREATE POLICY "Allow all update to cash_with_hub_managers" ON public.cash_with_hub_managers FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to cash_with_hub_managers" ON public.cash_with_hub_managers;
CREATE POLICY "Allow all delete to cash_with_hub_managers" ON public.cash_with_hub_managers FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE cash_with_hub_managers;


-- ========================================================
-- CREATE MASTER ADMIN ACCOUNT
-- ========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  master_admin_id UUID;
  admin_email TEXT := 'admin@suriyawanshopping.com';
  admin_name TEXT := 'Suriyawan Shopping Master Admin';
  admin_password TEXT := 'AdminPassword123!';
BEGIN

  -- 0. CLEANUP: Delete the hardcoded 11111111-1111-1111-1111-111111111111 ID if it exists 
  -- so that a proper random UUID is generated for the admin.
  DELETE FROM public.admins WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
  DELETE FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
  DELETE FROM auth.identities WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;
  DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

  -- Check if admin already exists
  -- First try to find ANY existing admin in public.admins to avoid creating a second one if they changed their email
  SELECT id INTO master_admin_id FROM public.admins LIMIT 1;
  
  -- Fallback to auth.users if public.admins is empty
  IF master_admin_id IS NULL THEN
    SELECT id INTO master_admin_id FROM auth.users WHERE email = admin_email LIMIT 1;
  END IF;

  -- If not, generate a new random UUID
  IF master_admin_id IS NULL THEN
    master_admin_id := uuid_generate_v4();
  END IF;

  -- Prevent duplicate admin rows that cause data mismatch
  DELETE FROM public.admins WHERE id != master_admin_id;

  -- 1. Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    master_admin_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('role', 'admin', 'full_name', admin_name),
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    encrypted_password = EXCLUDED.encrypted_password;

  -- 2. Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    provider_id
  ) VALUES (
    uuid_generate_v4(),
    master_admin_id,
    format('{"sub":"%s","email":"%s"}', master_admin_id, admin_email)::jsonb,
    'email',
    now(),
    now(),
    now(),
    master_admin_id::text
  ) ON CONFLICT DO NOTHING;

  -- 3. Insert into public.profiles (in case the trigger didn't catch it on update)
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    email
  ) VALUES (
    master_admin_id,
    'admin',
    admin_name,
    admin_email
  ) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  -- 4. Insert into public.admins
  INSERT INTO public.admins (
    id,
    admin_name,
    mobile_number,
    email_address,
    address,
    GSTIN
  ) VALUES (
    master_admin_id,
    admin_name,
    '0000000000',
    admin_email,
    'Suriyawan Shopping Admin Address',
    'N/A'
  ) ON CONFLICT (id) DO UPDATE SET
    admin_name = EXCLUDED.admin_name;

END $$;


-- ========================================================
-- ANNOUNCEMENT AND UPDATE TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS announcement_and_update (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_update TEXT,
  seller_update TEXT,
  rider_update TEXT,
  hub_manager_update TEXT,
  cluster_update TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE announcement_and_update ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to announcement_and_update" ON announcement_and_update;
CREATE POLICY "Allow all select to announcement_and_update" ON announcement_and_update FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to announcement_and_update" ON announcement_and_update;
CREATE POLICY "Allow all insert to announcement_and_update" ON announcement_and_update FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to announcement_and_update" ON announcement_and_update;
CREATE POLICY "Allow all update to announcement_and_update" ON announcement_and_update FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to announcement_and_update" ON announcement_and_update;
CREATE POLICY "Allow all delete to announcement_and_update" ON announcement_and_update FOR DELETE USING (true);
-- ========================================================
-- CHAT FOR CUSTOMERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_for_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,
  customer_id TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_for_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to chat_for_customers" ON chat_for_customers;
CREATE POLICY "Allow all select to chat_for_customers" ON chat_for_customers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to chat_for_customers" ON chat_for_customers;
CREATE POLICY "Allow all insert to chat_for_customers" ON chat_for_customers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to chat_for_customers" ON chat_for_customers;
CREATE POLICY "Allow all update to chat_for_customers" ON chat_for_customers FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to chat_for_customers" ON chat_for_customers;
CREATE POLICY "Allow all delete to chat_for_customers" ON chat_for_customers FOR DELETE USING (true);
-- ========================================================
-- CHAT FOR SELLERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_for_sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,
  seller_id TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_for_sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to chat_for_sellers" ON chat_for_sellers;
CREATE POLICY "Allow all select to chat_for_sellers" ON chat_for_sellers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to chat_for_sellers" ON chat_for_sellers;
CREATE POLICY "Allow all insert to chat_for_sellers" ON chat_for_sellers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to chat_for_sellers" ON chat_for_sellers;
CREATE POLICY "Allow all update to chat_for_sellers" ON chat_for_sellers FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to chat_for_sellers" ON chat_for_sellers;
CREATE POLICY "Allow all delete to chat_for_sellers" ON chat_for_sellers FOR DELETE USING (true);
-- ========================================================
-- CHAT FOR RIDERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_for_riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,

  rider_id TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_for_riders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to chat_for_riders" ON chat_for_riders;
CREATE POLICY "Allow all select to chat_for_riders" ON chat_for_riders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to chat_for_riders" ON chat_for_riders;
CREATE POLICY "Allow all insert to chat_for_riders" ON chat_for_riders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to chat_for_riders" ON chat_for_riders;
CREATE POLICY "Allow all update to chat_for_riders" ON chat_for_riders FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to chat_for_riders" ON chat_for_riders;
CREATE POLICY "Allow all delete to chat_for_riders" ON chat_for_riders FOR DELETE USING (true);
-- ========================================================
-- CHAT FOR HUB MANAGERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_for_hub_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,

  hub_manager_id TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_for_hub_managers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to chat_for_hub_managers" ON chat_for_hub_managers;
CREATE POLICY "Allow all select to chat_for_hub_managers" ON chat_for_hub_managers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to chat_for_hub_managers" ON chat_for_hub_managers;
CREATE POLICY "Allow all insert to chat_for_hub_managers" ON chat_for_hub_managers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to chat_for_hub_managers" ON chat_for_hub_managers;
CREATE POLICY "Allow all update to chat_for_hub_managers" ON chat_for_hub_managers FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to chat_for_hub_managers" ON chat_for_hub_managers;
CREATE POLICY "Allow all delete to chat_for_hub_managers" ON chat_for_hub_managers FOR DELETE USING (true);
-- ========================================================
-- STORAGE BUCKETS
-- ========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
DROP POLICY IF EXISTS "Anyone can update their avatar." ON storage.objects;
CREATE POLICY "Anyone can update their avatar." ON storage.objects FOR UPDATE WITH CHECK ( bucket_id = 'avatars' );
DROP POLICY IF EXISTS "Anyone can delete their avatar." ON storage.objects;
CREATE POLICY "Anyone can delete their avatar." ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' );


-- ========================================================
-- RIDERS FOR APPROVAL TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS riders_for_approval (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id TEXT,
  avatar TEXT,
  rider_name TEXT,
  registered_mobile_number TEXT NOT NULL,
  registered_email TEXT,
  registered_full_address TEXT,
  registered_pincode TEXT,
  password TEXT NOT NULL,
  aadhaar_card TEXT,
  pan_card TEXT,
  driving_licence TEXT,
  vehicle_no TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);
ALTER TABLE riders_for_approval ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to riders_for_approval" ON riders_for_approval;
CREATE POLICY "Allow all select to riders_for_approval" ON riders_for_approval FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to riders_for_approval" ON riders_for_approval;
CREATE POLICY "Allow all insert to riders_for_approval" ON riders_for_approval FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to riders_for_approval" ON riders_for_approval;
CREATE POLICY "Allow all update to riders_for_approval" ON riders_for_approval FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to riders_for_approval" ON riders_for_approval;
CREATE POLICY "Allow all delete to riders_for_approval" ON riders_for_approval FOR DELETE USING (true);
-- ========================================================
-- SELLERS FOR APPROVAL TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS sellers_for_approval (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_name TEXT,
  trust_years_in_business TEXT,
  seller_name TEXT,
  registered_mobile_number TEXT NOT NULL,
  registered_email TEXT,
  registered_full_address TEXT,
  registered_pincode TEXT,
  password TEXT NOT NULL,
  aadhaar_card TEXT,
  pan_card TEXT,
  GSTIN TEXT,
  shop_establishment TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);
ALTER TABLE sellers_for_approval ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to sellers_for_approval" ON sellers_for_approval;
CREATE POLICY "Allow all select to sellers_for_approval" ON sellers_for_approval FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to sellers_for_approval" ON sellers_for_approval;
CREATE POLICY "Allow all insert to sellers_for_approval" ON sellers_for_approval FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to sellers_for_approval" ON sellers_for_approval;
CREATE POLICY "Allow all update to sellers_for_approval" ON sellers_for_approval FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to sellers_for_approval" ON sellers_for_approval;
CREATE POLICY "Allow all delete to sellers_for_approval" ON sellers_for_approval FOR DELETE USING (true);
-- ========================================================
-- CLUSTERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS clusters (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  avatar TEXT,
  cluster_name TEXT,
  registered_mobile_number TEXT NOT NULL,
  registered_email TEXT,
  registered_full_address TEXT,
  registered_pincode TEXT,
  password TEXT NOT NULL,
  aadhaar_card TEXT,
  pan_card TEXT,
  voter_id TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  "freeze" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to clusters" ON clusters;
CREATE POLICY "Allow all select to clusters" ON clusters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to clusters" ON clusters;
CREATE POLICY "Allow all insert to clusters" ON clusters FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to clusters" ON clusters;
CREATE POLICY "Allow all update to clusters" ON clusters FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to clusters" ON clusters;
CREATE POLICY "Allow all delete to clusters" ON clusters FOR DELETE USING (true);
-- ========================================================
-- RIDER LIVE WORK FLOW TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS rider_live_work_flow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id TEXT,
  "All Pic & Dlv" TEXT,
  "Pickup" TEXT,
  "Delivery" TEXT,
  "Total Cash" TEXT,
  "Today's Earning" TEXT,
  "Performance" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rider_live_work_flow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to rider_live_work_flow" ON rider_live_work_flow;
CREATE POLICY "Allow all select to rider_live_work_flow" ON rider_live_work_flow FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to rider_live_work_flow" ON rider_live_work_flow;
CREATE POLICY "Allow all insert to rider_live_work_flow" ON rider_live_work_flow FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to rider_live_work_flow" ON rider_live_work_flow;
CREATE POLICY "Allow all update to rider_live_work_flow" ON rider_live_work_flow FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to rider_live_work_flow" ON rider_live_work_flow;
CREATE POLICY "Allow all delete to rider_live_work_flow" ON rider_live_work_flow FOR DELETE USING (true);
-- ========================================================
-- RIDER SHIPMENT WORK FLOW TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS rider_shipment_work_flow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id TEXT,
  "All Pic & Dlv" TEXT,
  "Pickup" TEXT,
  "Delivery" TEXT,
  "Total Cash" TEXT,
  "Today's Earning" TEXT,
  "Performance" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rider_shipment_work_flow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to rider_shipment_work_flow" ON rider_shipment_work_flow;
CREATE POLICY "Allow all select to rider_shipment_work_flow" ON rider_shipment_work_flow FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to rider_shipment_work_flow" ON rider_shipment_work_flow;
CREATE POLICY "Allow all insert to rider_shipment_work_flow" ON rider_shipment_work_flow FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to rider_shipment_work_flow" ON rider_shipment_work_flow;
CREATE POLICY "Allow all update to rider_shipment_work_flow" ON rider_shipment_work_flow FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to rider_shipment_work_flow" ON rider_shipment_work_flow;
CREATE POLICY "Allow all delete to rider_shipment_work_flow" ON rider_shipment_work_flow FOR DELETE USING (true);
-- ========================================================
-- CHAT FOR CLUSTERS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_for_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT,
  cluster_id TEXT,

  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE chat_for_clusters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to chat_for_clusters" ON chat_for_clusters;
CREATE POLICY "Allow all select to chat_for_clusters" ON chat_for_clusters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to chat_for_clusters" ON chat_for_clusters;
CREATE POLICY "Allow all insert to chat_for_clusters" ON chat_for_clusters FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to chat_for_clusters" ON chat_for_clusters;
CREATE POLICY "Allow all update to chat_for_clusters" ON chat_for_clusters FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to chat_for_clusters" ON chat_for_clusters;
CREATE POLICY "Allow all delete to chat_for_clusters" ON chat_for_clusters FOR DELETE USING (true);


-- ========================================================
-- SETTLED RIDER SHIPMENTS
-- ========================================================
CREATE TABLE IF NOT EXISTS settled_rider_shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cluster id" TEXT,
  rider_id TEXT,
  "All Pic & Dlv" TEXT,
  "Pickup" TEXT,
  "Delivery" TEXT,
  "Total Cash" TEXT,
  "Today's Earning" TEXT,
  "Performance" TEXT,
  "payout status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE settled_rider_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to settled_rider_shipments" ON settled_rider_shipments;
CREATE POLICY "Allow all select to settled_rider_shipments" ON settled_rider_shipments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to settled_rider_shipments" ON settled_rider_shipments;
CREATE POLICY "Allow all insert to settled_rider_shipments" ON settled_rider_shipments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to settled_rider_shipments" ON settled_rider_shipments;
CREATE POLICY "Allow all update to settled_rider_shipments" ON settled_rider_shipments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to settled_rider_shipments" ON settled_rider_shipments;
CREATE POLICY "Allow all delete to settled_rider_shipments" ON settled_rider_shipments FOR DELETE USING (true);

-- ========================================================
-- HUB MANAGER SALLERY
-- ========================================================
CREATE TABLE IF NOT EXISTS hub_manager_salary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cluster id" TEXT,
  "hub manager id" TEXT,
  "fixed salary" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE hub_manager_salary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to hub_manager_salary" ON hub_manager_salary;
CREATE POLICY "Allow all select to hub_manager_salary" ON hub_manager_salary FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to hub_manager_salary" ON hub_manager_salary;
CREATE POLICY "Allow all insert to hub_manager_salary" ON hub_manager_salary FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to hub_manager_salary" ON hub_manager_salary;
CREATE POLICY "Allow all update to hub_manager_salary" ON hub_manager_salary FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to hub_manager_salary" ON hub_manager_salary;
CREATE POLICY "Allow all delete to hub_manager_salary" ON hub_manager_salary FOR DELETE USING (true);

-- ========================================================
-- SETTLED HUB MANAGER SALLERY
-- ========================================================
CREATE TABLE IF NOT EXISTS settled_hub_manager_salary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cluster id" TEXT,
  "hub manager id" TEXT,
  "fixed salary" TEXT,
  "payout status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE settled_hub_manager_salary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to settled_hub_manager_salary" ON settled_hub_manager_salary;
CREATE POLICY "Allow all select to settled_hub_manager_salary" ON settled_hub_manager_salary FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to settled_hub_manager_salary" ON settled_hub_manager_salary;
CREATE POLICY "Allow all insert to settled_hub_manager_salary" ON settled_hub_manager_salary FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to settled_hub_manager_salary" ON settled_hub_manager_salary;
CREATE POLICY "Allow all update to settled_hub_manager_salary" ON settled_hub_manager_salary FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to settled_hub_manager_salary" ON settled_hub_manager_salary;
CREATE POLICY "Allow all delete to settled_hub_manager_salary" ON settled_hub_manager_salary FOR DELETE USING (true);

-- ========================================================
-- SELLER INCOME ESTIMATE
-- ========================================================
CREATE TABLE IF NOT EXISTS selller_income_estimate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "admin id" TEXT,
  "seller id" TEXT,
  "order id" TEXT,
  "product id" TEXT,
  "awb number" TEXT,
  "total earning amount" TEXT,
  "total platform estimate" TEXT,
  "final payable amount" TEXT,
  "days" TEXT,
  "payout status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE selller_income_estimate ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to selller_income_estimate" ON selller_income_estimate;
CREATE POLICY "Allow all select to selller_income_estimate" ON selller_income_estimate FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to selller_income_estimate" ON selller_income_estimate;
CREATE POLICY "Allow all insert to selller_income_estimate" ON selller_income_estimate FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to selller_income_estimate" ON selller_income_estimate;
CREATE POLICY "Allow all update to selller_income_estimate" ON selller_income_estimate FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to selller_income_estimate" ON selller_income_estimate;
CREATE POLICY "Allow all delete to selller_income_estimate" ON selller_income_estimate FOR DELETE USING (true);

-- ========================================================
-- SETTLED SELLER INCOME ESTIMATE
-- ========================================================
CREATE TABLE IF NOT EXISTS settled_selller_income_estimate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "admin id" TEXT,
  "seller id" TEXT,
  "order id" TEXT,
  "product id" TEXT,
  "awb number" TEXT,
  "total earning amount" TEXT,
  "total platform estimate" TEXT,
  "final payable amount" TEXT,
  "days" TEXT,
  "payout status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE settled_selller_income_estimate ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to settled_selller_income_estimate" ON settled_selller_income_estimate;
CREATE POLICY "Allow all select to settled_selller_income_estimate" ON settled_selller_income_estimate FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to settled_selller_income_estimate" ON settled_selller_income_estimate;
CREATE POLICY "Allow all insert to settled_selller_income_estimate" ON settled_selller_income_estimate FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to settled_selller_income_estimate" ON settled_selller_income_estimate;
CREATE POLICY "Allow all update to settled_selller_income_estimate" ON settled_selller_income_estimate FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to settled_selller_income_estimate" ON settled_selller_income_estimate;
CREATE POLICY "Allow all delete to settled_selller_income_estimate" ON settled_selller_income_estimate FOR DELETE USING (true);

-- ========================================================
-- RIDER RATE SETTING WITH CLUSTER
-- ========================================================
CREATE TABLE IF NOT EXISTS rider_rate_setting_with_cluster (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cluster id" TEXT,
  "multiple quantity half rate" BOOLEAN,
  "performance based proportional rate" BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE rider_rate_setting_with_cluster ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster;
CREATE POLICY "Allow all select to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster;
CREATE POLICY "Allow all insert to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster;
CREATE POLICY "Allow all update to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster;
CREATE POLICY "Allow all delete to rider_rate_setting_with_cluster" ON rider_rate_setting_with_cluster FOR DELETE USING (true);

-- ========================================================
-- RIDER RATE SETTING
-- ========================================================
CREATE TABLE IF NOT EXISTS rider_rate_setting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "multiple quantity half rate" BOOLEAN,
  "performance based proportional rate" BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE rider_rate_setting ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to rider_rate_setting" ON rider_rate_setting;
CREATE POLICY "Allow all select to rider_rate_setting" ON rider_rate_setting FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to rider_rate_setting" ON rider_rate_setting;
CREATE POLICY "Allow all insert to rider_rate_setting" ON rider_rate_setting FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to rider_rate_setting" ON rider_rate_setting;
CREATE POLICY "Allow all update to rider_rate_setting" ON rider_rate_setting FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to rider_rate_setting" ON rider_rate_setting;
CREATE POLICY "Allow all delete to rider_rate_setting" ON rider_rate_setting FOR DELETE USING (true);
-- ========================================================
-- GRANT PRIVILEGES FOR ALL NEW TABLES
-- ========================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;

-- PAYMENT WITH CLUSTERS TABLE
CREATE TABLE IF NOT EXISTS cash_with_clusters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "cluster id" UUID,

  "cash payment status" TEXT,
  "total cash payment" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
GRANT ALL PRIVILEGES ON TABLE public.cash_with_clusters TO postgres, anon, authenticated, service_role;
ALTER TABLE public.cash_with_clusters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to cash_with_clusters" ON public.cash_with_clusters;
CREATE POLICY "Allow all select to cash_with_clusters" ON public.cash_with_clusters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to cash_with_clusters" ON public.cash_with_clusters;
CREATE POLICY "Allow all insert to cash_with_clusters" ON public.cash_with_clusters FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to cash_with_clusters" ON public.cash_with_clusters;
CREATE POLICY "Allow all update to cash_with_clusters" ON public.cash_with_clusters FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to cash_with_clusters" ON public.cash_with_clusters;
CREATE POLICY "Allow all delete to cash_with_clusters" ON public.cash_with_clusters FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE cash_with_clusters;

-- PAYMENT WITH ADMIN TABLE
CREATE TABLE IF NOT EXISTS cash_with_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "admin id" UUID,

  "cash payment status" TEXT,
  "total cash payment" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
GRANT ALL PRIVILEGES ON TABLE public.cash_with_admin TO postgres, anon, authenticated, service_role;
ALTER TABLE public.cash_with_admin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to cash_with_admin" ON public.cash_with_admin;
CREATE POLICY "Allow all select to cash_with_admin" ON public.cash_with_admin FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to cash_with_admin" ON public.cash_with_admin;
CREATE POLICY "Allow all insert to cash_with_admin" ON public.cash_with_admin FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to cash_with_admin" ON public.cash_with_admin;
CREATE POLICY "Allow all update to cash_with_admin" ON public.cash_with_admin FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to cash_with_admin" ON public.cash_with_admin;
CREATE POLICY "Allow all delete to cash_with_admin" ON public.cash_with_admin FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE cash_with_admin;

-- CONTACT LINK TABLE
CREATE TABLE IF NOT EXISTS contact_link (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
GRANT ALL PRIVILEGES ON TABLE public.contact_link TO postgres, anon, authenticated, service_role;
ALTER TABLE public.contact_link ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to contact_link" ON public.contact_link;
CREATE POLICY "Allow all select to contact_link" ON public.contact_link FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to contact_link" ON public.contact_link;
CREATE POLICY "Allow all insert to contact_link" ON public.contact_link FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to contact_link" ON public.contact_link;
CREATE POLICY "Allow all update to contact_link" ON public.contact_link FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to contact_link" ON public.contact_link;
CREATE POLICY "Allow all delete to contact_link" ON public.contact_link FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE contact_link;


-- ========================================================
-- CLUSTERS ESTIMATE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.clusters_estimate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cluster id" TEXT,
  "per order rate" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
GRANT ALL PRIVILEGES ON TABLE public.clusters_estimate TO postgres, anon, authenticated, service_role;
ALTER TABLE public.clusters_estimate ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to clusters_estimate" ON public.clusters_estimate;
CREATE POLICY "Allow all select to clusters_estimate" ON public.clusters_estimate FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to clusters_estimate" ON public.clusters_estimate;
CREATE POLICY "Allow all insert to clusters_estimate" ON public.clusters_estimate FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to clusters_estimate" ON public.clusters_estimate;
CREATE POLICY "Allow all update to clusters_estimate" ON public.clusters_estimate FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to clusters_estimate" ON public.clusters_estimate;
CREATE POLICY "Allow all delete to clusters_estimate" ON public.clusters_estimate FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE clusters_estimate;

-- ========================================================
-- CUSTOMER REFUND SETTING
-- ========================================================
CREATE TABLE IF NOT EXISTS public.customer_refund_setting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "refund with total selling price" BOOLEAN DEFAULT false,
  "refund with total amount" BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
GRANT ALL PRIVILEGES ON TABLE public.customer_refund_setting TO postgres, anon, authenticated, service_role;
ALTER TABLE public.customer_refund_setting ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to customer_refund_setting" ON public.customer_refund_setting;
CREATE POLICY "Allow all select to customer_refund_setting" ON public.customer_refund_setting FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to customer_refund_setting" ON public.customer_refund_setting;
CREATE POLICY "Allow all insert to customer_refund_setting" ON public.customer_refund_setting FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to customer_refund_setting" ON public.customer_refund_setting;
CREATE POLICY "Allow all update to customer_refund_setting" ON public.customer_refund_setting FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to customer_refund_setting" ON public.customer_refund_setting;
CREATE POLICY "Allow all delete to customer_refund_setting" ON public.customer_refund_setting FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE customer_refund_setting;

-- ========================================================
-- RIDERS PENALTY TABLE
-- ========================================================
CREATE TABLE riders_penalty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "rider id" UUID,

  "penalty amount" TEXT,
  "penalty status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE riders_penalty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to riders_penalty" ON riders_penalty;
CREATE POLICY "Allow all select to riders_penalty" ON riders_penalty FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to riders_penalty" ON riders_penalty;
CREATE POLICY "Allow all insert to riders_penalty" ON riders_penalty FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to riders_penalty" ON riders_penalty;
CREATE POLICY "Allow all update to riders_penalty" ON riders_penalty FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to riders_penalty" ON riders_penalty;
CREATE POLICY "Allow all delete to riders_penalty" ON riders_penalty FOR DELETE USING (true);

GRANT ALL PRIVILEGES ON TABLE riders_penalty TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE riders_penalty;

-- ========================================================
-- HUB MANAGERS PENALTY TABLE
-- ========================================================
CREATE TABLE hub_managers_penalty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  "hub manager id" UUID,
  "penalty amount" TEXT,
  "penalty status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE hub_managers_penalty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to hub_managers_penalty" ON hub_managers_penalty;
CREATE POLICY "Allow all select to hub_managers_penalty" ON hub_managers_penalty FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to hub_managers_penalty" ON hub_managers_penalty;
CREATE POLICY "Allow all insert to hub_managers_penalty" ON hub_managers_penalty FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to hub_managers_penalty" ON hub_managers_penalty;
CREATE POLICY "Allow all update to hub_managers_penalty" ON hub_managers_penalty FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to hub_managers_penalty" ON hub_managers_penalty;
CREATE POLICY "Allow all delete to hub_managers_penalty" ON hub_managers_penalty FOR DELETE USING (true);

GRANT ALL PRIVILEGES ON TABLE hub_managers_penalty TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE hub_managers_penalty;

-- ========================================================
-- CLUSTERS PENALTY TABLE
-- ========================================================
CREATE TABLE clusters_penalty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "cluster id" UUID,

  "penalty amount" TEXT,
  "penalty status" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE clusters_penalty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to clusters_penalty" ON clusters_penalty;
CREATE POLICY "Allow all select to clusters_penalty" ON clusters_penalty FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to clusters_penalty" ON clusters_penalty;
CREATE POLICY "Allow all insert to clusters_penalty" ON clusters_penalty FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to clusters_penalty" ON clusters_penalty;
CREATE POLICY "Allow all update to clusters_penalty" ON clusters_penalty FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to clusters_penalty" ON clusters_penalty;
CREATE POLICY "Allow all delete to clusters_penalty" ON clusters_penalty FOR DELETE USING (true);

GRANT ALL PRIVILEGES ON TABLE clusters_penalty TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE clusters_penalty;

-- ========================================================
-- FINISHED CUSTOMERS PAYABLE AMOUNT TABLE
-- ========================================================
CREATE TABLE finished_customers_payable_amount (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "customer id" UUID,
  "total amount" TEXT,
  "bank name" TEXT,
  "account no" TEXT,
  "ifsc code" TEXT,
  "upi id" TEXT,
  "total settled amount" TEXT,
  "penalty amount" TEXT,
  "penalty status" TEXT,
  "final Settlement status" TEXT
);

ALTER TABLE finished_customers_payable_amount ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select to finished_customers_payable_amount" ON finished_customers_payable_amount FOR SELECT USING (true);
CREATE POLICY "Allow all insert to finished_customers_payable_amount" ON finished_customers_payable_amount FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update to finished_customers_payable_amount" ON finished_customers_payable_amount FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete to finished_customers_payable_amount" ON finished_customers_payable_amount FOR DELETE USING (true);
GRANT ALL PRIVILEGES ON TABLE finished_customers_payable_amount TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE finished_customers_payable_amount;

-- ========================================================
-- FINISHED SELLERS PAYABLE AMOUNT TABLE
-- ========================================================
CREATE TABLE finished_sellers_payable_amount (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "seller id" UUID,
  "total amount" TEXT,
  "bank name" TEXT,
  "account no" TEXT,
  "ifsc code" TEXT,
  "upi id" TEXT,
  "total settled amount" TEXT,
  "penalty amount" TEXT,
  "penalty status" TEXT,
  "final Settlement status" TEXT
);

ALTER TABLE finished_sellers_payable_amount ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select to finished_sellers_payable_amount" ON finished_sellers_payable_amount FOR SELECT USING (true);
CREATE POLICY "Allow all insert to finished_sellers_payable_amount" ON finished_sellers_payable_amount FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update to finished_sellers_payable_amount" ON finished_sellers_payable_amount FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete to finished_sellers_payable_amount" ON finished_sellers_payable_amount FOR DELETE USING (true);
GRANT ALL PRIVILEGES ON TABLE finished_sellers_payable_amount TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE finished_sellers_payable_amount;

-- ========================================================
-- FINISHED RIDERS PAYABLE AMOUNT TABLE
-- ========================================================
CREATE TABLE finished_riders_payable_amount (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "rider id" UUID,
  "total amount" TEXT,
  "bank name" TEXT,
  "account no" TEXT,
  "ifsc code" TEXT,
  "upi id" TEXT,
  "total settled amount" TEXT,
  "penalty amount" TEXT,
  "penalty status" TEXT,
  "final Settlement status" TEXT
);

ALTER TABLE finished_riders_payable_amount ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select to finished_riders_payable_amount" ON finished_riders_payable_amount FOR SELECT USING (true);
CREATE POLICY "Allow all insert to finished_riders_payable_amount" ON finished_riders_payable_amount FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update to finished_riders_payable_amount" ON finished_riders_payable_amount FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete to finished_riders_payable_amount" ON finished_riders_payable_amount FOR DELETE USING (true);
GRANT ALL PRIVILEGES ON TABLE finished_riders_payable_amount TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE finished_riders_payable_amount;

-- ========================================================
-- FINISHED HUB MANAGERS PAYABLE AMOUNT TABLE
-- ========================================================
CREATE TABLE finished_hub_managers_payable_amount (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "hub manager id" UUID,
  "total amount" TEXT,
  "bank name" TEXT,
  "account no" TEXT,
  "ifsc code" TEXT,
  "upi id" TEXT,
  "total settled amount" TEXT,
  "penalty amount" TEXT,
  "penalty status" TEXT,
  "final Settlement status" TEXT
);

ALTER TABLE finished_hub_managers_payable_amount ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select to finished_hub_managers_payable_amount" ON finished_hub_managers_payable_amount FOR SELECT USING (true);
CREATE POLICY "Allow all insert to finished_hub_managers_payable_amount" ON finished_hub_managers_payable_amount FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update to finished_hub_managers_payable_amount" ON finished_hub_managers_payable_amount FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete to finished_hub_managers_payable_amount" ON finished_hub_managers_payable_amount FOR DELETE USING (true);
GRANT ALL PRIVILEGES ON TABLE finished_hub_managers_payable_amount TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE finished_hub_managers_payable_amount;

-- ========================================================
-- FINISHED CLUSTERS PAYABLE AMOUNT TABLE
-- ========================================================
CREATE TABLE finished_clusters_payable_amount (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "cluster id" UUID,

  "total amount" TEXT,
  "bank name" TEXT,
  "account no" TEXT,
  "ifsc code" TEXT,
  "upi id" TEXT,
  "total settled amount" TEXT,
  "penalty amount" TEXT,
  "penalty status" TEXT,
  "final Settlement status" TEXT
);

ALTER TABLE finished_clusters_payable_amount ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select to finished_clusters_payable_amount" ON finished_clusters_payable_amount FOR SELECT USING (true);
CREATE POLICY "Allow all insert to finished_clusters_payable_amount" ON finished_clusters_payable_amount FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update to finished_clusters_payable_amount" ON finished_clusters_payable_amount FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete to finished_clusters_payable_amount" ON finished_clusters_payable_amount FOR DELETE USING (true);
GRANT ALL PRIVILEGES ON TABLE finished_clusters_payable_amount TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE finished_clusters_payable_amount;

-- ========================================================
-- FIXED HUB MANAGER SALARY TABLE
-- ========================================================
CREATE TABLE fixed_hub_manager_salary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "fixed salary" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fixed_hub_manager_salary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select to fixed_hub_manager_salary" ON fixed_hub_manager_salary FOR SELECT USING (true);
CREATE POLICY "Allow all insert to fixed_hub_manager_salary" ON fixed_hub_manager_salary FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update to fixed_hub_manager_salary" ON fixed_hub_manager_salary FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete to fixed_hub_manager_salary" ON fixed_hub_manager_salary FOR DELETE USING (true);
GRANT ALL PRIVILEGES ON TABLE fixed_hub_manager_salary TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE fixed_hub_manager_salary;

-- ========================================================
-- SERVICES VISUAL TABLE
-- ========================================================
CREATE TABLE services_visual (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "admin id" UUID,
  "seller id" TEXT,
  "visual model" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE services_visual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select to services_visual" ON services_visual FOR SELECT USING (true);
CREATE POLICY "Allow all insert to services_visual" ON services_visual FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update to services_visual" ON services_visual FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete to services_visual" ON services_visual FOR DELETE USING (true);
GRANT ALL PRIVILEGES ON TABLE services_visual TO anon, authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE services_visual;

-- ========================================================
-- ONLINE PAYMENTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS online_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "rider id" UUID,
  "online payment status" TEXT,
  "total online payment" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.online_payments TO postgres, anon, authenticated, service_role;
ALTER TABLE public.online_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to online_payments" ON public.online_payments;
CREATE POLICY "Allow all select to online_payments" ON public.online_payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to online_payments" ON public.online_payments;
CREATE POLICY "Allow all insert to online_payments" ON public.online_payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to online_payments" ON public.online_payments;
CREATE POLICY "Allow all update to online_payments" ON public.online_payments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to online_payments" ON public.online_payments;
CREATE POLICY "Allow all delete to online_payments" ON public.online_payments FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE online_payments;

-- ========================================================
-- FINISHED ONLINE PAYMENTS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS finished_online_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "admin id" UUID,
  "rider id" UUID,
  "online payment status" TEXT,
  "total online payment" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.finished_online_payments TO postgres, anon, authenticated, service_role;
ALTER TABLE public.finished_online_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to finished_online_payments" ON public.finished_online_payments;
CREATE POLICY "Allow all select to finished_online_payments" ON public.finished_online_payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to finished_online_payments" ON public.finished_online_payments;
CREATE POLICY "Allow all insert to finished_online_payments" ON public.finished_online_payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to finished_online_payments" ON public.finished_online_payments;
CREATE POLICY "Allow all update to finished_online_payments" ON public.finished_online_payments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to finished_online_payments" ON public.finished_online_payments;
CREATE POLICY "Allow all delete to finished_online_payments" ON public.finished_online_payments FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE finished_online_payments;

-- ========================================================
-- RIDERS SETTING TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS riders_setting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "rider rule" TEXT,       
  "attendence" TEXT, 
  "text setting" TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON TABLE public.riders_setting TO postgres, anon, authenticated, service_role;
ALTER TABLE public.riders_setting ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all select to riders_setting" ON public.riders_setting;
CREATE POLICY "Allow all select to riders_setting" ON public.riders_setting FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to riders_setting" ON public.riders_setting;
CREATE POLICY "Allow all insert to riders_setting" ON public.riders_setting FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to riders_setting" ON public.riders_setting;
CREATE POLICY "Allow all update to riders_setting" ON public.riders_setting FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to riders_setting" ON public.riders_setting;
CREATE POLICY "Allow all delete to riders_setting" ON public.riders_setting FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE riders_setting;

-- riders_route table
CREATE TABLE IF NOT EXISTS public.riders_route (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "rider id" text,
    "route name" text,
    "route details" text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL PRIVILEGES ON TABLE public.riders_route TO postgres, anon, authenticated, service_role;
ALTER TABLE public.riders_route ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select to riders_route" ON public.riders_route;
CREATE POLICY "Allow all select to riders_route" ON public.riders_route FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert to riders_route" ON public.riders_route;
CREATE POLICY "Allow all insert to riders_route" ON public.riders_route FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update to riders_route" ON public.riders_route;
CREATE POLICY "Allow all update to riders_route" ON public.riders_route FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all delete to riders_route" ON public.riders_route;
CREATE POLICY "Allow all delete to riders_route" ON public.riders_route FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE riders_route;

-- Delete duplicate Saffari admin
DELETE FROM auth.users WHERE email = 'admin@suriyawansaffari.com';

-- user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    user_role text,
    session_id uuid DEFAULT gen_random_uuid(),
    login_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    logout_at timestamp with time zone,
    last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    device_type text,
    operating_system text,
    browser text,
    user_agent text,
    ip_address text,
    device_label text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL PRIVILEGES ON TABLE public.user_sessions TO postgres, anon, authenticated, service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select to user_sessions" ON public.user_sessions;
CREATE POLICY "Allow all select to user_sessions" ON public.user_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all insert to user_sessions" ON public.user_sessions;
CREATE POLICY "Allow all insert to user_sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update to user_sessions" ON public.user_sessions;
CREATE POLICY "Allow all update to user_sessions" ON public.user_sessions FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all delete to user_sessions" ON public.user_sessions;
CREATE POLICY "Allow all delete to user_sessions" ON public.user_sessions FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
