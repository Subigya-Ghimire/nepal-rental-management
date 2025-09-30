"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit, Trash2, Home, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  monthly_rent: number;
  is_occupied: boolean;
  floor_number: number;
  description: string | null;
  created_at: string;
}

interface RoomWithTenant extends Room {
  tenant?: {
    name: string;
    phone: string;
  };
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithTenant[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const { toast } = useToast();

  const fetchRooms = useCallback(async () => {
    try {
      // First fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number');

      if (roomsError) throw roomsError;

      // Then fetch tenants for occupied rooms
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('room_number, name, phone')
        .eq('is_active', true);

      if (tenantsError) throw tenantsError;

      // Combine room and tenant data
      const roomsWithTenants = (roomsData || []).map(room => ({
        ...room,
        tenant: tenantsData?.find(tenant => tenant.room_number === room.room_number)
      }));

      setRooms(roomsWithTenants);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "त्रुटि",
        description: "कोठाहरूको सूची लोड गर्न सकिएन।",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterRooms = useCallback(() => {
    let filtered = rooms;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(room => 
        statusFilter === "occupied" ? room.is_occupied : !room.is_occupied
      );
    }

    // Filter by floor
    if (floorFilter !== "all") {
      filtered = filtered.filter(room => 
        room.floor_number === parseInt(floorFilter)
      );
    }

    setFilteredRooms(filtered);
  }, [rooms, searchTerm, statusFilter, floorFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    filterRooms();
  }, [filterRooms]);

  const deleteRoom = async (room: Room) => {
    if (room.is_occupied) {
      toast({
        title: "त्रुटि",
        description: "कब्जामा रहेको कोठा मेटाउन सकिँदैन।",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`के तपाईं कोठा ${room.room_number} मेटाउन चाहनुहुन्छ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "सफल",
        description: "कोठा मेटाइयो।",
      });

      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "त्रुटि",
        description: "कोठा मेटाउन सकिएन।",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `रू ${amount.toLocaleString('ne-NP')}`;
  };

  const getRoomTypeNepali = (type: string) => {
    switch (type) {
      case 'single': return 'एकल कोठा';
      case 'double': return 'दोहोरो कोठा';
      case 'family': return 'पारिवारिक कोठा';
      default: return type;
    }
  };

  const getUniqueFloors = () => {
    const floors = [...new Set(rooms.map(room => room.floor_number))].sort();
    return floors;
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
              कोठा व्यवस्थापन
            </h1>
            <p className="text-gray-600">Room Management</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/">
              <Button variant="outline">घर फर्कनुहोस्</Button>
            </Link>
            <Link href="/rooms/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                नयाँ कोठा
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>खोज र फिल्टर</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="कोठा नम्बर, प्रकार वा भाडावालाको नामले खोज्नुहोस्..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="स्थिति छान्नुहोस्" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">सबै कोठा</SelectItem>
                    <SelectItem value="occupied">कब्जामा</SelectItem>
                    <SelectItem value="available">खाली</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={floorFilter} onValueChange={setFloorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="तला छान्नुहोस्" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">सबै तला</SelectItem>
                    {getUniqueFloors().map(floor => (
                      <SelectItem key={floor} value={floor.toString()}>
                        {floor} तला
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">कुल कोठा</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{rooms.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">कब्जामा</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {rooms.filter(r => r.is_occupied).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">खाली</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {rooms.filter(r => !r.is_occupied).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">कुल आम्दानी</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(
                  rooms
                    .filter(r => r.is_occupied)
                    .reduce((sum, r) => sum + r.monthly_rent, 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 text-lg">कुनै कोठा फेला परेन।</p>
                  <Link href="/rooms/add">
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      पहिलो कोठा थप्नुहोस्
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        कोठा {room.room_number}
                        {room.is_occupied ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <UserCheck className="w-3 h-3 mr-1" />
                            कब्जामा
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserX className="w-3 h-3 mr-1" />
                            खाली
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {getRoomTypeNepali(room.room_type)} - {room.floor_number} तला
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/rooms/edit/${room.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRoom(room)}
                        disabled={room.is_occupied}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">मासिक भाडा</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(room.monthly_rent)}
                    </p>
                  </div>

                  {room.tenant && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">वर्तमान भाडावाला</p>
                      <p className="font-medium">{room.tenant.name}</p>
                      <p className="text-sm text-gray-600">{room.tenant.phone}</p>
                    </div>
                  )}

                  {room.description && (
                    <div>
                      <p className="text-sm text-gray-500">विवरण</p>
                      <p className="text-sm">{room.description}</p>
                    </div>
                  )}

                  {!room.is_occupied && (
                    <div className="pt-2">
                      <Link href={`/tenants/add?room=${room.room_number}`}>
                        <Button className="w-full" size="sm">
                          भाडावाला राख्नुहोस्
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}