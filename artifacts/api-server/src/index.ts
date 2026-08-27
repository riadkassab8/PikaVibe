import app from "./app";
import { logger } from "./lib/logger";
import { seedCatalog } from "./lib/seed";

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

export default async function handler(req: Parameters<typeof app>[0], res: Parameters<typeof app>[1]) {
  await ensureSeeded();
  return app(req, res);
}

if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}`);
  }
  void ensureSeeded().then(() => {
    app.listen(port, () => {
      logger.info({ port }, "Server listening");
    });
  });
}
