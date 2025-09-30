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
import { sheetsBackup } from "@/lib/sheets-backup"
import { getCurrentNepaliDate, formatBilingualDate, getDefaultNepaliDate } from "@/lib/nepali-date"

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
    move_in_date: new Date().toISOString().split("T")[0],
    move_in_date_nepali: getDefaultNepaliDate(), // Nepali date field
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
          move_in_date: formData.move_in_date,
          move_in_date_nepali: formData.move_in_date_nepali, // Store Nepali date
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

      const { error } = await supabase.from("tenants").insert({
        name: formData.name,
        phone: formData.phone || null, // Handle optional phone
        email: formData.email || null,
        room_id: formData.room_id,
        move_in_date: formData.move_in_date,
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

      // Automatic backup to Google Sheets
      try {
        const { data: allTenants } = await supabase
          .from("tenants")
          .select("*")
          .order('created_at', { ascending: false })
        
        if (allTenants) {
          await sheetsBackup.backupTenants(allTenants)
        }
      } catch (backupError) {
        console.log('Backup warning:', backupError)
        // Don't show error to user - backup is optional
      }

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

          <div>
            <Label htmlFor="move_in_date">भित्रिएको मिति (अंग्रेजी) *</Label>
            <Input
              id="move_in_date"
              type="date"
              value={formData.move_in_date}
              onChange={(e) => {
                setFormData({ ...formData, move_in_date: e.target.value })
              }}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.move_in_date && formatBilingualDate(new Date(formData.move_in_date))}
            </p>
          </div>

          <div>
            <Label htmlFor="move_in_date_nepali">भित्रिएको मिति (नेपाली)</Label>
            <Input
              id="move_in_date_nepali"
              value={formData.move_in_date_nepali}
              onChange={(e) => setFormData({ ...formData, move_in_date_nepali: e.target.value })}
              placeholder="YYYY-MM-DD (जस्तै: 2081-06-15)"
            />
            <p className="text-sm text-muted-foreground mt-1">
              नेपाली मिति: YYYY-MM-DD ढाँचामा लेख्नुहोस् (वैकल्पिक)
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'प्रक्रिया भइरहेको छ...' : 'भाडादार थप्नुहोस्'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}