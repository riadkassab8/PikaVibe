import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import categoriesRouter from "./categories";

const router: IRouter = Router();
router.use(healthRouter);
router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/orders", ordersRouter);
router.use("/admin", adminRouter);

export default router;

