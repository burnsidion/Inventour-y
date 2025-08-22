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

export default router;
