import prisma from "../config/prismaClient.js";

const getMonthRange = (month) => {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const startDate = new Date(month + "-01T00:00:00.000Z");
    const endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    endDate.setUTCDate(0);
    endDate.setUTCHours(23, 59, 59, 999);
    return { startDate, endDate };
  }
  return null;
};

export const getSalarySummary = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employeeId" });
    }

    const month = req.query.month;
    const range = getMonthRange(month);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const where = { employeeId, status: "PRESENT" };
    if (range) {
      where.date = { gte: range.startDate, lte: range.endDate };
    }

    const attendance = await prisma.attendance.findMany({ where });
    const presentDays = attendance.length;
    let totalSalary = 0;

    if (employee.salaryType === "DAILY") {
      totalSalary = employee.salaryAmount * presentDays;
    } else {
      totalSalary = employee.salaryAmount;
    }

    const now = new Date();
    const monthLabel = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return res.json({
      employeeId: employee.id,
      idNo: employee.idNo,
      name: employee.name,
      role: employee.role,
      salaryType: employee.salaryType,
      salaryAmount: employee.salaryAmount,
      presentDays,
      totalSalary,
      month: monthLabel
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllSalarySummaries = async (req, res, next) => {
  try {
    const month = req.query.month || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();
    const range = getMonthRange(month);

    const employees = await prisma.employee.findMany({
      orderBy: { name: "asc" }
    });

    const summaries = [];

    for (const employee of employees) {
      const where = { employeeId: employee.id, status: "PRESENT" };
      if (range) {
        where.date = { gte: range.startDate, lte: range.endDate };
      }
      const attendance = await prisma.attendance.findMany({ where });
      const presentDays = attendance.length;
      let totalSalary = 0;
      if (employee.salaryType === "DAILY") {
        totalSalary = employee.salaryAmount * presentDays;
      } else {
        totalSalary = employee.salaryAmount;
      }
      summaries.push({
        employeeId: employee.id,
        idNo: employee.idNo,
        name: employee.name,
        role: employee.role,
        salaryType: employee.salaryType,
        salaryAmount: employee.salaryAmount,
        presentDays,
        totalSalary
      });
    }

    const now = new Date();
    const monthLabel = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return res.json({ month: monthLabel, summaries });
  } catch (err) {
    return next(err);
  }
};
