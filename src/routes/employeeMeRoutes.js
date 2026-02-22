import { Router } from "express";
import { getMyAttendance, getMySalary } from "../controllers/employeeMeController.js";
import { authenticateEmployee } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateEmployee);

router.get("/me/attendance", getMyAttendance);
router.get("/me/salary", getMySalary);

export default router;
