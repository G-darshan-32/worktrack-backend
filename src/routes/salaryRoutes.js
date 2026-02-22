import { Router } from "express";
import { getSalarySummary, getAllSalarySummaries } from "../controllers/salaryController.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/", getAllSalarySummaries);
router.get("/:employeeId", getSalarySummary);

export default router;
