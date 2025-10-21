import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { response } from "../utils/response";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json(response(false, "Missing or invalid token"));
  }

  const token = header.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json(response(false, "Invalid or expired token"));
  }

  (req as any).user = decoded;
  next();
};