import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import type { User } from "../types";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        response.data.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.data.user)
      );

      navigate("/dashboard");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* LEFT BRAND PANEL */}
      <section className="login-brand-panel">
        <div className="brand-logo">
          <div className="brand-mark">N</div>

          <div>
            <h1>NEXORA OPS</h1>
            <span>ERP + CRM</span>
          </div>
        </div>

        <div className="brand-content">
          <span className="eyebrow">
            OPERATIONS MANAGEMENT
          </span>

          <h2>
            Run your business
            <br />
            <span>with clarity.</span>
          </h2>

          <p>
            A centralized operations portal for
            customers, inventory, stock movements
            and sales challans.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <div className="feature-icon">01</div>

            <div>
              <strong>Customer CRM</strong>

              <span>
                Manage customer relationships and
                follow-ups.
              </span>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">02</div>

            <div>
              <strong>Inventory Control</strong>

              <span>
                Track products and real-time stock.
              </span>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">03</div>

            <div>
              <strong>Sales Operations</strong>

              <span>
                Create and confirm sales challans.
              </span>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <span>MINI ERP + CRM OPERATIONS PORTAL</span>
          <span>v1.0</span>
        </div>
      </section>

      {/* LOGIN PANEL */}
      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="mobile-brand">
            <div className="brand-mark">N</div>
            <strong>NEXORA OPS</strong>
          </div>

          <div className="login-heading">
            <span className="login-label">
              SECURE ACCESS
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in to access your operations
              dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* EMAIL */}
            <div className="login-field">
              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">
                <span className="input-icon">@</span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">
                <span className="input-icon">●</span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);

                    // Hide password text again when the
                    // field becomes empty.
                    if (event.target.value === "") {
                      setShowPassword(false);
                    }
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                {/* SHOW / HIDE PASSWORD */}
                {password.length > 0 && (
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="login-error">
                <span>!</span>
                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Authenticating..."
                  : "Sign in to portal"}
              </span>

              {!loading && (
                <span className="arrow">→</span>
              )}
            </button>
          </form>

          <div className="login-bottom">
  <div className="security-note">
    <span className="security-dot"></span>

    <span>
      Protected by JWT-based authentication
    </span>
  </div>

  <p className="register-prompt">
    Need an employee account?{" "}
    <button
      type="button"
      className="register-link"
      onClick={() => navigate("/register")}
    >
      Register
    </button>
  </p>
</div>
        </div>
      </section>
    </div>
  );
};

export default Login;