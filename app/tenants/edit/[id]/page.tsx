'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Room {
  id: string
  room_number: string
  floor_number: number
  monthly_rent: number
  is_occupied: boolean
}

interface Tenant {
  id: string
  name: string
  phone?: string
  email?: string
  room_id: string
  room_number: string
  monthly_rent: number
  security_deposit: number
  is_active: boolean
}

export default function EditTenantPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    room_id: '',
    monthly_rent: '',
    security_deposit: '',
    is_active: true
  })

  useEffect(() => {
    loadTenantAndRooms()
  }, [tenantId])

  const loadTenantAndRooms = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      
      // Load tenant data
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (tenantError) {
        console.error('Error loading tenant:', tenantError)
        toast({
          title: "त्रुटि",
          description: "भाडावाल फेला परेन",
          variant: "destructive",
        })
        router.push('/tenants')
        return
      }

      // Load available rooms + current tenant's room
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .or(`is_occupied.eq.false,id.eq.${tenant.room_id}`)
        .order('room_number')

      if (roomsError) {
        console.error('Error loading rooms:', roomsError)
        toast({
          title: "त्रुटि", 
          description: "कोठाहरू लोड गर्न सकिएन",
          variant: "destructive",
        })
      } else {
        setRooms(rooms || [])
      }

      // Set form data
      setFormData({
        name: tenant.name || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        room_id: tenant.room_id || '',
        monthly_rent: tenant.monthly_rent?.toString() || '',
        security_deposit: tenant.security_deposit?.toString() || '',
        is_active: tenant.is_active ?? true
      })

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "त्रुटि",
        description: "डाटा लोड गर्न सकिएन",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoomChange = (roomId: string) => {
    const selectedRoom = rooms.find(room => room.id === roomId)
    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        room_id: roomId,
        monthly_rent: selectedRoom.monthly_rent.toString()
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.room_id) {
      toast({
        title: "त्रुटि",
        description: "नाम र कोठा आवश्यक छ",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const supabase = getSupabaseBrowserClient()
      
      // Get current tenant data to check if room changed
      const { data: currentTenant, error: fetchError } = await supabase
        .from('tenants')
        .select('room_id')
        .eq('id', tenantId)
        .single()

      if (fetchError) {
        console.error('Error fetching current tenant:', fetchError)
        toast({
          title: "त्रुटि",
          description: "वर्तमान डाटा फेला परेन",
          variant: "destructive",
        })
        return
      }
      
      const selectedRoom = rooms.find(room => room.id === formData.room_id)
      if (!selectedRoom) {
        toast({
          title: "त्रुटि",
          description: "छनोट गरिएको कोठा फेला परेन",
          variant: "destructive",
        })
        return
      }

      const oldRoomId = currentTenant.room_id
      const newRoomId = formData.room_id
      const roomChanged = oldRoomId !== newRoomId

      // Update tenant
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          room_id: formData.room_id,
          room_number: selectedRoom.room_number,
          monthly_rent: parseFloat(formData.monthly_rent),
          security_deposit: parseFloat(formData.security_deposit),
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)

      if (tenantError) {
        console.error('Error updating tenant:', tenantError)
        toast({
          title: "त्रुटि",
          description: "भाडावाल अपडेट गर्न सकिएन",
          variant: "destructive",
        })
        return
      }

      // Update room occupancy if room changed
      if (roomChanged) {
        // Free up old room
        if (oldRoomId) {
          await supabase
            .from('rooms')
            .update({ is_occupied: false })
            .eq('id', oldRoomId)
        }

        // Occupy new room
        await supabase
          .from('rooms')
          .update({ is_occupied: true })
          .eq('id', newRoomId)
      }

      toast({
        title: "सफल",
        description: "भाडावाल सफलतापूर्वक अपडेट गरियो",
      })

      router.push('/tenants')

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "त्रुटि",
        description: "भाडावाल अपडेट गर्न सकिएन",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <Navigation />
          <div className="text-center py-20">
            <p>लोड हुँदैछ...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <Navigation />

        <div className="flex items-center gap-4 mb-6">
          <Link href="/tenants">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              फिर्ता
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">भाडावाल सम्पादन गर्नुहोस्</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>भाडावालको जानकारी सम्पादन गर्नुहोस्</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">नाम *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="भाडावालको पूरा नाम"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">फोन नम्बर</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="उदाहरण: 9841234567"
                />
              </div>

              <div>
                <Label htmlFor="email">इमेल</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="उदाहरण: example@email.com"
                />
              </div>

              <div>
                <Label htmlFor="room">कोठा छन्नुहोस् *</Label>
                <Select value={formData.room_id} onValueChange={handleRoomChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="कोठा छन्नुहोस्" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        कोठा {room.room_number} - तल्ला {room.floor_number} (रु. {room.monthly_rent}/महिना)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="monthly_rent">मासिक भाडा</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_rent: e.target.value }))}
                  placeholder="उदाहरण: 8000"
                />
              </div>

              <div>
                <Label htmlFor="security_deposit">धरौटी रकम</Label>
                <Input
                  id="security_deposit"
                  type="number"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData(prev => ({ ...prev, security_deposit: e.target.value }))}
                  placeholder="उदाहरण: 15000"
                />
              </div>

              <div>
                <Label htmlFor="is_active">स्थिति</Label>
                <Select 
                  value={formData.is_active.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">सक्रिय</SelectItem>
                    <SelectItem value="false">निष्क्रिय</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "सेभ गर्दै..." : "सेभ गर्नुहोस्"}
                </Button>
                <Link href="/tenants">
                  <Button type="button" variant="outline">
                    रद्द गर्नुहोस्
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}