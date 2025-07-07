import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Truck, Clock, X } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { type AssignmentWithDetails } from "@shared/schema";

interface RecentAssignmentsProps {
  assignments: AssignmentWithDetails[];
}

export function RecentAssignments({ assignments }: RecentAssignmentsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "in_transit":
      case "picked_up":
        return <Truck className="h-3 w-3 mr-1" />;
      case "cancelled":
        return <X className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "in_transit":
      case "picked_up":
        return "bg-orange-100 text-orange-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "in_transit":
        return "In Transit";
      case "picked_up":
        return "Picked Up";
      case "assigned":
        return "Assigned";
      case "cancelled":
        return "Cancelled";
      default:
        return "Pending";
    }
  };

  return (
    <Card className="bg-white shadow-sm mt-6">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Assignments</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent assignments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => {
                  const assignmentTime = new Date(assignment.assignedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.driver.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.order.restaurantName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.order.deliveryAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignmentTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`inline-flex items-center text-xs font-medium ${getStatusColor(assignment.order.status)}`}>
                          {getStatusIcon(assignment.order.status)}
                          {getStatusLabel(assignment.order.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`inline-flex items-center text-xs font-medium ${assignment.telegramSent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          <SiTelegram className="h-3 w-3 mr-1" />
                          {assignment.telegramSent ? 'Sent' : 'Failed'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
