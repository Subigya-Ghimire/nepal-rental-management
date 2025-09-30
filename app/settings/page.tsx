import { Navigation } from "@/components/navigation"
import { RoomList } from "@/components/room-list"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20 md:pb-0">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Navigation />

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">सेटिङ</h1>
          <p className="text-gray-600 text-sm mt-1">कोठा र मूल्य व्यवस्थापन गर्नुहोस्</p>
        </div>

        <RoomList />
      </div>
    </div>
  )
}