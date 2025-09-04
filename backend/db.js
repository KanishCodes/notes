const { Pool } = require('pg');

// Create a new pool instance. The pool will read the DATABASE_URL
// from the .env file automatically.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // This is necessary for connecting to cloud databases like Supabase
  ssl: {
    rejectUnauthorized: false
  }
});

// We are exporting an object with a query method.
// This allows us to import this file anywhere in our app
// and use it to run database queries.
module.exports = {
  query: (text, params) => pool.query(text, params),
};