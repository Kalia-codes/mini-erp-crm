Mini ERP + CRM Operations Portal

A small ERP/CRM operations portal for a wholesale/distribution business used by Sales, Warehouse, Accounts, and Admin teams.

Live Application

GitHub: https://github.com/Kalia-codes/mini-erp-crm
Frontend: https://mini-erp-crm-frontend-ten.vercel.app
Backend API: https://mini-erp-crm-backend-62f0.onrender.com
Health check: https://mini-erp-crm-backend-62f0.onrender.com/api/health

Technology Stack
Frontend
React
TypeScript
HTML/CSS
Vite
Axios

Backend

Node.js
TypeScript
Express.js
REST API
JWT authentication
bcrypt/bcryptjs password hashing

Database
MySQL 8.0-compatible schema
mysql2
Production database hosted on Aiven MySQL

Development and Deployment
VS Code
Git/GitHub
Vercel for frontend
Render for backend
Aiven MySQL for production database

Core Features
Authentication and Roles
The portal supports four roles:
ADMIN
SALES
WAREHOUSE
ACCOUNTS
Authentication uses JWT. Passwords are stored as bcrypt hashes.

Customer CRM
Add customer
Edit customer
Search/filter customers
View customer details
Follow-up date
Follow-up notes
Customer type: Retail, Wholesale, Distributor
Status: Lead, Active, Inactive

Products and Inventory
Add product
Edit product
Search/filter products
Unit price
Current stock
Minimum stock alert quantity
Warehouse/location
Inventory value and low-stock indicators

Stock Movement
Record IN and OUT movements
Track quantity and reason
Prevent negative stock
Store creator and timestamp
Stock movements created during sales-challan confirmation are recorded as OUT movements
Sales Challans

Select customer
Add multiple products and quantities
Automatic challan number
Draft / Confirmed / Cancelled status
Product snapshot data stored in challan items
Confirmation reduces stock
Insufficient stock returns an API error
Cancelled/draft handling
Created-by information

Architecture
```text
React + TypeScript (Vercel)
            |
            | HTTPS / REST / JWT
            v
Node.js + Express + TypeScript (Render)
            |
            | mysql2 + SSL
            v
       MySQL (Aiven)
```
The frontend uses a shared Axios API client. The client reads the JWT from local storage and sends it as a Bearer token with API requests.
The backend validates the JWT, applies role authorization where required, validates request data, and performs database operations through service modules.

Main Database Tables
`users`
`customers`
`products`
`stock_movements`
`challans`
`challan_items`
`challan_items` stores product snapshot fields such as product name, SKU, unit price, and quantity so historical challan data does not depend only on the current product record.
Local Setup
Prerequisites
Node.js
npm
MySQL 8.0-compatible server

Clone
```bash
git clone https://github.com/Kalia-codes/mini-erp-crm.git
cd mini-erp-crm
```
Backend
```bash
cd backend
npm install
```
Create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=mini_erp_crm
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=1d
```
For production, configure the MySQL SSL CA variable required by the deployed Aiven connection:
```env
DB_SSL_CA=YOUR_BASE64_ENCODED_AIVEN_CA
```
Run the backend:
```bash
npm run dev
```
Build:
```bash
npm run build
```
Start production build:
```bash
npm start
```
Frontend
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Build:
```bash
npm run build
```
The production frontend uses:
```text
https://mini-erp-crm-backend-62f0.onrender.com/api
```
through `src/services/api.ts`.

API Overview
Base URL:
```text
https://mini-erp-crm-backend-62f0.onrender.com/api
```
Authentication
```text
POST /auth/login
```
Customers
```text
GET    /customers
GET    /customers/:id
POST   /customers
PUT    /customers/:id
```
Products
```text
GET    /products
GET    /products/:id
POST   /products
PUT    /products/:id
GET    /products/stock-movements/list
POST   /products/:id/stock
```
Stock Movements
```text
GET  /stock-movements
POST /stock-movements
```
Challans
```text
GET  /challans
GET  /challans/:id
POST /challans
POST /challans/:id/confirm
POST /challans/:id/cancel
```
Authentication-protected endpoints require:
```text
Authorization: Bearer <JWT_TOKEN>
```
Test Credentials
Four production role accounts have been verified:
ADMIN: use the production Admin test account supplied with the submission
SALES: use the production Sales test account supplied with the submission
WAREHOUSE: use the production Warehouse test account supplied with the submission
ACCOUNTS: use the production Accounts test account supplied with the submission
> Do not commit real passwords or JWT secrets to the Git repository. Put the exact test usernames/passwords in the final submission form or evaluator message.
> 
Deployment
Frontend – Vercel
Repository: `Kalia-codes/mini-erp-crm`
Production branch: `main`
Root directory: `frontend`
Framework preset: Vite
Output directory: `dist`
GitHub integration is enabled
Backend – Render
The backend runs the compiled TypeScript application:
```bash
npm install && npm run build
npm start
```
Production environment variables include database credentials, Aiven SSL CA, JWT secret, and JWT expiry.
Database – Aiven MySQL
The production database is MySQL-compatible and configured for SSL.
API Testing
A Postman collection is included with this project submission:
`Mini-ERP-CRM-Postman-Collection.json`
Set these collection variables in Postman:
```text
baseUrl = https://mini-erp-crm-backend-62f0.onrender.com/api
adminEmail = <your admin test email>
adminPassword = <your admin test password>
salesEmail = <your sales test email>
salesPassword = <your sales test password>
warehouseEmail = <your warehouse test email>
warehousePassword = <your warehouse test password>
accountsEmail = <your accounts test email>
accountsPassword = <your accounts test password>
customerId = 1
productId = 1
challanId = 1
```
Run the relevant login request to obtain a JWT and set the corresponding token variable before testing protected endpoints.

Assumptions / Role Permissions
The implementation uses these working assumptions:
ADMIN has full operational access.
SALES can work with customers and sales challans.
WAREHOUSE handles products and inventory/stock operations.
ACCOUNTS can access customer/challan information needed for operations.
These role permissions are implementation assumptions for the case study because the brief requires role-based access but does not prescribe every endpoint-to-role mapping.

Known Limitations

The application is intentionally limited to the core case-study scope.
No advanced reporting, analytics, payment integration, invoicing, notifications, or other bonus functionality has been added.
Free hosting tiers may have cold-start delays.
Test credentials should be rotated after evaluation.
Pagination and additional enterprise-scale optimizations can be added later if the data volume requires them.
