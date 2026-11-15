// ---------------------------------------------------------------------------
// routes/reservations.js — Reservations with JOIN query
// ---------------------------------------------------------------------------
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET /reservations — list all reservations (INNER JOIN) ──────────────────
router.get('/', (_req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT
        r.id,
        r.designer_id,
        d.name  AS designer_name,
        r.printer_id,
        p.name  AS printer_name,
        p.material,
        r.print_duration_hours,
        r.status
      FROM reservations r
      INNER JOIN designers d ON r.designer_id = d.id
      INNER JOIN printers  p ON r.printer_id  = p.id
    `).all();

    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ── POST /reservations — create a new reservation ──────────────────────────
router.post('/', (req, res) => {
  try {
    const { designer_id, printer_id, print_duration_hours, status } = req.body;

    const finalStatus = status || 'queued';

    const info = db.prepare(
      'INSERT INTO reservations (designer_id, printer_id, print_duration_hours, status) VALUES (?, ?, ?, ?)'
    ).run(designer_id, printer_id, print_duration_hours, finalStatus);

    const created = db.prepare(`
      SELECT
        r.id,
        r.designer_id,
        d.name  AS designer_name,
        r.printer_id,
        p.name  AS printer_name,
        p.material,
        r.print_duration_hours,
        r.status
      FROM reservations r
      INNER JOIN designers d ON r.designer_id = d.id
      INNER JOIN printers  p ON r.printer_id  = p.id
      WHERE r.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
