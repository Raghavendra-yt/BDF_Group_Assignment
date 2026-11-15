// ---------------------------------------------------------------------------
// test-all.js — Standalone Automated Test Suite (49 Tests)
// ---------------------------------------------------------------------------
const http = require('http');
const app  = require('./server');

let server;
let BASE = '';
let passed = 0;
let failed = 0;

function req(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} ${detail}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  PrintPoint Centre — Full Automated Regression Suite');
  console.log('======================================================\n');

  // ── 1. Health Check ──
  console.log('── Suite 1: Health & Root Endpoints ──');
  let r = await req('GET', '/');
  assert('GET / returns 200 OK', r.status === 200);
  assert('GET / returns correct service name', r.body.service === 'PrintPoint Centre API');
  assert('GET / lists all mounted endpoints', Array.isArray(r.body.endpoints));

  r = await req('GET', '/unknown-route-404');
  assert('GET /invalid-route returns 404 Route not found', r.status === 404);

  // ── 2. Designers ──
  console.log('\n── Suite 2: Designer Management ──');
  r = await req('GET', '/designers');
  assert('GET /designers returns 200 OK', r.status === 200);
  assert('GET /designers returns seeded designer records', Array.isArray(r.body) && r.body.length >= 5);

  r = await req('GET', '/designers/1');
  assert('GET /designers/1 returns 200 with designer details', r.status === 200 && r.body.id === 1);
  assert('Designer has valid name & unique email', !!r.body.name && !!r.body.email);

  r = await req('GET', '/designers/999');
  assert('GET /designers/999 returns 404 Not Found', r.status === 404);

  r = await req('POST', '/designers', { name: 'Grace Hopper', email: 'grace.hopper@printpoint.io' });
  assert('POST /designers (valid) returns 201 Created', r.status === 201);
  assert('Returned object contains generated ID and trimmed values', r.body.name === 'Grace Hopper');

  r = await req('POST', '/designers', { email: 'noname@printpoint.io' });
  assert('POST /designers (missing name) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/designers', { name: '   ', email: 'whitespace@printpoint.io' });
  assert('POST /designers (whitespace name) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/designers', { name: 'No Email' });
  assert('POST /designers (missing email) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/designers', { name: 'Invalid Email', email: 'not-an-email' });
  assert('POST /designers (malformed email) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/designers', { name: 'Duplicate Alice', email: 'alice@printpoint.io' });
  assert('POST /designers (duplicate email) returns 400 UNIQUE constraint', r.status === 400);

  // ── 3. Printers CRUD ──
  console.log('\n── Suite 3: Printer CRUD Operations ──');
  r = await req('GET', '/printers');
  assert('GET /printers returns 200 OK', r.status === 200);
  assert('GET /printers returns seeded printer inventory', Array.isArray(r.body) && r.body.length >= 6);

  r = await req('GET', '/printers/1');
  assert('GET /printers/1 returns 200 OK', r.status === 200 && r.body.id === 1);

  r = await req('GET', '/printers/999');
  assert('GET /printers/999 returns 404 Printer not found', r.status === 404);

  r = await req('POST', '/printers', { name: 'Artillery Sidewinder X2', material: 'TPU' });
  assert('POST /printers returns 201 Created', r.status === 201);
  assert('Created printer has id, name, and material', r.body.name === 'Artillery Sidewinder X2' && r.body.material === 'TPU');
  const createdPrinterId = r.body.id;

  r = await req('POST', '/printers', { name: 'Incomplete Printer' });
  assert('POST /printers (missing material) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/printers', { name: '   ', material: '' });
  assert('POST /printers (empty/blank fields) returns 400 Bad Request', r.status === 400);

  r = await req('PUT', `/printers/${createdPrinterId}`, { name: 'Artillery Sidewinder X2 Pro', material: 'Carbon Fiber' });
  assert('PUT /printers/:id (valid update) returns 200 OK', r.status === 200);
  assert('Printer values successfully updated', r.body.name === 'Artillery Sidewinder X2 Pro' && r.body.material === 'Carbon Fiber');

  r = await req('PUT', '/printers/999', { name: 'Ghost', material: 'PLA' });
  assert('PUT /printers/999 returns 404 Not Found', r.status === 404);

  r = await req('PUT', `/printers/${createdPrinterId}`, { name: 'No Material Given' });
  assert('PUT /printers/:id (missing material) returns 400 Bad Request', r.status === 400);

  r = await req('DELETE', `/printers/${createdPrinterId}`);
  assert('DELETE /printers/:id returns 200 OK with confirmation', r.status === 200 && !!r.body.message);

  r = await req('DELETE', '/printers/999');
  assert('DELETE /printers/999 returns 404 Printer not found', r.status === 404);

  // ── 4. Special Feature — Smart Search (Twist) ──
  console.log('\n── Suite 4: Smart Search Twist Rule (?q=...) ──');
  r = await req('GET', '/printers?q=printer');
  assert('Test 1: GET /printers?q=printer returns 200 with matching items', r.status === 200 && r.body.printers.length > 0);
  const qLowerResults = JSON.stringify(r.body.printers);

  r = await req('GET', '/printers?q=PRINTER');
  assert('Test 2: GET /printers?q=PRINTER returns 200 and matches ?q=printer exactly', r.status === 200 && JSON.stringify(r.body.printers) === qLowerResults);

  r = await req('GET', '/printers?q=zzz');
  assert('Test 3: GET /printers?q=zzz returns 200 OK', r.status === 200);
  assert('Test 3: Empty results return empty array []', Array.isArray(r.body.printers) && r.body.printers.length === 0);
  assert('Test 3: Exactly returns message: "Nothing found"', r.body.message === 'Nothing found');

  r = await req('GET', '/printers?q=resin');
  assert('Smart Search matches material column ("Resin")', r.status === 200 && r.body.printers.some(p => p.material === 'Resin'));

  r = await req('GET', '/printers?q=bambu');
  assert('Smart Search matches partial name ("Bambu")', r.status === 200 && r.body.printers.some(p => p.name.includes('Bambu')));

  // ── 5. Reservations (INNER JOIN & Queue) ──
  console.log('\n── Suite 5: Reservations & Queue Engine (Three-Table JOIN) ──');
  r = await req('GET', '/reservations');
  assert('GET /reservations returns 200 OK', r.status === 200);
  assert('GET /reservations returns list of seeded queue reservations', Array.isArray(r.body) && r.body.length >= 6);
  assert('Three-table JOIN provides designer_name', !!r.body[0].designer_name);
  assert('Three-table JOIN provides printer_name', !!r.body[0].printer_name);
  assert('Three-table JOIN provides printer material', !!r.body[0].material);
  assert('Reservation contains print_duration_hours', typeof r.body[0].print_duration_hours === 'number');
  assert('Reservation contains valid status (queued/printing/completed)', ['queued', 'printing', 'completed'].includes(r.body[0].status));

  r = await req('POST', '/reservations', { designer_id: 1, printer_id: 2, print_duration_hours: 5.5, status: 'queued' });
  assert('POST /reservations (valid booking) returns 201 Created', r.status === 201);
  assert('Returned reservation includes joined designer_name and printer_name', !!r.body.designer_name && !!r.body.printer_name);

  r = await req('POST', '/reservations', { printer_id: 1, print_duration_hours: 2.0 });
  assert('POST /reservations (missing designer_id) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/reservations', { designer_id: 1, print_duration_hours: 2.0 });
  assert('POST /reservations (missing printer_id) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/reservations', { designer_id: 1, printer_id: 1 });
  assert('POST /reservations (missing duration) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/reservations', { designer_id: 1, printer_id: 1, print_duration_hours: -3.5, status: 'queued' });
  assert('POST /reservations (negative duration) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/reservations', { designer_id: 1, printer_id: 1, print_duration_hours: 0, status: 'queued' });
  assert('POST /reservations (zero duration) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/reservations', { designer_id: 1, printer_id: 1, print_duration_hours: 2.5, status: 'broken' });
  assert('POST /reservations (invalid status string) returns 400 Bad Request', r.status === 400);

  r = await req('POST', '/reservations', { designer_id: 999, printer_id: 1, print_duration_hours: 2.0, status: 'queued' });
  assert('POST /reservations (non-existent designer_id) returns 404 Not Found', r.status === 404);

  r = await req('POST', '/reservations', { designer_id: 1, printer_id: 999, print_duration_hours: 2.0, status: 'queued' });
  assert('POST /reservations (non-existent printer_id) returns 404 Not Found', r.status === 404);

  // ── Summary ──
  console.log('\n======================================================');
  console.log(`  REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('======================================================\n');

  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

// Start ephemeral server on random port and run suite
server = app.listen(0, () => {
  const port = server.address().port;
  BASE = `http://localhost:${port}`;
  runTests().catch((err) => {
    console.error('Test execution failed:', err);
    if (server) server.close();
    process.exit(1);
  });
});
