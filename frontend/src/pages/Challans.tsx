import "./Challans.css";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import Layout from "../components/Layout";
import api from "../services/api";

import type {
  Challan,
  ChallanItem,
  Customer,
  Product,
} from "../types";

type DraftItem = {
  product_id: number;
  quantity: number;
};

type ChallanWithCreator = Challan & {
  created_by?: number;
  created_by_name?: string;
};

const getCreatorDisplay = (challan: Challan): string => {
  const record = challan as ChallanWithCreator;

  if (record.created_by_name) {
    return record.created_by_name;
  }

  if (record.created_by !== undefined && record.created_by !== null) {
    return `User #${record.created_by}`;
  }

  return "—";
};

const Challans = () => {
  // =====================================================
  // DATA
  // =====================================================

  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // =====================================================
  // FORM
  // =====================================================

  const [showForm, setShowForm] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<number | "">("");

  const [items, setItems] = useState<DraftItem[]>([]);

  const [selectedProductId, setSelectedProductId] =
    useState<number | "">("");

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // =====================================================
  // DETAILS
  // =====================================================

  const [selectedChallan, setSelectedChallan] =
    useState<Challan | null>(null);

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        challansResponse,
        customersResponse,
        productsResponse,
      ] = await Promise.all([
        api.get("/challans"),
        api.get("/customers"),
        api.get("/products"),
      ]);

      setChallans(
        challansResponse.data?.data || []
      );

      setCustomers(
        customersResponse.data?.data || []
      );

      setProducts(
        productsResponse.data?.data || []
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load sales challans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  const openCreateForm = () => {
    setSelectedCustomerId("");
    setItems([]);
    setSelectedProductId("");
    setSelectedQuantity(1);

    setSelectedChallan(null);
    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // =====================================================
  // CLOSE CREATE FORM
  // =====================================================

  const closeCreateForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setSelectedCustomerId("");
    setItems([]);
    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const addProduct = () => {
    setError("");

    if (selectedProductId === "") {
      setError("Please select a product.");
      return;
    }

    const productId = Number(selectedProductId);

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      setError("Invalid product selected.");
      return;
    }

    if (
      !Number.isInteger(selectedQuantity) ||
      selectedQuantity <= 0
    ) {
      setError(
        "Quantity must be a positive integer."
      );
      return;
    }

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      setError("Selected product was not found.");
      return;
    }

    const alreadyAdded = items.some(
      (item) => item.product_id === productId
    );

    if (alreadyAdded) {
      setError(
        "This product is already added. Update its quantity instead."
      );
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        product_id: productId,
        quantity: selectedQuantity,
      },
    ]);

    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  const removeProduct = (productId: number) => {
    setItems((previous) =>
      previous.filter(
        (item) => item.product_id !== productId
      )
    );
  };

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = (
    productId: number,
    quantity: number
  ) => {
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  // =====================================================
  // PRODUCT LOOKUP
  // =====================================================

  const getProduct = (productId: number) => {
    return products.find(
      (product) => product.id === productId
    );
  };

  // =====================================================
  // AVAILABLE PRODUCTS
  // =====================================================

  const availableProducts = useMemo(() => {
    const addedIds = new Set(
      items.map((item) => item.product_id)
    );

    return products.filter(
      (product) => !addedIds.has(product.id)
    );
  }, [products, items]);

  // =====================================================
  // TOTAL QUANTITY
  // =====================================================

  const totalQuantity = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [items]);

  // =====================================================
  // TOTAL VALUE
  // =====================================================

  const totalValue = useMemo(() => {
    return items.reduce((total, item) => {
      const product = getProduct(item.product_id);

      return (
        total +
        Number(product?.unit_price || 0) *
          item.quantity
      );
    }, 0);
  }, [items, products]);

  // =====================================================
  // CREATE CHALLAN
  // =====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (selectedCustomerId === "") {
      setError("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      setError(
        "Please add at least one product."
      );
      return;
    }

    const customerId = Number(
      selectedCustomerId
    );

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0
    ) {
      setError("Invalid customer selected.");
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !Number.isInteger(item.product_id) ||
        item.product_id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    );

    if (invalidItem) {
      setError(
        "All products must have a valid positive quantity."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        "/challans",
        {
          customer_id: customerId,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }
      );

      const created = response.data?.data;

      setSuccess(
        `Challan ${
          created?.challan_number || ""
        } created successfully as Draft.`
      );

      setShowForm(false);
      setSelectedCustomerId("");
      setItems([]);
      setSelectedProductId("");
      setSelectedQuantity(1);

      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to create challan."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // VIEW CHALLAN
  // =====================================================

  const viewChallan = async (id: number) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(
        `/challans/${id}`
      );

      setSelectedChallan(
        response.data?.data || null
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load challan details."
      );
    }
  };

  // =====================================================
  // CONFIRM CHALLAN
  // =====================================================

  const confirmChallan = async (id: number) => {
    const confirmed = window.confirm(
      "Confirm this sales challan? Stock will be reduced after confirmation."
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.put(
        `/challans/${id}/confirm`
      );

      setSuccess(
        "Challan confirmed successfully. Stock has been reduced."
      );

      setSelectedChallan(null);

      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to confirm challan."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // CANCEL CHALLAN
  // =====================================================

  const cancelChallan = async (id: number) => {
    const confirmed = window.confirm(
      "Cancel this draft challan?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.put(
        `/challans/${id}/cancel`
      );

      setSuccess(
        "Challan cancelled successfully."
      );

      setSelectedChallan(null);

      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to cancel challan."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (value: string) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Layout>
      <div className="challan-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="challan-header">

          <div>
            <span className="challan-eyebrow">
              SALES OPERATIONS
            </span>

            <h1>Sales Challans</h1>

            <p>
              Create and manage sales challans.
            </p>
          </div>

          <button
            type="button"
            className="challan-primary-button"
            onClick={openCreateForm}
          >
            <span>+</span>
            New Challan
          </button>

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="challan-alert error">
            <span>!</span>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="challan-alert success">
            <span>✓</span>

            <p>{success}</p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Close success"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            CREATE CHALLAN FORM
        ================================================= */}

        {showForm && (
          <div className="challan-card challan-form-card">

            <div className="challan-card-header">

              <div>
                <span className="challan-card-eyebrow">
                  SALES CHALLAN
                </span>

                <h2>Create New Challan</h2>

                <p>
                  Select a customer and add the products
                  to be issued.
                </p>
              </div>

              <button
                type="button"
                className="challan-close-button"
                onClick={closeCreateForm}
                aria-label="Close form"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {/* CUSTOMER */}

              <div className="challan-form-section">

                <div className="challan-section-title">
                  Customer Information
                </div>

                <div className="challan-field">
                  <label htmlFor="challan-customer">
                    Customer *
                  </label>

                  <select
                    id="challan-customer"
                    value={selectedCustomerId}
                    onChange={(event) =>
                      setSelectedCustomerId(
                        event.target.value
                          ? Number(event.target.value)
                          : ""
                      )
                    }
                    required
                  >
                    <option value="">
                      Select customer
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={customer.id}
                          value={customer.id}
                        >
                          {customer.name} —{" "}
                          {customer.business_name}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>

              {/* PRODUCTS */}

              <div className="challan-form-section">

                <div className="challan-section-heading">

                  <div>
                    <div className="challan-section-title">
                      Products
                    </div>

                    <p>
                      Add one or more products to
                      this challan.
                    </p>
                  </div>

                </div>

                <div className="challan-product-selector">

                  <div className="challan-field">

                    <label htmlFor="challan-product">
                      Product
                    </label>

                    <select
                      id="challan-product"
                      value={selectedProductId}
                      onChange={(event) =>
                        setSelectedProductId(
                          event.target.value
                            ? Number(event.target.value)
                            : ""
                        )
                      }
                    >
                      <option value="">
                        Select product
                      </option>

                      {availableProducts.map(
                        (product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name} —{" "}
                            {product.sku} — Stock:{" "}
                            {product.current_stock}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                  <div className="challan-field quantity-field">

                    <label htmlFor="challan-quantity">
                      Quantity
                    </label>

                    <input
                      id="challan-quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={selectedQuantity}
                      onChange={(event) =>
                        setSelectedQuantity(
                          Number(event.target.value)
                        )
                      }
                    />

                  </div>

                  <button
                    type="button"
                    className="challan-add-product-button"
                    onClick={addProduct}
                  >
                    + Add Product
                  </button>

                </div>

                {/* ITEM TABLE */}

                {items.length > 0 ? (
                  <div className="challan-items-wrapper">

                    <table className="challan-items-table">

                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Unit Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>

                        {items.map((item) => {
                          const product =
                            getProduct(
                              item.product_id
                            );

                          const itemTotal =
                            Number(
                              product?.unit_price || 0
                            ) * item.quantity;

                          return (
                            <tr
                              key={
                                item.product_id
                              }
                            >
                              <td>
                                <strong>
                                  {product?.name ||
                                    "Unknown Product"}
                                </strong>
                              </td>

                              <td>
                                <span className="challan-sku">
                                  {product?.sku ||
                                    "—"}
                                </span>
                              </td>

                              <td>
                                {formatCurrency(
                                  Number(
                                    product?.unit_price ||
                                      0
                                  )
                                )}
                              </td>

                              <td>
                                <input
                                  className="challan-quantity-input"
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={
                                    item.quantity
                                  }
                                  onChange={(event) =>
                                    updateQuantity(
                                      item.product_id,
                                      Number(
                                        event.target.value
                                      )
                                    )
                                  }
                                  aria-label={`Quantity for ${
                                    product?.name ||
                                    "product"
                                  }`}
                                />
                              </td>

                              <td>
                                <strong>
                                  {formatCurrency(
                                    itemTotal
                                  )}
                                </strong>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="challan-remove-button"
                                  onClick={() =>
                                    removeProduct(
                                      item.product_id
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </td>

                            </tr>
                          );
                        })}

                      </tbody>

                    </table>

                  </div>
                ) : (
                  <div className="challan-items-empty">
                    No products added yet.
                  </div>
                )}

              </div>

              {/* SUMMARY */}

              <div className="challan-summary">

                <div>
                  <span>Total Products</span>
                  <strong>
                    {items.length}
                  </strong>
                </div>

                <div>
                  <span>Total Quantity</span>
                  <strong>
                    {totalQuantity}
                  </strong>
                </div>

                <div>
                  <span>Estimated Value</span>
                  <strong>
                    {formatCurrency(totalValue)}
                  </strong>
                </div>

              </div>

              {/* ACTIONS */}

              <div className="challan-form-actions">

                <button
                  type="button"
                  className="challan-secondary-button"
                  onClick={closeCreateForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="challan-primary-button"
                  disabled={
                    saving ||
                    items.length === 0 ||
                    selectedCustomerId === ""
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* =================================================
            CHALLAN DETAILS
        ================================================= */}

        {selectedChallan && (
          <div className="challan-card challan-details-card">

            <div className="challan-card-header">

              <div>
                <span className="challan-card-eyebrow">
                  CHALLAN DETAILS
                </span>

                <h2>
                  {selectedChallan.challan_number}
                </h2>

                <p>
                  {selectedChallan.customer_name}
                  {" — "}
                  {selectedChallan.business_name}
                </p>
              </div>

              <button
                type="button"
                className="challan-close-button"
                onClick={() =>
                  setSelectedChallan(null)
                }
                aria-label="Close details"
              >
                ×
              </button>

            </div>

            <div className="challan-details-meta">

              <div>
                <span>Status</span>

                <strong
                  className={`challan-status status-${selectedChallan.status.toLowerCase()}`}
                >
                  <i></i>
                  {selectedChallan.status}
                </strong>
              </div>

              <div>
                <span>Customer</span>

                <strong>
                  {selectedChallan.customer_name}
                </strong>
              </div>

              <div>
                <span>Total Quantity</span>

                <strong>
                  {selectedChallan.total_quantity}
                </strong>
              </div>

              <div>
                <span>Created by</span>

                <strong>
                  {getCreatorDisplay(selectedChallan)}
                </strong>
              </div>

              <div>
                <span>Created</span>

                <strong>
                  {formatDate(
                    selectedChallan.created_at
                  )}
                </strong>
              </div>

            </div>

            <div className="challan-details-items">

              <div className="challan-section-title">
                Challan Products
              </div>

              {selectedChallan.items &&
              selectedChallan.items.length > 0 ? (
                <div className="challan-items-wrapper">
                  <table className="challan-items-table">

                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>

                      {selectedChallan.items.map(
                        (
                          item: ChallanItem,
                          index
                        ) => (
                          <tr
                            key={
                              item.id ??
                              `${item.product_id}-${index}`
                            }
                          >
                            <td>
                              <strong>
                                {item.product_name ||
                                  "Product"}
                              </strong>
                            </td>

                            <td>
                              <span className="challan-sku">
                                {item.sku || "—"}
                              </span>
                            </td>

                            <td>
                              {formatCurrency(
                                Number(
                                  item.unit_price ||
                                    0
                                )
                              )}
                            </td>

                            <td>
                              {item.quantity}
                            </td>

                            <td>
                              <strong>
                                {formatCurrency(
                                  Number(
                                    item.unit_price ||
                                      0
                                  ) *
                                    item.quantity
                                )}
                              </strong>
                            </td>
                          </tr>
                        )
                      )}

                    </tbody>

                  </table>
                </div>
              ) : (
                <div className="challan-items-empty">
                  No products found.
                </div>
              )}

            </div>

            {/* DETAILS ACTIONS */}

            {selectedChallan.status ===
              "DRAFT" && (
              <div className="challan-detail-actions">

                <button
                  type="button"
                  className="challan-cancel-action"
                  onClick={() =>
                    cancelChallan(
                      selectedChallan.id
                    )
                  }
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Processing..."
                    : "Cancel Challan"}
                </button>

                <button
                  type="button"
                  className="challan-confirm-action"
                  onClick={() =>
                    confirmChallan(
                      selectedChallan.id
                    )
                  }
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Processing..."
                    : "Confirm Challan"}
                </button>

              </div>
            )}

          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="challan-stats-grid">

          <div className="challan-stat-card">
            <div className="challan-stat-icon">
              C
            </div>

            <div>
              <span>Total Challans</span>

              <strong>
                {challans.length}
              </strong>
            </div>
          </div>

          <div className="challan-stat-card">
            <div className="challan-stat-icon">
              D
            </div>

            <div>
              <span>Draft</span>

              <strong>
                {
                  challans.filter(
                    (challan) =>
                      challan.status === "DRAFT"
                  ).length
                }
              </strong>
            </div>
          </div>

          <div className="challan-stat-card">
            <div className="challan-stat-icon">
              ✓
            </div>

            <div>
              <span>Confirmed</span>

              <strong>
                {
                  challans.filter(
                    (challan) =>
                      challan.status ===
                      "CONFIRMED"
                  ).length
                }
              </strong>
            </div>
          </div>

          <div className="challan-stat-card">
            <div className="challan-stat-icon">
              Q
            </div>

            <div>
              <span>Total Quantity</span>

              <strong>
                {challans.reduce(
                  (total, challan) =>
                    total +
                    Number(
                      challan.total_quantity
                    ),
                  0
                )}
              </strong>
            </div>
          </div>

        </div>

        {/* =================================================
            CHALLAN TABLE
        ================================================= */}

        <div className="challan-card challan-table-card">

          <div className="challan-table-header">

            <div>
              <span className="challan-eyebrow">
                CHALLAN DIRECTORY
              </span>

              <h2>
                Sales Challan Records
              </h2>

              <p>
                View and manage created sales
                challans.
              </p>
            </div>

            <div className="challan-record-count">
              {challans.length} record
              {challans.length !== 1
                ? "s"
                : ""}
            </div>

          </div>

          {loading ? (
            <div className="challan-loading">
              <div className="challan-spinner"></div>
              Loading challans...
            </div>
          ) : challans.length === 0 ? (
            <div className="challan-empty">

              <div className="challan-empty-icon">
                C
              </div>

              <h3>
                No sales challans found
              </h3>

              <p>
                Create your first sales challan
                to get started.
              </p>

              <button
                type="button"
                className="challan-primary-button"
                onClick={openCreateForm}
              >
                + New Challan
              </button>

            </div>
          ) : (
            <div className="challan-table-wrapper">

              <table className="challan-table">

                <thead>
                  <tr>
                    <th>Challan</th>
                    <th>Customer</th>
                    <th>Business</th>
                    <th>Total Qty</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {challans.map(
                    (challan) => (
                      <tr
                        key={challan.id}
                      >

                        <td>
                          <div className="challan-number-cell">
                            <strong>
                              {
                                challan.challan_number
                              }
                            </strong>

                            <span>
                              ID #{challan.id}
                            </span>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {
                              challan.customer_name
                            }
                          </strong>
                        </td>

                        <td>
                          <span className="challan-business">
                            {
                              challan.business_name
                            }
                          </span>
                        </td>

                        <td>
                          <strong>
                            {
                              challan.total_quantity
                            }
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`challan-status status-${challan.status.toLowerCase()}`}
                          >
                            <i></i>
                            {challan.status}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            challan.created_at
                          )}
                        </td>

                        <td>
                          <div className="challan-actions">

                            <button
                              type="button"
                              className="challan-view-button"
                              onClick={() =>
                                viewChallan(
                                  challan.id
                                )
                              }
                            >
                              View
                            </button>

                            {challan.status ===
                              "DRAFT" && (
                              <button
                                type="button"
                                className="challan-confirm-small"
                                onClick={() =>
                                  confirmChallan(
                                    challan.id
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                              >
                                Confirm
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </Layout>
  );
};

export default Challans;