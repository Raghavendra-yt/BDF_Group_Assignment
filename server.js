// ---------------------------------------------------------------------------
// server.js — Express application entry point
// ---------------------------------------------------------------------------
const express = require('express');
const app     = express();
const PORT    = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Mount routers ───────────────────────────────────────────────────────────
app.use('/designers',    require('./routes/designers'));
app.use('/printers',     require('./routes/printers'));
app.use('/reservations', require('./routes/reservations'));

// ── Root health check ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    service: 'PrintPoint Centre API',
    version: '1.0.0',
    endpoints: ['/designers', '/printers', '/reservations']
  });
});

// ── 404 catch-all ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🖨️  PrintPoint Centre API running on http://localhost:${PORT}`);
});
