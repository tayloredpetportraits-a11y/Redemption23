
-- Drop the restrictive check constraint on selected_print_product
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_selected_print_product_check;
