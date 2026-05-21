import express from "express";
import pool from "./db.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "Server is running!" });
});

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      status: "Connected to PostgreSQL!",
      server_time: result.rows[0].current_time,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/create-table", async (req, res) => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id          SERIAL PRIMARY KEY,
          name        VARCHAR(100) NOT NULL,
          email       VARCHAR(100) UNIQUE NOT NULL,
          age         INTEGER,
          is_active   BOOLEAN DEFAULT true,
          created_at  TIMESTAMP DEFAULT NOW()
        )
      `);
    res.json({ message: "users table created!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/check-table", async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns
        WHERE table_name = 'users'
      `);
    res.json({ columns: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/drop-table", async (req, res) => {
  try {
    await pool.query("DROP TABLE IF EXISTS users");
    res.json({ message: "users table dropped!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
