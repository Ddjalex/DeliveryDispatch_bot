import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Info, AlertTriangle, X } from "lucide-react";

interface NotificationPanelProps {
  notification: { type: string; message: string } | null;
  onClose: () => void;
}

export function NotificationPanel({ notification, onClose }: NotificationPanelProps) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right duration-300">
      <Card className={`shadow-lg border max-w-sm ${getBgColor()}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.type === "success" ? "Assignment Successful" : 
                 notification.type === "error" ? "Error" : "Information"}
              </p>
              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.type === "success" && "Telegram notification sent"} • Just now
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
