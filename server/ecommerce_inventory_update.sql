-- Add continue_selling column to products and product_variants
ALTER TABLE products ADD COLUMN IF NOT EXISTS continue_selling BOOLEAN DEFAULT false;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS continue_selling BOOLEAN DEFAULT false;

-- Add variant_id to order_items and cart_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id TEXT;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id TEXT;
