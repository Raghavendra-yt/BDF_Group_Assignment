// ---------------------------------------------------------------------------
// routes/printers.js — Full CRUD + Smart Search for printers
// ---------------------------------------------------------------------------
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── Helper: validate printer body fields ────────────────────────────────────
function validatePrinterBody(body) {
  const { name, material } = body;
  if (
    !name || typeof name !== 'string' || !name.trim() ||
    !material || typeof material !== 'string' || !material.trim()
  ) {
    return "Validation failed: 'name' and 'material' are required and must be non-empty strings.";
  }
  return null; // valid
}

// ── GET /printers — list all printers OR Smart Search with ?q=... ───────────
router.get('/', (req, res) => {
  try {
    const q = req.query.q;

    // Smart Search
    if (q !== undefined && typeof q === 'string' && q.trim() !== '') {
      const pattern = `%${q.toLowerCase()}%`;
      const printers = db.prepare(
        `SELECT * FROM printers
         WHERE LOWER(name) LIKE ? OR LOWER(material) LIKE ?`
      ).all(pattern, pattern);

      if (printers.length === 0) {
        return res.status(200).json({ message: 'Nothing found', printers: [] });
      }
      return res.status(200).json({ count: printers.length, printers });
    }

    // Default: return all printers
    const printers = db.prepare('SELECT * FROM printers').all();
    res.status(200).json(printers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ── GET /printers/:id — get a single printer ───────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }
    res.status(200).json(printer);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ── POST /printers — add a new printer ──────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const validationError = validatePrinterBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const name     = req.body.name.trim();
    const material = req.body.material.trim();

    const info    = db.prepare('INSERT INTO printers (name, material) VALUES (?, ?)').run(name, material);
    const created = db.prepare('SELECT * FROM printers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ── PUT /printers/:id — update a printer ────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const validationError = validatePrinterBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    const name     = req.body.name.trim();
    const material = req.body.material.trim();

    db.prepare('UPDATE printers SET name = ?, material = ? WHERE id = ?').run(name, material, req.params.id);
    const updated = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ── DELETE /printers/:id — delete a printer ─────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    db.prepare('DELETE FROM printers WHERE id = ?').run(req.params.id);
    res.status(200).json({ message: `Printer '${printer.name}' (ID ${printer.id}) deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
