"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { isDemoMode, getDemoData, setDemoData } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Mock data for demo mode
const mockRooms = [
  { id: '1', room_number: '101', floor_number: '1', monthly_rent: 8000 },
  { id: '2', room_number: '102', floor_number: '1', monthly_rent: 8500 },
  { id: '3', room_number: '201', floor_number: '2', monthly_rent: 9000 }
]

interface Room {
  id: string
  room_number: string
  floor_number: string
  monthly_rent: number
}

export function TenantForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [formData, setFormData] = useState({
    name: "",
    phone: "", // Made optional
    email: "",
    room_id: "",
  })

  const loadRooms = useCallback(async () => {
    try {
      if (isDemoMode()) {
        setRooms(mockRooms)
        return
      }

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("is_occupied", false)

      if (error) {
        console.error('Error loading rooms:', error)
        toast({
          title: "त्रुटि",
          description: "कोठाहरू लोड गर्न सकिएन",
          variant: "destructive",
        })
        // Fallback to demo mode
        setRooms(mockRooms)
        return
      }

      setRooms(data || [])
    } catch (error) {
      console.error('Error:', error)
      setRooms(mockRooms)
    }
  }, [toast])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isDemoMode()) {
        console.log('Demo mode: Tenant would be added:', formData)
        
        // Create tenant data with room information
        const selectedRoom = rooms.find(r => r.id === formData.room_id)
        const tenantData = {
          id: Date.now().toString(),
          name: formData.name,
          phone: formData.phone || '', // Handle optional phone
          email: formData.email || '',
          is_active: true,
          created_at: new Date().toISOString(),
          rooms: {
            room_number: selectedRoom?.room_number || '',
            floor_number: selectedRoom?.floor_number || ''
          }
        }
        
        // Save to localStorage
        const existingTenants = getDemoData('tenants')
        const updatedTenants = [...existingTenants, tenantData]
        setDemoData('tenants', updatedTenants)
        
        console.log('💾 Saved tenant to localStorage. Total tenants:', updatedTenants.length)
        
        toast({
          title: "सफल",
          description: "भाडादार सफलतापूर्वक थपियो",
        })

        // Use window.location to force a full page refresh and navigation
        window.location.href = "/tenants"
        return
      }

      // Get room details for the selected room
      const selectedRoom = rooms.find(r => r.id === formData.room_id)
      if (!selectedRoom) {
        toast({
          title: "त्रुटि",
          description: "कोठा फेला परेन",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const { error } = await supabase.from("tenants").insert({
        name: formData.name,
        phone: formData.phone || null, // Handle optional phone
        email: formData.email || null,
        room_id: formData.room_id,
        room_number: selectedRoom.room_number, // Required field
        monthly_rent: selectedRoom.monthly_rent, // Required field
        security_deposit: selectedRoom.monthly_rent * 2, // Typical security deposit (2 months rent)
        is_active: true,
      })

      if (error) {
        console.error('Error adding tenant:', error)
        toast({
          title: "त्रुटि",
          description: "भाडादार थप्न सकिएन",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Also update the room to mark it as occupied
      await supabase
        .from("rooms")
        .update({ is_occupied: true })
        .eq("id", formData.room_id)

      toast({
        title: "सफल",
        description: "भाडादार सफलतापूर्वक थपियो",
      })

      // Use window.location to force a full page refresh and navigation
      window.location.href = "/tenants"

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "त्रुटि",
        description: "भाडादार थप्न सकिएन",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">नाम *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="भाडादारको नाम"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">फोन नम्बर</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="मोबाइल नम्बर (वैकल्पिक)"
            />
          </div>

          <div>
            <Label htmlFor="email">इमेल</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="इमेल ठेगाना"
            />
          </div>

          <div>
            <Label htmlFor="room_id">कोठा छान्नुहोस् *</Label>
            <Select
              value={formData.room_id}
              onValueChange={(value) => setFormData({ ...formData, room_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="कोठा छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    कोठा {room.room_number} - तल्ला {room.floor_number} (रु. {room.monthly_rent})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'प्रक्रिया भइरहेको छ...' : 'भाडादार थप्नुहोस्'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}