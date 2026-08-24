import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../../../lib/db/src/index";
import { orderItemsTable, ordersTable, productsTable } from "../../../../lib/db/src/schema/index";
import { requireAdmin } from "../middleware/auth";
import { emitNewOrder } from "../lib/realtime";

const router: IRouter = Router();
const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;
const money = (value: string | number) => Math.round(Number(value) * 100) / 100;
const idOf = (value: string) => Number.parseInt(value, 10);

function effectivePrice(product: any) {
  const base = Number(product.price);
  const percent = Number(product.discountPercent || 0);
  const now = Date.now();
  const starts = product.discountStartsAt ? new Date(product.discountStartsAt).getTime() : null;
  const ends = product.discountEndsAt ? new Date(product.discountEndsAt).getTime() : null;
  const live = Boolean(product.discountActive) && percent > 0 && percent <= 100 && (!starts || starts <= now) && (!ends || ends >= now);
  return money(live ? base * (1 - percent / 100) : base);
}

function orderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HGH-${stamp}-${suffix}`;
}

async function responseForOrder(order: any) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: money(order.subtotal),
    shipping: money(order.shipping),
    total: money(order.total),
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      governorate: order.customerGovernorate,
      city: order.customerCity,
      address: order.shippingAddress,
      notes: order.customerNotes,
    },
    items: items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      price: money(item.price),
      quantity: item.quantity,
      variant: item.variant || undefined,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    return res.json(await Promise.all(orders.map(responseForOrder)));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = idOf(String(req.params.id));
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(await responseForOrder(order));
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body as any;
    const customer = body.customer || {};
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const governorate = String(customer.governorate || "").trim();
    const city = String(customer.city || "").trim();
    const address = String(customer.address || "").trim();
    const notes = String(customer.notes || "").trim();
    const paymentMethod = String(body.paymentMethod || "");
    if (name.length < 2 || phone.length < 7 || !governorate || !city || address.length < 8 || !rawItems.length) {
      return res.status(400).json({ error: "Complete customer information and at least one item are required" });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod as typeof PAYMENT_METHODS[number])) return res.status(400).json({ error: "Unsupported payment method" });
    if (name.length > 120 || phone.length > 40 || address.length > 500 || notes.length > 1000) return res.status(400).json({ error: "Customer information is too long" });

    const requested = new Map<string, { productId: string | number; quantity: number; variant: string }>();
    for (const item of rawItems) {
      const productId = String(item.productId ?? "").trim();
      const quantity = Number(item.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ error: "Each item must have a valid product and quantity" });
      const key = `${productId}::${String(item.variant || "")}`;
      const existing = requested.get(key);
      requested.set(key, { productId, quantity: (existing?.quantity || 0) + quantity, variant: String(item.variant || "").slice(0, 120) });
    }

    const saved = await db.transaction(async (tx) => {
      const resolvedItems: Array<{ id: number; name: string; price: number; quantity: number; variant: string }> = [];
      for (const item of requested.values()) {
        const numericId = Number(item.productId);
        const [product] = Number.isInteger(numericId) && String(numericId) === String(item.productId)
          ? await tx.select().from(productsTable).where(and(eq(productsTable.id, numericId), eq(productsTable.active, true)))
          : await tx.select().from(productsTable).where(and(eq(productsTable.slug, String(item.productId)), eq(productsTable.active, true)));
        if (!product) throw new Error("PRODUCT_NOT_FOUND");
        if (product.stock < item.quantity) throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.stock}`);
        resolvedItems.push({ id: product.id, name: product.name, price: effectivePrice(product), quantity: item.quantity, variant: item.variant });
      }
      const subtotal = money(resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
      const shipping = subtotal >= 5000 ? 0 : 250;
      const total = money(subtotal + shipping);
      const [order] = await tx.insert(ordersTable).values({
        orderNumber: orderNumber(), userId: null, status: "pending", paymentMethod, paymentStatus: "pending",
        subtotal: subtotal.toFixed(2), shipping: shipping.toFixed(2), total: total.toFixed(2), shippingAddress: address,
        customerName: name, customerPhone: phone, customerGovernorate: governorate, customerCity: city, customerNotes: notes,
      }).returning();
      await tx.insert(orderItemsTable).values(resolvedItems.map((item) => ({
        orderId: order.id, productId: item.id, productName: item.name, quantity: item.quantity, price: item.price.toFixed(2), variant: item.variant,
      })));
      for (const item of resolvedItems) {
        const [decremented] = await tx.update(productsTable).set({ stock: sql`${productsTable.stock} - ${item.quantity}`, updatedAt: new Date() }).where(and(eq(productsTable.id, item.id), gte(productsTable.stock, item.quantity))).returning({ id: productsTable.id });
        if (!decremented) throw new Error("INSUFFICIENT_STOCK");
      }
      return { order, subtotal, shipping, total };
    });
    const orderResponse = await responseForOrder(saved.order);
    emitNewOrder(orderResponse);
    return res.status(201).json(orderResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    if (message === "PRODUCT_NOT_FOUND") return res.status(404).json({ error: "One of the selected products is no longer available" });
    if (message.startsWith("INSUFFICIENT_STOCK")) return res.status(409).json({ error: "One of the selected products does not have enough stock" });
    if (message === "STOCK_UPDATE_FAILED") return res.status(409).json({ error: "Stock changed while placing the order. Please try again" });
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

async function updateStatus(req: any, res: any) {
  try {
    const status = String(req.body.status || "");
    if (!ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) return res.status(400).json({ error: "Invalid order status" });
    const id = idOf(String(req.params.id));
    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!existing) return res.status(404).json({ error: "Order not found" });
    if (existing.status !== "cancelled" && status === "cancelled") {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
      await db.transaction(async (tx) => {
        for (const item of items) await tx.update(productsTable).set({ stock: sql`${productsTable.stock} + ${item.quantity}`, updatedAt: new Date() }).where(eq(productsTable.id, item.productId));
        await tx.update(ordersTable).set({ status, updatedAt: new Date() }).where(eq(ordersTable.id, id));
      });
    } else {
      await db.update(ordersTable).set({ status, updatedAt: new Date() }).where(eq(ordersTable.id, id));
    }
    const [updated] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    return res.json(await responseForOrder(updated));
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Failed to update order status" });
  }
}

router.put("/:id/status", requireAdmin, updateStatus);
router.patch("/:id", requireAdmin, updateStatus);

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = idOf(String(req.params.id));
    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!existing) return res.status(404).json({ error: "Order not found" });
    await db.delete(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    const [order] = await db.delete(ordersTable).where(eq(ordersTable.id, id)).returning();
    return res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
