import { useState, useEffect } from "react";
import { Truck, Clock, Settings, MapPin, Users, BarChart3, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatsOverview } from "@/components/StatsOverview";
import { PendingOrders } from "@/components/PendingOrders";
import { DriverStatus } from "@/components/DriverStatus";
import { RecentAssignments } from "@/components/RecentAssignments";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { isConnected, data, lastNotification, clearNotification } = useWebSocket();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const createMockOrder = async () => {
    try {
      await apiRequest("POST", "/api/orders/mock");
    } catch (error) {
      console.error("Failed to create mock order:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Delivery Assignment System</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full ${isConnected ? 'animate-pulse' : ''}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'System Online' : 'System Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{currentTime}</span>
            </div>
            <div className="flex space-x-2">
              <Button onClick={createMockOrder} size="sm" variant="outline">
                Create Test Order
              </Button>
              <Link href="/driver-registration">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Driver Registration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Orders</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <Users className="h-5 w-5" />
                  <span>Drivers</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Live Map</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Stats Overview */}
            <StatsOverview stats={data.stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Orders */}
              <PendingOrders orders={data.orders} />

              {/* Driver Status */}
              <DriverStatus drivers={data.drivers} />
            </div>

            {/* Recent Assignments */}
            <RecentAssignments assignments={data.assignments} />
          </div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        notification={lastNotification}
        onClose={clearNotification}
      />
    </div>
  );
}
