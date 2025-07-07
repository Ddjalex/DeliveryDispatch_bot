import { storage } from '../storage';
import { telegramBot } from './telegramBot';
import { type Driver, type Order } from '@shared/schema';

export class AssignmentEngine {
  private isProcessing = false;

  // Calculate distance between two points using Euclidean distance
  private calculateDistance(lat1: string, lon1: string, lat2: string, lon2: string): number {
    const lat1Num = parseFloat(lat1);
    const lon1Num = parseFloat(lon1);
    const lat2Num = parseFloat(lat2);
    const lon2Num = parseFloat(lon2);

    // Euclidean distance calculation (approximation for demo purposes)
    const deltaLat = lat2Num - lat1Num;
    const deltaLon = lon2Num - lon1Num;
    const distance = Math.sqrt(deltaLat * deltaLat + deltaLon * deltaLon);
    
    // Convert to approximate kilometers (rough approximation: 1 degree ≈ 111 km)
    return Number((distance * 111).toFixed(2));
  }

  // Find the closest available driver to a restaurant location
  private async findClosestDriver(order: Order): Promise<{ driver: Driver; distance: number } | null> {
    const availableDrivers = await storage.getAvailableDrivers();
    
    if (availableDrivers.length === 0) {
      return null;
    }

    let closestDriver: Driver | null = null;
    let minDistance = Infinity;

    for (const driver of availableDrivers) {
      const distance = this.calculateDistance(
        driver.latitude,
        driver.longitude,
        order.restaurantLatitude,
        order.restaurantLongitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestDriver = driver;
      }
    }

    return closestDriver ? { driver: closestDriver, distance: minDistance } : null;
  }

  // Process a single order assignment
  async assignOrder(order: Order): Promise<boolean> {
    try {
      console.log(`🔄 Processing assignment for order ${order.orderNumber}`);

      // Check if order is already assigned
      const existingAssignment = await storage.getAssignmentByOrderId(order.id);
      if (existingAssignment) {
        console.log(`⚠️  Order ${order.orderNumber} already assigned`);
        return false;
      }

      // Find closest available driver
      const result = await this.findClosestDriver(order);
      if (!result) {
        console.log(`❌ No available drivers for order ${order.orderNumber}`);
        return false;
      }

      const { driver, distance } = result;

      // Create assignment
      const assignment = await storage.createAssignment({
        orderId: order.id,
        driverId: driver.id,
        distance: distance.toString(),
        telegramSent: false
      });

      // Update order status
      await storage.updateOrderStatus(order.id, 'assigned');

      // Update driver availability
      await storage.updateDriverAvailability(driver.id, false);

      // Send Telegram notification
      const telegramSent = await telegramBot.sendAssignmentNotification(driver, order, assignment);
      
      // Update telegram status in assignment
      await storage.updateAssignmentTelegramStatus(assignment.id, telegramSent);

      console.log(`✅ Order ${order.orderNumber} assigned to ${driver.name} (${distance} km away)`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to assign order ${order.orderNumber}:`, error);
      return false;
    }
  }

  // Process all pending orders
  async processPendingOrders(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      const pendingOrders = await storage.getPendingOrders();
      
      if (pendingOrders.length === 0) {
        return;
      }

      console.log(`📋 Processing ${pendingOrders.length} pending orders`);

      // Sort orders by creation time (oldest first)
      const sortedOrders = pendingOrders.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const order of sortedOrders) {
        await this.assignOrder(order);
        // Small delay between assignments to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } finally {
      this.isProcessing = false;
    }
  }

  // Simulate order creation for demo purposes
  async createMockOrder(): Promise<Order> {
    const mockRestaurants = [
      { name: "Pizza Palace", lat: "40.7589", lon: "-73.9851" },
      { name: "Burger Hub", lat: "40.7505", lon: "-73.9934" },
      { name: "Sushi Express", lat: "40.7282", lon: "-73.7949" },
      { name: "Taco Corner", lat: "40.6892", lon: "-74.0445" },
      { name: "Pasta Place", lat: "40.7128", lon: "-74.0060" }
    ];

    const mockAddresses = [
      { address: "123 Main St, New York, NY", lat: "40.7589", lon: "-73.9851" },
      { address: "456 Oak Ave, New York, NY", lat: "40.7505", lon: "-73.9934" },
      { address: "789 Pine Rd, New York, NY", lat: "40.7282", lon: "-73.7949" },
      { address: "321 Elm St, New York, NY", lat: "40.6892", lon: "-74.0445" },
      { address: "654 Broadway, New York, NY", lat: "40.7128", lon: "-74.0060" }
    ];

    const restaurant = mockRestaurants[Math.floor(Math.random() * mockRestaurants.length)];
    const delivery = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount = (Math.random() * 50 + 10).toFixed(2);

    const order = await storage.createOrder({
      orderNumber,
      restaurantName: restaurant.name,
      restaurantLatitude: restaurant.lat,
      restaurantLongitude: restaurant.lon,
      deliveryAddress: delivery.address,
      deliveryLatitude: delivery.lat,
      deliveryLongitude: delivery.lon,
      amount,
      status: "pending"
    });

    console.log(`📦 Created mock order: ${orderNumber} - ${restaurant.name} → ${delivery.address}`);
    return order;
  }
}

export const assignmentEngine = new AssignmentEngine();
