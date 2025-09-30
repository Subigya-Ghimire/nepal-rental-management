'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Bill {
  id: string
  tenant_name: string
  room_number: string
  bill_date_nepali: string
  total_amount: number
  is_paid: boolean
  created_at: string
}

const NEPALI_MONTHS = [
  { value: 'all', label: 'सबै महिना' },
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

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchBills()
  }, [])

  useEffect(() => {
    filterBillsByMonth()
  }, [bills, selectedMonth])

  const fetchBills = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bills:', error)
        toast({
          title: "त्रुटि",
          description: "बिलहरू लोड गर्न सकिएन",
          variant: "destructive",
        })
      } else {
        setBills(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "त्रुटि",
        description: "बिलहरू लोड गर्न सकिएन",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterBillsByMonth = () => {
    if (selectedMonth === 'all') {
      setFilteredBills(bills)
    } else {
      const filtered = bills.filter(bill => {
        // Extract month from Nepali date (format: YYYY-MM-DD)
        const nepaliDate = bill.bill_date_nepali
        if (nepaliDate && nepaliDate.includes('-')) {
          const month = nepaliDate.split('-')[1]
          return month === selectedMonth
        }
        return false
      })
      setFilteredBills(filtered)
    }
  }

  const deleteBill = async (billId: string, billDetails: string) => {
    if (!confirm(`के तपाईं यो बिल मेटाउन चाहनुहुन्छ?\n${billDetails}`)) {
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId)

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
        // Remove from local state
        setBills(bills.filter(bill => bill.id !== billId))
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

  const getMonthName = (monthNumber: string) => {
    const month = NEPALI_MONTHS.find(m => m.value === monthNumber)
    return month ? month.label : 'अज्ञात महिना'
  }

  const groupBillsByMonth = (bills: Bill[]) => {
    const grouped: { [key: string]: Bill[] } = {}
    
    bills.forEach(bill => {
      const nepaliDate = bill.bill_date_nepali
      if (nepaliDate && nepaliDate.includes('-')) {
        const month = nepaliDate.split('-')[1]
        const monthKey = getMonthName(month)
        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(bill)
      } else {
        if (!grouped['अन्य']) {
          grouped['अन्य'] = []
        }
        grouped['अन्य'].push(bill)
      }
    })

    return grouped
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

  const groupedBills = selectedMonth === 'all' ? groupBillsByMonth(filteredBills) : {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20 md:pb-0">
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <Navigation />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">बिलहरू</h1>
            <p className="text-gray-600 text-sm mt-1">सबै भाडा बिलहरूको सूची</p>
          </div>
          <Button asChild>
            <Link href="/new-bill">
              <Plus className="h-4 w-4 mr-2" />
              नयाँ बिल
            </Link>
          </Button>
        </div>

        {/* Month Filter */}
        <div className="mb-6">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="महिना छन्नुहोस्" />
            </SelectTrigger>
            <SelectContent>
              {NEPALI_MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bills Display */}
        {selectedMonth === 'all' ? (
          // Group by month when showing all
          <div className="space-y-8">
            {Object.entries(groupedBills).map(([monthName, monthBills]) => (
              <div key={monthName}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                  {monthName} महिनाको बिल ({monthBills.length})
                </h2>
                <div className="space-y-3">
                  {monthBills.map((bill) => (
                    <Card key={bill.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <Link href={`/bills/${bill.id}`} className="flex-1 cursor-pointer">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{bill.tenant_name}</h3>
                              <p className="text-sm text-gray-600">
                                कोठा: {bill.room_number}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                मिति: {bill.bill_date_nepali || 'नेपाली मिति उपलब्ध छैन'}
                              </p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xl font-bold text-blue-600">रु. {bill.total_amount}</p>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  bill.is_paid
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {bill.is_paid ? "भुक्तानी भयो" : "बाँकी"}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                deleteBill(bill.id, `${bill.tenant_name} - कोठा ${bill.room_number}`)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show filtered bills for specific month
          <div className="space-y-3">
            {filteredBills.length > 0 && (
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {getMonthName(selectedMonth)} महिनाको बिल ({filteredBills.length})
              </h2>
            )}
            {filteredBills.map((bill) => (
              <Card key={bill.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link href={`/bills/${bill.id}`} className="flex-1 cursor-pointer">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{bill.tenant_name}</h3>
                        <p className="text-sm text-gray-600">
                          कोठा: {bill.room_number}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          मिति: {bill.bill_date_nepali || 'नेपाली मिति उपलब्ध छैन'}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">रु. {bill.total_amount}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            bill.is_paid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {bill.is_paid ? "भुक्तानी भयो" : "बाँकी"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          deleteBill(bill.id, `${bill.tenant_name} - कोठा ${bill.room_number}`)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredBills.length === 0 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">
                {selectedMonth === 'all' 
                  ? 'कुनै बिल छैन' 
                  : `${getMonthName(selectedMonth)} महिनामा कुनै बिल छैन`
                }
              </p>
              <Button asChild>
                <Link href="/new-bill">
                  {bills.length === 0 ? 'पहिलो बिल बनाउनुहोस्' : 'नयाँ बिल बनाउनुहोस्'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}