import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { type OrderWithAssignment } from "@shared/schema";

interface PendingOrdersProps {
  orders: OrderWithAssignment[];
}

export function PendingOrders({ orders }: PendingOrdersProps) {
  const pendingOrders = orders.filter(order => order.status === "pending");

  return (
    <Card className="bg-white shadow-sm lg:col-span-2">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Pending Orders</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto-refresh</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {pendingOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No pending orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const orderTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.restaurantName} → {order.deliveryAddress}</p>
                      <p className="text-xs text-gray-500">Order time: {orderTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${order.amount}</p>
                    <p className="text-xs text-orange-600">Searching driver...</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
