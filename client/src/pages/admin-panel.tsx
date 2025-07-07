import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, User, Phone, Mail, MapPin, Car, FileText, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PendingDriver {
  id: number;
  name: string;
  telegramId: string;
  phone: string;
  email: string;
  approvalStatus: string;
  registrationData: any;
  createdAt: string;
}

export default function AdminPanel() {
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();

  const { data: pendingDrivers, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-drivers"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const approveMutation = useMutation({
    mutationFn: async ({ driverId, approved, reason }: { driverId: number; approved: boolean; reason?: string }) => {
      return await apiRequest("PATCH", `/api/admin/drivers/${driverId}/approve`, { approved, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-drivers"] });
      setSelectedDriver(null);
      setRejectionReason("");
    }
  });

  const handleApprove = (driver: PendingDriver) => {
    approveMutation.mutate({ driverId: driver.id, approved: true });
  };

  const handleReject = (driver: PendingDriver) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    approveMutation.mutate({ 
      driverId: driver.id, 
      approved: false, 
      reason: rejectionReason 
    });
  };

  const DriverDetailsModal = ({ driver }: { driver: PendingDriver }) => {
    const regData = driver.registrationData || {};
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Driver Application Review</h2>
              <Button variant="outline" onClick={() => setSelectedDriver(null)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Full Name:</strong> {regData.firstName} {regData.lastName}
                  </div>
                  <div>
                    <strong>Email:</strong> {regData.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {regData.phone}
                  </div>
                  <div>
                    <strong>Telegram:</strong> {driver.telegramId}
                  </div>
                  <div>
                    <strong>Date of Birth:</strong> {regData.dateOfBirth}
                  </div>
                  <div>
                    <strong>Address:</strong> {regData.address}
                  </div>
                  <div>
                    <strong>City:</strong> {regData.city}
                  </div>
                  <div>
                    <strong>Emergency Contact:</strong> {regData.emergencyContact}
                  </div>
                  <div>
                    <strong>Emergency Phone:</strong> {regData.emergencyPhone}
                  </div>
                  <div>
                    <strong>Bank Account:</strong> {regData.bankAccount}
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Vehicle Type:</strong> {regData.vehicleType}
                  </div>
                  <div>
                    <strong>License Plate:</strong> {regData.vehiclePlate}
                  </div>
                  <div>
                    <strong>Make & Model:</strong> {regData.vehicleModel}
                  </div>
                  <div>
                    <strong>Year:</strong> {regData.vehicleYear}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Document Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {regData.documents && Object.entries(regData.documents).map(([key, uploaded]: [string, any]) => (
                      <div key={key} className="flex items-center space-x-2">
                        {uploaded ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Application Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Application Date:</strong> {new Date(driver.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Status:</strong> 
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                        {driver.approvalStatus}
                      </Badge>
                    </div>
                  </div>
                  
                  {regData.latitude && regData.longitude && (
                    <div className="mt-4">
                      <strong>Location:</strong> {regData.latitude}, {regData.longitude}
                      <br />
                      <a 
                        href={`https://maps.google.com/?q=${regData.latitude},${regData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-4">
              <Textarea
                placeholder="Reason for rejection (optional for approval, required for rejection)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              
              <div className="flex space-x-4">
                <Button
                  onClick={() => handleApprove(driver)}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Driver
                </Button>
                
                <Button
                  onClick={() => handleReject(driver)}
                  disabled={approveMutation.isPending || !rejectionReason.trim()}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Driver Applications</h2>
            <p className="text-gray-600">Review and approve driver registration applications</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading pending applications...</div>
          ) : !pendingDrivers || pendingDrivers.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Pending Applications</h3>
                  <p>All driver applications have been reviewed.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingDrivers.map((driver: PendingDriver) => (
                <Card key={driver.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{driver.name}</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {driver.phone}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {driver.email}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(driver.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => setSelectedDriver(driver)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Review Application
                      </Button>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApprove(driver)}
                          disabled={approveMutation.isPending}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        
                        <Button
                          onClick={() => setSelectedDriver(driver)}
                          disabled={approveMutation.isPending}
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedDriver && (
        <DriverDetailsModal driver={selectedDriver} />
      )}
    </div>
  );
}