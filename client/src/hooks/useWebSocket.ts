import { useEffect, useRef, useState } from 'react';
import { type SystemStats, type OrderWithAssignment, type Driver, type AssignmentWithDetails } from '@shared/schema';

interface WebSocketData {
  stats: SystemStats;
  orders: OrderWithAssignment[];
  drivers: Driver[];
  assignments: AssignmentWithDetails[];
}

interface WebSocketMessage {
  type: 'initial_data' | 'stats_update' | 'new_order' | 'order_updated' | 'driver_updated' | 'new_assignment';
  data: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<WebSocketData>({
    stats: { activeOrders: 0, availableDrivers: 0, avgAssignmentTime: '0m', successRate: '0%' },
    orders: [],
    drivers: [],
    assignments: []
  });
  const [lastNotification, setLastNotification] = useState<{ type: string; message: string } | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected');
        setIsConnected(true);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'initial_data':
              setData(message.data);
              break;
              
            case 'stats_update':
              setData(prev => ({ ...prev, stats: message.data }));
              break;
              
            case 'new_order':
              setData(prev => ({ 
                ...prev, 
                orders: [message.data, ...prev.orders].slice(0, 50) // Keep only latest 50
              }));
              setLastNotification({
                type: 'info',
                message: `New order received: ${message.data.orderNumber}`
              });
              break;
              
            case 'order_updated':
              setData(prev => ({
                ...prev,
                orders: prev.orders.map(order => 
                  order.id === message.data.id ? { ...order, ...message.data } : order
                )
              }));
              break;
              
            case 'driver_updated':
              setData(prev => ({
                ...prev,
                drivers: prev.drivers.map(driver => 
                  driver.id === message.data.id ? message.data : driver
                )
              }));
              break;
              
            case 'new_assignment':
              setData(prev => ({ 
                ...prev, 
                assignments: [message.data, ...prev.assignments].slice(0, 20) // Keep only latest 20
              }));
              setLastNotification({
                type: 'success',
                message: `Order ${message.data.order.orderNumber} assigned to ${message.data.driver.name}`
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    data,
    lastNotification,
    clearNotification: () => setLastNotification(null)
  };
}
