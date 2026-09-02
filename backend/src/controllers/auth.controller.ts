import { Request, Response } from "express";

import {
  loginUser,
  registerUser,
} from "../services/auth.service";

type UserRole =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

/**
 * Login existing user
 */
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const result = await loginUser(
      email.trim().toLowerCase(),
      password
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * Register new employee user
 */
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    // Required field validation
    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      res.status(400).json({
        success: false,
        message:
          "Name, email, password and role are required",
      });
      return;
    }

    // Allowed roles
    const allowedRoles: UserRole[] = [
      "ADMIN",
      "SALES",
      "WAREHOUSE",
      "ACCOUNTS",
    ];

    if (
      !allowedRoles.includes(
        role as UserRole
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid role",
      });
      return;
    }

    // Basic password validation
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
      return;
    }

    // Clean input
    const cleanName = name.trim();
    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanName) {
      res.status(400).json({
        success: false,
        message: "Name is required",
      });
      return;
    }

    // Create user
    const userId = await registerUser(
      cleanName,
      cleanEmail,
      password,
      role as UserRole
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    // Duplicate email
    if (
      message ===
      "An account with this email already exists"
    ) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};