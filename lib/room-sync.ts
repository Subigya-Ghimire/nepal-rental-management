// Room Occupancy Sync Utility
// This ensures room availability is correctly updated across the application

import { getSupabaseBrowserClient } from './supabase'

export async function syncRoomOccupancy() {
  try {
    const supabase = getSupabaseBrowserClient()
    
    console.log('🔄 Starting room occupancy sync...')
    
    // First, get all active tenants and their room IDs
    const { data: activeTenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('room_id')
      .eq('is_active', true)

    if (tenantsError) {
      console.error('Error fetching active tenants:', tenantsError)
      throw tenantsError
    }

    const occupiedRoomIds = activeTenants?.map(t => t.room_id).filter(Boolean) || []
    console.log('🏠 Found occupied rooms:', occupiedRoomIds)

    // Reset all rooms to unoccupied first
    const { error: resetError } = await supabase
      .from('rooms')
      .update({ is_occupied: false })

    if (resetError) {
      console.error('Error resetting room occupancy:', resetError)
      throw resetError
    }

    // Mark occupied rooms
    if (occupiedRoomIds.length > 0) {
      const { error: occupyError } = await supabase
        .from('rooms')
        .update({ is_occupied: true })
        .in('id', occupiedRoomIds)

      if (occupyError) {
        console.error('Error marking rooms as occupied:', occupyError)
        throw occupyError
      }
    }

    console.log('✅ Room occupancy synced successfully:', occupiedRoomIds.length, 'rooms occupied')
    return {
      success: true,
      occupiedRooms: occupiedRoomIds.length,
      totalRooms: occupiedRoomIds.length
    }
  } catch (error) {
    console.error('❌ Error syncing room occupancy:', error)
    return {
      success: false,
      error: error
    }
  }
}

export async function getRoomAvailability() {
  try {
    const supabase = getSupabaseBrowserClient()
    
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('id, room_number, is_occupied')
      .order('room_number')

    if (error) {
      console.error('Error fetching room availability:', error)
      throw error
    }

    const available = rooms?.filter(room => !room.is_occupied) || []
    const occupied = rooms?.filter(room => room.is_occupied) || []

    console.log('🏠 Room availability:', {
      total: rooms?.length || 0,
      available: available.length,
      occupied: occupied.length
    })

    return {
      success: true,
      total: rooms?.length || 0,
      available: available.length,
      occupied: occupied.length,
      availableRooms: available,
      occupiedRooms: occupied
    }
  } catch (error) {
    console.error('❌ Error getting room availability:', error)
    return {
      success: false,
      error: error
    }
  }
}