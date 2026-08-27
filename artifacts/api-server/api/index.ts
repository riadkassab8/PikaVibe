import app from "../src/app";
import { logger } from "../src/lib/logger";
import { seedCatalog } from "../src/lib/seed";

let seedPromise: Promise<void> | undefined;

function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedCatalog()
      .then(() => logger.info("Catalog seed check complete"))
      .catch((error) => {
        logger.error({ error }, "Catalog seed check failed; the request will still continue");
      });
  }
  return seedPromise;
}

export default async function handler(req: any, res: any) {
  await ensureSeeded();
  return app(req, res);
}
