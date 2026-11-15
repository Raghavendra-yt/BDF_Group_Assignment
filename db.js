// ---------------------------------------------------------------------------
// db.js — SQLite database initialisation, schema creation & seed data
// ---------------------------------------------------------------------------
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'printpoint.db');
const db = new Database(DB_PATH);

// ── Enforce foreign keys ────────────────────────────────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create tables ───────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS designers (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL,
    email TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS printers (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    material TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    designer_id          INTEGER NOT NULL,
    printer_id           INTEGER NOT NULL,
    print_duration_hours REAL    NOT NULL,
    status               TEXT    NOT NULL DEFAULT 'queued',
    FOREIGN KEY (designer_id) REFERENCES designers(id),
    FOREIGN KEY (printer_id)  REFERENCES printers(id)
  );
`);

// ── Seed realistic sample data (only when the DB is empty) ──────────────────
const designerCount = db.prepare('SELECT COUNT(*) AS cnt FROM designers').get().cnt;

if (designerCount === 0) {
  console.log('🌱  Seeding database with sample data …');

  const insertDesigner    = db.prepare('INSERT INTO designers (name, email) VALUES (?, ?)');
  const insertPrinter     = db.prepare('INSERT INTO printers (name, material) VALUES (?, ?)');
  const insertReservation = db.prepare(
    'INSERT INTO reservations (designer_id, printer_id, print_duration_hours, status) VALUES (?, ?, ?, ?)'
  );

  const seedAll = db.transaction(() => {
    // — Designers —
    insertDesigner.run('Alice Johnson',  'alice@printpoint.io');
    insertDesigner.run('Bob Martinez',   'bob@printpoint.io');
    insertDesigner.run('Carol Zhang',    'carol@printpoint.io');
    insertDesigner.run('David Okonkwo',  'david@printpoint.io');
    insertDesigner.run('Eva Rossi',      'eva@printpoint.io');

    // — Printers —
    insertPrinter.run('Prusa MK4 Printer',       'PLA');
    insertPrinter.run('Bambu Lab X1C',            'PETG');
    insertPrinter.run('Creality Ender 3 V3',      'PLA');
    insertPrinter.run('Formlabs Form 4',          'Resin');
    insertPrinter.run('Voron 2.4 Printer',        'ABS');
    insertPrinter.run('Anycubic Photon Mono X',   'Resin');

    // — Reservations —
    insertReservation.run(1, 1, 3.5,  'queued');
    insertReservation.run(2, 2, 6.0,  'printing');
    insertReservation.run(3, 4, 1.25, 'completed');
    insertReservation.run(1, 5, 8.0,  'queued');
    insertReservation.run(4, 3, 2.0,  'printing');
    insertReservation.run(5, 6, 4.5,  'queued');
  });

  seedAll();
  console.log('✅  Seed data inserted.');
}

module.exports = db;
