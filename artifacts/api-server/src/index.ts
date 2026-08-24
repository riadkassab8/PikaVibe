import app from "./app";
import { logger } from "./lib/logger";
import { seedCatalog } from "./lib/seed";

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

try {
  await seedCatalog();
  logger.info("Catalog seed check complete");
} catch (error) {
  logger.error({ error }, "Catalog seed check failed; the server will still start");
}

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});
