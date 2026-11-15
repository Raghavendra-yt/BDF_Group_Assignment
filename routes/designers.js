// ---------------------------------------------------------------------------
// routes/designers.js — CRUD endpoints for designers
// ---------------------------------------------------------------------------
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── GET /designers — list all designers ─────────────────────────────────────
router.get('/', (_req, res) => {
  try {
    const designers = db.prepare('SELECT * FROM designers').all();
    res.status(200).json(designers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ── GET /designers/:id — get a single designer ─────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const designer = db.prepare('SELECT * FROM designers WHERE id = ?').get(req.params.id);
    if (!designer) {
      return res.status(404).json({ error: 'Designer not found' });
    }
    res.status(200).json(designer);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ── POST /designers — create a new designer ─────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'name' is required and must be a non-empty string."
      });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'email' is required and must be a non-empty string."
      });
    }

    const trimmedName  = name.trim();
    const trimmedEmail = email.trim();

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({
        error: "Validation failed: 'email' must be a valid email address."
      });
    }

    const info = db.prepare('INSERT INTO designers (name, email) VALUES (?, ?)').run(trimmedName, trimmedEmail);
    const created = db.prepare('SELECT * FROM designers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A designer with this email already exists.' });
    }
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
