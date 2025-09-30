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
  }
}

// Mock data for demo mode
const mockTenants = [
  { id: '1', name: 'राम बहादुर', rooms: { room_number: '101' } },
  { id: '2', name: 'सीता कुमारी', rooms: { room_number: '102' } },
  { id: '3', name: 'हरि प्रसाद', rooms: { room_number: '201' } }
]

export function ReadingForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [formData, setFormData] = useState({
    tenant_id: "",
    reading_date: new Date().toISOString().split("T")[0],
    reading_date_nepali: getDefaultNepaliDate(), // Nepali date field
    previous_reading: 0,
    current_reading: 0,
    rate_per_unit: 15, // Default unit rate set to 15 rupees as requested
  })

  const loadTenants = useCallback(async () => {
    try {
      if (isDemoMode()) {
        setTenants(mockTenants)
        return
      }

      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, rooms!inner(room_number)")
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
          rate_per_unit?: number;
        }>)
          .filter((r) => r.tenant_id === tenantId)
          .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())[0];
        
        if (lastReading) {
          setFormData(prev => ({
            ...prev,
            previous_reading: lastReading.current_reading || 0,
            rate_per_unit: lastReading.rate_per_unit || 15
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            previous_reading: 0,
            rate_per_unit: 15
          }));
        }
        return
      }

      const { data, error } = await supabase
        .from("readings")
        .select("current_reading, rate_per_unit")
        .eq("tenant_id", tenantId)
        .order("reading_date", { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error loading previous reading:', error)
        // Just set defaults on error
        setFormData(prev => ({
          ...prev,
          previous_reading: 0,
          rate_per_unit: 15
        }));
        return
      }

      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          previous_reading: data[0].current_reading || 0,
          rate_per_unit: data[0].rate_per_unit || 15
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          previous_reading: 0,
          rate_per_unit: 15
        }));
      }
    } catch (error) {
      console.error('Error:', error)
      setFormData(prev => ({
        ...prev,
        previous_reading: 0,
        rate_per_unit: 15
      }));
    }
  }, [])

  useEffect(() => {
    if (formData.tenant_id) {
      loadPreviousReading(formData.tenant_id)
    }
  }, [formData.tenant_id, loadPreviousReading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    console.log('=== FORM SUBMISSION START ===')
    console.log('Form data:', formData)
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

      const unitsConsumed = formData.current_reading - formData.previous_reading
      console.log('✅ Validation passed. Units consumed:', unitsConsumed)

      if (isDemoMode()) {
        console.log('💾 Saving in demo mode...')
        
        const readingData = {
          id: Date.now().toString(),
          tenant_id: formData.tenant_id,
          reading_date: formData.reading_date,
          previous_reading: formData.previous_reading,
          current_reading: formData.current_reading,
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

      const { error } = await supabase.from('readings').insert({
        tenant_id: formData.tenant_id,
        tenant_name: selectedTenant.name,
        room_number: selectedTenant.rooms.room_number,
        reading_date: formData.reading_date,
        reading_date_nepali: formData.reading_date_nepali,
        previous_reading: formData.previous_reading,
        current_reading: formData.current_reading,
        rate_per_unit: formData.rate_per_unit
      })

      if (error) {
        console.error('Error saving reading:', error)
        toast({
          title: "त्रुटि",
          description: "रिडिङ सेभ गर्न सकिएन",
          variant: "destructive",
        })
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

  const unitsConsumed = formData.current_reading - formData.previous_reading
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
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} - कोठा {tenant.rooms.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reading_date">मिति (अंग्रेजी) *</Label>
            <Input
              id="reading_date"
              type="date"
              value={formData.reading_date}
              onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.reading_date && formatBilingualDate(new Date(formData.reading_date))}
            </p>
          </div>

          <div>
            <Label htmlFor="reading_date_nepali">मिति (नेपाली)</Label>
            <Input
              id="reading_date_nepali"
              value={formData.reading_date_nepali}
              onChange={(e) => setFormData({ ...formData, reading_date_nepali: e.target.value })}
              placeholder="YYYY-MM-DD (जस्तै: 2081-06-15)"
            />
            <p className="text-sm text-muted-foreground mt-1">
              नेपाली मिति: YYYY-MM-DD ढाँचामा लेख्नुहोस् (वैकल्पिक)
            </p>
          </div>

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
              readOnly
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
              min={formData.previous_reading}
            />
          </div>

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