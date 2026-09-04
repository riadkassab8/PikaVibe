import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../../../lib/db/src/index";
import { categoriesTable, productsTable } from "../../../../lib/db/src/schema/index";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();
const DEFAULT_CATEGORIES = ["Cookware", "Storage", "Cleaning", "Bathroom", "Small Appliances", "Dining"];

async function ensureDefaultCategories() {
  const existing = await db.select({ name: categoriesTable.name }).from(categoriesTable);
  if (existing.length) return;
  await db.insert(categoriesTable).values(DEFAULT_CATEGORIES.map((name) => ({ name, slug: slugify(name), active: true })));
}

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `category-${Date.now()}`;
}

router.get("/", async (_req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.active, true)).orderBy(asc(categoriesTable.name));
    return res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/all", requireAdmin, async (_req, res) => {
  try {
    await ensureDefaultCategories();
    return res.json(await db.select().from(categoriesTable).orderBy(asc(categoriesTable.name)));
  } catch (error) {
    console.error("Error fetching all categories:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const nameAr = String(req.body?.nameAr || "").trim();
    const nameEn = String(req.body?.nameEn || "").trim();
    const name = String(req.body?.name || nameEn || nameAr).trim();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Category name must be between 2 and 80 characters" });
    const [category] = await db.insert(categoriesTable).values({ name, nameAr: nameAr || null, nameEn: nameEn || null, slug: slugify(String(req.body?.slug || nameEn || name)), active: req.body?.active !== false }).returning();
    return res.status(201).json(category);
  } catch (error: any) {
    if (error?.code === "23505") return res.status(409).json({ error: "A category with this name or slug already exists" });
    console.error("Error creating category:", error);
    return res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    const nameAr = String(req.body?.nameAr || "").trim();
    const nameEn = String(req.body?.nameEn || "").trim();
    const name = String(req.body?.name || nameEn || nameAr).trim();
    if (!Number.isInteger(id) || name.length < 2 || name.length > 80) return res.status(400).json({ error: "A valid category id and name are required" });
    const [category] = await db.update(categoriesTable).set({ name, nameAr: nameAr || null, nameEn: nameEn || null, slug: slugify(String(req.body?.slug || nameEn || name)), active: req.body?.active !== false, updatedAt: new Date() }).where(eq(categoriesTable.id, id)).returning();
    return category ? res.json(category) : res.status(404).json({ error: "Category not found" });
  } catch (error: any) {
    if (error?.code === "23505") return res.status(409).json({ error: "A category with this name or slug already exists" });
    console.error("Error updating category:", error);
    return res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid category id" });
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    if (!category) return res.status(404).json({ error: "Category not found" });
    const [usage] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.category, category.name));
    if (Number(usage?.count || 0) > 0) return res.status(409).json({ error: "Move or rename products in this category before deleting it" });
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
