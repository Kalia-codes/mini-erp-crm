import pool from "../config/database";

export interface ChallanItemInput {
  product_id: number;
  quantity: number;
}

export interface CreateChallanInput {
  customer_id: number;
  items: ChallanItemInput[];
  created_by: number;
}

export const createChallan = async (
  input: CreateChallanInput
): Promise<{ id: number; challan_number: string }> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // =====================================================
    // CHECK CUSTOMER
    // =====================================================

    const [customerRows] = await connection.execute(
      `SELECT id
       FROM customers
       WHERE id = ?
       LIMIT 1`,
      [input.customer_id]
    );

    const customers = customerRows as { id: number }[];

    if (customers.length === 0) {
      throw new Error("Customer not found");
    }

    // =====================================================
    // VALIDATE ITEMS
    // =====================================================

    if (!input.items || input.items.length === 0) {
      throw new Error("At least one product is required");
    }

    const uniqueProductIds = new Set(
      input.items.map((item) => item.product_id)
    );

    if (uniqueProductIds.size !== input.items.length) {
      throw new Error(
        "Duplicate products are not allowed in a challan"
      );
    }

    // =====================================================
    // GENERATE CHALLAN NUMBER
    // =====================================================

    const [lastChallanRows] = await connection.execute(
      `SELECT challan_number
       FROM challans
       ORDER BY id DESC
       LIMIT 1`
    );

    const lastChallans = lastChallanRows as {
      challan_number: string;
    }[];

    let nextNumber = 1;

    if (lastChallans.length > 0) {
      const lastNumber = Number(
        lastChallans[0].challan_number.split("-").pop()
      );

      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const datePart = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const challanNumber = `CH-${datePart}-${String(
      nextNumber
    ).padStart(4, "0")}`;

    // =====================================================
    // CREATE CHALLAN AS DRAFT
    // =====================================================

    const [challanResult] = await connection.execute(
      `INSERT INTO challans
       (
         challan_number,
         customer_id,
         total_quantity,
         status,
         created_by
       )
       VALUES (?, ?, ?, 'DRAFT', ?)`,
      [
        challanNumber,
        input.customer_id,
        0,
        input.created_by,
      ]
    );

    const challanId = (
      challanResult as { insertId: number }
    ).insertId;

    let totalQuantity = 0;

    // =====================================================
    // STORE PRODUCT SNAPSHOTS
    // =====================================================

    for (const item of input.items) {
      if (
        !Number.isInteger(item.product_id) ||
        item.product_id <= 0
      ) {
        throw new Error("Invalid product ID");
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new Error(
          "Quantity must be a positive integer"
        );
      }

      const [productRows] = await connection.execute(
        `SELECT
           id,
           name,
           sku,
           unit_price
         FROM products
         WHERE id = ?
         LIMIT 1`,
        [item.product_id]
      );

      const products = productRows as {
        id: number;
        name: string;
        sku: string;
        unit_price: number;
      }[];

      if (products.length === 0) {
        throw new Error(
          `Product ${item.product_id} not found`
        );
      }

      const product = products[0];

      await connection.execute(
        `INSERT INTO challan_items
         (
           challan_id,
           product_id,
           product_name,
           sku,
           unit_price,
           quantity
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          challanId,
          product.id,
          product.name,
          product.sku,
          product.unit_price,
          item.quantity,
        ]
      );

      totalQuantity += item.quantity;
    }

    // =====================================================
    // UPDATE TOTAL QUANTITY
    // =====================================================

    await connection.execute(
      `UPDATE challans
       SET total_quantity = ?
       WHERE id = ?`,
      [totalQuantity, challanId]
    );

    await connection.commit();

    return {
      id: challanId,
      challan_number: challanNumber,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =====================================================
// GET ALL CHALLANS
// =====================================================

export const getChallans = async (): Promise<any[]> => {
  const [rows] = await pool.execute(
    `SELECT
       c.id,
       c.challan_number,
       c.customer_id,
       cu.name AS customer_name,
       cu.business_name,
       c.total_quantity,
       c.status,
       c.created_by,
       u.name AS created_by_name,
       c.created_at,
       c.updated_at
     FROM challans c
     INNER JOIN customers cu
       ON cu.id = c.customer_id
     INNER JOIN users u
       ON u.id = c.created_by
     ORDER BY c.id DESC`
  );

  return rows as any[];
};

// =====================================================
// GET CHALLAN BY ID
// =====================================================

export const getChallanById = async (
  id: number
): Promise<any | null> => {
  const [challanRows] = await pool.execute(
    `SELECT
       c.id,
       c.challan_number,
       c.customer_id,
       cu.name AS customer_name,
       cu.business_name,
       c.total_quantity,
       c.status,
       c.created_by,
       u.name AS created_by_name,
       c.created_at,
       c.updated_at
     FROM challans c
     INNER JOIN customers cu
       ON cu.id = c.customer_id
     INNER JOIN users u
       ON u.id = c.created_by
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  );

  const challans = challanRows as any[];

  if (challans.length === 0) {
    return null;
  }

  const [itemRows] = await pool.execute(
    `SELECT
       id,
       product_id,
       product_name,
       sku,
       unit_price,
       quantity
     FROM challan_items
     WHERE challan_id = ?
     ORDER BY id ASC`,
    [id]
  );

  return {
    ...challans[0],
    items: itemRows,
  };
};

// =====================================================
// CONFIRM CHALLAN
// =====================================================

export const confirmChallan = async (
  id: number,
  userId: number
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // =====================================================
    // LOCK CHALLAN
    // =====================================================

    const [challanRows] = await connection.execute(
      `SELECT
         id,
         status
       FROM challans
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    const challans = challanRows as {
      id: number;
      status: "DRAFT" | "CONFIRMED" | "CANCELLED";
    }[];

    if (challans.length === 0) {
      throw new Error("Challan not found");
    }

    if (challans[0].status !== "DRAFT") {
      throw new Error(
        `Challan cannot be confirmed because its status is ${challans[0].status}`
      );
    }

    // =====================================================
    // GET CHALLAN ITEMS
    // =====================================================

    const [itemRows] = await connection.execute(
      `SELECT
         id,
         product_id,
         quantity
       FROM challan_items
       WHERE challan_id = ?
       ORDER BY id ASC`,
      [id]
    );

    const items = itemRows as {
      id: number;
      product_id: number;
      quantity: number;
    }[];

    if (items.length === 0) {
      throw new Error("Challan has no products");
    }

    // =====================================================
    // LOCK AND VALIDATE ALL PRODUCTS FIRST
    // =====================================================

    const lockedProducts: {
      product_id: number;
      quantity: number;
      current_stock: number;
    }[] = [];

    for (const item of items) {
      const [productRows] = await connection.execute(
        `SELECT
           id,
           current_stock
         FROM products
         WHERE id = ?
         FOR UPDATE`,
        [item.product_id]
      );

      const products = productRows as {
        id: number;
        current_stock: number;
      }[];

      if (products.length === 0) {
        throw new Error(
          `Product ${item.product_id} not found`
        );
      }

      if (products[0].current_stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.product_id}. Available stock: ${products[0].current_stock}, required: ${item.quantity}`
        );
      }

      lockedProducts.push({
        product_id: item.product_id,
        quantity: item.quantity,
        current_stock: products[0].current_stock,
      });
    }

    // =====================================================
    // DEDUCT STOCK + CREATE OUT MOVEMENTS
    // =====================================================

    for (const product of lockedProducts) {
      const newStock =
        product.current_stock - product.quantity;

      await connection.execute(
        `UPDATE products
         SET current_stock = ?
         WHERE id = ?`,
        [newStock, product.product_id]
      );

      await connection.execute(
        `INSERT INTO stock_movements
         (
           product_id,
           quantity,
           movement_type,
           reason,
           created_by
         )
         VALUES (?, ?, 'OUT', ?, ?)`,
        [
          product.product_id,
          product.quantity,
          "Sales challan confirmation",
          userId,
        ]
      );
    }

    // =====================================================
    // MARK CHALLAN CONFIRMED
    // =====================================================

    await connection.execute(
      `UPDATE challans
       SET status = 'CONFIRMED'
       WHERE id = ?`,
      [id]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =====================================================
// CANCEL CHALLAN
// =====================================================

export const cancelChallan = async (
  id: number
): Promise<void> => {
  const [result] = await pool.execute(
    `UPDATE challans
     SET status = 'CANCELLED'
     WHERE id = ?
       AND status = 'DRAFT'`,
    [id]
  );

  const affectedRows = (
    result as {
      affectedRows: number;
    }
  ).affectedRows;

  if (affectedRows === 0) {
    const challan = await getChallanById(id);

    if (!challan) {
      throw new Error("Challan not found");
    }

    throw new Error(
      `Challan cannot be cancelled because its status is ${challan.status}`
    );
  }
};