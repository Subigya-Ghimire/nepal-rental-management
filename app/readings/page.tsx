'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isDemoMode, getDemoData } from '@/lib/utils'

// Mock data for demo mode
interface MockReading {
  id: string
  reading_date: string
  previous_reading: number
  current_reading: number
  units_consumed: number
  rate_per_unit: number
  tenants: { name: string; rooms: { room_number: string } }
}

const mockReadings: MockReading[] = [
  {
    id: '1',
    reading_date: '2024-01-15',
    previous_reading: 1200,
    current_reading: 1350,
    units_consumed: 150,
    rate_per_unit: 15,
    tenants: { name: 'राम बहादुर', rooms: { room_number: '101' } }
  },
  {
    id: '2',
    reading_date: '2024-01-16',
    previous_reading: 850,
    current_reading: 970,
    units_consumed: 120,
    rate_per_unit: 15,
    tenants: { name: 'सीता कुमारी', rooms: { room_number: '102' } }
  },
  {
    id: '3',
    reading_date: '2024-01-17',
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

      const { data, error } = await supabase
        .from("meter_readings")
        .select("*, tenants(name, rooms(room_number))")
        .order("reading_date", { ascending: false })

      if (error) {
        console.error('Error loading readings:', error)
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
              नयाँ रिडिङ
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">लोड हुँदैछ...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {readings?.map((reading) => (
            <Card key={reading.id} className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{reading.tenants?.name}</h3>
                    <p className="text-sm text-gray-600">
                      कोठा: {reading.tenants?.rooms?.room_number}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      मिति: {new Date(reading.reading_date).toLocaleDateString("ne-NP")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{reading.units_consumed} युनिट</p>
                    <p className="text-sm text-gray-600">
                      {reading.previous_reading} → {reading.current_reading}
                    </p>
                    <p className="text-sm font-medium text-blue-600">
                      रु. {reading.units_consumed * reading.rate_per_unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {!loading && !readings?.length && (
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