import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

type Role =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SALES");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post<RegisterResponse>(
        "/auth/register",
        {
          name,
          email,
          password,
          role,
        }
      );

      setSuccess(
        response.data.message ||
          "Account created successfully."
      );

      setName("");
      setEmail("");
      setPassword("");
      setRole("SALES");
      setShowPassword(false);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to create account."
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
            Build your
            <br />
            <span>operations team.</span>
          </h2>

          <p>
            Create employee access for the
            operations portal with role-based
            authentication.
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

      {/* REGISTER PANEL */}
      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="mobile-brand">
            <div className="brand-mark">N</div>
            <strong>NEXORA OPS</strong>
          </div>

          <div className="login-heading">
            <span className="login-label">
              EMPLOYEE ACCESS
            </span>

            <h2>Create account</h2>

            <p>
              Register an employee for the
              operations portal.
            </p>
          </div>

          <form onSubmit={handleRegister}>
            {/* NAME */}
            <div className="login-field">
              <label htmlFor="name">
                Full name
              </label>

              <div className="input-wrapper">
                <span className="input-icon">N</span>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="login-field">
              <label htmlFor="register-email">
                Email address
              </label>

              <div className="input-wrapper">
                <span className="input-icon">@</span>

                <input
                  id="register-email"
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
              <label htmlFor="register-password">
                Password
              </label>

              <div className="input-wrapper">
                <span className="input-icon">●</span>

                <input
                  id="register-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);

                    if (event.target.value === "") {
                      setShowPassword(false);
                    }
                  }}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />

                {password.length > 0 && (
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>

            {/* ROLE */}
            <div className="login-field">
              <label htmlFor="role">
                Role
              </label>

              <div className="input-wrapper">
                <span className="input-icon">R</span>

                <select
                  id="role"
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value as Role
                    )
                  }
                  required
                >
                  <option value="ADMIN">
                    Admin
                  </option>

                  <option value="SALES">
                    Sales
                  </option>

                  <option value="WAREHOUSE">
                    Warehouse
                  </option>

                  <option value="ACCOUNTS">
                    Accounts
                  </option>
                </select>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>!</span>
                {error}
              </div>
            )}

            {success && (
              <div className="login-success">
                <span>✓</span>
                {success}
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Creating account..."
                  : "Create account"}
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
                Role-based employee access
              </span>
            </div>

            <p className="register-prompt">
              Already have an account?{" "}
              <button
                type="button"
                className="register-link"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;