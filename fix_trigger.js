import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE OR REPLACE FUNCTION sync_shipment_to_customer_order()
RETURNS TRIGGER AS $$
DECLARE
    new_status_text TEXT;
    new_process_type TEXT;
    existing_status TEXT;
    formatted_date TEXT;
    final_status TEXT;
    cust_order_id UUID;
    tracking_info TEXT;
BEGIN
    -- Only proceed if shipment_type has actually changed
    IF NEW."shipment type" = OLD."shipment type" THEN
        RETURN NEW;
    END IF;

    -- Date formatting matching frontend: "11 Sep 2026, 02:11 PM"
    formatted_date := to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM');

    -- Determine new status text and process type based on user's exact requirements
    IF NEW."shipment type" ILIKE '%ready to pickup%' AND NEW."shipment tag" ILIKE '%seller pickup%' THEN
        new_status_text := 'Your order has been accepted successfully on ' || formatted_date;
        new_process_type := 'order accepted';
    ELSIF NEW."shipment type" ILIKE '%picked up%' AND NEW."shipment tag" ILIKE '%seller pickup%' THEN
        tracking_info := COALESCE(NEW."tracking id number", '');
        new_status_text := 'Your order has been picked upsuccessfully on ' || formatted_date || ' - Tracking ID: ' || tracking_info;
        new_process_type := 'order picked';
    ELSIF NEW."shipment type" ILIKE '%faild pickup%' AND NEW."shipment tag" ILIKE '%seller pickup%' THEN
        new_status_text := 'Your order has been cancelled on ' || formatted_date || ' - Order ID: ' || NEW."order ID";
        new_process_type := 'order cancelled';
    ELSIF NEW."shipment type" ILIKE '%received at hub%' AND NEW."shipment tag" ILIKE '%customer delivery%' THEN
        tracking_info := COALESCE(NEW."awb number", '');
        new_status_text := 'Your order has been successfully received at hub on ' || formatted_date || ' - AWB: ' || tracking_info;
        new_process_type := 'received at hub';
    ELSIF NEW."shipment type" ILIKE '%dishpacthed%' AND NEW."shipment tag" ILIKE '%customer delivery%' THEN
        new_status_text := 'Your order has been successfully dishpacthed from the hub on ' || formatted_date;
        new_process_type := 'order dishpacthed';
    ELSIF NEW."shipment type" ILIKE '%shipped%' AND NEW."shipment tag" ILIKE '%customer delivery%' THEN
        new_status_text := 'Your order has been shipped successfully on ' || formatted_date;
        new_process_type := 'order shipped';
    ELSIF NEW."shipment type" ILIKE '%out for delivery%' AND NEW."shipment tag" ILIKE '%customer delivery%' THEN
        new_status_text := 'Your order is out for delivery on ' || formatted_date;
        new_process_type := 'out for delivery';
    ELSIF NEW."shipment type" ILIKE '%delivered%' AND NEW."shipment tag" ILIKE '%customer delivery%' THEN
        new_status_text := 'Your order has been delivered successfully on ' || formatted_date;
        new_process_type := 'delivered';
    ELSIF NEW."shipment type" ILIKE '%ready to pickup%' AND NEW."shipment tag" ILIKE '%customer pickup%' THEN
        new_status_text := 'Your return request has been successfully submitted. on ' || formatted_date;
        new_process_type := 'return requested';
    ELSIF NEW."shipment type" ILIKE '%out for return%' AND NEW."shipment tag" ILIKE '%customer pickup%' THEN
        tracking_info := COALESCE(NEW."pickup ID", '');
        new_status_text := 'Your order is out for return on ' || formatted_date || ' - Pickup ID: ' || tracking_info;
        new_process_type := 'out for return';
    ELSIF NEW."shipment type" ILIKE '%returned%' AND NEW."shipment tag" ILIKE '%customer pickup%' THEN
        new_status_text := 'Your order has been returned successfully on ' || formatted_date;
        new_process_type := 'returned';
    ELSE
        RETURN NEW;
    END IF;

    -- Update accepted_shipments "order status"
    existing_status := COALESCE(OLD."order status", '');
    IF existing_status = '' THEN
        final_status := new_status_text;
    ELSIF existing_status NOT ILIKE '%' || new_status_text || '%' THEN
        final_status := existing_status || ' || ' || new_status_text;
    ELSE
        final_status := existing_status;
    END IF;
    
    NEW."order status" := final_status;

    -- Now update customer_orders. We match by product id and order ID to update the specific item
    -- But since trigger cannot easily update without knowing which specific item, we update all matching items in customer_orders
    -- Wait, accepted_shipments also has product id.
    
    UPDATE customer_orders
    SET 
        "order status" = CASE 
                            WHEN COALESCE("order status", '') = '' THEN new_status_text
                            WHEN "order status" NOT ILIKE '%' || new_status_text || '%' THEN "order status" || ' || ' || new_status_text
                            ELSE "order status"
                         END,
        "process type" = new_process_type
    WHERE "order ID" = NEW."order ID" AND "product id" = NEW."product id";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_shipment_to_customer_order ON accepted_shipments;
CREATE TRIGGER trigger_sync_shipment_to_customer_order
BEFORE UPDATE OF "shipment type" ON accepted_shipments
FOR EACH ROW
EXECUTE FUNCTION sync_shipment_to_customer_order();
`;

// Helper to run raw SQL in Supabase via REST API (since JS client doesn't expose raw SQL directly, but wait - there is no direct raw SQL execution from supabase-js unless using an RPC that runs raw SQL, which isn't standard).
// Alternatively, I will use postgres module directly since pg is installed.
