import express from "express";
import pool from "../utils/database.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

//Sales routes
router.post("", authenticateToken, async (req, res) => {
	const {
		inventory_id,
		show_id,
		quantity_sold,
		total_amount,
		payment_method,
		size,
	} = req.body;

	if (
		!inventory_id ||
		!show_id ||
		!quantity_sold ||
		!total_amount ||
		!payment_method
	) {
		return res.status(400).json({
			error:
				"Missing required fields: inventory_id, show_id, quantity_sold, total_amount, payment_method",
		});
	}

	const validPaymentMethods = ["cash", "card", "free"];
	if (!validPaymentMethods.includes(payment_method)) {
		return res.status(400).json({
			error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(
				", "
			)}`,
		});
	}

	try {
		await pool.query("BEGIN");

		let adjustedPrice = total_amount;
		if (payment_method === "free") {
			adjustedPrice = 0;
		}

		const itemTypeResult = await pool.query(
			`SELECT type FROM inventory WHERE id = $1`,
			[inventory_id]
		);

		if (itemTypeResult.rows.length === 0) {
			await pool.query("ROLLBACK");
			return res.status(400).json({ error: "Invalid inventory ID" });
		}

		const itemType = itemTypeResult.rows[0].type;

		if (itemType === "bundle") {
			const bundleItems = await pool.query(
				`SELECT item_id FROM bundle_items WHERE bundle_id = $1`,
				[inventory_id]
			);

			if (bundleItems.rows.length === 0) {
				await pool.query("ROLLBACK");
				return res.status(400).json({ error: "No items found in bundle" });
			}

			for (const { item_id } of bundleItems.rows) {
				const itemTypeQuery = await pool.query(
					`SELECT type FROM inventory WHERE id = $1`,
					[item_id]
				);
				const itemType = itemTypeQuery.rows[0].type;

				if (itemType === "soft") {
					let selectedSize = size;
					if (!selectedSize) {
						const sizeQuery = await pool.query(
							`SELECT size FROM inventory_sizes WHERE inventory_id = $1 AND quantity > 0 ORDER BY quantity ASC LIMIT 1`,
							[item_id]
						);
						selectedSize = sizeQuery.rows[0]?.size || null;
					}

					console.log(
						`🛠 Deducting inventory for soft item ${item_id}, size: ${selectedSize}`
					);

					if (selectedSize) {
						const updateResult = await pool.query(
							`UPDATE inventory_sizes
               SET quantity = quantity - $1
               WHERE inventory_id = $2 AND size = $3 AND quantity >= $1
               RETURNING *`,
							[quantity_sold, item_id, selectedSize]
						);

						if (updateResult.rows.length === 0) {
							console.warn(
								`⚠️ Not enough stock for soft item ${item_id}, size: ${selectedSize}`
							);
						} else {
							console.log(
								`✅ Updated inventory_sizes for soft item ${item_id}, size: ${selectedSize}`
							);
						}
					} else {
						console.warn(
							`⚠️ No valid size found for soft item ${item_id}, skipping update.`
						);
					}
				} else {
					const updateResult = await pool.query(
						`UPDATE inventory
           SET quantity = quantity - $1
           WHERE id = $2 AND quantity >= $1
           RETURNING *`,
						[quantity_sold, item_id]
					);

					if (updateResult.rows.length === 0) {
						console.warn(`⚠️ Not enough stock for hard item ${item_id}`);
					} else {
						console.log(`✅ Updated inventory for hard item ${item_id}`);
					}
				}
			}
		} else {
			let inventoryResult;
			if (itemType === "soft") {
				inventoryResult = await pool.query(
					`UPDATE inventory_sizes
           SET quantity = quantity - $1
           WHERE inventory_id = $2 AND size = $3 AND quantity >= $1
           RETURNING *`,
					[quantity_sold, inventory_id, size]
				);
			} else {
				inventoryResult = await pool.query(
					`UPDATE inventory
           SET quantity = quantity - $1
           WHERE id = $2 AND quantity >= $1
           RETURNING *`,
					[quantity_sold, inventory_id]
				);
			}

			if (inventoryResult.rows.length === 0) {
				await pool.query("ROLLBACK");
				return res.status(400).json({ error: "Insufficient inventory" });
			}
		}

		const salesResult = await pool.query(
			`INSERT INTO sales (inventory_id, show_id, quantity_sold, total_amount, payment_method, size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
			[
				inventory_id,
				show_id,
				quantity_sold,
				adjustedPrice,
				payment_method,
				itemType === "soft" ? size : null,
			]
		);

		await pool.query("COMMIT");

		res.status(201).json({
			message: "Sale recorded successfully!",
			sale: salesResult.rows[0],
		});
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error recording sale:", error);
		res.status(500).json({ error: "Failed to record sale" });
	}
});

router.get("", authenticateToken, async (req, res) => {
	const { show_id } = req.query;

	if (!show_id) {
		return res
			.status(400)
			.json({ error: "Missing required query parameter: show_id" });
	}

	try {
		const result = await pool.query(
			`SELECT
        sales.id,
        sales.quantity_sold,
        sales.total_amount,
        sales.payment_method,
        sales.created_at,
        inventory.name AS item_name,
        inventory.type,
        inventory.price,
        CASE
            WHEN inventory.type = 'soft'
            THEN json_agg(json_build_object('size', inventory_sizes.size, 'quantity', inventory_sizes.quantity))
            ELSE NULL
        END AS sizes
        FROM sales
        JOIN inventory ON sales.inventory_id = inventory.id
        LEFT JOIN inventory_sizes ON inventory.id = inventory_sizes.inventory_id
        WHERE sales.show_id = $1
        GROUP BY sales.id, inventory.id
        ORDER BY sales.created_at DESC;`,
			[show_id]
		);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching sales:", error);
		res.status(500).json({ error: "Failed to fetch sales" });
	}
});

router.get("/tour", authenticateToken, async (req, res) => {
	const { tour_id } = req.query;

	if (!tour_id) {
		return res
			.status(400)
			.json({ error: "Missing required query parameter: tour_id" });
	}

	try {
		const result = await pool.query(
			`SELECT SUM(sales.total_amount) AS total_sales
       FROM sales
       JOIN shows ON sales.show_id = shows.id
       WHERE shows.tour_id = $1`,
			[tour_id]
		);

		res.status(200).json({ total_sales: result.rows[0]?.total_sales || 0 });
	} catch (error) {
		console.error("Error fetching total tour sales:", error);
		res.status(500).json({ error: "Failed to fetch total sales for tour" });
	}
});

router.post("/bundle", authenticateToken, async (req, res) => {
	const { bundle_id, quantity_sold, show_id } = req.body;

	if (!bundle_id || !quantity_sold || !show_id) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	try {
		await pool.query("BEGIN");

		const bundleItems = await pool.query(
			`SELECT item_id, quantity FROM bundle_items WHERE bundle_id = $1`,
			[bundle_id]
		);

		if (bundleItems.rows.length === 0) {
			return res.status(404).json({ error: "No items found in bundle" });
		}

		for (const { item_id, quantity } of bundleItems.rows) {
			await pool.query(
				`UPDATE inventory SET quantity = quantity - ($1 * $2)
         WHERE id = $3 AND quantity >= ($1 * $2)`,
				[quantity_sold, quantity, item_id]
			);
		}

		await pool.query(
			`INSERT INTO sales (inventory_id, quantity_sold, total_amount, payment_method, show_id)
       VALUES ($1, $2, (SELECT price FROM inventory WHERE id = $1) * $2, 'cash', $3)`,
			[bundle_id, quantity_sold, show_id]
		);

		await pool.query("COMMIT");

		res.status(200).json({ message: "Bundle sold successfully" });
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error selling bundle:", error);
		res.status(500).json({ error: "Failed to sell bundle" });
	}
});
export default router;
