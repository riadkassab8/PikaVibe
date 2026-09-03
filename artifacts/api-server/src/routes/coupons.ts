import { Router, type IRouter } from "express";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../../../../lib/db/src/index.js";
import { couponsTable } from "../../../../lib/db/src/schema/index.js";
import { requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();
const TYPES = ["percent", "fixed"] as const;
const money = (value: number) => Math.round(value * 100) / 100;

function activeCoupon(coupon: any, now = new Date()) {
  return Boolean(coupon.active)
    && (!coupon.startsAt || coupon.startsAt <= now)
    && (!coupon.endsAt || coupon.endsAt >= now)
    && (coupon.usageLimit == null || coupon.usedCount < coupon.usageLimit);
}

function normalizeInput(body: any) {
  const code = String(body.code || "").trim().toUpperCase().replace(/\s+/g, "-");
  const discountType = String(body.discountType || "percent");
  const discountValue = Number(body.discountValue);
  const usageLimit = body.usageLimit === "" || body.usageLimit == null ? null : Number(body.usageLimit);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new Error("Coupon code must be 3-40 letters or numbers");
  if (!TYPES.includes(discountType as typeof TYPES[number])) throw new Error("Discount type must be percent or fixed");
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percent" && discountValue > 100)) throw new Error("Invalid discount value");
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) throw new Error("Usage limit must be a positive whole number");
  const date = (value: any) => value ? new Date(String(value)) : null;
  const startsAt = date(body.startsAt);
  const endsAt = date(body.endsAt);
  if (startsAt && Number.isNaN(startsAt.getTime())) throw new Error("Invalid start date");
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("Invalid end date");
  if (startsAt && endsAt && startsAt > endsAt) throw new Error("Start date must be before end date");
  return { code, discountType, discountValue: discountValue.toFixed(2), active: body.active !== false, startsAt, endsAt, usageLimit };
}

function discountFor(coupon: any, subtotal: number) {
  return money(Math.min(subtotal, coupon.discountType === "percent" ? subtotal * Number(coupon.discountValue) / 100 : Number(coupon.discountValue)));
}

router.post("/validate", async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const subtotal = Number(req.body?.subtotal);
    if (!code || !Number.isFinite(subtotal) || subtotal < 0) return res.status(400).json({ error: "Coupon code and subtotal are required" });
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code));
    if (!coupon || !activeCoupon(coupon)) return res.status(400).json({ error: "Coupon is invalid or expired" });
    return res.json({ code: coupon.code, discountType: coupon.discountType, discountValue: Number(coupon.discountValue), discount: discountFor(coupon, subtotal), subtotal });
  } catch (error) {
    return res.status(500).json({ error: "Failed to validate coupon" });
  }
});

router.get("/", requireAdmin, async (_req, res) => {
  try { return res.json(await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt))); }
  catch { return res.status(500).json({ error: "Failed to fetch coupons" }); }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const [coupon] = await db.insert(couponsTable).values(normalizeInput(req.body)).returning();
    return res.status(201).json(coupon);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    return res.status(400).json({ error: message.includes("duplicate") ? "Coupon code already exists" : message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const [coupon] = await db.update(couponsTable).set({ ...normalizeInput(req.body), updatedAt: new Date() }).where(eq(couponsTable.id, Number(req.params.id))).returning();
    return coupon ? res.json(coupon) : res.status(404).json({ error: "Coupon not found" });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update coupon" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [coupon] = await db.update(couponsTable).set({ active: false, updatedAt: new Date() }).where(eq(couponsTable.id, Number(req.params.id))).returning();
    return coupon ? res.json({ message: "Coupon disabled" }) : res.status(404).json({ error: "Coupon not found" });
  } catch { return res.status(500).json({ error: "Failed to disable coupon" }); }
});

export { activeCoupon, discountFor };
export default router;
