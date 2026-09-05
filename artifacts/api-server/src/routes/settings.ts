import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { storeSettingsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

const defaults = {
  storeName: "PikaVibe",
  logoUrl: "",
  primaryColor: "#C8722E",
  inkColor: "#3D2A1E",
  backgroundColor: "#f4ecdf",
  surfaceColor: "#fbf8f3",
  secondaryColor: "#ead9c0",
  accentColor: "#d9a77d",
  successColor: "#2E9B68",
  mutedTextColor: "#765e4c",
};

type StoreSettingsPayload = typeof defaults;

function toPublicSettings(row?: Partial<StoreSettingsPayload> | null): StoreSettingsPayload {
  return { ...defaults, ...(row || {}) };
}

function validHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function readPayload(body: any): StoreSettingsPayload {
  const next = toPublicSettings(body);
  if (next.storeName.trim().length < 1 || next.storeName.trim().length > 80) throw new Error("Store name must be between 1 and 80 characters");
  if (next.logoUrl.length > 2_000_000) throw new Error("Logo file is too large");
  for (const key of ["primaryColor", "inkColor", "backgroundColor", "surfaceColor", "secondaryColor", "accentColor", "successColor", "mutedTextColor"] as const) {
    if (!validHex(next[key])) throw new Error(`${key} must be a valid six-digit hex color`);
  }
  return { ...next, storeName: next.storeName.trim(), logoUrl: next.logoUrl.trim() };
}

async function loadSettings(): Promise<StoreSettingsPayload> {
  const [row] = await db.select().from(storeSettingsTable).limit(1);
  return toPublicSettings(row);
}

router.get("/store-settings", async (_req, res) => {
  try {
    return res.json(await loadSettings());
  } catch (error) {
    console.error("Error fetching store settings:", error);
    return res.json(defaults);
  }
});

router.get("/admin/store-settings", requireAdmin, async (_req, res) => {
  try {
    return res.json(await loadSettings());
  } catch (error) {
    console.error("Error fetching admin store settings:", error);
    return res.status(500).json({ error: "Failed to fetch store settings" });
  }
});

router.put("/admin/store-settings", requireAdmin, async (req, res) => {
  try {
    const values = readPayload(req.body || {});
    await db.insert(storeSettingsTable).values({ id: 1, ...values }).onConflictDoUpdate({
      target: storeSettingsTable.id,
      set: { ...values, updatedAt: new Date() },
    });
    return res.json(values);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save store settings";
    return res.status(message.includes("must be") || message.includes("too large") ? 400 : 500).json({ error: message });
  }
});

export default router;
