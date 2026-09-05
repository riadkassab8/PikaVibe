import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { installmentPlansTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const plans = await db.select().from(installmentPlansTable).orderBy(asc(installmentPlansTable.providerName));
    return res.json(plans);
  } catch (error) {
    console.error("Error fetching installment plans:", error);
    return res.status(500).json({ error: "Failed to fetch installment plans" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const providerName = String(req.body?.providerName || "").trim();
    if (providerName.length < 2 || providerName.length > 80) return res.status(400).json({ error: "Provider name must be between 2 and 80 characters" });
    
    const inserted = await db.insert(installmentPlansTable).values({
      providerName,
      providerNameAr: req.body?.providerNameAr || null,
      providerNameEn: req.body?.providerNameEn || null,
      minMonths: Number(req.body?.minMonths) || 1,
      maxMonths: Number(req.body?.maxMonths) || 12,
      interestRate: String(req.body?.interestRate || "0"),
      active: req.body?.active !== false
    }).returning();
    const plan = (inserted as any[])[0];
    
    return res.status(201).json(plan);
  } catch (error: any) {
    console.error("Error creating installment plan:", error);
    return res.status(500).json({ error: "Failed to create installment plan" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    const providerName = String(req.body?.providerName || "").trim();
    if (!Number.isInteger(id) || providerName.length < 2 || providerName.length > 80) return res.status(400).json({ error: "A valid id and provider name are required" });
    
    const updated = await db.update(installmentPlansTable).set({
      providerName,
      providerNameAr: req.body?.providerNameAr || null,
      providerNameEn: req.body?.providerNameEn || null,
      minMonths: Number(req.body?.minMonths) || 1,
      maxMonths: Number(req.body?.maxMonths) || 12,
      interestRate: String(req.body?.interestRate || "0"),
      active: req.body?.active !== false,
      updatedAt: new Date()
    }).where(eq(installmentPlansTable.id, id)).returning();
    const plan = (updated as any[])[0];
    
    return plan ? res.json(plan) : res.status(404).json({ error: "Installment plan not found" });
  } catch (error: any) {
    console.error("Error updating installment plan:", error);
    return res.status(500).json({ error: "Failed to update installment plan" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    
    await db.delete(installmentPlansTable).where(eq(installmentPlansTable.id, id));
    return res.json({ message: "Installment plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting installment plan:", error);
    return res.status(500).json({ error: "Failed to delete installment plan" });
  }
});

export default router;
