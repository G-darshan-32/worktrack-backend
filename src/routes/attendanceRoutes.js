import { Router } from "express";
import {
  markAttendance,
  getAttendanceByEmployee
} from "../controllers/attendanceController.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateAdmin);

router.post("/", markAttendance);
router.get("/:employeeId", getAttendanceByEmployee);

export default router;
