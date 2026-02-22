import bcrypt from "bcryptjs";
import prisma from "../config/prismaClient.js";

const omitPassword = (emp) => {
  const { password, ...rest } = emp;
  return rest;
};

export const getEmployees = async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" }
    });
    return res.json(employees.map(omitPassword));
  } catch (err) {
    return next(err);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const { idNo, name, role, salaryType, salaryAmount, password } = req.body;

    if (!idNo || !name || !role || !salaryType || salaryAmount == null) {
      return res.status(400).json({
        message: "idNo, name, role, salaryType and salaryAmount are required"
      });
    }

    const existingIdNo = await prisma.employee.findFirst({
      where: { idNo: String(idNo).trim() }
    });
    if (existingIdNo) {
      return res.status(400).json({ message: "Employee ID already in use" });
    }

    if (!["DAILY", "MONTHLY"].includes(salaryType)) {
      return res.status(400).json({
        message: "salaryType must be DAILY or MONTHLY"
      });
    }

    const amount = Number(salaryAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: "salaryAmount must be a positive number"
      });
    }

    const data = {
      idNo: String(idNo).trim(),
      name,
      role,
      salaryType,
      salaryAmount: amount
    };

    if (password && String(password).length >= 4) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(String(password), salt);
    }

    const employee = await prisma.employee.create({ data });
    const { password: _, ...result } = employee;
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(omitPassword(employee));
  } catch (err) {
    return next(err);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    const { idNo, name, role, salaryType, salaryAmount, password } = req.body;

    const data = {};
    if (idNo != null) {
      const trimmed = String(idNo).trim();
      const existing = await prisma.employee.findFirst({
        where: { idNo: trimmed, NOT: { id } }
      });
      if (existing) {
        return res.status(400).json({ message: "Employee ID already in use" });
      }
      data.idNo = trimmed;
    }
    if (name != null) data.name = name;
    if (role != null) data.role = role;
    if (salaryType != null) {
      if (!["DAILY", "MONTHLY"].includes(salaryType)) {
        return res.status(400).json({
          message: "salaryType must be DAILY or MONTHLY"
        });
      }
      data.salaryType = salaryType;
    }
    if (salaryAmount != null) {
      const amount = Number(salaryAmount);
      if (Number.isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          message: "salaryAmount must be a positive number"
        });
      }
      data.salaryAmount = amount;
    }
    if (password !== undefined) {
      if (password && String(password).length >= 4) {
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(String(password), salt);
      } else {
        data.password = null;
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data
    });
    const { password: _, ...result } = employee;
    return res.json(result);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Employee not found" });
    }
    return next(err);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }

    await prisma.employee.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Employee not found" });
    }
    return next(err);
  }
};
