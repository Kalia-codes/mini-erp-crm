import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import "./StockMovements.css";

interface Product {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
}

interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

const StockMovements = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [reason, setReason] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/stock-movements");

      const data = response.data?.data || [];

      setMovements(data);
    } catch (err: any) {
      console.error("Failed to load stock movements:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load stock movements."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");

      const data = response.data?.data || [];

      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, []);

  const resetForm = () => {
    setProductId("");
    setQuantity("");
    setMovementType("IN");
    setReason("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    const numericQuantity = Number(quantity);

    if (!numericQuantity || numericQuantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/stock-movements", {
        product_id: Number(productId),
        quantity: numericQuantity,
        movement_type: movementType,
        reason: reason.trim(),
      });

      setSuccess("Stock movement added successfully.");

      resetForm();
      setShowForm(false);

      await loadMovements();

      // Refresh product data because current stock may have changed.
      await loadProducts();
    } catch (err: any) {
      console.error("Failed to add stock movement:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to add stock movement."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalMovements = movements.length;

  const totalIn = movements
    .filter((movement) => movement.movement_type === "IN")
    .reduce((total, movement) => total + Number(movement.quantity), 0);

  const totalOut = movements
    .filter((movement) => movement.movement_type === "OUT")
    .reduce((total, movement) => total + Number(movement.quantity), 0);

  const getProductName = (movement: StockMovement) => {
    if (movement.product_name) {
      return movement.product_name;
    }

    const product = products.find(
      (item) => item.id === Number(movement.product_id)
    );

    return product?.name || `Product #${movement.product_id}`;
  };

  const getProductSku = (movement: StockMovement) => {
    if (movement.product_sku) {
      return movement.product_sku;
    }

    const product = products.find(
      (item) => item.id === Number(movement.product_id)
    );

    return product?.sku || "-";
  };

  const formatDate = (dateValue: string) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  return (
    <Layout>
      <div className="stock-movements-page">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">INVENTORY OPERATIONS</div>

            <h1>Stock Movements</h1>

            <p>
              Track inventory stock movements and changes.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm((current) => !current);
            }}
          >
            {showForm ? "Close" : "+ Add Movement"}
          </button>
        </div>

        {error && (
          <div className="movement-message movement-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="movement-message movement-success">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        {showForm && (
          <div className="content-card movement-form-card">
            <div className="content-card-header">
              <div>
                <h2>Add Stock Movement</h2>

                <p>
                  Record an inventory stock change.
                </p>
              </div>
            </div>

            <form
              className="movement-form"
              onSubmit={handleSubmit}
            >
              <div className="movement-form-grid">
                <div className="movement-form-group">
                  <label htmlFor="product">
                    Product
                  </label>

                  <select
                    id="product"
                    value={productId}
                    onChange={(event) =>
                      setProductId(event.target.value)
                    }
                    disabled={saving}
                  >
                    <option value="">
                      Select product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="movement-form-group">
                  <label htmlFor="movement-type">
                    Movement Type
                  </label>

                  <select
                    id="movement-type"
                    value={movementType}
                    onChange={(event) =>
                      setMovementType(
                        event.target.value as "IN" | "OUT"
                      )
                    }
                    disabled={saving}
                  >
                    <option value="IN">
                      IN
                    </option>

                    <option value="OUT">
                      OUT
                    </option>
                  </select>
                </div>

                <div className="movement-form-group">
                  <label htmlFor="quantity">
                    Quantity
                  </label>

                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="Enter quantity"
                    disabled={saving}
                  />
                </div>

                <div className="movement-form-group">
                  <label htmlFor="reason">
                    Reason
                  </label>

                  <input
                    id="reason"
                    type="text"
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value)
                    }
                    placeholder="e.g. New stock received"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="movement-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Movement"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="movement-stats-grid">
          <div className="movement-stat-card">
            <div className="movement-stat-label">
              TOTAL MOVEMENTS
            </div>

            <div className="movement-stat-value">
              {totalMovements}
            </div>

            <div className="movement-stat-description">
              Recorded stock changes
            </div>
          </div>

          <div className="movement-stat-card">
            <div className="movement-stat-label">
              STOCK IN
            </div>

            <div className="movement-stat-value">
              {totalIn}
            </div>

            <div className="movement-stat-description">
              Units added to inventory
            </div>
          </div>

          <div className="movement-stat-card">
            <div className="movement-stat-label">
              STOCK OUT
            </div>

            <div className="movement-stat-value">
              {totalOut}
            </div>

            <div className="movement-stat-description">
              Units removed from inventory
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h2>Stock Movement Log</h2>

              <p>
                Inventory movement tracking module.
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={loadMovements}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="movement-loading">
              Loading stock movements...
            </div>
          ) : movements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                ↕
              </div>

              <h3>No stock movements found</h3>

              <p>
                Stock movement records will appear here.
              </p>

              <button
                className="primary-button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowForm(true);
                }}
              >
                + Add First Movement
              </button>
            </div>
          ) : (
            <div className="movement-table-wrapper">
              <table className="movement-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>SKU</th>
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
                        <div className="movement-product-name">
                          {getProductName(movement)}
                        </div>
                      </td>

                      <td>
                        <span className="movement-sku">
                          {getProductSku(movement)}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {movement.quantity}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`movement-type-badge ${
                            movement.movement_type === "IN"
                              ? "movement-in"
                              : "movement-out"
                          }`}
                        >
                          {movement.movement_type}
                        </span>
                      </td>

                      <td>
                        {movement.reason || "-"}
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
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StockMovements;