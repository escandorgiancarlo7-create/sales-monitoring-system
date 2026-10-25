# Sales Monitoring System

A web-based sales and inventory application for recording point-of-sale transactions, managing products and customers, monitoring stock, and reviewing business performance. The React frontend communicates with an Express REST API backed by MySQL.

## Project Overview

The system brings day-to-day retail workflows into one dashboard. Employees sign in to work with the sales catalog, register customers, process sales, and review inventory. Managers and administrators can also adjust stock and run date-filtered reports; administrators manage employee accounts.

Sales are persisted as transactions with item-level details. At checkout, the backend verifies current product prices and stock, then records the sale, sale items, stock deductions, and inventory movement history together in a MySQL transaction.

## Features

### Point of Sale

- Build a cart from active products and select a registered customer or use walk-in checkout.
- Quantities must be positive whole numbers; the API calculates totals from current database prices rather than trusting client-submitted prices.
- Checkout checks and locks product stock before saving the sale.
- A successful checkout creates a sale, its line items, stock deductions, and corresponding inventory movement entries atomically. If any step fails, the transaction is rolled back.
- View recent transactions and inspect saved sale details.

### Inventory Management

- Review current stock, reorder thresholds, low-stock products, and recent movement history.
- Managers and administrators can record stock increases or decreases with a required reason.
- Adjustments cannot reduce inventory below zero.
- Sales and manual adjustments are both recorded in the inventory movement history.

### Product Management

- Create and edit products with a unique SKU, description, selling price, cost, and reorder level.
- Set opening inventory when creating a product; this is recorded as an opening stock movement.
- Product deactivation is a soft delete, preserving historical references.
- Low-stock alerts appear when a product's quantity is at or below its reorder level.

### Customer Relationship Management

- Register customers with name and optional email, phone, and address.
- Update or deactivate customer records.
- Associate a customer with a sale, or leave the customer blank for walk-in transactions.
- Customer deactivation preserves existing sales history.

### Employee and Access Management

- Employees sign in using JWT-based authentication. Passwords are stored as bcrypt hashes.
- API routes validate the bearer token and check the employee's current active status and role.
- Administrators can create employee accounts, assign roles, and deactivate accounts.

| Capability | Admin | Manager | Cashier |
|---|:---:|:---:|:---:|
| View dashboard, products, customers, inventory history, and sales | Yes | Yes | Yes |
| Create and update products | Yes | Yes | No |
| Deactivate products | Yes | No | No |
| Adjust inventory | Yes | Yes | No |
| Create, update, and deactivate customers | Yes | Yes | Yes |
| Create sales | Yes | Yes | Yes |
| View date-filtered reports | Yes | Yes | No |
| Manage employee accounts | Yes | No | No |

### Business Analytics and Reporting

- Dashboard cards summarize today's revenue and transactions, active products, stock units, and customer count.
- Charts show recent daily sales and revenue performance.
- The dashboard surfaces products at or below their configured reorder levels.
- Admins and managers can filter reports by date range and view revenue, transaction count, average sale, and top-selling products.
- Export report data as CSV.

### Security and Data Integrity

- Express Helmet supplies common HTTP security headers.
- CORS is configured with explicit allowed frontend origins.
- Database statements use parameterized queries for user-provided values.
- Checkout and stock adjustments use MySQL transactions; sales lock selected product rows while checking stock.
- API permissions are enforced server-side; hiding a page in the frontend is not the security boundary.
- Use a strong private JWT secret, unique credentials, HTTPS, and a narrowly scoped CORS allowlist in production.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Bootstrap 5, Chart.js, Lucide icons |
| Backend | Node.js, Express |
| Database | MySQL 8+, InnoDB |
| Authentication | JSON Web Tokens, bcrypt |
| Security middleware | Helmet, CORS |

## Database Schema Overview

The schema is defined in [`database/schema.sql`](./database/schema.sql); optional starter products and customers are in [`database/seed.sql`](./database/seed.sql).

| Table | Purpose |
|---|---|
| `employees` | Login identity, bcrypt password hash, role, and active status |
| `customers` | Customer contact details and active status |
| `products` | SKU, description, price, cost, current quantity, and reorder threshold |
| `sales` | Transaction header: customer (optional), employee, total, status, and timestamp |
| `sale_items` | Product snapshot, quantity, unit price, and line total for each sale |
| `inventory_movements` | Stock change type, signed quantity, employee, reason, and timestamp |

Relationships: a sale belongs to an employee and may belong to a customer; each sale has multiple sale items. Sale items reference products while retaining the product name and price at the time of sale. Inventory movements reference a product and optionally the employee who recorded the change. Foreign keys and indexes support consistency and common report lookups.

## Installation and Setup

### Prerequisites

- Node.js 20 or newer and npm
- MySQL 8.0 or newer, running locally or on a reachable database host

Commands below use PowerShell on Windows. In the MySQL import commands, `cmd /c` is used because input redirection with `<` is handled by `cmd.exe`.

### 1. Create the database

From the project root, import the schema. Enter your MySQL password when prompted:

```powershell
cmd /c "mysql -u root -p < database\schema.sql"
```

The schema creates and selects the `sales_monitoring` database. If your MySQL user is not `root`, replace it with the correct user.

### 2. Configure environment variables

Copy the example environment file into the backend and edit it:

```powershell
Copy-Item .env.example backend\.env
```

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for your MySQL server. Replace `JWT_SECRET` with a long, random secret. Set the initial administrator's `ADMIN_NAME`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` of at least eight characters. Do not commit `backend/.env` or share production secrets.

| Variable | Purpose | Default/example |
|---|---|---|
| `PORT` | Express API port | `4000` |
| `FRONTEND_ORIGIN` | Comma-separated allowed browser origins | `http://localhost:5173` |
| `DB_HOST` / `DB_PORT` | MySQL hostname and port | `localhost` / `3306` |
| `DB_NAME` | Database name | `sales_monitoring` |
| `DB_USER` / `DB_PASSWORD` | MySQL credentials | Configure for your server |
| `JWT_SECRET` | Token-signing secret | Required; replace example |
| `JWT_EXPIRES_IN` | JWT lifetime | `8h` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial administrator account | Configure before seeding |

### 3. Install dependencies

From the project root:

```powershell
npm.cmd run install:all
```

This installs root development tooling and dependencies for both `backend` and `frontend`.

### 4. Load starter data and create the administrator

The SQL seed inserts example products and customers. The backend seed script provisions the administrator from `backend/.env` and hashes the password:

```powershell
cmd /c "mysql -u root -p sales_monitoring < database\seed.sql"
npm.cmd --prefix backend run seed
```

The admin seed command can be rerun; it updates the account matching `ADMIN_EMAIL` with the configured name, password, and admin role.

### 5. Run the application

Start the API and frontend development servers together:

```powershell
npm.cmd run dev
```

- Web app: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

Sign in using the configured `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

To start only one service:

```powershell
npm.cmd --prefix backend run dev
npm.cmd --prefix frontend run dev
```

### Open on a phone on the same Wi-Fi

1. Run `ipconfig` on the development computer and note the Wi-Fi adapter's IPv4 address, such as `192.168.1.25`.
2. Add the computer's frontend URL to `FRONTEND_ORIGIN` in `backend/.env`, retaining localhost for desktop use:

   ```env
   FRONTEND_ORIGIN=http://localhost:5173,http://192.168.1.25:5173
   ```

3. Restart the dev servers and open `http://192.168.1.25:5173` on the phone while both devices are connected to the same private Wi-Fi network. The frontend uses the same hostname for the API on port `4000`.
4. If the devices cannot connect, allow Node.js or inbound TCP ports `5173` and `4000` through Windows Defender Firewall for private networks only. Do not expose the development server to public or untrusted networks.

### Production build

Build the frontend assets:

```powershell
npm.cmd run build
```

Start the backend in production mode with:

```powershell
npm.cmd start
```

Deploy the built frontend and API behind HTTPS in production. Configure `FRONTEND_ORIGIN` with only the actual trusted frontend origin(s), and set production secrets and database credentials outside source control.

## API Overview

All `/api` routes require a bearer token except login and the health check. Admin-only and admin/manager route restrictions are enforced on the backend.

| Method and path | Description | Access |
|---|---|---|
| `GET /api/health` | Database connectivity health check | Public |
| `POST /api/auth/login` | Authenticate and return a JWT | Public |
| `GET /api/auth/me` | Return the authenticated employee | Any signed-in user |
| `GET /api/dashboard` | Dashboard metrics, sales chart data, low-stock list | Any signed-in user |
| `GET /api/products` | List products | Any signed-in user |
| `POST`, `PUT /api/products` | Create or update a product | Admin, manager |
| `DELETE /api/products/:id` | Deactivate a product | Admin |
| `GET /api/inventory` | List recent stock movements | Any signed-in user |
| `POST /api/inventory/adjustments` | Adjust stock and record a movement | Admin, manager |
| `GET`, `POST`, `PUT`, `DELETE /api/customers` | List, register, update, or deactivate customers | Any signed-in user |
| `GET`, `POST`, `PUT /api/employees` | List, create, or update employee accounts | Admin |
| `GET /api/sales` | List recent sales | Any signed-in user |
| `POST /api/sales` | Check out a transaction | Any signed-in user |
| `GET /api/sales/:id` | Read a sale and its line items | Any signed-in user |
| `GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` | Date-filtered sales metrics and top products | Admin, manager |

## Project Structure

```text
backend/
  src/
    db.js
    middleware.js
    seed.js
    server.js
database/
  schema.sql
  seed.sql
frontend/
  src/
    pages/
    App.jsx
    api.js
    main.jsx
    styles.css
  index.html
```
