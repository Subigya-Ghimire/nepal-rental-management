'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Plus, Phone, Home, Edit2, Trash2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { isDemoMode, getDemoData } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()

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

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("tenants")
        .select("*, rooms(*)")
        .order("created_at", { ascending: false })

      if (error) {
        console.error('Error loading tenants:', error)
        toast({
          title: "त्रुटि",
          description: "भाडावालहरू लोड गर्न सकिएन",
          variant: "destructive",
        })
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

  const deleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`के तपाईं ${tenantName} लाई मेटाउन चाहनुहुन्छ?\nयसले सबै सम्बन्धित रिडिङ र बिलहरू पनि मेट्नेछ।`)) {
      return
    }

    if (isDemoMode()) {
      // Handle demo mode deletion
      const updatedTenants = tenants.filter(tenant => tenant.id !== tenantId)
      setTenants(updatedTenants)
      toast({
        title: "सफल",
        description: "भाडावाल सफलतापूर्वक मेटाइयो (डेमो मोड)",
      })
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId)

      if (error) {
        console.error('Error deleting tenant:', error)
        toast({
          title: "त्रुटि",
          description: "भाडावाल मेटाउन सकिएन",
          variant: "destructive",
        })
      } else {
        toast({
          title: "सफल",
          description: "भाडावाल सफलतापूर्वक मेटाइयो",
        })
        // Reload tenants
        loadTenants()
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "त्रुटि",
        description: "भाडावाल मेटाउन सकिएन",
        variant: "destructive",
      })
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
              <Card key={tenant.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{tenant.name}</span>
                    {tenant.is_active && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">सक्रिय</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="h-4 w-4" />
                    <span>
                      कोठा: {tenant.rooms?.room_number || "N/A"} (तल्ला: {tenant.rooms?.floor_number || "N/A"})
                    </span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                  {tenant.move_in_date && (
                    <div className="text-sm text-gray-500">
                      भित्रिएको मिति: {new Date(tenant.move_in_date).toLocaleDateString("ne-NP")}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/tenants/edit/${tenant.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit2 className="h-4 w-4 mr-1" />
                        सम्पादन
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        deleteTenant(tenant.id, tenant.name)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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