import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle, ShoppingCart } from "lucide-react";
import { type SystemStats } from "@shared/schema";

interface StatsOverviewProps {
  stats: SystemStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeOrders}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">+12%</span>
            <span className="text-gray-600 ml-1">from last hour</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Drivers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.availableDrivers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-500">-3</span>
            <span className="text-gray-600 ml-1">since last check</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Assignment Time</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgAssignmentTime}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">-0.3m</span>
            <span className="text-gray-600 ml-1">improvement</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.successRate}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">+0.5%</span>
            <span className="text-gray-600 ml-1">this hour</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
