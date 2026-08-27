import { eq, sql } from "drizzle-orm";
import { db } from "../../../../lib/db/src/index.js";
import { productsTable } from "../../../../lib/db/src/schema/index.js";

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
const catalog = [
  ["cast-iron-skillet", "12-inch Cast Iron Skillet", "Cookware", 2850, 3300, "photo-1556909212-d5b604d0c90d", 8, true],
  ["copper-saucepan", "Copper Glow Saucepan", "Cookware", 3950, 4500, "photo-1584990347449-ae8b7a0e3b7f", 6, false],
  ["glass-pantry-set", "Clear Pantry Jar Set", "Storage", 2200, 2600, "photo-1583947215259-38e31be8751f", 12, true],
  ["stackable-baskets", "Stackable Kiondo Baskets", "Storage", 1800, null, "photo-1558618666-fcd25c85cd64", 9, false],
  ["bamboo-utensils", "Bamboo Cooking Utensil Set", "Cookware", 1450, null, "photo-1556911220-bff31c812dba", 14, true],
  ["countertop-kettle", "Cream Pour Electric Kettle", "Small Appliances", 4200, null, "photo-1570222094114-d054a817e56b", 5, false],
  ["scrub-brush-trio", "Home Reset Brush Trio", "Cleaning", 980, null, "photo-1583947215259-38e31be8751f", 10, false],
  ["linen-hand-towels", "Woven Kitchen Cloths", "Cleaning", 1250, null, "photo-1604014237800-1c9102c219da", 11, false],
  ["bathroom-organiser", "Stoneware Bath Organiser", "Bathroom", 1650, null, "photo-1556228578-8c89e6adf883", 7, true],
  ["lunchbox", "Everyday Stainless Lunchbox", "Storage", 2100, null, "photo-1606787366850-de6330128bfc", 8, false],
  ["ceramic-serving-bowl", "Sunset Serving Bowl", "Dining", 2400, null, "photo-1610701596007-11502861dcfa", 6, false],
] as const;

export async function seedCatalog() {
  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
  if (Number(existing?.count || 0) > 0) return;
  await db.insert(productsTable).values(catalog.map(([slug, name, category, price, oldPrice, imageId, stock, featured]) => ({
    slug, name, category, price: price.toFixed(2), oldPrice: oldPrice ? oldPrice.toFixed(2) : null,
    imageUrl: photo(imageId), images: [photo(imageId)], specifications: [], variants: [], description: "A carefully selected everyday home essential for the PikaVibe collection.",
    stock, featured, active: true, rating: "4.80",
  })));
}
