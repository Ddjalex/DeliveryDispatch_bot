import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { assignmentEngine } from "./services/assignmentEngine";
import { insertOrderSchema, insertDriverSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API Routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/pending", async (req, res) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending orders" });
    }
  });

  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/assignments/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const assignments = await storage.getRecentAssignments(limit);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent assignments" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Broadcast new order via WebSocket
      broadcastToClients({ type: 'new_order', data: order });
      
      // Trigger assignment processing
      assignmentEngine.processPendingOrders();
      
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.post("/api/orders/mock", async (req, res) => {
    try {
      const order = await assignmentEngine.createMockOrder();
      
      // Broadcast new order via WebSocket
      broadcastToClients({ type: 'new_order', data: order });
      
      // Trigger assignment processing after a short delay
      setTimeout(() => {
        assignmentEngine.processPendingOrders();
      }, 1000);
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create mock order" });
    }
  });

  app.patch("/api/drivers/:id/availability", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isAvailable } = req.body;
      
      const driver = await storage.updateDriverAvailability(id, isAvailable);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Broadcast driver update via WebSocket
      broadcastToClients({ type: 'driver_updated', data: driver });
      
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver availability" });
    }
  });

  app.patch("/api/drivers/:id/telegram", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { telegramId } = req.body;
      
      if (!telegramId) {
        return res.status(400).json({ error: "Telegram ID is required" });
      }
      
      const updatedDriver = await storage.updateDriverTelegramId(id, telegramId);
      if (!updatedDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // Broadcast driver update via WebSocket
      broadcastToClients({ type: 'driver_updated', data: updatedDriver });
      
      res.json(updatedDriver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver telegram ID" });
    }
  });

  app.post("/api/drivers/register", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver({
        ...validatedData,
        registrationData: req.body, // Store full registration data for admin review
        approvalStatus: 'pending'
      });
      
      // Broadcast new driver via WebSocket
      broadcastToClients({ type: 'driver_registered', data: driver });
      
      res.json(driver);
    } catch (error) {
      res.status(400).json({ error: "Invalid driver registration data" });
    }
  });

  // Admin routes
  app.get("/api/admin/pending-drivers", async (req, res) => {
    try {
      const pendingDrivers = await storage.getPendingDrivers();
      res.json(pendingDrivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending drivers" });
    }
  });

  app.patch("/api/admin/drivers/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approved, reason } = req.body;
      
      const status = approved ? 'approved' : 'rejected';
      const driver = await storage.updateDriverApprovalStatus(id, status, 'admin');
      
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      // Notify driver via Telegram about approval status
      if (driver.telegramId) {
        const message = approved 
          ? "🎉 Congratulations! Your driver application has been approved. You can now start receiving delivery orders."
          : `❌ Your driver application has been rejected. Reason: ${reason || 'Please contact support for details.'}`;
        
        // Import the driver registration bot to send notification
        const { driverRegistrationBot } = await import('./services/driverRegistrationBot');
        await driverRegistrationBot.sendNotificationToDriver(driver.telegramId, message);
      }
      
      // Broadcast driver update via WebSocket
      broadcastToClients({ type: 'driver_approved', data: driver });
      
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver approval status" });
    }
  });

  // Driver order dashboard for approved drivers
  app.get("/api/driver/orders", async (req, res) => {
    try {
      const { telegramId } = req.query;
      
      if (!telegramId) {
        return res.status(400).json({ error: "Telegram ID required" });
      }

      const driver = await storage.getDriverByTelegramId(telegramId as string);
      if (!driver || driver.approvalStatus !== 'approved') {
        return res.status(403).json({ error: "Driver not approved" });
      }

      // Get recent assignments for this driver
      const assignments = await storage.getRecentAssignments(20);
      const driverAssignments = assignments.filter(a => a.driverId === driver.id);
      
      res.json({
        driver,
        assignments: driverAssignments,
        stats: {
          completedOrders: driverAssignments.filter(a => a.order.status === 'delivered').length,
          activeOrders: driverAssignments.filter(a => ['assigned', 'picked_up', 'in_transit'].includes(a.order.status)).length,
          totalEarnings: driverAssignments
            .filter(a => a.order.status === 'delivered')
            .reduce((sum, a) => sum + parseFloat(a.order.amount), 0)
            .toFixed(2)
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver orders" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // If order is completed, make driver available again
      if (status === 'delivered' || status === 'cancelled') {
        const assignment = await storage.getAssignmentByOrderId(id);
        if (assignment) {
          await storage.updateDriverAvailability(assignment.driverId, true);
        }
      }
      
      // Broadcast order update via WebSocket
      broadcastToClients({ type: 'order_updated', data: order });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  wss.on('connection', (ws) => {
    console.log('📡 WebSocket client connected');
    clients.add(ws);

    // Send initial data
    const sendInitialData = async () => {
      try {
        const [stats, orders, drivers, assignments] = await Promise.all([
          storage.getSystemStats(),
          storage.getAllOrders(),
          storage.getAllDrivers(),
          storage.getRecentAssignments()
        ]);

        ws.send(JSON.stringify({
          type: 'initial_data',
          data: { stats, orders, drivers, assignments }
        }));
      } catch (error) {
        console.error('Error sending initial data:', error);
      }
    };

    sendInitialData();

    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Periodic updates
  setInterval(async () => {
    try {
      const stats = await storage.getSystemStats();
      broadcastToClients({ type: 'stats_update', data: stats });
    } catch (error) {
      console.error('Error broadcasting stats update:', error);
    }
  }, 5000); // Update stats every 5 seconds

  // Auto-create mock orders for demo (every 30 seconds)
  setInterval(async () => {
    try {
      // Only create new orders if there are available drivers
      const availableDrivers = await storage.getAvailableDrivers();
      if (availableDrivers.length > 0 && Math.random() < 0.3) { // 30% chance
        const order = await assignmentEngine.createMockOrder();
        broadcastToClients({ type: 'new_order', data: order });
        
        // Process assignments after a short delay
        setTimeout(() => {
          assignmentEngine.processPendingOrders();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating auto mock order:', error);
    }
  }, 30000);

  return httpServer;
}
