import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  telegramId: text("telegram_id").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  isOnline: boolean("is_online").notNull().default(false),
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  registrationData: jsonb("registration_data"), // Store full registration form data
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  restaurantName: text("restaurant_name").notNull(),
  restaurantLatitude: decimal("restaurant_latitude", { precision: 10, scale: 8 }).notNull(),
  restaurantLongitude: decimal("restaurant_longitude", { precision: 11, scale: 8 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 8 }).notNull(),
  deliveryLongitude: decimal("delivery_longitude", { precision: 11, scale: 8 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, assigned, picked_up, in_transit, delivered, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  telegramSent: boolean("telegram_sent").notNull().default(false),
  distance: decimal("distance", { precision: 10, scale: 2 }), // in kilometers
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
}).extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  bankAccount: z.string().optional(),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  documents: z.record(z.boolean()).optional()
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  assignedAt: true,
});

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

// Extended types for API responses
export type OrderWithAssignment = Order & {
  assignment?: Assignment & { driver: Driver };
};

export type AssignmentWithDetails = Assignment & {
  order: Order;
  driver: Driver;
};

export type SystemStats = {
  activeOrders: number;
  availableDrivers: number;
  avgAssignmentTime: string;
  successRate: string;
};
