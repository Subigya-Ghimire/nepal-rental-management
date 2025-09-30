import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Plus } from 'lucide-react'

export default async function BillsPage() {
  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .order("bill_date", { ascending: false })

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

        <div className="space-y-3">
          {bills?.map((bill) => (
            <Link key={bill.id} href={`/bills/${bill.id}`}>
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{bill.tenant_name}</h3>
                      <p className="text-sm text-gray-600">
                        कोठा: {bill.room_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        मिति: {bill.bill_date_nepali || 'नेपाली मिति उपलब्ध छैन'}
                      </p>
                    </div>
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
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!bills?.length && (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">कुनै बिल छैन</p>
              <Button asChild>
                <Link href="/new-bill">पहिलो बिल बनाउनुहोस्</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}