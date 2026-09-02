import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import productRoutes from "./routes/product.routes";
import stockMovementRoutes from "./routes/stockMovement.routes";
import challanRoutes from "./routes/challan.routes";

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Mini ERP CRM API is running",
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use("/api/auth", authRoutes);

// Customers
app.use("/api/customers", customerRoutes);

// Products
app.use("/api/products", productRoutes);

// Stock Movements
app.use("/api/stock-movements", stockMovementRoutes);

// Sales Challans
app.use("/api/challans", challanRoutes);

export default app;