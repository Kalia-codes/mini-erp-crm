import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type UserRole =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

/*
|--------------------------------------------------------------------------
| AuthRequest
|--------------------------------------------------------------------------
| Used by the Product controller.
*/

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/*
|--------------------------------------------------------------------------
| Extend Express Request
|--------------------------------------------------------------------------
| Allows req.user in the existing controllers and middleware.
*/

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/*
|--------------------------------------------------------------------------
| JWT Authentication
|--------------------------------------------------------------------------
*/

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "JWT secret is not configured",
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as AuthUser;

    if (
      !decoded.id ||
      !decoded.email ||
      !decoded.role
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Existing routes use `authenticate`
|--------------------------------------------------------------------------
*/

export const authenticate = authenticateToken;