'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Bill {
  id: string
  tenant_name: string
  room_number: string
  bill_date_nepali: string
  rent_amount: number
  electricity_amount: number
  previous_balance: number
  total_amount: number
  is_paid: boolean
  notes?: string
  created_at: string
}

export default function BillDetailPage() {
  const params = useParams()
  const router = useRouter()
  const billId = params.id as string
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('id', billId)
          .single()

        if (error) {
          console.error('Error fetching bill:', error)
          setError('बिल फेला परेन')
        } else {
          setBill(data)
        }
      } catch (err) {
        console.error('Error:', err)
        setError('बिल लोड गर्न सकिएन')
      } finally {
        setLoading(false)
      }
    }

    if (billId) {
      fetchBill()
    }
  }, [billId])

  const markAsPaid = async () => {
    if (!bill) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('bills')
        .update({ is_paid: true })
        .eq('id', bill.id)

      if (error) {
        console.error('Error updating bill:', error)
        toast({
          title: "त्रुटि",
          description: "भुक्तानी अपडेट गर्न सकिएन",
          variant: "destructive",
        })
      } else {
        setBill({ ...bill, is_paid: true })
        toast({
          title: "सफल",
          description: "बिल भुक्तानी भयो भनेर चिन्ह लगाइयो",
        })
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "त्रुटि",
        description: "भुक्तानी अपडेट गर्न सकिएन",
        variant: "destructive",
      })
    }
  }

  const deleteBill = async () => {
    if (!bill) return

    if (!confirm(`के तपाईं यो बिल मेटाउन चाहनुहुन्छ?\n${bill.tenant_name} - कोठा ${bill.room_number}`)) {
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', bill.id)

      if (error) {
        console.error('Error deleting bill:', error)
        toast({
          title: "त्रुटि",
          description: "बिल मेटाउन सकिएन",
          variant: "destructive",
        })
      } else {
        toast({
          title: "सफल",
          description: "बिल सफलतापूर्वक मेटाइयो",
        })
        router.push('/bills')
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "त्रुटि",
        description: "बिल मेटाउन सकिएन",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <p>लोड हुँदैछ...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <p className="text-red-600">{error || 'बिल फेला परेन'}</p>
            <Link href="/bills">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                फिर्ता जानुहोस्
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/bills">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              बिलहरूमा फिर्ता
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">बिल विवरण</h1>
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-blue-800">
                बिल नं: {bill.id.slice(-8)}
              </CardTitle>
              <Badge 
                className={bill.is_paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
              >
                {bill.is_paid ? "भुक्तानी भयो" : "बाँकी"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tenant Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  भाडावाल जानकारी
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">नाम:</span> {bill.tenant_name}</p>
                  <p><span className="font-medium">कोठा नं:</span> {bill.room_number}</p>
                  <p><span className="font-medium">बिल मिति:</span> {bill.bill_date_nepali}</p>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  बिल विवरण
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>कोठाको भाडा:</span>
                    <span>रु. {bill.rent_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>बिजुलीको बिल:</span>
                    <span>रु. {bill.electricity_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>अघिल्लो बाँकी:</span>
                    <span>रु. {bill.previous_balance}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>कुल रकम:</span>
                      <span>रु. {bill.total_amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {bill.notes && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                  टिप्पणी
                </h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{bill.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3 flex-wrap">
              {!bill.is_paid && (
                <Button onClick={markAsPaid} className="bg-green-600 hover:bg-green-700">
                  भुक्तानी भयो भनेर चिन्ह लगाउनुहोस्
                </Button>
              )}
              <Button variant="outline" onClick={() => window.print()}>
                छाप्नुहोस्
              </Button>
              <Button 
                variant="outline" 
                onClick={deleteBill}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                बिल मेटाउनुहोस्
              </Button>
            </div>

            {/* Creation Date */}
            <div className="mt-6 pt-4 border-t text-sm text-gray-500">
              सिर्जना भएको मिति: {new Date(bill.created_at).toLocaleDateString('ne-NP')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}