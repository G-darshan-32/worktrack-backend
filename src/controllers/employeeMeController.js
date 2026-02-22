import prisma from "../config/prismaClient.js";

export const getMyAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.employee;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const records = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: "desc" }
    });

    return res.json({
      employee: {
        id: employee.id,
        idNo: employee.idNo,
        name: employee.name,
        role: employee.role
      },
      attendance: records
    });
  } catch (err) {
    return next(err);
  }
};

export const getMySalary = async (req, res, next) => {
  try {
    const { employeeId } = req.employee;
    const month = req.query.month;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let startDate;
    let endDate;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      startDate = new Date(month + "-01T00:00:00.000Z");
      endDate = new Date(startDate);
      endDate.setUTCMonth(endDate.getUTCMonth() + 1);
      endDate.setUTCDate(0);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      endDate = new Date();
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId,
        status: "PRESENT",
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const presentDays = attendance.length;
    let totalSalary = 0;

    if (employee.salaryType === "DAILY") {
      totalSalary = employee.salaryAmount * presentDays;
    } else {
      totalSalary = employee.salaryAmount;
    }

    return res.json({
      employeeId: employee.id,
      idNo: employee.idNo,
      name: employee.name,
      role: employee.role,
      salaryType: employee.salaryType,
      salaryAmount: employee.salaryAmount,
      presentDays,
      totalSalary,
      month: month || `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, "0")}`
    });
  } catch (err) {
    return next(err);
  }
};
