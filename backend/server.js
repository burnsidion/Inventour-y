import dotenv from "dotenv";
dotenv.config();

import pool from "./utils/database.js";
import express from "express";
import supabase from "./utils/supabaseClient.js";
import cors from "cors";

import apiRoutes from "./routes/api.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error testing database connection:", err);
  } else {
    console.log("Database connection test successful:", res.rows[0]);
  }
});

//API routes
console.log("Supabase client import successful");

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
