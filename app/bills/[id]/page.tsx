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

interface Reading {
  id: string
  previous_reading: number
  current_reading: number
  units_consumed: number
  rate_per_unit: number
  electricity_cost: number
}

const NEPALI_MONTHS = [
  { value: '01', label: 'बैशाख' },
  { value: '02', label: 'जेठ' },
  { value: '03', label: 'असार' },
  { value: '04', label: 'साउन' },
  { value: '05', label: 'भदौ' },
  { value: '06', label: 'असोज' },
  { value: '07', label: 'कात्तिक' },
  { value: '08', label: 'मंसिर' },
  { value: '09', label: 'पुष' },
  { value: '10', label: 'माघ' },
  { value: '11', label: 'फागुन' },
  { value: '12', label: 'चैत' }
]

const getMonthNameFromDate = (nepaliDate: string) => {
  if (nepaliDate && nepaliDate.includes('-')) {
    const month = nepaliDate.split('-')[1]
    const monthObj = NEPALI_MONTHS.find(m => m.value === month)
    return monthObj ? monthObj.label : 'अज्ञात महिना'
  }
  return 'अज्ञात महिना'
}

function ElectricityBreakdown({ billId, electricityAmount }: { billId: string, electricityAmount: number }) {
  const [reading, setReading] = useState<Reading | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReading = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        // Get the most recent reading 
        const { data, error } = await supabase
          .from('readings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!error && data) {
          setReading(data)
        }
      } catch (err) {
        console.error('Error fetching reading:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReading()
  }, [billId])

  if (loading) {
    return <div className="text-sm text-gray-500">लोड हुँदैछ...</div>
  }

  if (!reading) {
    return (
      <div className="text-sm space-y-1">
        <div>बिजुलीको बिल: रु. {electricityAmount}</div>
        <div className="text-gray-500">(रिडिङ जानकारी उपलब्ध छैन)</div>
      </div>
    )
  }

  return (
    <div className="text-sm space-y-1">
      <div className="grid grid-cols-2 gap-2">
        <span>हालको रिडिङ:</span>
        <span className="font-medium">{reading.current_reading}</span>
        <span>पहिलेको रिडिङ:</span>
        <span className="font-medium">{reading.previous_reading}</span>
        <span>खपत भएको युनिट:</span>
        <span className="font-medium">{reading.units_consumed} युनिट</span>
        <span>प्रति युनिट दर:</span>
        <span className="font-medium">रु. {reading.rate_per_unit}</span>
      </div>
      <div className="border-t pt-1 mt-2">
        <div className="flex justify-between font-medium">
          <span>कुल रकम:</span>
          <span>रु. {electricityAmount}</span>
        </div>
      </div>
    </div>
  )
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
              <div>
                <CardTitle className="text-2xl text-blue-800">
                  {getMonthNameFromDate(bill.bill_date_nepali)} महिनाको बिल
                </CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  बिल नं: {bill.id.slice(-8)} | मिति: {bill.bill_date_nepali}
                </p>
              </div>
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
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>कोठाको भाडा:</span>
                    <span className="font-medium">रु. {bill.rent_amount}</span>
                  </div>
                  
                  {/* Detailed Electricity Breakdown */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-800 mb-2">बिजुलीको बिल विवरण:</div>
                    <ElectricityBreakdown billId={bill.id} electricityAmount={bill.electricity_amount} />
                  </div>
                  
                  <div className="flex justify-between">
                    <span>अघिल्लो बाँकी:</span>
                    <span className="font-medium">रु. {bill.previous_balance}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>कुल रकम:</span>
                      <span className="text-blue-600">रु. {bill.total_amount}</span>
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