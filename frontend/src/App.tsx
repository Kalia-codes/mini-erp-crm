import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import StockMovements from "./pages/StockMovements";
import Challans from "./pages/Challans";

// =====================================================
// PROTECTED ROUTE
// =====================================================

const ProtectedRoute = ({
  children,
}: {
  children: ReactNode;
}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// =====================================================
// APP
// =====================================================

const App = () => {
  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* REGISTER */}
      <Route
        path="/register"
        element={<Register />}
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* CUSTOMERS */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* PRODUCTS */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* STOCK MOVEMENTS */}
      <Route
        path="/stock-movements"
        element={
          <ProtectedRoute>
            <Layout>
              <StockMovements />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* SALES CHALLANS */}
      <Route
        path="/challans"
        element={
          <ProtectedRoute>
            <Layout>
              <Challans />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* DEFAULT */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      {/* UNKNOWN URL */}
      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
};

export default App;