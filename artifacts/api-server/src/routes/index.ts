import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import productsRouter from "./products.js";
import ordersRouter from "./orders.js";
import adminRouter from "./admin.js";
import categoriesRouter from "./categories.js";
import settingsRouter from "./settings.js";
import couponsRouter from "./coupons.js";
import installmentPlansRouter from "./installment-plans.js";

const router: IRouter = Router();
router.use(healthRouter);
router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/orders", ordersRouter);
router.use("/admin", adminRouter);
router.use(settingsRouter);
router.use("/coupons", couponsRouter);
router.use("/installment-plans", installmentPlansRouter);

export default router;

