import express from "express";
import pool from "../utils/database.js";

import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

// Inventory Routes
router.post("/", authenticateToken, async (req, res) => {
	const { name, type, price, image_url, tour_id, sizes, quantity } = req.body;

	if (!name || !type || !price || !tour_id) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	if (type === "soft" && (!Array.isArray(sizes) || sizes.length === 0)) {
		return res
			.status(400)
			.json({ error: "Soft items require at least one size" });
	}

	try {
		const inventoryResult = await pool.query(
			`INSERT INTO inventory (name, type, price, image_url, tour_id, quantity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[name, type, price, image_url, tour_id, type === "hard" ? quantity : null]
		);

		const inventoryItem = inventoryResult.rows[0];
		let responsePayload = { ...inventoryItem, sizes: [] };

		if (type === "soft") {
			const sizeInserts = sizes.map(({ size, quantity }) =>
				pool.query(
					`INSERT INTO inventory_sizes (inventory_id, size, quantity)
           VALUES ($1, $2, $3)`,
					[inventoryItem.id, size, quantity]
				)
			);

			await Promise.all(sizeInserts);

			responsePayload.sizes = sizes;
		}

		res.status(201).json({
			message: "Inventory item added",
			inventory: responsePayload,
		});
	} catch (error) {
		console.error("Error adding inventory:", error);
		res.status(500).json({ error: "Failed to add inventory" });
	}
});

router.get("/", authenticateToken, async (req, res) => {
	try {
		const { tour_id } = req.query;
		if (!tour_id) {
			return res.status(400).json({ error: "Missing required tour_id" });
		}

		// Fetch all inventory items
		const inventoryResult = await pool.query(
			`SELECT
              id,
              name,
              type,
              price,
              image_url,
              created_at,
              tour_id,
              quantity
       FROM inventory
       WHERE tour_id = $1`,
			[tour_id]
		);

		const inventoryItems = inventoryResult.rows;

		const formattedInventory = await Promise.all(
			inventoryItems.map(async (item) => {
				if (item.type === "soft") {
					// Fetch sizes for soft items
					const sizesResult = await pool.query(
						`SELECT size, quantity FROM inventory_sizes WHERE inventory_id = $1`,
						[item.id]
					);

					return { ...item, sizes: sizesResult.rows };
				} else if (item.type === "bundle") {
					// Fetch items in the bundle
					const bundleItemsResult = await pool.query(
						`SELECT i.id, i.name, i.type, i.price, i.image_url, bi.quantity,
                    CASE
                        WHEN i.type = 'soft' THEN
                            (SELECT json_agg(json_build_object('size', s.size, 'quantity', s.quantity))
                            FROM inventory_sizes s
                            WHERE s.inventory_id = i.id)
                        ELSE NULL
                    END AS sizes
             FROM bundle_items bi
             JOIN inventory i ON bi.item_id = i.id
             WHERE bi.bundle_id = $1`,
						[item.id]
					);

					return { ...item, items: bundleItemsResult.rows };
				} else {
					return item;
				}
			})
		);

		res.json(formattedInventory);
	} catch (error) {
		console.error("Error fetching inventory:", error);
		res.status(500).json({ error: "Failed to fetch inventory" });
	}
});

router.post("/update", authenticateToken, async (req, res) => {
	const { inventory_id, new_quantity, new_price = null } = req.body;

	if (!inventory_id || new_quantity === undefined) {
		return res
			.status(400)
			.json({ error: "Missing required fields: inventory_id, new_quantity" });
	}

	try {
		const result = await pool.query(
			`UPDATE inventory
     SET price = $1, quantity = $2
     WHERE id = $3
     RETURNING *`,
			[new_price, new_quantity, inventory_id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Inventory item not found" });
		}

		res.status(200).json({
			message: "Inventory updated successfully",
			item: result.rows[0],
		});
	} catch (error) {
		console.error("Error updating inventory:", error);
		res.status(500).json({ error: "Failed to update inventory" });
	}
});

router.put("/:id", authenticateToken, async (req, res) => {
	const { id } = req.params;
	const { name, type, price, image_url, quantity, sizes } = req.body;

	try {
		const itemResult = await pool.query(
			"SELECT type FROM inventory WHERE id = $1",
			[id]
		);

		if (itemResult.rows.length === 0) {
			return res.status(404).json({ error: "Item not found" });
		}

		const itemType = itemResult.rows[0].type;

		await pool.query("BEGIN");

		await pool.query(
			`UPDATE inventory SET name = $1, price = $2, image_url = $3 WHERE id = $4`,
			[name, price, image_url, id]
		);

		if (itemType === "hard") {
			await pool.query(`UPDATE inventory SET quantity = $1 WHERE id = $2`, [
				quantity,
				id,
			]);
		} else if (itemType === "soft" && sizes) {
			for (const size of sizes) {
				await pool.query(
					`UPDATE inventory_sizes SET quantity = $1 WHERE inventory_id = $2 AND size = $3`,
					[size.quantity, id, size.size]
				);
			}
		}

		await pool.query("COMMIT");

		const updatedItemResult = await pool.query(
			`SELECT id, name, type, price, image_url, tour_id, quantity FROM inventory WHERE id = $1`,
			[id]
		);

		if (updatedItemResult.rows.length === 0) {
			return res.status(404).json({ error: "Failed to fetch updated item" });
		}

		const updatedItem = updatedItemResult.rows[0];

		if (itemType === "soft") {
			const sizesResult = await pool.query(
				`SELECT size, quantity FROM inventory_sizes WHERE inventory_id = $1`,
				[id]
			);
			updatedItem.sizes = sizesResult.rows;
		}

		res.json({ message: "Inventory item updated", inventory: updatedItem });
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error updating inventory:", error);
		res.status(500).json({ error: "Failed to update inventory" });
	}
});

router.delete("/:id", authenticateToken, async (req, res) => {
	const { id } = req.params;

	try {
		await pool.query("BEGIN");

		// Check if the item is part of any bundle
		const bundleCheck = await pool.query(
			"SELECT bundle_id FROM bundle_items WHERE item_id = $1",
			[id]
		);

		if (bundleCheck.rows.length > 0) {
			const bundleIds = bundleCheck.rows.map((row) => row.bundle_id);

			// Delete bundles that contain the inventory item
			await pool.query("DELETE FROM bundle_items WHERE bundle_id = ANY($1)", [
				bundleIds,
			]);
			await pool.query(
				"DELETE FROM inventory WHERE id = ANY($1) AND type = 'bundle'",
				[bundleIds]
			);

			console.log(
				`🗑️ Deleted ${bundleIds.length} bundles containing inventory item ${id}`
			);
		}

		// Now delete the actual inventory item
		await pool.query("DELETE FROM inventory WHERE id = $1 RETURNING *", [id]);

		await pool.query("COMMIT");

		res.status(200).json({
			message:
				"Inventory item deleted successfully, along with associated bundles.",
		});
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("❌ Error deleting inventory item:", error);
		res.status(500).json({ error: "Failed to delete inventory item." });
	}
});

//Bundle routes
router.get("/bundles/:bundle_id", authenticateToken, async (req, res) => {
	const { bundle_id } = req.params;

	try {
		const bundleResult = await pool.query(
			`SELECT * FROM inventory WHERE id = $1 AND type = 'bundle'`,
			[bundle_id]
		);

		if (bundleResult.rows.length === 0) {
			return res.status(404).json({ error: "Bundle not found" });
		}

		const itemsResult = await pool.query(
			`SELECT i.id, i.name, i.type, i.price, i.image_url, bi.quantity,
              CASE
                  WHEN i.type = 'soft' THEN
                      (SELECT json_agg(json_build_object('size', s.size, 'quantity', s.quantity))
                       FROM inventory_sizes s
                       WHERE s.inventory_id = i.id)
                  ELSE NULL
              END AS sizes
       FROM bundle_items bi
       JOIN inventory i ON bi.item_id = i.id
       WHERE bi.bundle_id = $1`,
			[bundle_id]
		);

		res.json({ bundle: bundleResult.rows[0], items: itemsResult.rows });
	} catch (error) {
		console.error("Error fetching bundle:", error);
		res.status(500).json({ error: "Failed to fetch bundle" });
	}
});

router.post("/bundles", authenticateToken, async (req, res) => {
	const { name, price, items } = req.body;
	const { tour_id } = req.query;

	if (
		!name ||
		!price ||
		!tour_id ||
		!Array.isArray(items) ||
		items.length === 0
	) {
		return res
			.status(400)
			.json({ error: "Missing required fields or invalid items array" });
	}

	try {
		await pool.query("BEGIN");

		const bundleResult = await pool.query(
			`INSERT INTO inventory (name, type, price, tour_id, quantity)
       VALUES ($1, 'bundle', $2, $3, 0) RETURNING id`,
			[name, price, tour_id]
		);

		if (!bundleResult.rows.length) {
			throw new Error("Failed to insert bundle into inventory");
		}

		const bundleId = bundleResult.rows[0].id;

		let bundleQuantities = [];

		for (const { item_id } of items) {
			const itemQuery = await pool.query(
				`SELECT type FROM inventory WHERE id = $1`,
				[item_id]
			);

			if (!itemQuery.rows.length) continue;

			const itemType = itemQuery.rows[0].type;
			let itemQuantity = 0;

			if (itemType === "hard") {
				const hardItem = await pool.query(
					`SELECT quantity FROM inventory WHERE id = $1`,
					[item_id]
				);
				itemQuantity = hardItem.rows.length ? hardItem.rows[0].quantity : 0;
			} else if (itemType === "soft") {
				const softItemSizes = await pool.query(
					`SELECT MIN(quantity) AS min_quantity FROM inventory_sizes WHERE inventory_id = $1`,
					[item_id]
				);
				itemQuantity = softItemSizes.rows[0]?.min_quantity || 0;
			}

			bundleQuantities.push(itemQuantity);

			await pool.query(
				`INSERT INTO bundle_items (bundle_id, item_id, quantity) VALUES ($1, $2, $3)`,
				[bundleId, item_id, itemQuantity]
			);
		}

		const bundleQuantity =
			bundleQuantities.length > 0 ? Math.min(...bundleQuantities) : 0;

		await pool.query(`UPDATE inventory SET quantity = $1 WHERE id = $2`, [
			bundleQuantity,
			bundleId,
		]);

		await pool.query("COMMIT");
		res
			.status(201)
			.json({ message: "Bundle created", bundleId, quantity: bundleQuantity });
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error creating bundle:", error);
		res.status(500).json({ error: "Failed to create bundle" });
	}
});

export default router;
