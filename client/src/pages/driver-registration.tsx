import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, MapPin, User, FileText, Phone, Mail, ArrowLeft, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Telegram Web App types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        close(): void;
        sendData(data: string): void;
        MainButton: {
          text: string;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

interface DocumentUpload {
  file: File | null;
  preview: string | null;
  uploaded: boolean;
}

interface DriverFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegramId: string;
  dateOfBirth: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  city: string;
  bankAccount: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: string;
}

export default function DriverRegistration() {
  const [formData, setFormData] = useState<DriverFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    telegramId: "",
    dateOfBirth: "",
    emergencyContact: "",
    emergencyPhone: "",
    address: "",
    city: "",
    bankAccount: "",
    vehicleType: "motorcycle",
    vehiclePlate: "",
    vehicleModel: "",
    vehicleYear: ""
  });

  const [documents, setDocuments] = useState({
    driverLicenseFront: { file: null, preview: null, uploaded: false } as DocumentUpload,
    driverLicenseBack: { file: null, preview: null, uploaded: false } as DocumentUpload,
    kebeleIdFront: { file: null, preview: null, uploaded: false } as DocumentUpload,
    kebeleIdBack: { file: null, preview: null, uploaded: false } as DocumentUpload,
    vehicleRegistration: { file: null, preview: null, uploaded: false } as DocumentUpload,
    profilePhoto: { file: null, preview: null, uploaded: false } as DocumentUpload,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);

  useEffect(() => {
    // Check if running in Telegram Web App
    if (window.Telegram?.WebApp) {
      setIsTelegramWebApp(true);
      const tg = window.Telegram.WebApp;
      
      // Initialize Telegram Web App
      tg.ready();
      
      // Get user data from Telegram
      if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        setTelegramUser(user);
        
        // Pre-fill form with Telegram data
        setFormData(prev => ({
          ...prev,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          telegramId: `@${user.username}` || user.id.toString()
        }));
      }
      
      // Setup main button for final submission (initially hidden)
      tg.MainButton.text = 'Complete Registration';
      tg.MainButton.onClick(() => {
        handleSubmit();
      });
      tg.MainButton.hide();
    }
  }, []);

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 2:
        return documents.driverLicenseFront.file && documents.driverLicenseBack.file &&
               documents.kebeleIdFront.file && documents.kebeleIdBack.file;
      case 3:
        return formData.vehiclePlate && formData.vehicleModel && documents.vehicleRegistration.file;
      case 4:
        return location && documents.profilePhoto.file;
      default:
        return false;
    }
  };

  // Update Telegram Main Button based on current step
  useEffect(() => {
    if (isTelegramWebApp && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      if (currentStep === 4 && isStepComplete(4)) {
        tg.MainButton.show();
      } else {
        tg.MainButton.hide();
      }
    }
  }, [currentStep, isTelegramWebApp, formData, documents, location]);

  const handleInputChange = (field: keyof DriverFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (docType: keyof typeof documents, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          file,
          preview: e.target?.result as string,
          uploaded: false
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const uploadDocument = async (docType: keyof typeof documents) => {
    const doc = documents[docType];
    if (!doc.file) return;

    // Simulate upload - in real implementation, upload to cloud storage
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], uploaded: true }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Upload all documents first
      const uploadPromises = Object.keys(documents).map(docType => 
        uploadDocument(docType as keyof typeof documents)
      );
      await Promise.all(uploadPromises);

      // Submit driver registration
      const registrationData = {
        ...formData,
        latitude: location?.lat?.toString() || "0",
        longitude: location?.lng?.toString() || "0",
        documents: Object.keys(documents).reduce((acc, key) => {
          acc[key] = documents[key as keyof typeof documents].uploaded;
          return acc;
        }, {} as Record<string, boolean>)
      };

      if (isTelegramWebApp && window.Telegram?.WebApp) {
        // Send data back to Telegram bot
        window.Telegram.WebApp.sendData(JSON.stringify(registrationData));
        window.Telegram.WebApp.close();
      } else {
        // Regular web submission
        await apiRequest("POST", "/api/drivers/register", registrationData);
        alert("Driver registration submitted successfully!");
      }
      
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const DocumentUploadCard = ({ 
    title, 
    docType, 
    icon: Icon 
  }: { 
    title: string; 
    docType: keyof typeof documents; 
    icon: any 
  }) => (
    <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
      <CardContent className="p-4">
        <div className="text-center">
          <Icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium mb-2">{title}</p>
          
          {documents[docType].preview ? (
            <div className="relative">
              <img 
                src={documents[docType].preview!} 
                alt={title}
                className="w-full h-32 object-cover rounded-lg mb-2"
              />
              {documents[docType].uploaded && (
                <Badge className="absolute top-2 right-2 bg-green-500">
                  Uploaded
                </Badge>
              )}
            </div>
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}

          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(docType, file);
              }}
              className="hidden"
              id={`upload-${docType}`}
            />
            <label
              htmlFor={`upload-${docType}`}
              className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 text-sm"
            >
              <Upload className="h-4 w-4 mr-1" />
              Choose File
            </label>
            
            {documents[docType].file && !documents[docType].uploaded && (
              <Button
                size="sm"
                onClick={() => uploadDocument(docType)}
                className="w-full"
              >
                Upload
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - only show if not in Telegram Web App */}
      {!isTelegramWebApp && (
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
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Driver Registration</h1>
              </div>
            </div>
            {telegramUser && (
              <div className="text-sm text-gray-600">
                Welcome, {telegramUser.first_name}!
              </div>
            )}
          </div>
        </header>
      )}
      
      <div className="max-w-2xl mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Driver Registration</CardTitle>
            <div className="flex justify-center space-x-2 mt-4">
              {[1, 2, 3, 4].map(step => (
                <div 
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-500 text-white' 
                      : isStepComplete(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+251..."
                  />
                </div>
                <div>
                  <Label htmlFor="telegramId">Telegram Username</Label>
                  <Input
                    id="telegramId"
                    value={formData.telegramId}
                    onChange={(e) => handleInputChange("telegramId", e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                    placeholder="+251..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Street, Woreda, Kebele..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Addis Ababa"
                />
              </div>

              <div>
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                  placeholder="For payment processing"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Identity Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUploadCard
                  title="Driver License (Front)"
                  docType="driverLicenseFront"
                  icon={FileText}
                />
                <DocumentUploadCard
                  title="Driver License (Back)"
                  docType="driverLicenseBack"
                  icon={FileText}
                />
                <DocumentUploadCard
                  title="Kebele ID (Front)"
                  docType="kebeleIdFront"
                  icon={FileText}
                />
                <DocumentUploadCard
                  title="Kebele ID (Back)"
                  docType="kebeleIdBack"
                  icon={FileText}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <select
                  id="vehicleType"
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange("vehicleType", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                  <option value="scooter">Scooter</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehiclePlate">License Plate</Label>
                  <Input
                    id="vehiclePlate"
                    value={formData.vehiclePlate}
                    onChange={(e) => handleInputChange("vehiclePlate", e.target.value)}
                    placeholder="AA-123-456"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleYear">Year</Label>
                  <Input
                    id="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                    placeholder="2020"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="vehicleModel">Make & Model</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                  placeholder="Honda CBR 150"
                />
              </div>

              <DocumentUploadCard
                title="Vehicle Registration"
                docType="vehicleRegistration"
                icon={FileText}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Final Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <DocumentUploadCard
                title="Profile Photo"
                docType="profilePhoto"
                icon={User}
              />

              <div>
                <Label className="text-sm font-medium">Current Location</Label>
                <div className="mt-2">
                  {location ? (
                    <div className="flex items-center text-green-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <Button onClick={getLocation} variant="outline" className="w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Current Location
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Registration Summary</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Personal information completed</li>
                  <li>• Identity documents uploaded</li>
                  <li>• Vehicle information provided</li>
                  <li>• Profile photo and location captured</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              disabled={!isStepComplete(currentStep)}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepComplete(4) || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}