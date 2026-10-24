const express = require('express');
const { Pool } = require('pg');
const client = require('prom-client');

const app = express();
const port = 3000;

client.collectDefaultMetrics({ timeout: 5000 });
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'tour_user',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'tour_db',
  password: process.env.POSTGRES_PASSWORD || 'StrongPassword123!',
  port: 5432,
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`<h1>Hệ thống Booking Tour Du Lịch</h1><p>Thời gian DB: ${result.rows[0].now}</p>`);
  } catch (err) {
    res.status(500).send("Lỗi kết nối cơ sở dữ liệu: " + err.message);
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(port, () => {
  console.log(`Booking Tour app running on port ${port}`);
});
