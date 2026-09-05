import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { getAdminEmailFromRequest, requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

function idOf(value: string) {
  return Number.parseInt(value, 10);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function optionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Discount dates must be valid dates");
  return date;
}

function isDiscountLive(product: any) {
  const now = Date.now();
  const starts = product.discountStartsAt ? new Date(product.discountStartsAt).getTime() : null;
  const ends = product.discountEndsAt ? new Date(product.discountEndsAt).getTime() : null;
  return Boolean(product.discountActive) && Number(product.discountPercent) > 0 && Number(product.discountPercent) <= 100 && (!starts || starts <= now) && (!ends || ends >= now);
}

function serializeProduct(product: any) {
  if (!isDiscountLive(product)) return product;
  const basePrice = Number(product.price);
  const percentage = Number(product.discountPercent);
  return { ...product, price: (basePrice * (1 - percentage / 100)).toFixed(2), basePrice: basePrice.toFixed(2), oldPrice: basePrice.toFixed(2), discount: percentage };
}

function productInput(body: Record<string, unknown>, partial = false) {
  const nameAr = String(body.nameAr ?? "").trim();
  const nameEn = String(body.nameEn ?? "").trim();
  const name = String(body.name ?? (nameEn || nameAr)).trim();
  const price = Number(body.price);
  const stock = Number(body.stock ?? 0);
  const imageUrl = String(body.imageUrl ?? body.image ?? "").trim();
  const images = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : imageUrl ? [imageUrl] : [];
  const variants = Array.isArray(body.variants) ? body.variants : [];
  const specifications = Array.isArray(body.specifications) ? body.specifications.map(String).filter(Boolean) : [];
  const discountPercent = Number(body.discountPercent ?? 0);
  const installmentAvailable = body.installmentAvailable === undefined
    ? (body.installmentMinMonths !== undefined || body.installmentMaxMonths !== undefined ? true : undefined)
    : Boolean(body.installmentAvailable);
  const installmentMinMonths = body.installmentMinMonths === undefined || body.installmentMinMonths === null || body.installmentMinMonths === '' ? 2 : Number(body.installmentMinMonths);
  const installmentMaxMonths = body.installmentMaxMonths === undefined || body.installmentMaxMonths === null || body.installmentMaxMonths === '' ? 6 : Number(body.installmentMaxMonths);
  if (body.discountPercent !== undefined && (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)) throw new Error("Discount must be between 0 and 100 percent");
  if (installmentAvailable === true && (!Number.isInteger(installmentMinMonths) || !Number.isInteger(installmentMaxMonths) || installmentMinMonths < 1 || installmentMaxMonths < 1 || installmentMinMonths > 60 || installmentMaxMonths > 60 || installmentMinMonths > installmentMaxMonths)) {
    throw new Error("Installment months must be whole numbers from 1 to 60, with the minimum no greater than the maximum");
  }
  if (!partial && (!name || !String(body.category ?? "").trim() || !Number.isFinite(price))) {
    throw new Error("name, category and a valid price are required");
  }
  if (name && name.length > 160) throw new Error("Product name is too long");
  if (body.price !== undefined && (!Number.isFinite(price) || price < 0)) throw new Error("Price must be a positive number");
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock must be a non-negative integer");
  if (body.variants !== undefined && variants.some((variant: any) => !variant || typeof variant.name !== "string" || !Array.isArray(variant.options))) {
    throw new Error("Variants must contain a name and options array");
  }
  return {
    ...(name ? { name } : {}),
    ...(body.nameAr !== undefined ? { nameAr: nameAr || null } : {}),
    ...(body.nameEn !== undefined ? { nameEn: nameEn || null } : {}),
    ...(body.slug !== undefined || name ? { slug: slugify(String(body.slug || name)) } : {}),
    ...(body.description !== undefined ? { description: String(body.description).trim() } : {}),
    ...(body.price !== undefined ? { price: price.toFixed(2) } : {}),
    ...(body.oldPrice !== undefined ? { oldPrice: body.oldPrice === null || body.oldPrice === "" ? null : Number(body.oldPrice).toFixed(2) } : {}),
    ...(body.discountPercent !== undefined ? { discountPercent: discountPercent.toFixed(2) } : {}),
    ...(body.discountActive !== undefined ? { discountActive: Boolean(body.discountActive) } : {}),
    ...(body.discountStartsAt !== undefined ? { discountStartsAt: optionalDate(body.discountStartsAt) } : {}),
    ...(body.discountEndsAt !== undefined ? { discountEndsAt: optionalDate(body.discountEndsAt) } : {}),
    ...(installmentAvailable !== undefined ? { installmentAvailable, installmentMinMonths: installmentAvailable ? installmentMinMonths : null, installmentMaxMonths: installmentAvailable ? installmentMaxMonths : null } : {}),
    ...(body.imageUrl !== undefined || body.image !== undefined || body.images !== undefined ? { imageUrl: images[0] || "", images } : {}),
    ...(body.specifications !== undefined ? { specifications } : {}),
    ...(body.variants !== undefined ? { variants } : {}),
    ...(body.category !== undefined ? { category: String(body.category).trim() } : {}),
    ...(body.stock !== undefined ? { stock } : {}),
    ...(body.rating !== undefined ? { rating: Number(body.rating).toFixed(2) } : {}),
    ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
    ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
    updatedAt: new Date(),
  };
}

router.get("/", async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    if (includeInactive && !getAdminEmailFromRequest(req)) return res.status(401).json({ error: "Admin authentication required" });
    const products = includeInactive
      ? await db.select().from(productsTable).orderBy(desc(productsTable.createdAt))
      : await db.select().from(productsTable).where(eq(productsTable.active, true)).orderBy(desc(productsTable.createdAt));
    return res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = idOf(String(req.params.id));
    const isNumeric = Number.isInteger(id) && String(id) === req.params.id;
    const [product] = isNumeric
      ? await db.select().from(productsTable).where(and(eq(productsTable.id, id), eq(productsTable.active, true)))
      : await db.select().from(productsTable).where(and(eq(productsTable.slug, req.params.id), eq(productsTable.active, true)));
    return product ? res.json(serializeProduct(product)) : res.status(404).json({ error: "Product not found" });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const input = productInput(req.body as Record<string, unknown>);
    const [product] = await db.insert(productsTable).values(({
      slug: String(input.slug), name: String(input.name), nameAr: input.nameAr ?? null, nameEn: input.nameEn ?? null, description: String(input.description ?? ""),
      price: String(input.price), oldPrice: input.oldPrice == null ? null : String(input.oldPrice),
      imageUrl: String(input.imageUrl ?? ""),
      images: sql`${JSON.stringify((input.images ?? []) as string[])}::jsonb`,
      specifications: sql`${JSON.stringify((input.specifications ?? []) as string[])}::jsonb`,
      variants: sql`${JSON.stringify((input.variants ?? []) as Array<{ name: string; options: string[] }>)}::jsonb`,
      category: String(input.category), stock: Number(input.stock ?? 0),
      rating: String(input.rating ?? "4.80"), featured: Boolean(input.featured), active: input.active !== false,
      discountPercent: String(input.discountPercent ?? "0"), discountActive: Boolean(input.discountActive), discountStartsAt: input.discountStartsAt ?? null, discountEndsAt: input.discountEndsAt ?? null,
      installmentAvailable: Boolean(input.installmentAvailable), installmentMinMonths: input.installmentMinMonths ?? null, installmentMaxMonths: input.installmentMaxMonths ?? null,
    }) as any).returning();
    return res.status(201).json(serializeProduct(product));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return res.status(message.startsWith("name") || message.startsWith("Price") || message.startsWith("Stock") || message.startsWith("Variants") || message.startsWith("Installment") ? 400 : 500).json({ error: message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = idOf(String(req.params.id));
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid product id" });
    const input = productInput(req.body as Record<string, unknown>, true);
    const updateData: any = { ...input };
    if (input.images !== undefined) updateData.images = sql`${JSON.stringify(input.images)}::jsonb`;
    if (input.specifications !== undefined) updateData.specifications = sql`${JSON.stringify(input.specifications)}::jsonb`;
    if (input.variants !== undefined) updateData.variants = sql`${JSON.stringify(input.variants)}::jsonb`;
    const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
    return product ? res.json(serializeProduct(product)) : res.status(404).json({ error: "Product not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return res.status(400).json({ error: message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [product] = await db.update(productsTable).set({ active: false, updatedAt: new Date() }).where(eq(productsTable.id, idOf(String(req.params.id)))).returning();
    return product ? res.json({ message: "Product deactivated successfully" }) : res.status(404).json({ error: "Product not found" });
  } catch (error) {
    console.error("Error deactivating product:", error);
    return res.status(500).json({ error: "Failed to deactivate product" });
  }
});

export default router;
