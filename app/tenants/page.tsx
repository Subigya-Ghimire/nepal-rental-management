'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Plus, Phone, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isDemoMode, getDemoData } from '@/lib/utils'

// Mock data for demo mode
interface MockTenant {
  id: string
  name: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
  move_in_date: string
  rooms: { room_number: string; floor_number: string }
}

const mockTenants: MockTenant[] = [
  {
    id: '1',
    name: 'राम बहादुर',
    phone: '9841234567',
    email: 'ram@example.com',
    is_active: true,
    created_at: '2024-01-15',
    move_in_date: '2024-01-15',
    rooms: { room_number: '101', floor_number: '1' }
  },
  {
    id: '2',
    name: 'सीता कुमारी',
    phone: '9851234567',
    email: 'sita@example.com',
    is_active: true,
    created_at: '2024-01-16',
    move_in_date: '2024-01-16',
    rooms: { room_number: '102', floor_number: '1' }
  },
  {
    id: '3',
    name: 'हरि प्रसाद',
    phone: '9861234567',
    email: 'hari@example.com',
    is_active: true,
    created_at: '2024-01-17',
    move_in_date: '2024-01-17',
    rooms: { room_number: '201', floor_number: '2' }
  }
]

export default function TenantsPage() {
  const [tenants, setTenants] = useState<MockTenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      if (isDemoMode()) {
        // Load from localStorage first, then fall back to mock data
        const storedTenants = getDemoData('tenants') as MockTenant[]
        console.log('📖 Loaded tenants from localStorage:', storedTenants.length)
        
        if (storedTenants.length > 0) {
          setTenants([...storedTenants, ...mockTenants])
        } else {
          setTenants(mockTenants)
        }
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("tenants")
        .select("*, rooms(*)")
        .order("created_at", { ascending: false })

      if (error) {
        console.error('Error loading tenants:', error)
        // Fallback to demo mode
        const storedTenants = getDemoData('tenants') as MockTenant[]
        if (storedTenants.length > 0) {
          setTenants([...storedTenants, ...mockTenants])
        } else {
          setTenants(mockTenants)
        }
      } else {
        setTenants(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      const storedTenants = getDemoData('tenants') as MockTenant[]
      if (storedTenants.length > 0) {
        setTenants([...storedTenants, ...mockTenants])
      } else {
        setTenants(mockTenants)
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">भाडामा बस्नेहरू</h1>
            <p className="text-gray-600 text-sm mt-1">सबै भाडामा बस्ने व्यक्तिहरूको सूची</p>
          </div>
          <Button asChild>
            <Link href="/new-tenant">
              <Plus className="h-4 w-4 mr-2" />
              नयाँ थप्नुहोस्
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">लोड हुँदैछ...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants?.map((tenant) => (
            <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{tenant.name}</span>
                    {tenant.is_active && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">सक्रिय</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="h-4 w-4" />
                    <span>
                      कोठा: {tenant.rooms?.room_number || "N/A"} (तल्ला: {tenant.rooms?.floor_number || "N/A"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{tenant.phone}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    भित्रिएको मिति: {new Date(tenant.move_in_date).toLocaleDateString("ne-NP")}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          </div>
        )}

        {!loading && !tenants?.length && (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">कुनै भाडामा बस्ने छैन</p>
              <Button asChild>
                <Link href="/new-tenant">पहिलो भाडामा थप्नुहोस्</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}