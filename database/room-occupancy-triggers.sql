-- Room Occupancy Management Triggers
-- These triggers automatically manage room occupancy status when tenants are added, updated, or deleted

-- Function to update room occupancy when tenant is inserted or updated
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new tenant)
    IF TG_OP = 'INSERT' THEN
        -- Mark new room as occupied
        UPDATE public.rooms 
        SET is_occupied = true 
        WHERE id = NEW.room_id AND NEW.is_active = true;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (tenant changes room or status)
    IF TG_OP = 'UPDATE' THEN
        -- If room changed
        IF OLD.room_id != NEW.room_id THEN
            -- Free up old room
            UPDATE public.rooms 
            SET is_occupied = false 
            WHERE id = OLD.room_id;
            
            -- Occupy new room (if tenant is active)
            UPDATE public.rooms 
            SET is_occupied = true 
            WHERE id = NEW.room_id AND NEW.is_active = true;
        END IF;
        
        -- If tenant status changed to inactive
        IF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE public.rooms 
            SET is_occupied = false 
            WHERE id = NEW.room_id;
        END IF;
        
        -- If tenant status changed to active
        IF OLD.is_active = false AND NEW.is_active = true THEN
            UPDATE public.rooms 
            SET is_occupied = true 
            WHERE id = NEW.room_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (tenant removed)
    IF TG_OP = 'DELETE' THEN
        -- Free up the room
        UPDATE public.rooms 
        SET is_occupied = false 
        WHERE id = OLD.room_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tenant_room_occupancy_trigger ON public.tenants;

-- Create trigger for tenant table
CREATE TRIGGER tenant_room_occupancy_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_room_occupancy();

-- Function to ensure room occupancy consistency
CREATE OR REPLACE FUNCTION sync_room_occupancy()
RETURNS void AS $$
BEGIN
    -- Reset all rooms to unoccupied first
    UPDATE public.rooms SET is_occupied = false;
    
    -- Mark rooms as occupied based on active tenants
    UPDATE public.rooms 
    SET is_occupied = true 
    WHERE id IN (
        SELECT DISTINCT room_id 
        FROM public.tenants 
        WHERE is_active = true AND room_id IS NOT NULL
    );
    
    RAISE NOTICE 'Room occupancy synchronized successfully';
END;
$$ LANGUAGE plpgsql;

-- Run the sync function to fix any existing inconsistencies
SELECT sync_room_occupancy();

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Room Occupancy Management Setup Complete!';
    RAISE NOTICE '🔄 Database triggers will now automatically manage room occupancy';
    RAISE NOTICE '🏠 Room availability will update automatically when tenants are added/edited/deleted';
    RAISE NOTICE '⚡ Run SELECT sync_room_occupancy(); anytime to fix inconsistencies';
END $$;