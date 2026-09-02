import pool from "../config/database";

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: number;
  created_at: Date;
}

export interface StockMovementInput {
  product_id: number;
  quantity: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: number;
}

export const createStockMovement = async (
  movement: StockMovementInput
): Promise<number> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.execute(
      `SELECT id, current_stock
       FROM products
       WHERE id = ?
       FOR UPDATE`,
      [movement.product_id]
    );

    const products = productRows as {
      id: number;
      current_stock: number;
    }[];

    if (products.length === 0) {
      throw new Error("Product not found");
    }

    const currentStock = products[0].current_stock;

    if (
      movement.movement_type === "OUT" &&
      currentStock < movement.quantity
    ) {
      throw new Error(
        `Insufficient stock. Available stock: ${currentStock}`
      );
    }

    const newStock =
      movement.movement_type === "IN"
        ? currentStock + movement.quantity
        : currentStock - movement.quantity;

    await connection.execute(
      `UPDATE products
       SET current_stock = ?
       WHERE id = ?`,
      [newStock, movement.product_id]
    );

    const [result] = await connection.execute(
      `INSERT INTO stock_movements
       (product_id, quantity, movement_type, reason, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        movement.product_id,
        movement.quantity,
        movement.movement_type,
        movement.reason,
        movement.created_by,
      ]
    );

    await connection.commit();

    return (result as { insertId: number }).insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getStockMovements = async (
  productId?: number
): Promise<StockMovement[]> => {
  let query = `
    SELECT
      id,
      product_id,
      quantity,
      movement_type,
      reason,
      created_by,
      created_at
    FROM stock_movements
  `;

  const params: number[] = [];

  if (productId !== undefined) {
    query += ` WHERE product_id = ?`;
    params.push(productId);
  }

  query += ` ORDER BY id DESC`;

  const [rows] = await pool.execute(query, params);

  return rows as StockMovement[];
};