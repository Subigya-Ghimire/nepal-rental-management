'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { isDemoMode } from '@/lib/utils'
import { formatBilingualDate, getDefaultNepaliDate } from '@/lib/nepali-date'

// Mock data for demo mode
interface MockTenant {
  id: string
  name: string
  room: { 
    id: string; 
    room_number: string;
    monthly_rent?: number;
    room_type?: string;
  }
}

interface MockReading {
  id: string
  reading_date_nepali: string
  tenant_id: string
  tenant_name?: string
  room_number?: string
  rate_per_unit?: number
  meter_type?: string
  // Single room fields
  previous_reading?: number
  current_reading?: number
  // Double room fields  
  room_meter_previous?: number
  room_meter_current?: number
  kitchen_meter_previous?: number
  kitchen_meter_current?: number
  // Calculated field
  units_consumed?: number
}

const mockTenants: MockTenant[] = [
  { id: '1', name: 'राम बहादुर', room: { id: '1', room_number: '101' } },
  { id: '2', name: 'सीता कुमारी', room: { id: '2', room_number: '102' } },
  { id: '3', name: 'हरि प्रसाद', room: { id: '3', room_number: '201' } }
]

const mockReadings: MockReading[] = [
  { id: '1', reading_date_nepali: '2081-01-15', units_consumed: 150, tenant_id: '1', tenant_name: 'राम बहादुर', room_number: '101', rate_per_unit: 15 },
  { id: '2', reading_date_nepali: '2081-01-16', units_consumed: 120, tenant_id: '2', tenant_name: 'सीता कुमारी', room_number: '102', rate_per_unit: 15 },
  { id: '3', reading_date_nepali: '2081-01-17', units_consumed: 180, tenant_id: '3', tenant_name: 'हरि प्रसाद', room_number: '201', rate_per_unit: 15 }
]

export default function BillForm() {
  const [tenants, setTenants] = useState<MockTenant[]>([])
  const [readings, setReadings] = useState<MockReading[]>([])
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedReading, setSelectedReading] = useState('')
  const [selectedRoomType, setSelectedRoomType] = useState<'single' | 'double'>('single')
  const [billData, setBillData] = useState({
    bill_date_nepali: getDefaultNepaliDate(), // Only Nepali date
    // Core charges
    monthly_rent: '',
    // Previous month adjustments
    previous_balance: '0', // Remaining rent from last month (+) or advance payment (-)
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadTenants = useCallback(async () => {
    try {
      if (isDemoMode()) {
        setTenants(mockTenants)
        return
      }

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          room:rooms!inner(id, room_number, monthly_rent, room_type)
        `)
        .eq('is_active', true)

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
        const transformedData: MockTenant[] = data.map((item: unknown) => {
          const typedItem = item as { 
            id: string; 
            name: string; 
            room: { 
              id: string; 
              room_number: string; 
              monthly_rent: number;
              room_type?: string;
            } | { 
              id: string; 
              room_number: string; 
              monthly_rent: number;
              room_type?: string;
            }[] 
          }
          const roomData = Array.isArray(typedItem.room) ? typedItem.room[0] : typedItem.room
          return {
            id: typedItem.id,
            name: typedItem.name,
            room: {
              id: roomData.id,
              room_number: roomData.room_number,
              monthly_rent: roomData.monthly_rent,
              room_type: roomData.room_type || 'single'
            }
          }
        })
        setTenants(transformedData)
      }
    } catch (error) {
      console.error('Error:', error)
      setTenants(mockTenants)
    }
  }, [toast])

  const loadReadings = useCallback(async (tenantId: string) => {
    try {
      if (isDemoMode()) {
        const tenantReadings = mockReadings.filter(r => r.tenant_id === tenantId)
        setReadings(tenantReadings)
        return
      }

      const { data, error } = await supabase
        .from('readings')
        .select(`
          id, 
          reading_date_nepali, 
          rate_per_unit, 
          tenant_id, 
          tenant_name, 
          room_number,
          meter_type,
          previous_reading,
          current_reading,
          room_meter_previous,
          room_meter_current,
          kitchen_meter_previous,
          kitchen_meter_current
        `)
        .eq('tenant_id', tenantId)
        .order('reading_date_nepali', { ascending: false })

      if (error) {
        console.error('Error loading readings:', error)
        toast({
          title: "त्रुटि",
          description: "रीडिङहरू लोड गर्न सकिएन",
          variant: "destructive",
        })
        // Fallback to demo mode
        const tenantReadings = mockReadings.filter(r => r.tenant_id === tenantId)
        setReadings(tenantReadings)
        return
      }

      // Calculate units for each reading based on meter type
      const readingsWithUnits = (data || []).map(reading => {
        let units_consumed = 0
        
        if (reading.meter_type === 'double') {
          // For double rooms: room meter + kitchen meter
          const roomUnits = (reading.room_meter_current || 0) - (reading.room_meter_previous || 0)
          const kitchenUnits = (reading.kitchen_meter_current || 0) - (reading.kitchen_meter_previous || 0)
          units_consumed = roomUnits + kitchenUnits
        } else {
          // For single rooms: current - previous
          units_consumed = (reading.current_reading || 0) - (reading.previous_reading || 0)
        }
        
        return {
          ...reading,
          units_consumed: Math.max(0, units_consumed) // Ensure no negative values
        }
      })

      setReadings(readingsWithUnits)
    } catch (error) {
      console.error('Error:', error)
      const tenantReadings = mockReadings.filter(r => r.tenant_id === tenantId)
      setReadings(tenantReadings)
    }
  }, [toast])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  useEffect(() => {
    if (selectedTenant) {
      loadReadings(selectedTenant)
      
      // Set room type and monthly rent from selected tenant's room
      const tenant = tenants.find(t => t.id === selectedTenant)
      if (tenant) {
        // Set room type
        setSelectedRoomType(tenant.room.room_type === 'double' ? 'double' : 'single')
        
        // Set monthly rent
        if (tenant.room.monthly_rent) {
          setBillData(prev => ({
            ...prev,
            monthly_rent: tenant.room.monthly_rent!.toString()
          }))
        }
      }
    } else {
      // Reset when no tenant selected
      setSelectedRoomType('single')
      setBillData(prev => ({
        ...prev,
        monthly_rent: ''
      }))
    }
  }, [selectedTenant, loadReadings, tenants])

  const calculateBill = () => {
    if (!selectedReading) return 0

    const reading = readings.find(r => r.id === selectedReading)
    if (!reading) return 0

    const monthlyRent = parseFloat(billData.monthly_rent) || 0
    // Use the rate from the reading (set when reading was added)
    const electricityAmount = (reading.units_consumed || 0) * (reading.rate_per_unit || 15)
    const previousBalance = parseFloat(billData.previous_balance) || 0

    return monthlyRent + electricityAmount + previousBalance
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!selectedTenant || !selectedReading) {
        toast({
          title: "त्रुटि",
          description: "कृपया भाडादार र रीडिङ छान्नुहोस्",
          variant: "destructive",
        })
        return
      }

      const tenant = tenants.find(t => t.id === selectedTenant)
      const reading = readings.find(r => r.id === selectedReading)
      
      if (!tenant || !reading) {
        toast({
          title: "त्रुटि",
          description: "भाडादार वा रीडिङ भेटिएन",
          variant: "destructive",
        })
        return
      }

      const totalAmount = calculateBill()

      const billRecord = {
        tenant_id: selectedTenant,
        tenant_name: tenant.name,
        room_number: tenant.room.room_number,
        bill_date_nepali: billData.bill_date_nepali,
        rent_amount: parseFloat(billData.monthly_rent),
        electricity_amount: (reading.units_consumed || 0) * (reading.rate_per_unit || 15),
        previous_balance: parseFloat(billData.previous_balance),
        notes: billData.notes || null,
        is_paid: false
      }

      if (isDemoMode()) {
        console.log('Demo mode: Bill would be created:', billRecord)
        toast({
          title: "सफल",
          description: `बिल सिर्जना गरियो। कुल रकम: रू ${totalAmount}`,
        })
        
        // Reset form
        setSelectedTenant('')
        setSelectedReading('')
        setReadings([])
        setSelectedRoomType('single')
        setBillData({
          bill_date_nepali: getDefaultNepaliDate(),
          monthly_rent: '',
          previous_balance: '0',
          notes: ''
        })
        return
      }

      const { error } = await supabase
        .from('bills')
        .insert([billRecord])

      if (error) {
        console.error('Error creating bill:', error)
        console.error('Bill record being inserted:', billRecord)
        toast({
          title: "त्रुटि",
          description: `बिल सिर्जना गर्न सकिएन: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log('Bill created successfully:', billRecord)

      toast({
        title: "सफल",
        description: `बिल सिर्जना गरियो। कुल रकम: रू ${totalAmount}`,
      })

      // Reset form
      setSelectedTenant('')
      setSelectedReading('')
      setReadings([])
      setSelectedRoomType('single')
      setBillData({
        bill_date_nepali: getDefaultNepaliDate(),
        monthly_rent: '',
        previous_balance: '0',
        notes: ''
      })

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "त्रुटि",
        description: "बिल सिर्जना गर्न सकिएन",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>नयाँ बिल सिर्जना गर्नुहोस्</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">भाडादार छान्नुहोस्</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="भाडादार छान्नुहोस्" />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-60 overflow-y-auto bg-white border-gray-200 shadow-xl">
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id} className="bg-white hover:bg-blue-50 focus:bg-blue-100">
                      {tenant.name} - कोठा {tenant.room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading">रीडिङ छान्नुहोस्</Label>
              <Select 
                value={selectedReading} 
                onValueChange={setSelectedReading}
                disabled={!selectedTenant}
              >
                <SelectTrigger>
                  <SelectValue placeholder="रीडिङ छान्नुहोस्" />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-60 overflow-y-auto bg-white border-gray-200 shadow-xl">
                  {readings.map((reading) => (
                    <SelectItem key={reading.id} value={reading.id} className="bg-white hover:bg-blue-50 focus:bg-blue-100">
                      {reading.reading_date_nepali} - {reading.units_consumed} युनिट
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bill_date_nepali">बिल मिति (नेपाली) *</Label>
              <Input
                id="bill_date_nepali"
                value={billData.bill_date_nepali}
                onChange={(e) => setBillData({...billData, bill_date_nepali: e.target.value})}
                placeholder="YYYY-MM-DD (जस्तै: 2082-06-14)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_rent">मासिक भाडा</Label>
              <Input
                id="monthly_rent"
                type="number"
                step="0.01"
                value={billData.monthly_rent}
                onChange={(e) => setBillData({...billData, monthly_rent: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previous_balance">पहिलेको बाँकी/अग्रिम (+/-)</Label>
              <Input
                id="previous_balance"
                type="number"
                step="0.01"
                value={billData.previous_balance}
                onChange={(e) => setBillData({...billData, previous_balance: e.target.value})}
                placeholder="बाँकी: + | अग्रिम: -"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">टिप्पणी</Label>
            <Input
              id="notes"
              value={billData.notes}
              onChange={(e) => setBillData({...billData, notes: e.target.value})}
              placeholder="कुनै टिप्पणी..."
            />
          </div>

          {selectedReading && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">बिल सारांश</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>कोठाको प्रकार:</span>
                  <span>{selectedRoomType === 'double' ? '🏠 डबल कोठा (दुई मिटर)' : '🏠 सिंगल कोठा (एक मिटर)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>मासिक भाडा:</span>
                  <span>रू {billData.monthly_rent || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>बिजुली ({readings.find(r => r.id === selectedReading)?.units_consumed || 0} युनिट @ रू{readings.find(r => r.id === selectedReading)?.rate_per_unit || 15}):</span>
                  <span>रू {(readings.find(r => r.id === selectedReading)?.units_consumed || 0) * (readings.find(r => r.id === selectedReading)?.rate_per_unit || 15)}</span>
                </div>
                <div className="flex justify-between">
                  <span>पहिलेको बाँकी/अग्रिम:</span>
                  <span>{parseFloat(billData.previous_balance || '0') >= 0 ? '+' : ''}रू {billData.previous_balance || '0'}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>कुल रकम:</span>
                  <span>रू {calculateBill()}</span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'प्रक्रिया भइरहेको छ...' : 'बिल सिर्जना गर्नुहोस्'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}