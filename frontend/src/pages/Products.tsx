import { useEffect, useMemo, useState } from "react";
import "./Products.css";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  current_stock: string;
  minimum_stock: string;
  warehouse_location: string;
}

interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unit_price: "",
  current_stock: "",
  minimum_stock: "",
  warehouse_location: "",
};

const getToken = (): string | null => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken")
  );
};

const authHeaders = (): HeadersInit => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const formatDate = (value: string): string => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (value: number): string => {
  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [loading, setLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showProductModal, setShowProductModal] =
    useState(false);

  const [showStockModal, setShowStockModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>(
    emptyForm
  );

  const [stockForm, setStockForm] = useState({
    quantity: "",
    movement_type: "IN" as "IN" | "OUT",
    reason: "",
  });

  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Products
  |--------------------------------------------------------------------------
  */

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (categoryFilter) {
        params.append("category", categoryFilter);
      }

      const query = params.toString()
        ? `?${params.toString()}`
        : "";

      const response = await fetch(
        `${API_BASE_URL}/products${query}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch products"
        );
      }

      setProducts(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Stock Movements
  |--------------------------------------------------------------------------
  */

  const loadMovements = async () => {
    try {
      setMovementLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/products/stock-movements/list`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch stock movements"
        );
      }

      setMovements(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch stock movements"
      );
    } finally {
      setMovementLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter]);

  useEffect(() => {
    loadMovements();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Categories
  |--------------------------------------------------------------------------
  */

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      )
    ).sort();
  }, [products]);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) =>
      product.current_stock <= product.minimum_stock
  ).length;

  const totalUnits = products.reduce(
    (total, product) =>
      total + Number(product.current_stock),
    0
  );

  const totalInventoryValue = products.reduce(
    (total, product) =>
      total +
      Number(product.current_stock) *
        Number(product.unit_price),
    0
  );

  /*
  |--------------------------------------------------------------------------
  | Form Helpers
  |--------------------------------------------------------------------------
  */

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowProductModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit_price: String(product.unit_price),
      current_stock: String(product.current_stock),
      minimum_stock: String(product.minimum_stock),
      warehouse_location: product.warehouse_location,
    });

    setError("");
    setSuccess("");
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    if (saving) return;

    setShowProductModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleFormChange = (
    field: keyof ProductForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Save Product
  |--------------------------------------------------------------------------
  */

  const handleProductSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.sku.trim() ||
      !form.category.trim() ||
      !form.unit_price ||
      !form.current_stock ||
      !form.minimum_stock ||
      !form.warehouse_location.trim()
    ) {
      setError("Please complete all product fields.");
      return;
    }

    const unitPrice = Number(form.unit_price);
    const currentStock = Number(form.current_stock);
    const minimumStock = Number(form.minimum_stock);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError("Enter a valid unit price.");
      return;
    }

    if (
      !Number.isInteger(currentStock) ||
      currentStock < 0
    ) {
      setError("Current stock must be a valid number.");
      return;
    }

    if (
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      setError("Minimum stock must be a valid number.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingProduct);

      const endpoint = isEditing
        ? `${API_BASE_URL}/products/${editingProduct!.id}`
        : `${API_BASE_URL}/products`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim(),
          category: form.category.trim(),
          unit_price: unitPrice,
          current_stock: currentStock,
          minimum_stock: minimumStock,
          warehouse_location:
            form.warehouse_location.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to ${
              isEditing ? "update" : "create"
            } product`
        );
      }

      setSuccess(
        isEditing
          ? "Product updated successfully."
          : "Product created successfully."
      );

      setShowProductModal(false);
      setEditingProduct(null);
      setForm(emptyForm);

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Stock Modal
  |--------------------------------------------------------------------------
  */

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);

    setStockForm({
      quantity: "",
      movement_type: "IN",
      reason: "",
    });

    setError("");
    setSuccess("");
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    if (stockSaving) return;

    setShowStockModal(false);
    setSelectedProduct(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Stock Movement
  |--------------------------------------------------------------------------
  */

  const handleStockSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedProduct) return;

    setError("");
    setSuccess("");

    const quantity = Number(stockForm.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!stockForm.reason.trim()) {
      setError("Please enter a reason for the movement.");
      return;
    }

    if (
      stockForm.movement_type === "OUT" &&
      quantity > selectedProduct.current_stock
    ) {
      setError(
        `Insufficient stock. Available stock: ${selectedProduct.current_stock}`
      );
      return;
    }

    try {
      setStockSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/products/${selectedProduct.id}/stock`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            quantity,
            movement_type:
              stockForm.movement_type,
            reason: stockForm.reason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to record stock movement"
        );
      }

      setSuccess(
        `Stock ${stockForm.movement_type === "IN" ? "IN" : "OUT"} movement recorded successfully.`
      );

      setShowStockModal(false);
      setSelectedProduct(null);

      await Promise.all([
        loadProducts(),
        loadMovements(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to record stock movement"
      );
    } finally {
      setStockSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="products-page">

      {/* Header */}

      <div className="products-header">
        <div>
          <div className="products-eyebrow">
            INVENTORY OPERATIONS
          </div>

          <h1>Products & Inventory</h1>

          <p>
            Manage products, pricing, stock levels and
            warehouse locations.
          </p>
        </div>

        <button
          className="products-primary-button"
          onClick={openAddModal}
        >
          <span>+</span>
          Add Product
        </button>
      </div>

      {/* Alerts */}

      {error && (
        <div className="products-alert products-alert-error">
          <strong>!</strong>
          <span>{error}</span>

          <button onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="products-alert products-alert-success">
          <strong>✓</strong>
          <span>{success}</span>

          <button onClick={() => setSuccess("")}>
            ×
          </button>
        </div>
      )}

      {/* Stats */}

      <div className="products-stats-grid">

        <div className="product-stat-card">
          <div className="product-stat-icon">
            P
          </div>

          <div>
            <span>Total Products</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon">
            S
          </div>

          <div>
            <span>Total Units</span>
            <strong>{totalUnits}</strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon product-stat-warning">
            !
          </div>

          <div>
            <span>Low Stock</span>
            <strong>{lowStockProducts}</strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon">
            ₹
          </div>

          <div>
            <span>Inventory Value</span>
            <strong>
              {formatPrice(totalInventoryValue)}
            </strong>
          </div>
        </div>

      </div>

      {/* Product Table */}

      <section className="products-card">

        <div className="products-card-header">

          <div>
            <h2>Product Catalogue</h2>

            <p>
              View and manage your current inventory.
            </p>
          </div>

          <div className="products-toolbar">

            <div className="products-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search product, SKU or category..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

          </div>

        </div>

        <div className="products-table-wrapper">

          {loading ? (
            <div className="products-state">
              <div className="products-spinner" />
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-state">
              <div className="products-empty-icon">
                P
              </div>

              <h3>No products found</h3>

              <p>
                Add a product or change your search
                criteria.
              </p>

              <button
                className="products-secondary-button"
                onClick={openAddModal}
              >
                Add Product
              </button>
            </div>
          ) : (
            <table className="products-table">

              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SKU / CODE</th>
                  <th>CATEGORY</th>
                  <th>UNIT PRICE</th>
                  <th>STOCK</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const lowStock =
                    product.current_stock <=
                    product.minimum_stock;

                  return (
                    <tr key={product.id}>

                      <td>
                        <div className="product-name-cell">
                          <div className="product-avatar">
                            {product.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            <small>
                              ID #{product.id}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="product-sku">
                          {product.sku}
                        </span>
                      </td>

                      <td>
                        {product.category}
                      </td>

                      <td>
                        <strong>
                          {formatPrice(
                            product.unit_price
                          )}
                        </strong>
                      </td>

                      <td>
                        <div className="stock-cell">
                          <strong>
                            {product.current_stock}
                          </strong>

                          <small>
                            Min.{" "}
                            {product.minimum_stock}
                          </small>
                        </div>
                      </td>

                      <td>
                        {product.warehouse_location}
                      </td>

                      <td>
                        <span
                          className={
                            lowStock
                              ? "stock-status low"
                              : "stock-status healthy"
                          }
                        >
                          <span />
                          {lowStock
                            ? "Low Stock"
                            : "Healthy"}
                        </span>
                      </td>

                      <td>
                        <div className="product-actions">

                          <button
                            className="icon-action"
                            title="Stock movement"
                            onClick={() =>
                              openStockModal(product)
                            }
                          >
                            ±
                          </button>

                          <button
                            className="icon-action"
                            title="Edit product"
                            onClick={() =>
                              openEditModal(product)
                            }
                          >
                            ✎
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          )}

        </div>

      </section>

      {/* Stock Movement Log */}

      <section className="products-card movement-card">

        <div className="products-card-header">

          <div>
            <h2>Stock Movement Log</h2>

            <p>
              Track inventory IN and OUT movements.
            </p>
          </div>

          <span className="movement-count">
            {movements.length} movements
          </span>

        </div>

        <div className="products-table-wrapper">

          {movementLoading ? (
            <div className="products-state">
              <div className="products-spinner" />
              <p>
                Loading stock movements...
              </p>
            </div>
          ) : movements.length === 0 ? (
            <div className="products-state compact">
              <p>No stock movements recorded yet.</p>
            </div>
          ) : (
            <table className="products-table">

              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>QUANTITY</th>
                  <th>TYPE</th>
                  <th>REASON</th>
                  <th>CREATED BY</th>
                  <th>TIMESTAMP</th>
                </tr>
              </thead>

              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>

                    <td>
                      <div className="movement-product">
                        <strong>
                          {movement.product_name}
                        </strong>

                        <small>
                          {movement.sku}
                        </small>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {movement.quantity}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={
                          movement.movement_type ===
                          "IN"
                            ? "movement-badge in"
                            : "movement-badge out"
                        }
                      >
                        {movement.movement_type}
                      </span>
                    </td>

                    <td>
                      {movement.reason}
                    </td>

                    <td>
                      {movement.created_by_name ||
                        `User #${movement.created_by}`}
                    </td>

                    <td>
                      {formatDate(
                        movement.created_at
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>

      </section>

      {/* Add/Edit Product Modal */}

      {showProductModal && (
        <div
          className="products-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeProductModal();
            }
          }}
        >
          <div className="products-modal">

            <div className="products-modal-header">

              <div>
                <span>
                  {editingProduct
                    ? "PRODUCT MANAGEMENT"
                    : "NEW PRODUCT"}
                </span>

                <h2>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>
              </div>

              <button
                onClick={closeProductModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleProductSubmit}
              className="products-form"
            >

              <div className="products-form-grid">

                <label>
                  <span>Product Name *</span>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleFormChange(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Enter product name"
                  />
                </label>

                <label>
                  <span>SKU / Code *</span>

                  <input
                    type="text"
                    value={form.sku}
                    onChange={(event) =>
                      handleFormChange(
                        "sku",
                        event.target.value
                      )
                    }
                    placeholder="e.g. RICE-25KG-001"
                  />
                </label>

                <label>
                  <span>Category *</span>

                  <input
                    type="text"
                    value={form.category}
                    onChange={(event) =>
                      handleFormChange(
                        "category",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Rice"
                  />
                </label>

                <label>
                  <span>Unit Price *</span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(event) =>
                      handleFormChange(
                        "unit_price",
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                  />
                </label>

                <label>
                  <span>Current Stock *</span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.current_stock}
                    onChange={(event) =>
                      handleFormChange(
                        "current_stock",
                        event.target.value
                      )
                    }
                    placeholder="0"
                  />
                </label>

                <label>
                  <span>Minimum Stock Alert *</span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.minimum_stock}
                    onChange={(event) =>
                      handleFormChange(
                        "minimum_stock",
                        event.target.value
                      )
                    }
                    placeholder="10"
                  />
                </label>

                <label className="products-field-full">
                  <span>
                    Location / Warehouse *
                  </span>

                  <input
                    type="text"
                    value={form.warehouse_location}
                    onChange={(event) =>
                      handleFormChange(
                        "warehouse_location",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Warehouse A"
                  />
                </label>

              </div>

              <div className="products-modal-actions">

                <button
                  type="button"
                  className="products-cancel-button"
                  onClick={closeProductModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="products-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* Stock Movement Modal */}

      {showStockModal && selectedProduct && (
        <div
          className="products-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeStockModal();
            }
          }}
        >
          <div className="products-modal stock-modal">

            <div className="products-modal-header">

              <div>
                <span>
                  INVENTORY MOVEMENT
                </span>

                <h2>Update Stock</h2>
              </div>

              <button
                onClick={closeStockModal}
                disabled={stockSaving}
              >
                ×
              </button>

            </div>

            <div className="selected-product-banner">

              <div className="product-avatar large">
                {selectedProduct.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {selectedProduct.name}
                </strong>

                <span>
                  {selectedProduct.sku}
                </span>
              </div>

              <div className="selected-stock">
                <small>Current Stock</small>
                <strong>
                  {selectedProduct.current_stock}
                </strong>
              </div>

            </div>

            <form
              onSubmit={handleStockSubmit}
              className="products-form"
            >

              <div className="products-form-grid">

                <label>
                  <span>Movement Type *</span>

                  <select
                    value={stockForm.movement_type}
                    onChange={(event) =>
                      setStockForm((previous) => ({
                        ...previous,
                        movement_type:
                          event.target.value as
                            | "IN"
                            | "OUT",
                      }))
                    }
                  >
                    <option value="IN">
                      IN — Add Stock
                    </option>

                    <option value="OUT">
                      OUT — Remove Stock
                    </option>
                  </select>
                </label>

                <label>
                  <span>Quantity *</span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={stockForm.quantity}
                    onChange={(event) =>
                      setStockForm((previous) => ({
                        ...previous,
                        quantity:
                          event.target.value,
                      }))
                    }
                    placeholder="Enter quantity"
                  />
                </label>

                <label className="products-field-full">
                  <span>Reason *</span>

                  <input
                    type="text"
                    value={stockForm.reason}
                    onChange={(event) =>
                      setStockForm((previous) => ({
                        ...previous,
                        reason:
                          event.target.value,
                      }))
                    }
                    placeholder="e.g. New stock received"
                  />
                </label>

              </div>

              <div className="products-modal-actions">

                <button
                  type="button"
                  className="products-cancel-button"
                  onClick={closeStockModal}
                  disabled={stockSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="products-primary-button"
                  disabled={stockSaving}
                >
                  {stockSaving
                    ? "Saving..."
                    : "Record Movement"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Products;