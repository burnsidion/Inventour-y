import express from "express";
import pool from "../utils/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";

import { authenticateToken } from "../middleware/authenticateToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

//Show Summary routes
router.post("/shows/:show_id/close", authenticateToken, async (req, res) => {
  const { show_id } = req.params;

  try {
    await pool.query("BEGIN");

    const showCheck = await pool.query("SELECT * FROM shows WHERE id = $1", [
      show_id,
    ]);
    if (showCheck.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Show not found" });
    }

    const salesData = await pool.query(
      `
      SELECT SUM(total_amount) AS total_sales,
             COUNT(*) AS total_transactions,
             SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) AS total_cash,
             SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) AS total_card
      FROM sales
      WHERE show_id = $1;
    `,
      [show_id]
    );

    const { total_sales, total_transactions, total_cash, total_card } =
      salesData.rows[0];

    const bestSellingItems = await pool.query(
      `
      SELECT inventory.name, SUM(sales.quantity_sold) AS total_sold
      FROM sales
      JOIN inventory ON sales.inventory_id = inventory.id
      WHERE sales.show_id = $1
      GROUP BY inventory.name
      ORDER BY total_sold DESC
      LIMIT 3;
    `,
      [show_id]
    );

    const itemsSold = await pool.query(
      `
      SELECT inventory.name, sales.size, SUM(sales.quantity_sold) AS total_sold
      FROM sales
      JOIN inventory ON sales.inventory_id = inventory.id
      WHERE sales.show_id = $1
      GROUP BY inventory.name, sales.size
      ORDER BY total_sold DESC;
    `,
      [show_id]
    );

    await pool.query(
      `
      INSERT INTO show_summaries (show_id, total_sales, total_cash, total_card, total_transactions, best_selling_items, items_sold)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `,
      [
        show_id,
        total_sales || 0,
        total_cash || 0,
        total_card || 0,
        total_transactions || 0,
        JSON.stringify(bestSellingItems.rows),
        JSON.stringify(itemsSold.rows),
      ]
    );

    await pool.query("COMMIT");
    res.status(201).json({ message: "Show closed successfully" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error closing show:", error);
    res.status(500).json({ error: "Failed to close show" });
  }
});

router.get("/shows/:show_id/summary", authenticateToken, async (req, res) => {
  const { show_id } = req.params;
  const userId = req.user.id;

  try {
    const showCheck = await pool.query(
      `
      SELECT s.id, s.venue, s.date, t.name AS tour_name, t.band_name
      FROM shows s
      JOIN tours t ON s.tour_id = t.id
      WHERE s.id = $1 AND t.user_id = $2
    `,
      [show_id, userId]
    );

    if (showCheck.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized or show not found" });
    }

    const summaryResult = await pool.query(
      "SELECT * FROM show_summaries WHERE show_id = $1",
      [show_id]
    );

    if (summaryResult.rows.length === 0) {
      return res.status(404).json({ error: "No summary found for this show" });
    }

    const showDetails = showCheck.rows[0];
    const summaryData = summaryResult.rows[0];

    const response = {
      ...summaryData,
      venue: showDetails.venue,
      date: showDetails.date,
      tour_name: showDetails.tour_name,
      band_name: showDetails.band_name,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching show summary:", error);
    res.status(500).json({ error: "Failed to fetch show summary" });
  }
});
export default router;
