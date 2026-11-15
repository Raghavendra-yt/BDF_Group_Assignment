// ---------------------------------------------------------------------------
// routes/reservations.js — Reservations with JOIN + creation validation
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

    // ── Validate required fields ──
    if (designer_id === undefined || designer_id === null) {
      return res.status(400).json({
        error: "Validation failed: 'designer_id' is required."
      });
    }
    if (printer_id === undefined || printer_id === null) {
      return res.status(400).json({
        error: "Validation failed: 'printer_id' is required."
      });
    }
    if (print_duration_hours === undefined || print_duration_hours === null) {
      return res.status(400).json({
        error: "Validation failed: 'print_duration_hours' is required."
      });
    }
    if (typeof print_duration_hours !== 'number' || print_duration_hours <= 0) {
      return res.status(400).json({
        error: "Validation failed: 'print_duration_hours' must be a positive number."
      });
    }

    const validStatuses = ['queued', 'printing', 'completed'];
    const finalStatus   = status ? String(status).trim().toLowerCase() : 'queued';
    if (!validStatuses.includes(finalStatus)) {
      return res.status(400).json({
        error: `Validation failed: 'status' must be one of: ${validStatuses.join(', ')}.`
      });
    }

    // ── Check designer exists ──
    const designer = db.prepare('SELECT id FROM designers WHERE id = ?').get(designer_id);
    if (!designer) {
      return res.status(404).json({ error: `Designer with id ${designer_id} not found.` });
    }

    // ── Check printer exists ──
    const printer = db.prepare('SELECT id FROM printers WHERE id = ?').get(printer_id);
    if (!printer) {
      return res.status(404).json({ error: `Printer with id ${printer_id} not found.` });
    }

    // ── Insert ──
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
