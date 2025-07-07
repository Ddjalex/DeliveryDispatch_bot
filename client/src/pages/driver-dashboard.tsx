import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock, DollarSign, Package, CheckCircle, AlertCircle, Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Telegram Web App types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        close(): void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
          };
        };
      };
    };
  }
}

interface DriverStats {
  completedOrders: number;
  activeOrders: number;
  totalEarnings: string;
}

interface Assignment {
  id: number;
  assignedAt: string;
  distance: string;
  order: {
    id: number;
    orderNumber: string;
    restaurantName: string;
    deliveryAddress: string;
    amount: string;
    status: string;
    createdAt: string;
  };
}

interface DriverData {
  driver: {
    id: number;
    name: string;
    approvalStatus: string;
    isAvailable: boolean;
    isOnline: boolean;
  };
  assignments: Assignment[];
  stats: DriverStats;
}

export default function DriverDashboard() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  useEffect(() => {
    // Check if running in Telegram Web App
    if (window.Telegram?.WebApp) {
      setIsTelegramWebApp(true);
      const tg = window.Telegram.WebApp;
      
      // Initialize Telegram Web App
      tg.ready();
      
      // Get user data from Telegram
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  const { data: driverData, isLoading, error } = useQuery<DriverData>({
    queryKey: ["/api/driver/orders", telegramUser?.id || telegramUser?.username],
    enabled: !!telegramUser,
    queryFn: async () => {
      const telegramId = telegramUser?.id?.toString() || `@${telegramUser?.username}`;
      const params = new URLSearchParams({ telegramId });
      const response = await fetch(`/api/driver/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch driver data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-orange-100 text-orange-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'in_transit': return <Navigation className="h-4 w-4" />;
      case 'picked_up': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!isTelegramWebApp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Telegram Required</h2>
            <p className="text-gray-600">
              This driver dashboard can only be accessed through the Telegram Mini App.
              Please use the Telegram bot to access your driver dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !driverData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You are not registered as an approved driver or your application is still pending approval.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { driver, assignments, stats } = driverData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Driver Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {driver.name}!</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${driver.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {driver.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">${stats.totalEarnings}</p>
              <p className="text-xs text-gray-600">Total Earnings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{stats.completedOrders}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-orange-600">{stats.activeOrders}</p>
              <p className="text-xs text-gray-600">Active Orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders yet. Stay online to receive delivery requests!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 10).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          Order #{assignment.order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-600">
                          {assignment.order.restaurantName}
                        </p>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(assignment.order.status)}`}>
                        <span className="flex items-center">
                          {getStatusIcon(assignment.order.status)}
                          <span className="ml-1 capitalize">{assignment.order.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {assignment.order.deliveryAddress}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(assignment.assignedAt).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${assignment.order.amount}
                        </div>
                      </div>
                      {assignment.distance && (
                        <div className="flex items-center">
                          <Navigation className="h-3 w-3 mr-1" />
                          {assignment.distance} km away
                        </div>
                      )}
                    </div>

                    {assignment.order.status === 'assigned' && (
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          Start Pickup
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Details
                        </Button>
                      </div>
                    )}

                    {assignment.order.status === 'picked_up' && (
                      <div className="mt-3">
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                          Start Delivery
                        </Button>
                      </div>
                    )}

                    {assignment.order.status === 'in_transit' && (
                      <div className="mt-3">
                        <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                          Mark as Delivered
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className={`${driver.isAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
              >
                {driver.isAvailable ? 'Available' : 'Unavailable'}
              </Button>
              <Button variant="outline">
                Update Location
              </Button>
              <Button variant="outline">
                View Earnings
              </Button>
              <Button variant="outline">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}