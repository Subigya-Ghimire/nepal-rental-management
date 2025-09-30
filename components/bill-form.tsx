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
  room: { id: string; room_number: string }
}

interface MockReading {
  id: string
  reading_date: string
  units_consumed: number // Changed from unit_consumed to match database
  tenant_id: string
  tenant_name?: string
  room_number?: string
  rate_per_unit?: number
}

const mockTenants: MockTenant[] = [
  { id: '1', name: 'राम बहादुर', room: { id: '1', room_number: '101' } },
  { id: '2', name: 'सीता कुमारी', room: { id: '2', room_number: '102' } },
  { id: '3', name: 'हरि प्रसाद', room: { id: '3', room_number: '201' } }
]

const mockReadings: MockReading[] = [
  { id: '1', reading_date: '2024-01-15', units_consumed: 150, tenant_id: '1', tenant_name: 'राम बहादुर', room_number: '101', rate_per_unit: 15 },
  { id: '2', reading_date: '2024-01-16', units_consumed: 120, tenant_id: '2', tenant_name: 'सीता कुमारी', room_number: '102', rate_per_unit: 15 },
  { id: '3', reading_date: '2024-01-17', units_consumed: 180, tenant_id: '3', tenant_name: 'हरि प्रसाद', room_number: '201', rate_per_unit: 15 }
]

export default function BillForm() {
  const [tenants, setTenants] = useState<MockTenant[]>([])
  const [readings, setReadings] = useState<MockReading[]>([])
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedReading, setSelectedReading] = useState('')
  const [billData, setBillData] = useState({
    bill_date: new Date().toISOString().split('T')[0],
    // Core charges
    monthly_rent: '8000',
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
          room:rooms!inner(id, room_number)
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
          const typedItem = item as { id: string; name: string; room: { id: string; room_number: string } | { id: string; room_number: string }[] }
          return {
            id: typedItem.id,
            name: typedItem.name,
            room: Array.isArray(typedItem.room) ? typedItem.room[0] : typedItem.room
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
        .select('id, reading_date, units_consumed, rate_per_unit, tenant_id, tenant_name, room_number')
        .eq('tenant_id', tenantId)
        .order('reading_date', { ascending: false })

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

      setReadings(data || [])
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
    }
  }, [selectedTenant, loadReadings])

  const calculateBill = () => {
    if (!selectedReading) return 0

    const reading = readings.find(r => r.id === selectedReading)
    if (!reading) return 0

    const monthlyRent = parseFloat(billData.monthly_rent)
    // Use the rate from the reading (set when reading was added)
    const electricityAmount = reading.units_consumed * (reading.rate_per_unit || 15)
    const previousBalance = parseFloat(billData.previous_balance)

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
        bill_date: billData.bill_date,
        bill_date_nepali: formatBilingualDate(new Date(billData.bill_date)).split(' / ')[1],
        rent_amount: parseFloat(billData.monthly_rent),
        electricity_amount: reading.units_consumed * (reading.rate_per_unit || 15),
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
        setBillData({
          bill_date: new Date().toISOString().split('T')[0],
          monthly_rent: '8000',
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
        toast({
          title: "त्रुटि",
          description: "बिल सिर्जना गर्न सकिएन",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "सफल",
        description: `बिल सिर्जना गरियो। कुल रकम: रू ${totalAmount}`,
      })

      // Reset form
      setSelectedTenant('')
      setSelectedReading('')
      setReadings([])
      setBillData({
        bill_date: new Date().toISOString().split('T')[0],
        monthly_rent: '8000',
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
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
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
                <SelectContent>
                  {readings.map((reading) => (
                    <SelectItem key={reading.id} value={reading.id}>
                      {reading.reading_date} - {reading.units_consumed} युनिट
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bill_date">बिल मिति *</Label>
              <Input
                id="bill_date"
                type="date"
                value={billData.bill_date}
                onChange={(e) => setBillData({...billData, bill_date: e.target.value})}
                required
              />
              <p className="text-sm text-muted-foreground">
                नेपाली मिति: {billData.bill_date && formatBilingualDate(new Date(billData.bill_date)).split(' / ')[1]}
              </p>
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
                  <span>मासिक भाडा:</span>
                  <span>रू {billData.monthly_rent}</span>
                </div>
                <div className="flex justify-between">
                  <span>बिजुली ({readings.find(r => r.id === selectedReading)?.units_consumed || 0} युनिट @ रू{readings.find(r => r.id === selectedReading)?.rate_per_unit || 15}):</span>
                  <span>रू {(readings.find(r => r.id === selectedReading)?.units_consumed || 0) * (readings.find(r => r.id === selectedReading)?.rate_per_unit || 15)}</span>
                </div>
                <div className="flex justify-between">
                  <span>पहिलेको बाँकी/अग्रिम:</span>
                  <span>{parseFloat(billData.previous_balance) >= 0 ? '+' : ''}रू {billData.previous_balance}</span>
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