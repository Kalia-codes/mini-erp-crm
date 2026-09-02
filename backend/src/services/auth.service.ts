import bcrypt from "bcryptjs";
import pool from "../config/database";
import { generateToken } from "../utils/jwt";

interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
}

type UserRole =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

/**
 * Login existing user
 */
export const loginUser = async (
  email: string,
  password: string
) => {
  const [rows] = await pool.execute(
    `
      SELECT id, name, email, password, role
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  const users = rows as UserRow[];

  if (users.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = users[0];

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Register a new employee user
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<number> => {
  const [existingRows] = await pool.execute(
    `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  const existingUsers = existingRows as {
    id: number;
  }[];

  if (existingUsers.length > 0) {
    throw new Error(
      "An account with this email already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const [result] = await pool.execute(
    `
      INSERT INTO users
      (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `,
    [
      name,
      email,
      hashedPassword,
      role,
    ]
  );

  return (result as { insertId: number }).insertId;
};