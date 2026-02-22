import prisma from "../config/prismaClient.js";

export const markAttendance = async (req, res, next) => {
  try {
    const { employeeId, status, date } = req.body;

    const id = Number(employeeId);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid employeeId" });
    }

    if (!["PRESENT", "ABSENT"].includes(status)) {
      return res.status(400).json({
        message: "status must be PRESENT or ABSENT"
      });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const recordDate = date ? new Date(date) : new Date();
    if (Number.isNaN(recordDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const dayStart = new Date(Date.UTC(
      recordDate.getUTCFullYear(),
      recordDate.getUTCMonth(),
      recordDate.getUTCDate()
    ));
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: id,
        date: { gte: dayStart, lt: dayEnd }
      }
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          employeeId: id,
          status,
          date: recordDate
        }
      });
    }

    return res.status(existing ? 200 : 201).json(attendance);
  } catch (err) {
    return next(err);
  }
};

export const getAttendanceByEmployee = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ message: "Invalid employeeId" });
    }

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
      employee,
      attendance: records
    });
  } catch (err) {
    return next(err);
  }
};
