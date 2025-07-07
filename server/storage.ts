import { 
  drivers, 
  orders, 
  assignments,
  type Driver, 
  type InsertDriver, 
  type Order, 
  type InsertOrder, 
  type Assignment, 
  type InsertAssignment,
  type OrderWithAssignment,
  type AssignmentWithDetails,
  type SystemStats 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and } from "drizzle-orm";

export interface IStorage {
  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByTelegramId(telegramId: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriverLocation(id: number, latitude: string, longitude: string): Promise<Driver | undefined>;
  updateDriverAvailability(id: number, isAvailable: boolean): Promise<Driver | undefined>;
  updateDriverOnlineStatus(id: number, isOnline: boolean): Promise<Driver | undefined>;
  updateDriverTelegramId(id: number, telegramId: string): Promise<Driver | undefined>;
  updateDriverApprovalStatus(id: number, status: string, approvedBy?: string): Promise<Driver | undefined>;
  getAllDrivers(): Promise<Driver[]>;
  getAvailableDrivers(): Promise<Driver[]>;
  getPendingDrivers(): Promise<Driver[]>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getPendingOrders(): Promise<Order[]>;
  getAllOrders(): Promise<OrderWithAssignment[]>;

  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignmentTelegramStatus(id: number, sent: boolean): Promise<Assignment | undefined>;
  getAssignmentByOrderId(orderId: number): Promise<Assignment | undefined>;
  getRecentAssignments(limit?: number): Promise<AssignmentWithDetails[]>;

  // Statistics
  getSystemStats(): Promise<SystemStats>;
}

export class DatabaseStorage implements IStorage {
  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver || undefined;
  }

  async getDriverByTelegramId(telegramId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.telegramId, telegramId));
    return driver || undefined;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db
      .insert(drivers)
      .values(insertDriver)
      .returning();
    return driver;
  }

  async updateDriverLocation(id: number, latitude: string, longitude: string): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ latitude, longitude, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateDriverAvailability(id: number, isAvailable: boolean): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateDriverOnlineStatus(id: number, isOnline: boolean): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ isOnline, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateDriverTelegramId(id: number, telegramId: string): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ telegramId, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateDriverApprovalStatus(id: number, status: string, approvedBy?: string): Promise<Driver | undefined> {
    const [updated] = await db
      .update(drivers)
      .set({ 
        approvalStatus: status, 
        approvedAt: status === 'approved' ? new Date() : null,
        approvedBy: approvedBy || null,
        updatedAt: new Date() 
      })
      .where(eq(drivers.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).where(
      and(
        eq(drivers.isAvailable, true),
        eq(drivers.isOnline, true),
        eq(drivers.approvalStatus, 'approved')
      )
    );
  }

  async getPendingDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.approvalStatus, 'pending'));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async getPendingOrders(): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.status, 'pending'));
  }

  async getAllOrders(): Promise<OrderWithAssignment[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    const result: OrderWithAssignment[] = [];
    
    for (const order of allOrders) {
      const assignment = await db
        .select()
        .from(assignments)
        .where(eq(assignments.orderId, order.id))
        .limit(1);
        
      if (assignment.length > 0) {
        const driver = await db
          .select()
          .from(drivers)
          .where(eq(drivers.id, assignment[0].driverId))
          .limit(1);
          
        result.push({
          ...order,
          assignment: {
            ...assignment[0],
            driver: driver[0]
          }
        });
      } else {
        result.push({
          ...order,
          assignment: undefined
        });
      }
    }
    
    return result;
  }

  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment || undefined;
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async updateAssignmentTelegramStatus(id: number, sent: boolean): Promise<Assignment | undefined> {
    const [updated] = await db
      .update(assignments)
      .set({ telegramSent: sent })
      .where(eq(assignments.id, id))
      .returning();
    return updated || undefined;
  }

  async getAssignmentByOrderId(orderId: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.orderId, orderId));
    return assignment || undefined;
  }

  async getRecentAssignments(limit: number = 10): Promise<AssignmentWithDetails[]> {
    const recentAssignments = await db
      .select({
        id: assignments.id,
        orderId: assignments.orderId,
        driverId: assignments.driverId,
        assignedAt: assignments.assignedAt,
        telegramSent: assignments.telegramSent,
        distance: assignments.distance,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          restaurantName: orders.restaurantName,
          restaurantLatitude: orders.restaurantLatitude,
          restaurantLongitude: orders.restaurantLongitude,
          deliveryAddress: orders.deliveryAddress,
          deliveryLatitude: orders.deliveryLatitude,
          deliveryLongitude: orders.deliveryLongitude,
          amount: orders.amount,
          status: orders.status,
          createdAt: orders.createdAt,
        },
        driver: {
          id: drivers.id,
          name: drivers.name,
          telegramId: drivers.telegramId,
          phone: drivers.phone,
          email: drivers.email,
          latitude: drivers.latitude,
          longitude: drivers.longitude,
          isAvailable: drivers.isAvailable,
          isOnline: drivers.isOnline,
          approvalStatus: drivers.approvalStatus,
          registrationData: drivers.registrationData,
          approvedAt: drivers.approvedAt,
          approvedBy: drivers.approvedBy,
          createdAt: drivers.createdAt,
          updatedAt: drivers.updatedAt,
        }
      })
      .from(assignments)
      .innerJoin(orders, eq(assignments.orderId, orders.id))
      .innerJoin(drivers, eq(assignments.driverId, drivers.id))
      .orderBy(desc(assignments.assignedAt))
      .limit(limit);

    return recentAssignments;
  }

  async getSystemStats(): Promise<SystemStats> {
    const [activeOrdersCount] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    const [availableDriversCount] = await db
      .select({ count: count() })
      .from(drivers)
      .where(
        and(
          eq(drivers.isAvailable, true),
          eq(drivers.isOnline, true),
          eq(drivers.approvalStatus, 'approved')
        )
      );

    return {
      activeOrders: activeOrdersCount.count,
      availableDrivers: availableDriversCount.count,
      avgAssignmentTime: "2.3 min",
      successRate: "94.2%"
    };
  }
}

export const storage = new DatabaseStorage();