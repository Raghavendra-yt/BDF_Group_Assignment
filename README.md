# PrintPoint Centre – 3D Printer Reservation & Queue Management System

## Project Overview

**PrintPoint Centre** is a high-performance backend REST API developed for **Theme 19: 3D Printers** using **Node.js, Express.js, and SQLite** (`better-sqlite3`).

### Problem Statement
> *"3D printers are reserved by walking up to the desk. Long prints block a machine for others and nobody sees the queue. Please build us a system that fixes this."*  
> — **BDF Group Assignment Client Brief (Theme 19 of 30 · ST-CSEQE2B-G04)**

### The Solution
PrintPoint Centre eliminates physical desk bottlenecks and opaque machine queues by providing a centralised reservation and queue management engine. The system tracks 3D printer hardware specs (name, filament/resin materials), manages registered designers, schedules print duration hours, enforces strict referential integrity across print queues, and offers an intelligent, case-insensitive **Smart Search** engine across the entire printer fleet.

---

## Technologies Used

- **Runtime & Web Framework:** Node.js (v18+), Express.js (v4.21.0)
- **Database Engine:** SQLite3 via `better-sqlite3` (v11.0.0) with Write-Ahead Logging (WAL) and enforced Foreign Keys
- **Language & Standards:** Modern JavaScript (ES6+, CommonJS, RESTful JSON API Standards)
- **API Testing & Verification:** Postman v2.1 Collection, Native Node.js Automated HTTP Regression Suite (`test-all.js`)

---

## Team Contributions

The project work is distributed across five modular domains matching the client brief specifications (**ST-CSEQE2B-G04**):

| S.No. | Registration Number | Team Member Name | Branch / Module | Responsibilities |
| :---: | :--- | :--- | :--- | :--- |
| **1** | 252U1R8052 | **Raghavendra** | **Server & Routing Architecture – Major** | Express application setup, global middleware, JSON parser, modular route mounting, 404 handler, and centralised error handling pipeline (`server.js`). |
| **2** | 252U1R8060 | **Abdul Samad** | **Database & Persistence – Major** | SQLite database initialization, relational schema creation, WAL pragma configuration, foreign key enforcement (`PRAGMA foreign_keys = ON`), and atomic database auto-seeding (`db.js`). |
| **3** | 252U1R8089 | **Karthikeya** | **REST CRUD & Queue Engine – Major** | Full CRUD implementation for 3D printers, designer registration endpoints, and the multi-table `INNER JOIN` query returning live queue states with designer and machine names. |
| **4** | 252U1R8076 | **Sai Siva Teja** | **Validation Guard & Smart Search Twist – Major** | Strict input validation pipelines (type checking, non-empty whitespace stripping), email regex validation, foreign key existence verification, and the case-insensitive partial Smart Search twist (`?q=...`). |
| **5** | 252U1R80 | **Anish** | **Testing, Documentation & QA – Major** | Comprehensive 28-request Postman v2.1 test collection with automated test scripts, full regression test suite (`test-all.js`), and exhaustive project documentation (`README.md`). |

### Contribution Structure
- **5 Focused Modules:** Server & Middleware, Database Architecture, Core REST & Relational Queries, Validation & Smart Search Twist, and QA / Postman Test Automation.
- **Git Commit Attribution:** Each member's contribution is reflected directly in the GitHub commit history with individual author attribution matching their assigned module.

---

## Main Features

1. **Designer Profile & Identity Management:** Full CRUD tracking with RFC-compliant email validation and database-level `UNIQUE` constraint protection.
2. **3D Printer Fleet Inventory Management:** Complete CRUD endpoints (`GET`, `GET :id`, `POST`, `PUT`, `DELETE`) for printers, managing machine names and supported material types (PLA, PETG, ABS, Resin, TPU, Carbon Fiber).
3. **Queue & Reservation Engine:** Centralised print queue scheduling allowing designers to book printer time, specify print duration in hours, and track queue lifecycle states (`queued`, `printing`, `completed`).
4. **Three-Table Relational INNER JOIN:** Custom join query across `reservations`, `designers`, and `printers` returning comprehensive booking summaries with `designer_name` and `printer_name` in a single query.
5. **Star Feature (Smart Search Twist):** Case-insensitive partial text matching across both `name` AND `material` columns with automatic empty state detection returning HTTP `200` with `{"message": "Nothing found", "printers": []}`.
6. **Strict Input Sanitization & Validation Guards:** All `POST` and `PUT` endpoints validate presence, string types, and non-empty whitespace; malformed inputs immediately yield HTTP `400 Bad Request` with descriptive JSON diagnostics.
7. **Foreign Key Referential Integrity:** Enforced at the engine level via `PRAGMA foreign_keys = ON;`, preventing orphan reservations and verifying foreign IDs before write operations.
8. **Automated Database Bootstrapping & Seeding:** On startup, the system automatically checks table occupancy and atomically seeds realistic designers, printers, and active reservations within a single WAL transaction if empty.
9. **Centralised Error & 404 Handling:** Uniform error responses across all routes returning consistent JSON error payloads.

---

## Database Architecture & Schema

The relational database (`printpoint.db`) enforces referential integrity across three related tables:

```text
┌──────────────────────────┐          ┌───────────────────────────────────┐          ┌──────────────────────────┐
│        designers         │          │           reservations            │          │         printers         │
├──────────────────────────┤          ├───────────────────────────────────┤          ├──────────────────────────┤
│ id    INTEGER [PK, AUTO] │◄───┐     │ id                   INTEGER [PK] │     ┌───►│ id    INTEGER [PK, AUTO] │
│ name  TEXT    [NOT NULL] │    └─────│ designer_id          INTEGER [FK] │     │    │ name  TEXT    [NOT NULL] │
│ email TEXT    [UQ, NOT]  │          │ printer_id           INTEGER [FK] ├─────┘    │ material TEXT [NOT NULL] │
└──────────────────────────┘          │ print_duration_hours REAL    [NOT]│          └──────────────────────────┘
                                      │ status               TEXT    [DEF]│
                                      └───────────────────────────────────┘
```

### Table Definitions

1. **`designers`**
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `name`: TEXT NOT NULL
   - `email`: TEXT NOT NULL UNIQUE

2. **`printers`**
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `name`: TEXT NOT NULL (e.g., `"Prusa MK4 Printer"`, `"Bambu Lab X1C"`, `"Formlabs Form 4"`)
   - `material`: TEXT NOT NULL (e.g., `"PLA"`, `"PETG"`, `"ABS"`, `"Resin"`)

3. **`reservations`**
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `designer_id`: INTEGER NOT NULL (FOREIGN KEY references `designers(id)`)
   - `printer_id`: INTEGER NOT NULL (FOREIGN KEY references `printers(id)`)
   - `print_duration_hours`: REAL NOT NULL (Positive floating-point duration)
   - `status`: TEXT NOT NULL DEFAULT `'queued'` (Enum-like values: `'queued'`, `'printing'`, `'completed'`)

### Database Pragmas
- `PRAGMA foreign_keys = ON;` — Guarantees referential integrity; rejects invalid parent IDs.
- `PRAGMA journal_mode = WAL;` — Write-Ahead Logging delivers concurrent reads without database lock contention.

---

## REST API Endpoints Reference

### 1. Printers Fleet (`/printers`) — Full CRUD & Smart Search
| Method | Endpoint | Description | Request Body | Status Codes |
| :---: | :--- | :--- | :--- | :---: |
| `GET` | `/printers` | List all printers or execute **Smart Search** via `?q=...` | *None* | `200` |
| `GET` | `/printers/:id` | Fetch single printer by ID | *None* | `200`, `404` |
| `POST` | `/printers` | Add a new 3D printer to fleet | `{"name": "string", "material": "string"}` | `201`, `400` |
| `PUT` | `/printers/:id` | Update machine name and/or material | `{"name": "string", "material": "string"}` | `200`, `400`, `404` |
| `DELETE` | `/printers/:id` | Remove printer from fleet | *None* | `200`, `404` |

### 2. Designers (`/designers`)
| Method | Endpoint | Description | Request Body | Status Codes |
| :---: | :--- | :--- | :--- | :---: |
| `GET` | `/designers` | List all registered designers | *None* | `200` |
| `GET` | `/designers/:id` | Fetch designer profile by ID | *None* | `200`, `404` |
| `POST` | `/designers` | Register a new designer | `{"name": "string", "email": "string"}` | `201`, `400` |

### 3. Reservations & Live Queue (`/reservations`)
| Method | Endpoint | Description | Request Body | Status Codes |
| :---: | :--- | :--- | :--- | :---: |
| `GET` | `/reservations` | **Three-Table INNER JOIN:** Returns full queue with `designer_name` & `printer_name` | *None* | `200` |
| `POST` | `/reservations` | Schedule print reservation with FK validation | `{"designer_id": int, "printer_id": int, "print_duration_hours": float, "status": "string"}` | `201`, `400`, `404` |

---

## Special Feature: Smart Search Twist

The assignment specifies a dedicated **Smart Search Twist**:  
`GET /printers?q=word` matches the name or the material, anywhere in the text, ignoring capital letters. No match gets HTTP `200`, an empty list, and the exact message `"Nothing found"`.

### Implementation Logic
```sql
SELECT * FROM printers
WHERE LOWER(name) LIKE ? OR LOWER(material) LIKE ?
-- Parameter bound: `%${q.toLowerCase()}%`
```

### Twist Verification Matrix (All 3 Tests Verified)

| Test ID | Request Query | Matching Condition | Expected HTTP Status | Expected Response Body |
| :---: | :--- | :--- | :---: | :--- |
| **Test 1** | `GET /printers?q=printer` | Matches "printer" substring in `name` | **`200 OK`** | List of matching printers (`count > 0`) |
| **Test 2** | `GET /printers?q=PRINTER` | Case-insensitive uppercase variant | **`200 OK`** | **Identical** array of printers as Test 1 |
| **Test 3** | `GET /printers?q=zzz` | Substring not present in database | **`200 OK`** | `{"message": "Nothing found", "printers": []}` |

---

## Project Structure

```text
BDF_Group_Ass/
├── routes/
│   ├── designers.js                           # Designer profile routes with regex & unique email validation
│   ├── printers.js                            # Printer fleet CRUD + Smart Search (?q=...) twist logic
│   └── reservations.js                        # Reservation queue engine & 3-table INNER JOIN query
├── PrintPoint_Centre.postman_collection.json  # Comprehensive 28-request Postman v2.1 verification collection
├── server.js                                  # Express setup, JSON middleware, error handling, server entry
├── db.js                                      # SQLite connection, schema DDL, WAL pragma, and auto-seeder
├── test-all.js                                # Standalone 54-test automated HTTP regression test runner
├── package.json                               # Project metadata, dependencies, and npm scripts
├── .gitignore                                 # Git ignore rules for node_modules/ and database files
└── README.md                                  # Comprehensive architectural and user documentation
```

---

## Installation and Execution

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** (bundled with Node.js)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Raghavendra-yt/BDF_Group_Assignment.git
   cd BDF_Group_Assignment
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the API server:**
   ```bash
   npm start
   ```
   *(For development mode with automatic hot reload: `npm run dev`)*

4. **Verify server is operational:**
   - Server Address: `http://localhost:3000`
   - Health Check: `GET http://localhost:3000/`

---

## Testing & Verification

The project includes two independent layers of verification: a zero-dependency automated regression test suite and an importable Postman collection.

### 1. Automated Regression Test Suite (`npm test`)
Execute the full test suite in your terminal:
```bash
npm test
```

**Test Execution Results:**
- **Suite 1 (Health & Root):** 4 / 4 passed
- **Suite 2 (Designers Module):** 11 / 11 passed
- **Suite 3 (Printers CRUD):** 13 / 13 passed
- **Suite 4 (Smart Search Twist):** 7 / 7 passed
- **Suite 5 (Reservations & INNER JOIN):** 19 / 19 passed
- **Total:** **54 automated regression tests passed with 0 failures.**

---

## Postman Demonstration Sequence (3-Minute Live Demo)

Import `PrintPoint_Centre.postman_collection.json` directly into Postman. The collection is organized into a clean 12-step sequence demonstrating all grading criteria:

### Step 01: API Health Check (`GET /`)
- **Status:** `200 OK`
- **Verification:** Verifies server is active and lists supported routes (`/designers`, `/printers`, `/reservations`).

### Step 02: List Seeded Designers (`GET /designers`)
- **Status:** `200 OK`
- **Verification:** Confirms database auto-seeding initialized realistic designer accounts.

### Step 03: Register New Designer (`POST /designers`)
- **Status:** `201 Created`
- **Body:** `{"name": "Fiona McGregor", "email": "fiona@printpoint.io"}`
- **Verification:** Confirms dynamic designer creation and returns newly minted database ID.

### Step 04: Duplicate Email Guard (`POST /designers`)
- **Status:** `400 Bad Request`
- **Body:** `{"name": "Alice Duplicate", "email": "alice@printpoint.io"}`
- **Verification:** Enforces SQLite UNIQUE constraint and rejects duplicate registration.

### Step 05: List 3D Printer Fleet (`GET /printers`)
- **Status:** `200 OK`
- **Verification:** Retrieves all operational 3D printers with their respective materials (PLA, PETG, Resin, ABS).

### Step 06: Add New Machine to Fleet (`POST /printers`)
- **Status:** `201 Created`
- **Body:** `{"name": "Elegoo Saturn 3", "material": "Resin"}`
- **Verification:** Validates input strings and adds machine to inventory.

### Step 07: Twist Test 1 – Smart Search Substring (`GET /printers?q=printer`)
- **Status:** `200 OK`
- **Verification:** Evaluates `LOWER(name) LIKE '%printer%'` and returns all matching printers.

### Step 08: Twist Test 2 – Smart Search Case-Insensitive (`GET /printers?q=PRINTER`)
- **Status:** `200 OK`
- **Verification:** Confirms uppercase query returns the exact same matching items as lowercase Test 1.

### Step 09: Twist Test 3 – Smart Search No Match (`GET /printers?q=zzz`)
- **Status:** `200 OK`
- **Verification:** Returns `{"message": "Nothing found", "printers": []}` matching the client twist specification.

### Step 10: Multi-Table INNER JOIN Queue Inspection (`GET /reservations`)
- **Status:** `200 OK`
- **Verification:** Executes SQL `INNER JOIN` across `reservations`, `designers`, and `printers`, returning human-readable `designer_name` and `printer_name` alongside machine material and duration.

### Step 11: Queue New Print Reservation (`POST /reservations`)
- **Status:** `201 Created`
- **Body:** `{"designer_id": 2, "printer_id": 3, "print_duration_hours": 4.5, "status": "queued"}`
- **Verification:** Confirms foreign keys exist and inserts new queued print job.

### Step 12: Foreign Key Integrity Guard (`POST /reservations`)
- **Status:** `404 Not Found`
- **Body:** `{"designer_id": 999, "printer_id": 1, "print_duration_hours": 2.0, "status": "queued"}`
- **Verification:** Verifies referential integrity; rejects reservation with clear error: `Designer with id 999 not found.`

---

## Project Objective & Client Brief Alignment

The primary objective of **PrintPoint Centre** is to deliver a transparent, reliable, and accessible 3D printer management backend that addresses every problem highlighted in the original client brief:

- **Desk Walk-up Bottleneck Eliminated:** Designers can register accounts and reserve machines programmatically through a standardized REST interface.
- **Queue Transparency:** The Three-Table `INNER JOIN` endpoint exposes real-time machine allocation, print duration hours, and execution states (`queued`, `printing`, `completed`) to all users.
- **Hardware Discoverability:** The case-insensitive **Smart Search** engine enables users to quickly locate printers by machine make, model, or desired print material (e.g., Resin, PLA, PETG).
- **Industrial Reliability:** Built on ACID-compliant SQLite transactions, enforced foreign keys, and strict schema validation guards.
