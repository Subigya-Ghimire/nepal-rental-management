'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { isDemoMode, getDemoData } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Mock data for demo mode
interface MockReading {
  id: string
  reading_date_nepali: string // Only Nepali date
  previous_reading: number
  current_reading: number
  units_consumed: number
  rate_per_unit: number
  tenants?: { name: string; rooms: { room_number: string } }
  tenant_name?: string
  room_number?: string
}

const mockReadings: MockReading[] = [
  {
    id: '1',
    reading_date_nepali: '2081-01-15',
    previous_reading: 1200,
    current_reading: 1350,
    units_consumed: 150,
    rate_per_unit: 15,
    tenants: { name: 'राम बहादुर', rooms: { room_number: '101' } }
  },
  {
    id: '2',
    reading_date_nepali: '2081-01-16',
    previous_reading: 850,
    current_reading: 970,
    units_consumed: 120,
    rate_per_unit: 15,
    tenants: { name: 'सीता कुमारी', rooms: { room_number: '102' } }
  },
  {
    id: '3',
    reading_date_nepali: '2081-01-17',
    previous_reading: 1500,
    current_reading: 1680,
    units_consumed: 180,
    rate_per_unit: 15,
    tenants: { name: 'हरि प्रसाद', rooms: { room_number: '201' } }
  }
]

export default function ReadingsPage() {
  const [readings, setReadings] = useState<MockReading[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadReadings()
  }, [])

  const loadReadings = async () => {
    try {
      if (isDemoMode()) {
        // Load from localStorage first, then fall back to mock data
        const storedReadings = getDemoData('readings') as MockReading[]
        console.log('📖 Loaded readings from localStorage:', storedReadings.length)
        
        if (storedReadings.length > 0) {
          setReadings([...storedReadings, ...mockReadings])
        } else {
          setReadings(mockReadings)
        }
        setLoading(false)
        return
      }

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("readings")
        .select("*")
        .order("reading_date_nepali", { ascending: false })

      if (error) {
        console.error('Error loading readings:', error)
        toast({
          title: "त्रुटि",
          description: "रिडिङहरू लोड गर्न सकिएन",
          variant: "destructive",
        })
        // Fallback to demo mode
        const storedReadings = getDemoData('readings') as MockReading[]
        if (storedReadings.length > 0) {
          setReadings([...storedReadings, ...mockReadings])
        } else {
          setReadings(mockReadings)
        }
      } else {
        setReadings(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      const storedReadings = getDemoData('readings') as MockReading[]
      if (storedReadings.length > 0) {
        setReadings([...storedReadings, ...mockReadings])
      } else {
        setReadings(mockReadings)
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteReading = async (readingId: string, readingDetails: string) => {
    if (!confirm(`के तपाईं यो रिडिङ मेटाउन चाहनुहुन्छ?\n${readingDetails}`)) {
      return
    }

    if (isDemoMode()) {
      // Handle demo mode deletion
      const updatedReadings = readings.filter(reading => reading.id !== readingId)
      setReadings(updatedReadings)
      toast({
        title: "सफल",
        description: "रिडिङ सफलतापूर्वक मेटाइयो (डेमो मोड)",
      })
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('readings')
        .delete()
        .eq('id', readingId)

      if (error) {
        console.error('Error deleting reading:', error)
        toast({
          title: "त्रुटि",
          description: "रिडिङ मेटाउन सकिएन",
          variant: "destructive",
        })
      } else {
        toast({
          title: "सफल",
          description: "रिडिङ सफलतापूर्वक मेटाइयो",
        })
        // Reload readings
        loadReadings()
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "त्रुटि",
        description: "रिडिङ मेटाउन सकिएन",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <Navigation />
          <div className="text-center py-20">
            <p>लोड हुँदैछ...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20 md:pb-0">
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <Navigation />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">बिजुली रिडिङ</h1>
            <p className="text-gray-600 text-sm mt-1">सबै मिटर रिडिङहरूको सूची</p>
          </div>
          <Button asChild>
            <Link href="/new-reading">
              <Plus className="h-4 w-4 mr-2" />
              नयाँ रिडिङ थप्नुहोस्
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          {readings?.map((reading) => {
            const tenantName = reading.tenant_name || reading.tenants?.name || 'अज्ञात भाडावाल'
            const roomNumber = reading.room_number || reading.tenants?.rooms?.room_number || 'N/A'
            
            return (
              <Card key={reading.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{tenantName}</h3>
                      <p className="text-sm text-gray-600">
                        कोठा: {roomNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        मिति: {reading.reading_date_nepali}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {reading.units_consumed} युनिट
                        </p>
                        <p className="text-sm text-gray-600">
                          {reading.previous_reading} → {reading.current_reading}
                        </p>
                        <p className="text-xs text-gray-500">
                          @ रु. {reading.rate_per_unit}/युनिट
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          deleteReading(reading.id, `${tenantName} - कोठा ${roomNumber}`)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!readings?.length && (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">कुनै रिडिङ छैन</p>
              <Button asChild>
                <Link href="/new-reading">पहिलो रिडिङ थप्नुहोस्</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}