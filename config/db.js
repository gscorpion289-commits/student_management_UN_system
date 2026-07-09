const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
  process.exit(-1);
});

pool.on('end', () => {
  console.log('Database connection ended');
});

module.exports = pool;
