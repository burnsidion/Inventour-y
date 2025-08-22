//Dependencies
import dotenv from "dotenv";
dotenv.config();

import pool from "./utils/database.js";
import { fileURLToPath } from "url";
import express from "express";
import supabase from "./utils/supabaseClient.js";
import cors from "cors";
import path from "path";


//Routes
import apiRoutes from "./routes/api.js";
import usersRouter from "./routes/users.js";
import showsRouter from "./routes/shows.js";
import toursRouter from "./routes/tours.js";
import inventoryRouter from "./routes/inventory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);
app.use("/api/users", usersRouter);
app.use("/api/shows", showsRouter);
app.use("/api/tours", toursRouter);
app.use("/api/inventory", inventoryRouter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
