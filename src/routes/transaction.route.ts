import { Router } from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionDetail,
  getTransactionStatistics,
} from "../controllers/transaction.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// semua transaksi harus login dulu
router.post("/", authenticate, createTransaction);
router.get("/", authenticate, getAllTransactions);
router.get("/:transaction_id", authenticate, getTransactionDetail);
router.get("/statistics", authenticate, getTransactionStatistics);

export default router;