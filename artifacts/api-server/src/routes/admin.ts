import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { ordersTable, productsTable } from "@workspace/db";
import { createAdminToken, requireAdmin, verifyAdminPassword } from "../middleware/auth.js";
import { addAdminRealtimeClient, startAdminRealtimeHeartbeat } from "../lib/realtime.js";

const router: IRouter = Router();

router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const configuredEmail = String(process.env.ADMIN_EMAIL || "admin@homegoodshub.com").trim().toLowerCase();
  if (email !== configuredEmail || !verifyAdminPassword(password)) return res.status(401).json({ error: "Invalid admin credentials" });
  return res.json({ token: createAdminToken(email), admin: { email, name: "Store administrator" } });
});

router.get("/events", requireAdmin, (req, res) => {
  res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.flushHeaders();
  const removeClient = addAdminRealtimeClient(res);
  const stopHeartbeat = startAdminRealtimeHeartbeat(res);
  req.on("close", () => { stopHeartbeat(); removeClient(); });
});

router.get("/dashboard", requireAdmin, async (_req, res) => {
  try {
    const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.active, true));
    const [lowStock] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(sql`${productsTable.active} = true and ${productsTable.stock} <= 5`);
    const orders = await db.select({ status: ordersTable.status, total: ordersTable.total }).from(ordersTable);
    const revenue = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0);
    return res.json({
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      confirmedOrders: orders.filter((order) => order.status === "confirmed").length,
      shippedOrders: orders.filter((order) => order.status === "shipped").length,
      deliveredOrders: orders.filter((order) => order.status === "delivered").length,
      totalProducts: Number(productsCount?.count || 0),
      lowStockProducts: Number(lowStock?.count || 0),
      revenue: Math.round(revenue * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

router.get("/health", requireAdmin, async (_req, res) => {
  const [latest] = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(1);
  return res.json({ ok: true, latestOrderAt: latest?.createdAt || null });
});

export default router;
