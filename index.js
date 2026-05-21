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

app.post("/users", async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const result = await pool.query(
      "INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING *",
      [name, email, age],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/all-user", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" }, error);
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({
        msg: "User not found",
      });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
    });
  }
});

app.put("/update-user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age } = req.body;

    const current = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedName = name ?? current.rows[0].name; // ?? if name is null or undefined use the current value from the db
    const updatedAge = age ?? current.rows[0].age;

    const result = await pool.query(
      "UPDATE users SET name=$1, age=$2 WHERE id=$3 RETURNING *",
      [updatedName, updatedAge, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.delete("/delete-user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM users WHERE id=$1 RETURNING*",
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({
        msg: "User not found",
      });
    }
    res.status(200).json({
      msg: "User deleted successfully",
    });
    return;
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
