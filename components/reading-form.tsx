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
import { formatBilingualDate, getDefaultNepaliDate } from "@/lib/nepali-date"

interface Tenant {
  id: string
  name: string
  rooms: {
    room_number: string
    room_type: string
  }
}

// Mock data for demo mode
const mockTenants = [
  { id: '1', name: 'राम बहादुर', rooms: { room_number: '101', room_type: 'single' } },
  { id: '2', name: 'सीता कुमारी', rooms: { room_number: '102', room_type: 'single' } },
  { id: '3', name: 'हरि प्रसाद', rooms: { room_number: '201', room_type: 'double' } }
]

export function ReadingForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [formData, setFormData] = useState({
    tenant_id: "",
    reading_date_nepali: getDefaultNepaliDate(), // Only Nepali date
    // Single room fields
    previous_reading: 0,
    current_reading: 0,
    // Double room fields
    room_meter_previous: 0,
    room_meter_current: 0,
    kitchen_meter_previous: 0,
    kitchen_meter_current: 0,
    rate_per_unit: 15, // Default unit rate set to 15 rupees as requested
  })
  
  const [selectedRoomType, setSelectedRoomType] = useState<string>('single')

  const loadTenants = useCallback(async () => {
    try {
      if (isDemoMode()) {
        setTenants(mockTenants)
        return
      }

      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, rooms!inner(room_number, room_type)")
        .eq("is_active", true)

      if (error) {
        console.error('Error loading tenants:', error)
        toast({
          title: "त्रुटि",
          description: "भाडादारहरू लोड गर्न सकिएन",
          variant: "destructive",
        })
        // Fallback to demo mode
        setTenants(mockTenants)
        return
      }

      if (data) {
        // Transform the data to match our interface
        const transformedData = data.map((item: unknown) => {
          const typedItem = item as { id: string; name: string; rooms: { room_number: string }[] }
          return {
            id: typedItem.id,
            name: typedItem.name,
            rooms: Array.isArray(typedItem.rooms) ? typedItem.rooms[0] : typedItem.rooms
          }
        })
        setTenants(transformedData as Tenant[])
      }
    } catch (error) {
      console.error('Error:', error)
      setTenants(mockTenants)
    }
  }, [toast])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  const loadPreviousReading = useCallback(async (tenantId: string) => {
    try {
      if (isDemoMode()) {
        const demoReadings = getDemoData('readings') || [];
        const lastReading = (demoReadings as Array<{ 
          tenant_id: string; 
          reading_date: string; 
          current_reading?: number;
          room_meter_current?: number;
          kitchen_meter_current?: number;
          rate_per_unit?: number;
          meter_type?: string;
        }>)
          .filter((r) => r.tenant_id === tenantId)
          .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())[0];
        
        if (lastReading) {
          setFormData(prev => ({
            ...prev,
            previous_reading: lastReading.current_reading || 0,
            room_meter_previous: lastReading.room_meter_current || 0,
            kitchen_meter_previous: lastReading.kitchen_meter_current || 0,
            rate_per_unit: lastReading.rate_per_unit || 15
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            previous_reading: 0,
            room_meter_previous: 0,
            kitchen_meter_previous: 0,
            rate_per_unit: 15
          }));
        }
        return
      }

      const { data, error } = await supabase
        .from("readings")
        .select("current_reading, room_meter_current, kitchen_meter_current, rate_per_unit, meter_type")
        .eq("tenant_id", tenantId)
        .order("reading_date_nepali", { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error loading previous reading:', error)
        // Just set defaults on error
        setFormData(prev => ({
          ...prev,
          previous_reading: 0,
          room_meter_previous: 0,
          kitchen_meter_previous: 0,
          rate_per_unit: 15
        }));
        return
      }

      if (data && data.length > 0) {
        const lastReading = data[0]
        setFormData(prev => ({
          ...prev,
          previous_reading: lastReading.current_reading || 0,
          room_meter_previous: lastReading.room_meter_current || 0,
          kitchen_meter_previous: lastReading.kitchen_meter_current || 0,
          rate_per_unit: lastReading.rate_per_unit || 15
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          previous_reading: 0,
          room_meter_previous: 0,
          kitchen_meter_previous: 0,
          rate_per_unit: 15
        }));
      }
    } catch (error) {
      console.error('Error:', error)
      setFormData(prev => ({
        ...prev,
        previous_reading: 0,
        room_meter_previous: 0,
        kitchen_meter_previous: 0,
        rate_per_unit: 15
      }));
    }
  }, [])

  useEffect(() => {
    if (formData.tenant_id) {
      // Find selected tenant and update room type
      const selectedTenant = tenants.find(t => t.id === formData.tenant_id)
      if (selectedTenant) {
        const roomType = selectedTenant.rooms.room_type || 'single'
        console.log('🏠 Selected tenant room type:', roomType, 'for tenant:', selectedTenant.name)
        setSelectedRoomType(roomType)
      }
      loadPreviousReading(formData.tenant_id)
    }
  }, [formData.tenant_id, loadPreviousReading, tenants])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    console.log('=== FORM SUBMISSION START ===')
    console.log('Form data:', formData)
    console.log('Selected room type:', selectedRoomType)
    console.log('Is demo mode:', isDemoMode())
    console.log('Tenants loaded:', tenants.length)

    try {
      // Basic validation
      if (!formData.tenant_id) {
        console.log('❌ Validation failed: No tenant selected')
        toast({
          title: "त्रुटि",
          description: "कृपया भाडादार छान्नुहोस्",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Validation based on room type
      if (selectedRoomType === 'single') {
        if (!formData.current_reading || formData.current_reading <= 0) {
          console.log('❌ Validation failed: Invalid current reading')
          toast({
            title: "त्रुटि",
            description: "कृपया हालको रिडिङ भर्नुहोस्",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      } else if (selectedRoomType === 'double') {
        if (!formData.room_meter_current || formData.room_meter_current <= 0 ||
            !formData.kitchen_meter_current || formData.kitchen_meter_current <= 0) {
          console.log('❌ Validation failed: Invalid double room readings')
          toast({
            title: "त्रुटि",
            description: "कृपया कोठा र भान्साको मिटर रिडिङ भर्नुहोस्",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      const unitsConsumed = selectedRoomType === 'single' 
        ? formData.current_reading - formData.previous_reading
        : (formData.room_meter_current - formData.room_meter_previous) + 
          (formData.kitchen_meter_current - formData.kitchen_meter_previous)
      
      console.log('✅ Validation passed. Units consumed:', unitsConsumed, 'Room type:', selectedRoomType)

      if (isDemoMode()) {
        console.log('💾 Saving in demo mode...')
        
        const readingData = {
          id: Date.now().toString(),
          tenant_id: formData.tenant_id,
          reading_date_nepali: formData.reading_date_nepali,
          meter_type: selectedRoomType,
          // Single room fields
          previous_reading: selectedRoomType === 'single' ? formData.previous_reading : null,
          current_reading: selectedRoomType === 'single' ? formData.current_reading : null,
          // Double room fields
          room_meter_previous: selectedRoomType === 'double' ? formData.room_meter_previous : null,
          room_meter_current: selectedRoomType === 'double' ? formData.room_meter_current : null,
          kitchen_meter_previous: selectedRoomType === 'double' ? formData.kitchen_meter_previous : null,
          kitchen_meter_current: selectedRoomType === 'double' ? formData.kitchen_meter_current : null,
          units_consumed: unitsConsumed,
          rate_per_unit: formData.rate_per_unit,
          tenants: tenants.find(t => t.id === formData.tenant_id)
        }
        
        console.log('📝 Reading data to save:', readingData)

        // Save to localStorage for demo mode
        const existingReadings = getDemoData('readings')
        const updatedReadings = [...existingReadings, readingData]
        setDemoData('readings', updatedReadings)
        
        console.log('💾 Saved to localStorage. Total readings:', updatedReadings.length)
        
        toast({
          title: "सफल",
          description: "रिडिङ सफलतापूर्वक सेभ भयो",
        })

        console.log('✅ Toast shown, redirecting...')
        
        // Small delay to ensure toast is visible
        setTimeout(() => {
          window.location.href = "/readings"
        }, 1000)
        return
      }

      // Production mode - save to Supabase
      const selectedTenant = tenants.find(t => t.id === formData.tenant_id)
      if (!selectedTenant) {
        toast({
          title: "त्रुटि",
          description: "भाडादार फेला परेन",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const insertData: any = {
        tenant_id: formData.tenant_id,
        tenant_name: selectedTenant.name,
        room_number: selectedTenant.rooms.room_number,
        reading_date_nepali: formData.reading_date_nepali,
        meter_type: selectedRoomType,
        rate_per_unit: formData.rate_per_unit
      }

      // Add fields based on room type
      if (selectedRoomType === 'single') {
        insertData.previous_reading = formData.previous_reading
        insertData.current_reading = formData.current_reading
        // Set double room fields to null for single rooms
        insertData.room_meter_previous = null
        insertData.room_meter_current = null
        insertData.kitchen_meter_previous = null
        insertData.kitchen_meter_current = null
      } else if (selectedRoomType === 'double') {
        insertData.room_meter_previous = formData.room_meter_previous
        insertData.room_meter_current = formData.room_meter_current
        insertData.kitchen_meter_previous = formData.kitchen_meter_previous
        insertData.kitchen_meter_current = formData.kitchen_meter_current
        // Set single room fields to null for double rooms
        insertData.previous_reading = null
        insertData.current_reading = null
      }

      console.log('📊 Final insert data:', insertData)
      console.log('🎯 About to insert into database...')

      const { error } = await supabase.from('readings').insert(insertData)

      if (error) {
        console.error('Error saving reading:', error)
        console.error('Insert data was:', insertData)
        console.error('Selected room type:', selectedRoomType)
        
        // Check if the error is related to missing double room columns
        if (error.message.includes('column') && selectedRoomType === 'double') {
          toast({
            title: "त्रुटि",
            description: "डबल कोठा समर्थन सक्रिय गर्न डेटाबेस अपडेट आवश्यक छ। कृपया व्यवस्थापकलाई सम्पर्क गर्नुहोस्।",
            variant: "destructive",
          })
        } else {
          toast({
            title: "त्रुटि",
            description: `रिडिङ सेभ गर्न सकिएन: ${error.message}`,
            variant: "destructive",
          })
        }
        setLoading(false)
        return
      }

      toast({
        title: "सफल",
        description: "रिडिङ सफलतापूर्वक सेभ भयो",
      })

      console.log('✅ Toast shown, redirecting...')
      
      // Small delay to ensure toast is visible
      setTimeout(() => {
        window.location.href = "/readings"
      }, 1000)

    } catch (error) {
      console.error('💥 Unexpected error in form submission:', error)
      toast({
        title: "त्रुटि",
        description: "रिडिङ सेभ गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate units and amounts based on room type
  const unitsConsumed = selectedRoomType === 'single' 
    ? formData.current_reading - formData.previous_reading
    : (formData.room_meter_current - formData.room_meter_previous) + 
      (formData.kitchen_meter_current - formData.kitchen_meter_previous)
  
  const totalAmount = unitsConsumed * formData.rate_per_unit

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tenant">भाडामा *</Label>
            <Select
              value={formData.tenant_id}
              onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="भाडामा छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent className="z-[100] max-h-60 overflow-y-auto bg-white border-gray-200 shadow-xl">
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id} className="bg-white hover:bg-blue-50 focus:bg-blue-100">
                    {tenant.name} - कोठा {tenant.rooms.room_number} ({tenant.rooms.room_type === 'double' ? 'डबल' : 'सिंगल'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reading_date_nepali">मिति (नेपाली) *</Label>
            <Input
              id="reading_date_nepali"
              value={formData.reading_date_nepali}
              onChange={(e) => setFormData({ ...formData, reading_date_nepali: e.target.value })}
              placeholder="YYYY-MM-DD (जस्तै: 2082-06-14)"
              required
            />
          </div>

          {/* Single Room Meter Fields */}
          {selectedRoomType === 'single' && (
            <>
              <div>
                <Label htmlFor="previous_reading">पहिलेको रिडिङ</Label>
                <Input
                  id="previous_reading"
                  type="number"
                  value={formData.previous_reading}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previous_reading: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="पहिलेको रिडिङ (सम्पादन गर्न सकिन्छ)"
                />
              </div>

              <div>
                <Label htmlFor="current_reading">हालको रिडिङ *</Label>
                <Input
                  id="current_reading"
                  type="number"
                  value={formData.current_reading}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_reading: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  min={0}
                />
              </div>
            </>
          )}

          {/* Double Room Meter Fields */}
          {selectedRoomType === 'double' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_meter_previous">कोठा मिटर - पहिलेको रिडिङ</Label>
                  <Input
                    id="room_meter_previous"
                    type="number"
                    value={formData.room_meter_previous}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        room_meter_previous: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="कोठा मिटर पुरानो रिडिङ"
                  />
                </div>
                <div>
                  <Label htmlFor="kitchen_meter_previous">भान्सा मिटर - पहिलेको रिडिङ</Label>
                  <Input
                    id="kitchen_meter_previous"
                    type="number"
                    value={formData.kitchen_meter_previous}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kitchen_meter_previous: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="भान्सा मिटर पुरानो रिडिङ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_meter_current">कोठा मिटर - हालको रिडिङ *</Label>
                  <Input
                    id="room_meter_current"
                    type="number"
                    value={formData.room_meter_current}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        room_meter_current: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="kitchen_meter_current">भान्सा मिटर - हालको रिडिङ *</Label>
                  <Input
                    id="kitchen_meter_current"
                    type="number"
                    value={formData.kitchen_meter_current}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kitchen_meter_current: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">डबल कोठा मिटर ब्रेकडाउन:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>कोठा मिटर खपत:</span>
                    <span>{formData.room_meter_current - formData.room_meter_previous} युनिट</span>
                  </div>
                  <div className="flex justify-between">
                    <span>भान्सा मिटर खपत:</span>
                    <span>{formData.kitchen_meter_current - formData.kitchen_meter_previous} युनिट</span>
                  </div>
                  <div className="flex justify-between font-medium text-amber-700">
                    <span>कुल खपत:</span>
                    <span>{unitsConsumed} युनिट</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="rate_per_unit">प्रति युनिट दर (रु.) *</Label>
            <Input
              id="rate_per_unit"
              type="number"
              value={formData.rate_per_unit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rate_per_unit: Number.parseFloat(e.target.value) || 15,
                })
              }
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>खपत भएको युनिट:</span>
                <span className="font-semibold">{unitsConsumed} युनिट</span>
              </div>
              <div className="flex justify-between">
                <span>कुल रकम:</span>
                <span className="font-bold text-blue-600">रु. {totalAmount}</span>
              </div>
              {selectedRoomType === 'double' && (
                <div className="text-xs text-gray-600 mt-2">
                  दुवै मिटरको कुल खपत: {formData.room_meter_current - formData.room_meter_previous} + {formData.kitchen_meter_current - formData.kitchen_meter_previous} = {unitsConsumed} युनिट
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "सेभ गर्दै..." : "सेभ गर्नुहोस्"}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex-1">
              रद्द गर्नुहोस्
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}