"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Plus, DollarSign, Calendar, CreditCard, Search } from "lucide-react";
import Link from "next/link";

interface Payment {
  id: string;
  tenant_id: string;
  bill_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  description: string | null;
  tenant: {
    name: string;
    room_number: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  room_number: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const { toast } = useToast();

  const [newPayment, setNewPayment] = useState({
    tenant_id: "",
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: "cash",
    description: "",
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          tenant:tenants(name, room_number)
        `)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch active tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, room_number')
        .eq('is_active', true)
        .order('room_number');

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "त्रुटि",
        description: "डेटा लोड गर्न सकिएन।",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterPayments = useCallback(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.tenant.room_number.includes(searchTerm) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (methodFilter !== "all") {
      filtered = filtered.filter(payment => payment.payment_method === methodFilter);
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, methodFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    filterPayments();
  }, [filterPayments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPayment.tenant_id) {
      toast({
        title: "त्रुटि",
        description: "भाडावाला छान्नुहोस्।",
        variant: "destructive",
      });
      return;
    }

    if (newPayment.amount <= 0) {
      toast({
        title: "त्रुटि",
        description: "रकम ० भन्दा बढी हुनुपर्छ।",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          tenant_id: newPayment.tenant_id,
          amount: newPayment.amount,
          payment_date: newPayment.payment_date,
          payment_method: newPayment.payment_method,
          description: newPayment.description || null,
        }]);

      if (error) throw error;

      toast({
        title: "सफल",
        description: "भुक्तानी सफलतापूर्वक रेकर्ड भयो।",
      });

      // Reset form
      setNewPayment({
        tenant_id: "",
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: "cash",
        description: "",
      });

      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: "त्रुटि",
        description: "भुक्तानी रेकर्ड गर्न सकिएन।",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ne-NP');
  };

  const formatCurrency = (amount: number) => {
    return `रू ${amount.toLocaleString('ne-NP')}`;
  };

  const getPaymentMethodNepali = (method: string) => {
    switch (method) {
      case 'cash': return 'नगद';
      case 'bank_transfer': return 'बैंक ट्रान्सफर';
      case 'esewa': return 'eSewa';
      case 'khalti': return 'Khalti';
      case 'check': return 'चेक';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">लोड हुँदैछ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              भुक्तानी व्यवस्थापन
            </h1>
            <p className="text-gray-600">Payment Management</p>
          </div>
          <Link href="/">
            <Button variant="outline">घर फर्कनुहोस्</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                नयाँ भुक्तानी रेकर्ड
              </CardTitle>
              <CardDescription>
                भाडावालाको भुक्तानी रेकर्ड गर्नुहोस्
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    भाडावाला छान्नुहोस् *
                  </label>
                  <Select onValueChange={(value) => setNewPayment(prev => ({ ...prev, tenant_id: value }))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="भाडावाला छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} - कोठा {tenant.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      रकम *
                    </label>
                    <Input
                      type="number"
                      placeholder="15000"
                      value={newPayment.amount || ''}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      मिति *
                    </label>
                    <Input
                      type="date"
                      value={newPayment.payment_date}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    भुक्तानी विधि *
                  </label>
                  <Select 
                    value={newPayment.payment_method} 
                    onValueChange={(value) => setNewPayment(prev => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">नगद</SelectItem>
                      <SelectItem value="bank_transfer">बैंक ट्रान्सफर</SelectItem>
                      <SelectItem value="esewa">eSewa</SelectItem>
                      <SelectItem value="khalti">Khalti</SelectItem>
                      <SelectItem value="check">चेक</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    विवरण (वैकल्पिक)
                  </label>
                  <Input
                    placeholder="भुक्तानीको विवरण..."
                    value={newPayment.description}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      सेभ गर्दैछ...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      भुक्तानी रेकर्ड गर्नुहोस्
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                भुक्तानी इतिहास
              </CardTitle>
              <CardDescription>
                हालैका भुक्तानीहरूको रेकर्ड
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="भाडावाला वा विवरणले खोज्नुहोस्..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="भुक्तानी विधि छान्नुहोस्" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">सबै विधि</SelectItem>
                    <SelectItem value="cash">नगद</SelectItem>
                    <SelectItem value="bank_transfer">बैंक ट्रान्सफर</SelectItem>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="khalti">Khalti</SelectItem>
                    <SelectItem value="check">चेक</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">कुल भुक्तानी</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">भुक्तानी संख्या</p>
                  <p className="text-2xl font-bold text-blue-700">{payments.length}</p>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredPayments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    कुनै भुक्तानी फेला परेन।
                  </p>
                ) : (
                  filteredPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{payment.tenant.name}</p>
                          <p className="text-sm text-gray-600">कोठा {payment.tenant.room_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-500">{formatDate(payment.payment_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span>{getPaymentMethodNepali(payment.payment_method)}</span>
                        </div>
                        {payment.description && (
                          <p className="text-gray-600 text-xs">{payment.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}