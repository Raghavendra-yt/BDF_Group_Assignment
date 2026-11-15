# 🖨️ PrintPoint Centre — 3D Printer Reservation & Queue Management API

A RESTful API built with **Node.js**, **Express**, and **SQLite** (`better-sqlite3`) for managing 3D printer reservations, designers, and print queues.

---

## 📁 Project Structure

```
BDF_Group_Ass/
├── server.js                                  # Express server setup & entry point
├── db.js                                      # SQLite DB init, schema & seed data
├── routes/
│   ├── designers.js                           # /designers endpoints
│   ├── printers.js                            # /printers endpoints (CRUD + Smart Search)
│   └── reservations.js                        # /reservations endpoints (JOIN query)
├── PrintPoint_Centre.postman_collection.json  # Postman v2.1 test collection
├── package.json                               # NPM dependencies & scripts
├── printpoint.db                              # SQLite database (auto-created)
└── README.md                                  # You are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (includes `npm`)

### Installation

```bash
# 1. Navigate to the project folder
cd BDF_Group_Ass

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

The server starts on **http://localhost:3000** and automatically creates the SQLite database with sample data on first run.

### Development Mode (auto-restart on changes)

```bash
npm run dev
```

---

## 🗄️ Database Schema

Three related tables with foreign key constraints:

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│  designers   │       │  reservations    │       │   printers   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ designer_id (FK) │       │ id (PK)      │
│ name         │       │ printer_id (FK)  │──────►│ name         │
│ email (UQ)   │       │ print_duration   │       │ material     │
└──────────────┘       │ status           │       └──────────────┘
                       └──────────────────┘
```

- **`designers`** — `id`, `name`, `email` (unique)
- **`printers`** — `id`, `name`, `material`
- **`reservations`** — `id`, `designer_id` (FK), `printer_id` (FK), `print_duration_hours`, `status` (`queued` | `printing` | `completed`)

Foreign keys are enforced via `PRAGMA foreign_keys = ON`.

---

## 📡 API Endpoints

### Designers — `/designers`

| Method | Endpoint          | Description           | Status Codes  |
|--------|-------------------|-----------------------|---------------|
| GET    | `/designers`      | List all designers    | `200`         |
| GET    | `/designers/:id`  | Get designer by ID    | `200`, `404`  |
| POST   | `/designers`      | Create a new designer | `201`, `400`  |

### Printers — `/printers` (Full CRUD + Smart Search)

| Method | Endpoint          | Description                        | Status Codes        |
|--------|-------------------|------------------------------------|---------------------|
| GET    | `/printers`       | List all printers                  | `200`               |
| GET    | `/printers?q=...` | **Smart Search** (see below)       | `200`               |
| GET    | `/printers/:id`   | Get printer by ID                  | `200`, `404`        |
| POST   | `/printers`       | Add a new printer                  | `201`, `400`        |
| PUT    | `/printers/:id`   | Update a printer                   | `200`, `400`, `404` |
| DELETE | `/printers/:id`   | Delete a printer                   | `200`, `404`        |

### Reservations — `/reservations`

| Method | Endpoint         | Description                                         | Status Codes              |
|--------|------------------|-----------------------------------------------------|---------------------------|
| GET    | `/reservations`  | List all reservations (INNER JOIN with names)        | `200`                     |
| POST   | `/reservations`  | Create a reservation (validates FK existence)        | `201`, `400`, `404`       |

---

## 🔍 Smart Search (Twist Feature)

`GET /printers?q=<search_term>`

Case-insensitive partial matching across printer `name` AND `material` fields.

| Test Case                  | Expected Result                                          |
|---------------------------|----------------------------------------------------------|
| `?q=printer`              | `200` — returns printers with "printer" in name          |
| `?q=PRINTER`              | `200` — same results as above (case-insensitive)         |
| `?q=zzz`                  | `200` — `{ "message": "Nothing found", "printers": [] }` |
| `?q=resin`                | `200` — returns printers with "Resin" material           |

---

## ✅ Validation Rules

All `POST` and `PUT` endpoints validate input:

- **Printers**: `name` and `material` must be non-empty strings (whitespace-only rejected).
- **Designers**: `name` and `email` required; email must be valid format and unique.
- **Reservations**: `designer_id` and `printer_id` must reference existing records; `print_duration_hours` must be a positive number; `status` must be one of `queued`, `printing`, or `completed`.

Invalid input returns **`400`** with a descriptive error message.

---

## 🧪 Testing with Postman

1. Open **Postman** and click **Import**.
2. Select the file `PrintPoint_Centre.postman_collection.json`.
3. The collection uses the variable `{{baseUrl}}` defaulting to `http://localhost:3000`.
4. Make sure the server is running, then execute the requests in order.

### Included Test Cases

- ✅ All CRUD operations for printers (create, read, update, delete)
- ✅ Designer creation with validation (missing fields, duplicate email, invalid email)
- ✅ Reservation creation with FK validation (missing/invalid designer or printer)
- ✅ Smart Search: `?q=printer`, `?q=PRINTER`, `?q=zzz`, `?q=resin`, `?q=pla`
- ✅ 404 responses for non-existent resources
- ✅ 400 responses for validation failures

---

## 🧪 Quick `curl` Test Examples

```bash
# List all printers
curl http://localhost:3000/printers

# Smart Search (case-insensitive)
curl "http://localhost:3000/printers?q=printer"
curl "http://localhost:3000/printers?q=PRINTER"
curl "http://localhost:3000/printers?q=zzz"

# Create a printer
curl -X POST http://localhost:3000/printers \
  -H "Content-Type: application/json" \
  -d '{"name": "New Printer", "material": "PLA"}'

# List reservations (with JOIN data)
curl http://localhost:3000/reservations

# Create a reservation
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{"designer_id": 1, "printer_id": 2, "print_duration_hours": 3.5, "status": "queued"}'
```

---

## 🛠️ Tech Stack

| Technology       | Purpose                    |
|-----------------|----------------------------|
| Node.js         | Runtime environment        |
| Express         | Web framework              |
| better-sqlite3  | SQLite database driver     |
| Postman         | API testing                |

---

## 👥 Team & Responsibilities (ST-CSEQE2B-G04)

| Member | GitHub Username | Assigned Role / Module |
|---|---|---|
| **Raghavendra** | [@Raghavendra-yt](https://github.com/Raghavendra-yt) | **Part 1:** Server and routes (`server.js`, setup & status codes) |
| **Abdul** | [@abdulsamad301207-star](https://github.com/abdulsamad301207-star) | **Part 2:** Database (`db.js`, schema, FK enforcement & seeding) |
| **Karthikeya** | [@jayraguhuram-commits](https://github.com/jayraguhuram-commits) | **Part 3:** REST endpoints (CRUD & JOIN queries) |
| **Siva (Sai Siva Teja)** | [@sivamanidharreddy-cloud](https://github.com/sivamanidharreddy-cloud) | **Part 4 & 5:** Validation & Smart Search Twist |
| **Anish** | [@orugalluanesh-ops](https://github.com/orugalluanesh-ops) | **Part 6:** Postman collection & README documentation |

---

Built as a group assignment for the Backend Development Fundamentals (BDF) module.
