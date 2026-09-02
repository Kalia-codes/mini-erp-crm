import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const sslCA = process.env.DB_SSL_CA
  ? Buffer.from(process.env.DB_SSL_CA, "base64").toString("utf8")
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ...(sslCA && {
    ssl: {
      ca: sslCA,
      rejectUnauthorized: true,
    },
  }),
});

export default pool;