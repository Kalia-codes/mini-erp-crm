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



React + TypeScript (Vercel)

&#x20;           |

&#x20;           | HTTPS / REST / JWT

&#x20;           v

Node.js + Express + TypeScript (Render)

&#x20;           |

&#x20;           | mysql2 + SSL

&#x20;           v

&#x20;      MySQL (Aiven)



The frontend uses a shared Axios API client. The client reads the JWT from local storage and sends it as a Bearer token with API requests.



The backend validates the JWT, applies role authorization where required, validates request data, and performs database operations through service modules.



Main Database Tables



users



customers



products



stock\_movements



challans



challan\_items



challan\_items stores product snapshot fields such as product name, SKU, unit price, and quantity so historical challan data does not depend only on the current product record.



Local Setup



Prerequisites



Node.js



npm



MySQL 8.0-compatible server



Clone



git clone https://github.com/Kalia-codes/mini-erp-crm.git

cd mini-erp-crm



Backend



cd backend

npm install



Create backend/.env:



PORT=5000

DB\_HOST=localhost

DB\_PORT=3306

DB\_USER=root

DB\_PASSWORD=YOUR\_MYSQL\_PASSWORD

DB\_NAME=mini\_erp\_crm

JWT\_SECRET=YOUR\_JWT\_SECRET

JWT\_EXPIRES\_IN=1d



For production, configure the MySQL SSL CA variable required by the deployed Aiven connection:



DB\_SSL\_CA=YOUR\_BASE64\_ENCODED\_AIVEN\_CA



Run the backend:



npm run dev



Build:



npm run build



Start production build:



npm start



Frontend



In another terminal:



cd frontend

npm install

npm run dev



Build:



npm run build



The production frontend uses:



https://mini-erp-crm-backend-62f0.onrender.com/api



through src/services/api.ts.



API Overview



Base URL:



https://mini-erp-crm-backend-62f0.onrender.com/api



Authentication



POST /auth/login



Customers



GET    /customers

GET    /customers/:id

POST   /customers

PUT    /customers/:id



Products



GET    /products

GET    /products/:id

POST   /products

PUT    /products/:id

GET    /products/stock-movements/list

POST   /products/:id/stock



Stock Movements



GET  /stock-movements

POST /stock-movements



Challans



GET  /challans

GET  /challans/:id

POST /challans

POST /challans/:id/confirm

POST /challans/:id/cancel



Authentication-protected endpoints require:



Authorization: Bearer <JWT\_TOKEN>



Test Credentials



Four production role accounts have been verified:



ADMIN: use the production Admin test account supplied with the submission



SALES: use the production Sales test account supplied with the submission



WAREHOUSE: use the production Warehouse test account supplied with the submission



ACCOUNTS: use the production Accounts test account supplied with the submission



Do not commit real passwords or JWT secrets to the Git repository. Put the exact test usernames/passwords in the final submission form or evaluator message.



Deployment



Frontend – Vercel



Repository: Kalia-codes/mini-erp-crm



Production branch: main



Root directory: frontend



Framework preset: Vite



Output directory: dist



GitHub integration is enabled



Backend – Render



The backend runs the compiled TypeScript application:



npm install \&\& npm run build

npm start



Production environment variables include database credentials, Aiven SSL CA, JWT secret, and JWT expiry.



Database – Aiven MySQL



The production database is MySQL-compatible and configured for SSL.



API Testing



A Postman collection is included with this project submission:



Mini-ERP-CRM-Postman-Collection.json



Set these collection variables in Postman:



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

