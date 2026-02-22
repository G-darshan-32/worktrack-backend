import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const signEmployeeToken = (emp) => {
  return jwt.sign(
    { employeeId: emp.id, idNo: emp.idNo, role: "employee" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    });

    const token = signToken(user);

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    return next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    return next(err);
  }
};

export const employeeLogin = async (req, res, next) => {
  try {
    const { idNo, password } = req.body;

    if (!idNo || !password) {
      return res.status(400).json({ message: "Employee ID and password are required" });
    }

    const employee = await prisma.employee.findFirst({
      where: { idNo: String(idNo).trim() }
    });

    if (!employee || !employee.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signEmployeeToken(employee);

    return res.json({
      employee: {
        id: employee.id,
        idNo: employee.idNo,
        name: employee.name,
        role: employee.role
      },
      token
    });
  } catch (err) {
    return next(err);
  }
};
