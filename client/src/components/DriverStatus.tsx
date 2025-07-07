import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Edit } from "lucide-react";
import { type Driver } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface DriverStatusProps {
  drivers: Driver[];
}

export function DriverStatus({ drivers }: DriverStatusProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTelegramId, setNewTelegramId] = useState("");

  const getStatusColor = (driver: Driver) => {
    if (!driver.isOnline) return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
    if (!driver.isAvailable) return { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" };
    return { bg: "bg-green-100", text: "text-green-600", dot: "bg-green-500" };
  };

  const getStatusText = (driver: Driver) => {
    if (!driver.isOnline) return "Offline";
    if (!driver.isAvailable) return "Busy";
    return "Available";
  };

  const handleEditTelegramId = (driver: Driver) => {
    setEditingId(driver.id);
    setNewTelegramId(driver.telegramId);
  };

  const handleSaveTelegramId = async (driverId: number) => {
    try {
      await apiRequest("PATCH", `/api/drivers/${driverId}/telegram`, {
        telegramId: newTelegramId
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update telegram ID:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewTelegramId("");
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Driver Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {drivers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No drivers available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drivers.map((driver) => {
              const colors = getStatusColor(driver);
              const statusText = getStatusText(driver);

              return (
                <div key={driver.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center`}>
                      <User className={`h-4 w-4 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      {editingId === driver.id ? (
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            value={newTelegramId}
                            onChange={(e) => setNewTelegramId(e.target.value)}
                            placeholder="@username or chat ID"
                            className="text-xs h-6 w-32"
                          />
                          <Button size="sm" onClick={() => handleSaveTelegramId(driver.id)} className="h-6 px-2 text-xs">
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 px-2 text-xs">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-gray-500">ID: {driver.telegramId}</p>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditTelegramId(driver)}
                            className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <span className={`inline-block w-2 h-2 ${colors.dot} rounded-full mr-2`}></span>
                      <span className={`text-sm ${colors.text}`}>{statusText}</span>
                    </div>
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
