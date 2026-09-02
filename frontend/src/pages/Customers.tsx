import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Customer } from "../types";

type CustomerForm = {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  follow_up_date: string;
  notes: string;
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm: CustomerForm = {
  name: "",
  mobile: "",
  email: "",
  business_name: "",
  gst_number: "",
  customer_type: "RETAIL",
  address: "",
  status: "LEAD",
  follow_up_date: "",
  notes: "",
};

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerForm>(initialForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/customers`, {
        method: "GET",
        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to load customers."
        );
      }

      setCustomers(result?.data || []);
    } catch (err) {
      console.error("Load customers error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // =====================================================
  // FILTER CUSTOMERS
  // =====================================================

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        customer.name.toLowerCase().includes(searchValue) ||
        customer.mobile.toLowerCase().includes(searchValue) ||
        customer.business_name
          .toLowerCase()
          .includes(searchValue) ||
        (customer.email || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        customer.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        customer.customer_type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    customers,
    search,
    statusFilter,
    typeFilter,
  ]);

  // =====================================================
  // FORM
  // =====================================================

  const updateField = (
    field: keyof CustomerForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openAddForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setSelectedCustomer(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setForm({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || "",
      business_name: customer.business_name,
      gst_number: customer.gst_number || "",
      customer_type: customer.customer_type,
      address: customer.address || "",
      status: customer.status,
      follow_up_date: customer.follow_up_date || "",
      notes: customer.notes || "",
    });

    setEditingId(customer.id);
    setSelectedCustomer(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  // =====================================================
  // SAVE CUSTOMER
  // =====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim() || null,
      business_name: form.business_name.trim(),
      gst_number: form.gst_number.trim() || null,
      customer_type: form.customer_type,
      address: form.address.trim() || null,
      status: form.status,
      follow_up_date: form.follow_up_date || null,
      notes: form.notes.trim() || null,
    };

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      const url =
        editingId !== null
          ? `${API_URL}/customers/${editingId}`
          : `${API_URL}/customers`;

      const method =
        editingId !== null ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to save customer."
        );
      }

      if (editingId !== null) {
        setSuccess(
          "Customer updated successfully."
        );
      } else {
        setSuccess(
          "Customer added successfully."
        );
      }

      closeForm();

      await loadCustomers();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Save customer error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // VIEW CUSTOMER
  // =====================================================

  const viewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="customer-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="customer-header">

        <div>
          <span className="customer-eyebrow">
            CUSTOMER RELATIONSHIP MANAGEMENT
          </span>

          <h1>Customers</h1>

          <p>
            Manage customer information,
            relationships and follow-ups.
          </p>
        </div>

        <button
          className="customer-add-button"
          onClick={openAddForm}
        >
          <span>+</span>
          Add Customer
        </button>

      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="customer-alert error">
          <span>!</span>

          <p>{error}</p>

          <button
            onClick={() => setError("")}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="customer-alert success">
          <span>✓</span>

          <p>{success}</p>

          <button
            onClick={() => setSuccess("")}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {/* =================================================
          ADD / EDIT FORM
      ================================================= */}

      {showForm && (
        <div className="customer-card customer-form-card">

          <div className="customer-card-header">

            <div>
              <span>
                {editingId !== null
                  ? "UPDATE CUSTOMER"
                  : "NEW CUSTOMER"}
              </span>

              <h2>
                {editingId !== null
                  ? "Edit Customer"
                  : "Add Customer"}
              </h2>
            </div>

            <button
              className="customer-close-button"
              type="button"
              onClick={closeForm}
            >
              ×
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="customer-form-grid">

              {/* Customer Name */}
              <div className="customer-field">
                <label>
                  Customer Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter customer name"
                  required
                />
              </div>

              {/* Mobile */}
              <div className="customer-field">
                <label>
                  Mobile *
                </label>

                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(event) =>
                    updateField(
                      "mobile",
                      event.target.value
                    )
                  }
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              {/* Email */}
              <div className="customer-field">
                <label>Email</label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="customer@company.com"
                />
              </div>

              {/* Business Name */}
              <div className="customer-field">
                <label>
                  Business Name *
                </label>

                <input
                  type="text"
                  value={form.business_name}
                  onChange={(event) =>
                    updateField(
                      "business_name",
                      event.target.value
                    )
                  }
                  placeholder="Enter business name"
                  required
                />
              </div>

              {/* GST */}
              <div className="customer-field">
                <label>GST Number</label>

                <input
                  type="text"
                  value={form.gst_number}
                  onChange={(event) =>
                    updateField(
                      "gst_number",
                      event.target.value
                    )
                  }
                  placeholder="Optional GST number"
                />
              </div>

              {/* Customer Type */}
              <div className="customer-field">
                <label>
                  Customer Type *
                </label>

                <select
                  value={form.customer_type}
                  onChange={(event) =>
                    updateField(
                      "customer_type",
                      event.target.value
                    )
                  }
                >
                  <option value="RETAIL">
                    Retail
                  </option>

                  <option value="WHOLESALE">
                    Wholesale
                  </option>

                  <option value="DISTRIBUTOR">
                    Distributor
                  </option>
                </select>
              </div>

              {/* Status */}
              <div className="customer-field">
                <label>Status *</label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value
                    )
                  }
                >
                  <option value="LEAD">
                    Lead
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>
              </div>

              {/* Follow-up Date */}
              <div className="customer-field">
                <label>
                  Follow-up Date
                </label>

                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={(event) =>
                    updateField(
                      "follow_up_date",
                      event.target.value
                    )
                  }
                />
              </div>

              {/* Address */}
              <div className="customer-field full">
                <label>Address</label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value
                    )
                  }
                  placeholder="Enter customer address"
                />
              </div>

              {/* Notes */}
              <div className="customer-field full">
                <label>
                  Follow-up Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value
                    )
                  }
                  placeholder="Add customer notes..."
                />
              </div>

            </div>

            <div className="customer-form-actions">

              <button
                type="button"
                className="customer-cancel-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="customer-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Customer"
                  : "Save Customer"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          CUSTOMER DETAILS
      ================================================= */}

      {selectedCustomer && (
        <div className="customer-card customer-details-card">

          <div className="customer-card-header">

            <div className="customer-detail-title">

              <div className="customer-detail-avatar">
                {getInitial(
                  selectedCustomer.name
                )}
              </div>

              <div>
                <span>
                  CUSTOMER DETAILS
                </span>

                <h2>
                  {selectedCustomer.name}
                </h2>

                <p>
                  {selectedCustomer.business_name}
                </p>
              </div>

            </div>

            <button
              className="customer-close-button"
              type="button"
              onClick={() =>
                setSelectedCustomer(null)
              }
            >
              ×
            </button>

          </div>

          <div className="customer-details-grid">

            <div>
              <span>Mobile</span>
              <strong>
                {selectedCustomer.mobile}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {selectedCustomer.email ||
                  "Not provided"}
              </strong>
            </div>

            <div>
              <span>Business</span>
              <strong>
                {selectedCustomer.business_name}
              </strong>
            </div>

            <div>
              <span>Customer Type</span>
              <strong>
                {selectedCustomer.customer_type}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong>
                <span
                  className={`customer-status status-${selectedCustomer.status.toLowerCase()}`}
                >
                  {selectedCustomer.status}
                </span>
              </strong>
            </div>

            <div>
              <span>Follow-up</span>

              <strong>
                {selectedCustomer.follow_up_date ||
                  "Not scheduled"}
              </strong>
            </div>

            <div>
              <span>GST Number</span>

              <strong>
                {selectedCustomer.gst_number ||
                  "Not provided"}
              </strong>
            </div>

            <div className="full">
              <span>Address</span>

              <strong>
                {selectedCustomer.address ||
                  "Not provided"}
              </strong>
            </div>

            <div className="full">
              <span>Notes</span>

              <strong>
                {selectedCustomer.notes ||
                  "No notes available"}
              </strong>
            </div>

          </div>

          <div className="customer-detail-actions">

            <button
              className="customer-edit-button"
              onClick={() =>
                openEditForm(selectedCustomer)
              }
              type="button"
            >
              Edit Customer
            </button>

          </div>

        </div>
      )}

      {/* =================================================
          FILTER BAR
      ================================================= */}

      <div className="customer-toolbar">

        <div className="customer-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">
            All Status
          </option>

          <option value="LEAD">
            Lead
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="ALL">
            All Types
          </option>

          <option value="RETAIL">
            Retail
          </option>

          <option value="WHOLESALE">
            Wholesale
          </option>

          <option value="DISTRIBUTOR">
            Distributor
          </option>
        </select>

      </div>

      {/* =================================================
          CUSTOMER TABLE
      ================================================= */}

      <div className="customer-card customer-table-card">

        <div className="customer-table-header">

          <div>
            <span className="customer-eyebrow">
              CUSTOMER DIRECTORY
            </span>

            <h2>Customer Records</h2>

            <p>
              {filteredCustomers.length} record
              {filteredCustomers.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

        </div>

        {loading ? (
          <div className="customer-loading">
            <div className="customer-spinner"></div>
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="customer-empty">

            <div className="customer-empty-icon">
              C
            </div>

            <h3>
              No customers found
            </h3>

            <p>
              Try another search or add a new
              customer.
            </p>

            <button
              className="customer-add-button"
              onClick={openAddForm}
              type="button"
            >
              + Add Customer
            </button>

          </div>
        ) : (
          <div className="customer-table-wrapper">

            <table className="customer-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Business</th>
                  <th>Type</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredCustomers.map(
                  (customer) => (
                    <tr key={customer.id}>

                      <td>
                        <div className="customer-name-cell">

                          <div className="customer-avatar">
                            {getInitial(
                              customer.name
                            )}
                          </div>

                          <div>
                            <strong>
                              {customer.name}
                            </strong>

                            <span>
                              ID #{customer.id}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <div className="customer-business-cell">

                          <strong>
                            {customer.business_name}
                          </strong>

                          <span>
                            {customer.email ||
                              "No email"}
                          </span>

                        </div>
                      </td>

                      <td>
                        <span className="customer-type">
                          {customer.customer_type}
                        </span>
                      </td>

                      <td>
                        {customer.mobile}
                      </td>

                      <td>
                        <span
                          className={`customer-status status-${customer.status.toLowerCase()}`}
                        >
                          <i></i>
                          {customer.status}
                        </span>
                      </td>

                      <td>
                        {customer.follow_up_date ||
                          "—"}
                      </td>

                      <td>
                        <div className="customer-actions">

                          <button
                            onClick={() =>
                              viewCustomer(customer)
                            }
                            className="customer-view-button"
                            type="button"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              openEditForm(customer)
                            }
                            className="customer-edit-button"
                            type="button"
                          >
                            Edit
                          </button>

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
  );
};

export default Customers;