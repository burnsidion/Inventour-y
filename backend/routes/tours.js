import express from "express";
import pool from "../utils/database.js";

import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

//Tour Routes
router.post("/", authenticateToken, async (req, res) => {
	const { name, start_date, end_date, band_name } = req.body;
	const user_id = req.user.id;

	try {
		const result = await pool.query(
			"INSERT INTO tours (user_id, name, start_date, end_date, band_name) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[user_id, name, start_date, end_date, band_name]
		);
		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Error creating tour", error);
		res.status(500).json({ error: "Internal service error" });
	}
});

router.get("/", authenticateToken, async (req, res) => {
	const user_id = req.user.id;

	try {
		const result = await pool.query(
			"SELECT * FROM tours WHERE user_id = $1 ORDER BY created_at DESC",
			[user_id]
		);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching tours:", error);
		res.status(500).json({ message: "Failed to fetch tours" });
	}
});

router.get("/:id", authenticateToken, async (req, res) => {
	const { id } = req.params;
	try {
		const result = await pool.query("SELECT * FROM tours WHERE id = $1", [id]);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Tour not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (error) {
		console.error("Error fetching tour:", error);
		res.status(500).json({ error: "Failed to fetch tour" });
	}
});

router.put("/:id", authenticateToken, async (req, res) => {
	const { id } = req.params;
	const { name, start_date, end_date, band_name } = req.body;
	const userId = req.user.id;

	try {
		const tourCheck = await pool.query(
			"SELECT * FROM tours WHERE id = $1 AND user_id = $2",
			[id, userId]
		);

		if (tourCheck.rows.length === 0) {
			return res
				.status(404)
				.json({ message: "Tour not found or unauthorized" });
		}

		const result = await pool.query(
			`UPDATE tours
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           band_name = COALESCE($4, band_name)
       WHERE id = $5
       RETURNING *`,
			[name, start_date, end_date, band_name, id]
		);

		res
			.status(200)
			.json({ message: "Tour updated successfully", tour: result.rows[0] });
	} catch (error) {
		console.error("Error updating tour:", error);
		res.status(500).json({ message: "Failed to update tour" });
	}
});

router.delete("/:id", authenticateToken, async (req, res) => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const tourId = req.params.id;

		await client.query(
			`DELETE FROM show_summaries WHERE show_id IN (SELECT id FROM shows WHERE tour_id = $1)`,
			[tourId]
		);

		await client.query(
			`DELETE FROM sales WHERE show_id IN (SELECT id FROM shows WHERE tour_id = $1)`,
			[tourId]
		);

		await client.query(`DELETE FROM shows WHERE tour_id = $1`, [tourId]);

		await client.query(`DELETE FROM inventory WHERE tour_id = $1`, [tourId]);

		await client.query(`DELETE FROM tours WHERE id = $1`, [tourId]);

		await client.query("COMMIT");
		res.status(200).json({ message: "Tour deleted successfully" });
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Error deleting tour:", error);
		res.status(500).json({ error: "Failed to delete tour" });
	} finally {
		client.release();
	}
});

export default router;
