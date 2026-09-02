import pool from "../config/database";

export interface ProductInput {
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string;
}

export interface ProductUpdateInput {
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string;
}

interface ProductRow {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string;
  created_at: Date;
  updated_at: Date;
}

interface StockMovementRow {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: number;
  created_by_name: string;
  created_at: Date;
}

/**
 * Get all products
 */
export const getProducts = async (
  search?: string,
  category?: string
): Promise<ProductRow[]> => {
  let query = `
    SELECT
      id,
      name,
      sku,
      category,
      unit_price,
      current_stock,
      minimum_stock,
      warehouse_location,
      created_at,
      updated_at
    FROM products
    WHERE 1 = 1
  `;

  const params: (string | number)[] = [];

  if (search) {
    query += `
      AND (
        name LIKE ?
        OR sku LIKE ?
        OR category LIKE ?
      )
    `;

    const searchValue = `%${search}%`;

    params.push(searchValue, searchValue, searchValue);
  }

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await pool.execute(query, params);

  return rows as ProductRow[];
};

/**
 * Get one product
 */
export const getProductById = async (
  productId: number
): Promise<ProductRow | null> => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        name,
        sku,
        category,
        unit_price,
        current_stock,
        minimum_stock,
        warehouse_location,
        created_at,
        updated_at
      FROM products
      WHERE id = ?
      LIMIT 1
    `,
    [productId]
  );

  const products = rows as ProductRow[];

  return products.length > 0 ? products[0] : null;
};

/**
 * Create product
 */
export const createProduct = async (
  data: ProductInput
): Promise<ProductRow> => {
  const [existingRows] = await pool.execute(
    `
      SELECT id
      FROM products
      WHERE sku = ?
      LIMIT 1
    `,
    [data.sku]
  );

  const existingProducts = existingRows as { id: number }[];

  if (existingProducts.length > 0) {
    throw new Error("SKU already exists");
  }

  const [result] = await pool.execute(
    `
      INSERT INTO products (
        name,
        sku,
        category,
        unit_price,
        current_stock,
        minimum_stock,
        warehouse_location
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.name,
      data.sku,
      data.category,
      data.unit_price,
      data.current_stock,
      data.minimum_stock,
      data.warehouse_location,
    ]
  );

  const insertResult = result as { insertId: number };

  const product = await getProductById(insertResult.insertId);

  if (!product) {
    throw new Error("Product could not be created");
  }

  return product;
};

/**
 * Update product
 */
export const updateProduct = async (
  productId: number,
  data: ProductUpdateInput
): Promise<ProductRow> => {
  const existingProduct = await getProductById(productId);

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  const [duplicateRows] = await pool.execute(
    `
      SELECT id
      FROM products
      WHERE sku = ?
      AND id != ?
      LIMIT 1
    `,
    [data.sku, productId]
  );

  const duplicateProducts = duplicateRows as { id: number }[];

  if (duplicateProducts.length > 0) {
    throw new Error("SKU already exists");
  }

  await pool.execute(
    `
      UPDATE products
      SET
        name = ?,
        sku = ?,
        category = ?,
        unit_price = ?,
        current_stock = ?,
        minimum_stock = ?,
        warehouse_location = ?
      WHERE id = ?
    `,
    [
      data.name,
      data.sku,
      data.category,
      data.unit_price,
      data.current_stock,
      data.minimum_stock,
      data.warehouse_location,
      productId,
    ]
  );

  const updatedProduct = await getProductById(productId);

  if (!updatedProduct) {
    throw new Error("Product could not be updated");
  }

  return updatedProduct;
};

/**
 * Add stock movement
 *
 * IN  -> increases stock
 * OUT -> decreases stock
 */
export const createStockMovement = async (
  productId: number,
  quantity: number,
  movementType: "IN" | "OUT",
  reason: string,
  createdBy: number
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.execute(
      `
        SELECT
          id,
          name,
          sku,
          current_stock
        FROM products
        WHERE id = ?
        FOR UPDATE
      `,
      [productId]
    );

    const products = productRows as {
      id: number;
      name: string;
      sku: string;
      current_stock: number;
    }[];

    if (products.length === 0) {
      throw new Error("Product not found");
    }

    const product = products[0];

    let newStock = product.current_stock;

    if (movementType === "IN") {
      newStock = product.current_stock + quantity;
    } else {
      if (product.current_stock < quantity) {
        throw new Error(
          `Insufficient stock. Available stock: ${product.current_stock}`
        );
      }

      newStock = product.current_stock - quantity;
    }

    await connection.execute(
      `
        UPDATE products
        SET current_stock = ?
        WHERE id = ?
      `,
      [newStock, productId]
    );

    await connection.execute(
      `
        INSERT INTO stock_movements (
          product_id,
          quantity,
          movement_type,
          reason,
          created_by
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        productId,
        quantity,
        movementType,
        reason,
        createdBy,
      ]
    );

    await connection.commit();

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      previousStock: product.current_stock,
      quantity,
      movementType,
      newStock,
      reason,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get stock movement log
 */
export const getStockMovements = async (
  productId?: number
): Promise<StockMovementRow[]> => {
  let query = `
    SELECT
      sm.id,
      sm.product_id,
      p.name AS product_name,
      p.sku,
      sm.quantity,
      sm.movement_type,
      sm.reason,
      sm.created_by,
      u.name AS created_by_name,
      sm.created_at
    FROM stock_movements sm
    INNER JOIN products p
      ON p.id = sm.product_id
    INNER JOIN users u
      ON u.id = sm.created_by
  `;

  const params: number[] = [];

  if (productId) {
    query += ` WHERE sm.product_id = ?`;
    params.push(productId);
  }

  query += ` ORDER BY sm.created_at DESC`;

  const [rows] = await pool.execute(query, params);

  return rows as StockMovementRow[];
};