import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import api from "../services/api";

interface DashboardStats {
  customers: number;
  products: number;
  stockMovements: number;
  challans: number;
}

interface LoggedInUser {
  id?: number;
  name?: string;
  email?: string;
  role?: "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    products: 0,
    stockMovements: 0,
    challans: 0,
  });

  const [loading, setLoading] = useState(true);

  /*
   * Get the currently logged-in user.
   * Login.tsx already stores this object in localStorage.
   */
  const getLoggedInUser = (): LoggedInUser => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return {};
      }

      return JSON.parse(storedUser) as LoggedInUser;
    } catch (error) {
      console.error("Unable to read logged-in user:", error);
      return {};
    }
  };

  const user = getLoggedInUser();

  const userName = user.name || "Admin";

  const userRole = user.role || "ADMIN";

  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          customersResponse,
          productsResponse,
          movementsResponse,
          challansResponse,
        ] = await Promise.all([
          api.get("/customers"),
          api.get("/products"),
          api.get("/stock-movements"),
          api.get("/challans"),
        ]);

        setStats({
          customers:
            customersResponse.data.data?.length || 0,

          products:
            productsResponse.data.data?.length || 0,

          stockMovements:
            movementsResponse.data.data?.length || 0,

          challans:
            challansResponse.data.data?.length || 0,
        });
      } catch (error) {
        console.error(
          "Unable to load dashboard statistics:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <Layout>
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            OPERATIONS OVERVIEW
          </span>

          <h1> Hey Buddy! Welcome to workspace.</h1>

<p>
  {userName}, here's what's happening across your
  operations.
</p>
        </div>

        {/* LOGGED-IN USER */}
        <div className="dashboard-user">
          <div className="user-avatar">
            {userInitial}
          </div>

          <div>
            <strong>{userName}</strong>

            <span>{userRole}</span>
          </div>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Customers</span>
            <div className="stat-icon">C</div>
          </div>

          <div className="stat-number">
            {loading ? "—" : stats.customers}
          </div>

          <div className="stat-description">
            CRM records
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Products</span>
            <div className="stat-icon">P</div>
          </div>

          <div className="stat-number">
            {loading ? "—" : stats.products}
          </div>

          <div className="stat-description">
            Inventory items
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Stock Movements</span>
            <div className="stat-icon">S</div>
          </div>

          <div className="stat-number">
            {loading ? "—" : stats.stockMovements}
          </div>

          <div className="stat-description">
            IN / OUT transactions
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Sales Challans</span>
            <div className="stat-icon">CH</div>
          </div>

          <div className="stat-number">
            {loading ? "—" : stats.challans}
          </div>

          <div className="stat-description">
            Sales documents
          </div>
        </div>
      </div>

      {/* QUICK OPERATIONS */}
      <div className="section-title">
        <div>
          <h2>Quick Operations</h2>

          <p>
            Access your core business modules.
          </p>
        </div>
      </div>

      <div className="operations-grid">
        <button
          type="button"
          className="operation-card"
          onClick={() => navigate("/customers")}
        >
          <div className="operation-number">
            01
          </div>

          <div className="operation-content">
            <h3>Customer CRM</h3>

            <p>
              Manage customers, business details,
              status and follow-ups.
            </p>
          </div>

          <span className="operation-arrow">
            →
          </span>
        </button>

        <button
          type="button"
          className="operation-card"
          onClick={() => navigate("/products")}
        >
          <div className="operation-number">
            02
          </div>

          <div className="operation-content">
            <h3>Products & Inventory</h3>

            <p>
              Manage products, pricing, stock and
              warehouse locations.
            </p>
          </div>

          <span className="operation-arrow">
            →
          </span>
        </button>

        <button
          type="button"
          className="operation-card"
          onClick={() =>
            navigate("/stock-movements")
          }
        >
          <div className="operation-number">
            03
          </div>

          <div className="operation-content">
            <h3>Stock Movements</h3>

            <p>
              Track inventory IN and OUT
              transactions.
            </p>
          </div>

          <span className="operation-arrow">
            →
          </span>
        </button>

        <button
          type="button"
          className="operation-card"
          onClick={() => navigate("/challans")}
        >
          <div className="operation-number">
            04
          </div>

          <div className="operation-content">
            <h3>Sales Challans</h3>

            <p>
              Create drafts and confirm sales
              challans.
            </p>
          </div>

          <span className="operation-arrow">
            →
          </span>
        </button>
      </div>

      {/* BUSINESS FLOW */}
      <div className="workflow-card">
        <div className="workflow-heading">
          <div>
            <h2>Operations Workflow</h2>

            <p>
              Core business flow of the portal
            </p>
          </div>
        </div>

        <div className="workflow">
          <div className="workflow-step">
            <span>01</span>
            <strong>Customer</strong>
            <small>CRM</small>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <span>02</span>
            <strong>Product</strong>
            <small>Inventory</small>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <span>03</span>
            <strong>Challan</strong>
            <small>Sales</small>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <span>04</span>
            <strong>Stock OUT</strong>
            <small>Movement</small>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;