import pool from "../config/database";

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  business_name: string;
  gst_number?: string | null;
  customer_type: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address?: string | null;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  follow_up_date?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CustomerInput {
  name: string;
  mobile: string;
  email?: string;
  business_name: string;
  gst_number?: string;
  customer_type: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address?: string;
  status?: "LEAD" | "ACTIVE" | "INACTIVE";
  follow_up_date?: string;
  notes?: string;
}

export const createCustomer = async (
  customer: CustomerInput
): Promise<number> => {
  const [result] = await pool.execute(
    `INSERT INTO customers
    (
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customer.name,
      customer.mobile,
      customer.email || null,
      customer.business_name,
      customer.gst_number || null,
      customer.customer_type,
      customer.address || null,
      customer.status || "LEAD",
      customer.follow_up_date || null,
      customer.notes || null,
    ]
  );

  const insertResult = result as { insertId: number };

  return insertResult.insertId;
};

export const getCustomers = async (
  search?: string
): Promise<Customer[]> => {
  let query = `
    SELECT
      id,
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
      created_at,
      updated_at
    FROM customers
  `;

  const params: string[] = [];

  if (search) {
    query += `
      WHERE
        name LIKE ?
        OR mobile LIKE ?
        OR business_name LIKE ?
        OR email LIKE ?
    `;

    const searchValue = `%${search}%`;

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  query += ` ORDER BY id DESC`;

  const [rows] = await pool.execute(query, params);

  return rows as Customer[];
};

export const getCustomerById = async (
  id: number
): Promise<Customer | null> => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
      created_at,
      updated_at
    FROM customers
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  const customers = rows as Customer[];

  return customers.length > 0 ? customers[0] : null;
};

export const updateCustomer = async (
  id: number,
  customer: CustomerInput
): Promise<boolean> => {
  const [result] = await pool.execute(
    `UPDATE customers
    SET
      name = ?,
      mobile = ?,
      email = ?,
      business_name = ?,
      gst_number = ?,
      customer_type = ?,
      address = ?,
      status = ?,
      follow_up_date = ?,
      notes = ?
    WHERE id = ?`,
    [
      customer.name,
      customer.mobile,
      customer.email || null,
      customer.business_name,
      customer.gst_number || null,
      customer.customer_type,
      customer.address || null,
      customer.status || "LEAD",
      customer.follow_up_date || null,
      customer.notes || null,
      id,
    ]
  );

  const updateResult = result as { affectedRows: number };

  return updateResult.affectedRows > 0;
};