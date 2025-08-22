import express from "express";
import pool from "../utils/database.js";

import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

//Show Routes
router.post("/", authenticateToken, async (req, res) => {
	const { tour_id, date, venue, city, state } = req.body;

	if (!tour_id || !date || !venue || !city || !state) {
		return res.status(400).json({
			error: "Missing required fields: tour_id, date, venue, city, state",
		});
	}

	try {
		const result = await pool.query(
			"INSERT INTO shows (tour_id, date, venue, city, state) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[tour_id, date, venue, city, state]
		);

		res.status(201).json({ message: "Show created!", show: result.rows[0] });
	} catch (error) {
		console.error("Error creating show", error);
		res.status(500).json({ error: "Failed to create show" });
	}
});

router.get("/", authenticateToken, async (req, res) => {
	const { tour_id } = req.query;
	const userId = req.user.id;

	try {
		const result = await pool.query(
			`
      SELECT
        s.id,
        s.venue,
        s.date
      FROM shows s
      LEFT JOIN show_summaries ss ON s.id = ss.show_id
      JOIN tours t ON s.tour_id = t.id
      WHERE s.tour_id = $1 AND t.user_id = $2 AND ss.show_id IS NULL
      ORDER BY s.date ASC;
      `,
			[tour_id, userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "No open shows found" });
		}

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching open shows:", error);
		res.status(500).json({ error: "Failed to fetch open shows" });
	}
});

router.get("/closed", authenticateToken, async (req, res) => {
	const userId = req.user.id;

	try {
		const result = await pool.query(
			`
      SELECT
        s.id AS show_id,
        s.venue,
        s.date,
        t.id AS tour_id,
        t.name AS tour_name,
        t.band_name,
        ss.total_sales,
        ss.total_transactions
      FROM show_summaries ss
      JOIN shows s ON ss.show_id = s.id
      JOIN tours t ON s.tour_id = t.id
      WHERE t.user_id = $1
      ORDER BY s.date DESC;
    `,
			[userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "No closed shows found" });
		}

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching closed shows:", error);
		res.status(500).json({ error: "Failed to fetch closed shows" });
	}
});

router.get("/:id", authenticateToken, async (req, res) => {
	const showId = req.params.id;

	if (!showId || isNaN(Number(showId))) {
		return res.status(400).json({ error: "Invalid or missing show ID" });
	}

	try {
		const result = await pool.query("SELECT * FROM shows WHERE id = $1", [
			Number(showId),
		]);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Show not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (error) {
		console.error("Error fetching show:", error);
		res.status(500).json({ error: "Failed to fetch show" });
	}
});

router.delete("/:id", authenticateToken, async (req, res) => {
	const showId = req.params.id;
	const userId = req.user.id;

	try {
		const showCheck = await pool.query(
			`SELECT shows.id FROM shows
       JOIN tours ON shows.tour_id = tours.id
       WHERE shows.id = $1 AND tours.user_id = $2`,
			[showId, userId]
		);

		if (showCheck.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "Show not found or unauthorized to delete." });
		}

		await pool.query("DELETE FROM shows WHERE id = $1", [showId]);

		res.status(200).json({ message: "Show deleted successfully." });
	} catch (error) {
		console.error("Error deleting show:", error);
		res.status(500).json({ error: "Failed to delete show." });
	}
});

//Show Summary routes
router.post("/:show_id/close", authenticateToken, async (req, res) => {
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

router.get("/:show_id/summary", authenticateToken, async (req, res) => {
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
