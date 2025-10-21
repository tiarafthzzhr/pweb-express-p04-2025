import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";
import { generateToken } from "../utils/jwt";
import { response } from "../utils/response";

// POST /auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Cek email sudah dipakai belum
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json(response(false, "Email already registered"));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru
    const user = await prisma.users.create({
      data: { username, email, password: hashedPassword },
    });

    return res.status(201).json(response(true, "User registered successfully", user));
  } catch (error) {
    return res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(404).json(response(false, "User not found"));

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json(response(false, "Invalid password"));

    const token = generateToken({ id: user.id, email: user.email });

    return res.status(200).json(response(true, "Login success", { token }));
  } catch (error) {
    return res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// GET /auth/me
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json(response(false, "User not found"));

    return res.status(200).json(response(true, "User profile", user));
  } catch (error) {
    return res.status(500).json(response(false, "Internal Server Error", error));
  }
};