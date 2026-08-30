import { boolean, decimal, integer, jsonb, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull().unique(),
  nameAr: text("name_ar"),
  nameEn: text("name_en"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCategory = typeof categoriesTable.$inferInsert;
export type Category = typeof categoriesTable.$inferSelect;

export const storeSettingsTable = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("PikaVibe"),
  logoUrl: text("logo_url").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#C8722E"),
  inkColor: text("ink_color").notNull().default("#3D2A1E"),
  backgroundColor: text("background_color").notNull().default("#f4ecdf"),
  surfaceColor: text("surface_color").notNull().default("#fbf8f3"),
  secondaryColor: text("secondary_color").notNull().default("#ead9c0"),
  accentColor: text("accent_color").notNull().default("#d9a77d"),
  successColor: text("success_color").notNull().default("#2E9B68"),
  mutedTextColor: text("muted_text_color").notNull().default("#765e4c"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertStoreSettingsSchema = createInsertSchema(storeSettingsTable).omit({ id: true, updatedAt: true });
export type InsertStoreSettings = typeof storeSettingsTable.$inferInsert;
export type StoreSettings = typeof storeSettingsTable.$inferSelect;

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  nameEn: text("name_en"),
  description: text("description").notNull().default(""),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  oldPrice: decimal("old_price", { precision: 12, scale: 2 }),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountActive: boolean("discount_active").notNull().default(false),
  discountStartsAt: timestamp("discount_starts_at"),
  discountEndsAt: timestamp("discount_ends_at"),
  imageUrl: text("image_url").notNull().default(""),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  specifications: jsonb("specifications").$type<string[]>().notNull().default([]),
  variants: jsonb("variants").$type<Array<{ name: string; options: string[] }>>().notNull().default([]),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("4.8"),
  featured: boolean("featured").notNull().default(false),
  installmentAvailable: boolean("installment_available").notNull().default(false),
  installmentMinMonths: integer("installment_min_months"),
  installmentMaxMonths: integer("installment_max_months"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = typeof productsTable.$inferInsert;
export type Product = typeof productsTable.$inferSelect;

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id").references(() => usersTable.id),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  shippingAddress: text("shipping_address").notNull().default(""),
  customerName: text("customer_name").notNull().default("Guest"),
  customerPhone: text("customer_phone").notNull().default(""),
  customerGovernorate: text("customer_governorate").notNull().default(""),
  customerCity: text("customer_city").notNull().default(""),
  customerNotes: text("customer_notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = typeof ordersTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  productName: text("product_name").notNull().default(""),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  variant: text("variant").notNull().default(""),
});
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrderItem = typeof orderItemsTable.$inferInsert;
export type OrderItem = typeof orderItemsTable.$inferSelect;

export const cartTable = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull().default(1),
});
export const insertCartSchema = createInsertSchema(cartTable).omit({ id: true });
export type InsertCart = typeof cartTable.$inferInsert;
export type Cart = typeof cartTable.$inferSelect;
