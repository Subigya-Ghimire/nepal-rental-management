"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  monthly_rent: number;
  is_occupied: boolean;
  floor_number: number;
  description: string | null;
}

interface TenantForm {
  name: string;
  phone: string;
  email: string;
  room_number: string;
  monthly_rent: number;
  security_deposit: number;
  move_in_date: string;
}

export default function AddTenantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formData, setFormData] = useState<TenantForm>({
    name: "",
    phone: "",
    email: "",
    room_number: "",
    monthly_rent: 0,
    security_deposit: 0,
    move_in_date: new Date().toISOString().split('T')[0],
  });

  const fetchAvailableRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_occupied', false)
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "त्रुटि",
        description: "उपलब्ध कोठाहरूको सूची लोड गर्न सकिएन।",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAvailableRooms();
  }, [fetchAvailableRooms]);

  const handleRoomChange = (roomNumber: string) => {
    const selectedRoom = rooms.find(room => room.room_number === roomNumber);
    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        room_number: roomNumber,
        monthly_rent: selectedRoom.monthly_rent,
        security_deposit: selectedRoom.monthly_rent * 2, // Default 2 months rent as security
      }));
    }
  };

  const handleInputChange = (field: keyof TenantForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "त्रुटि",
        description: "भाडावालाको नाम आवश्यक छ।",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "त्रुटि",
        description: "फोन नम्बर आवश्यक छ।",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.room_number) {
      toast({
        title: "त्रुटि",
        description: "कोठा छान्नुहोस्।",
        variant: "destructive",
      });
      return false;
    }

    if (formData.monthly_rent <= 0) {
      toast({
        title: "त्रुटि",
        description: "मासिक भाडा ० भन्दा बढी हुनुपर्छ।",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.move_in_date) {
      toast({
        title: "त्रुटि",
        description: "सुरु मिति आवश्यक छ।",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Insert tenant
      const { data: _, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          room_number: formData.room_number,
          monthly_rent: formData.monthly_rent,
          security_deposit: formData.security_deposit,
          move_in_date: formData.move_in_date,
          is_active: true,
        }])
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Update room occupancy status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ is_occupied: true })
        .eq('room_number', formData.room_number);

      if (roomError) throw roomError;

      toast({
        title: "सफल",
        description: "नयाँ भाडावाला सफलतापूर्वक थपियो।",
      });

      router.push('/tenants');
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast({
        title: "त्रुटि",
        description: "भाडावाला थप्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tenants">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              फिर्ता
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              नयाँ भाडावाला थप्नुहोस्
            </h1>
            <p className="text-gray-600">Add New Tenant</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                भाडावालाको विवरण
              </CardTitle>
              <CardDescription>
                सबै आवश्यक जानकारी भर्नुहोस्
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">व्यक्तिगत जानकारी</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        पूरा नाम *
                      </label>
                      <Input
                        placeholder="भाडावालाको पूरा नाम"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        फोन नम्बर *
                      </label>
                      <Input
                        type="tel"
                        placeholder="98xxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      इमेल (वैकल्पिक)
                    </label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Room Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">कोठाको जानकारी</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      कोठा छान्नुहोस् *
                    </label>
                    <Select onValueChange={handleRoomChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder="उपलब्ध कोठा छान्नुहोस्" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            कुनै उपलब्ध कोठा छैन
                          </div>
                        ) : (
                          rooms.map((room) => (
                            <SelectItem key={room.id} value={room.room_number}>
                              कोठा {room.room_number} - {room.room_type} (रू {room.monthly_rent.toLocaleString('ne-NP')})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        मासिक भाडा *
                      </label>
                      <Input
                        type="number"
                        placeholder="15000"
                        value={formData.monthly_rent || ''}
                        onChange={(e) => handleInputChange('monthly_rent', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        धरौटी रकम *
                      </label>
                      <Input
                        type="number"
                        placeholder="30000"
                        value={formData.security_deposit || ''}
                        onChange={(e) => handleInputChange('security_deposit', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      सुरु मिति *
                    </label>
                    <Input
                      type="date"
                      value={formData.move_in_date}
                      onChange={(e) => handleInputChange('move_in_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Link href="/tenants" className="flex-1">
                    <Button variant="outline" className="w-full" type="button">
                      रद्द गर्नुहोस्
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        सेभ गर्दैछ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        सेभ गर्नुहोस्
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}