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

//Users Routes
router.get("/users/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, profile_pic, bio FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

router.post("/users", async (req, res) => {
  const { name, email, password, role } = req.body;
  const validRoles = ["admin", "manager", "user"];
  const assignedRole = validRoles.includes(role) ? role : "user";

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, assignedRole]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.status(201).json({ message: "User created!", user, token });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put(
  "/users",
  authenticateToken,
  upload.single("profilePic"),
  async (req, res) => {
    const { name, email, password, bio } = req.body;
    const userId = req.user.id;

    try {
      let profilePicPath = null;

      const userResult = await pool.query(
        "SELECT profile_pic FROM users WHERE id = $1",
        [userId]
      );
      const currentProfilePic = userResult.rows[0]?.profile_pic;

      if (
        currentProfilePic &&
        currentProfilePic.startsWith("/uploads") &&
        !currentProfilePic.includes("dummy-profile-pic-1.jpg")
      ) {
        const oldFilePath = path.join(__dirname, "..", currentProfilePic);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      if (req.file) {
        profilePicPath = `/uploads/${req.file.filename}`;
      }

      let hashedPassword = null;
      if (password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }

      const result = await pool.query(
        `UPDATE users 
         SET name = COALESCE($1, name), 
             email = COALESCE($2, email), 
             password = COALESCE($3, password),
             bio = COALESCE($4, bio),
             profile_pic = COALESCE($5, profile_pic, '/uploads/dummy-profile-pic-1.jpg')
         WHERE id = $6 RETURNING id, name, email, bio, profile_pic`,
        [name, email, hashedPassword, bio, profilePicPath, userId]
      );

      res
        .status(200)
        .json({ message: "User updated successfully", user: result.rows[0] });
    } catch (error) {
      console.error("❌ Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

router.delete(
  "/users",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    const userId = req.user.id;

    try {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

router.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//Tour Routes
router.post("/tours", authenticateToken, async (req, res) => {
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

router.get("/tours", authenticateToken, async (req, res) => {
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

router.get("/tours/:id", authenticateToken, async (req, res) => {
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

router.put("/tours/:id", authenticateToken, async (req, res) => {
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

router.delete("/tours/:id", authenticateToken, async (req, res) => {
  const tourId = req.params.id;
  const userId = req.user.id;

  try {
    const tourCheck = await pool.query(
      "SELECT * FROM tours WHERE id = $1 AND user_id = $2",
      [tourId, userId]
    );

    if (tourCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Tour not found or unauthorized" });
    }

    await pool.query("DELETE FROM tours WHERE id = $1", [tourId]);

    res.status(200).json({ message: "Tour deleted successfully" });
  } catch (error) {
    console.error("Error deleting tour:", error);
    res.status(500).json({ message: "Failed to delete tour" });
  }
});

//Show Routes
router.post("/shows", authenticateToken, async (req, res) => {
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

router.get("/shows", authenticateToken, async (req, res) => {
  const { tour_id } = req.query;

  if (!tour_id) {
    return res.status(400).json({ error: "Missing required tour_id" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM shows WHERE tour_id = $1 ORDER BY date ASC",
      [tour_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No shows found for this tour" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching shows:", error);
    res.status(500).json({ error: "Failed to fetch shows" });
  }
});

router.get("/shows/:id", authenticateToken, async (req, res) => {
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

router.delete("/shows/:id", authenticateToken, async (req, res) => {
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

//Inventory routes
router.post("/inventory", authenticateToken, async (req, res) => {
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

router.get("/inventory", authenticateToken, async (req, res) => {
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

router.post("/inventory/update", authenticateToken, async (req, res) => {
  const { inventory_id, new_quantity } = req.body;

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

router.put("/inventory/:id", authenticateToken, async (req, res) => {
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
      updatedItem.sizes = sizesResult.rows; // ✅ Only sets sizes if updatedItem is valid
    }

    res.json({ message: "Inventory item updated", inventory: updatedItem });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error updating inventory:", error);
    res.status(500).json({ error: "Failed to update inventory" });
  }
});

router.delete("/inventory/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN"); // Start transaction

    // Lock the inventory item to prevent concurrent modifications
    const itemResult = await pool.query(
      "SELECT type FROM inventory WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (itemResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Item not found" });
    }

    const itemType = itemResult.rows[0].type;

    // First, delete related sizes if it's a soft item
    if (itemType === "soft") {
      await pool.query("DELETE FROM inventory_sizes WHERE inventory_id = $1", [
        id,
      ]);
    }

    // Then delete the inventory item itself
    const deleteResult = await pool.query(
      "DELETE FROM inventory WHERE id = $1 RETURNING *",
      [id]
    );

    if (deleteResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Failed to delete item" });
    }

    await pool.query("COMMIT"); // Commit transaction

    res.status(200).json({
      message: "Item deleted successfully",
      deletedItem: deleteResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK"); // Rollback if anything fails
    console.error("❌ Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

//Sales routes
router.post("/sales", authenticateToken, async (req, res) => {
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

    // Check the item's type (hard or soft)
    const itemTypeResult = await pool.query(
      `SELECT type FROM inventory WHERE id = $1`,
      [inventory_id]
    );

    if (itemTypeResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid inventory ID" });
    }

    const itemType = itemTypeResult.rows[0].type;

    // Ensure size is required only for soft items
    if (itemType === "soft" && !size) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Size is required for soft items" });
    }

    let inventoryResult;
    if (itemType === "soft") {
      // Subtract from inventory_sizes table for soft items
      inventoryResult = await pool.query(
        `UPDATE inventory_sizes
         SET quantity = quantity - $1
         WHERE inventory_id = $2 AND size = $3 AND quantity >= $1
         RETURNING *`,
        [quantity_sold, inventory_id, size]
      );
    } else {
      // Subtract from inventory table for hard items
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
      return res
        .status(400)
        .json({ error: "Insufficient inventory or invalid inventory ID" });
    }

    // Record the sale
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

router.get("/sales", authenticateToken, async (req, res) => {
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

router.get("/sales/tour", authenticateToken, async (req, res) => {
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

router.post("/sales/bundle", authenticateToken, async (req, res) => {
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

//Bundle routes
router.post("/inventory/bundles", authenticateToken, async (req, res) => {
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

    if (!bundleId) {
      throw new Error("Bundle ID is undefined");
    }

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
          `SELECT SUM(quantity) AS total_quantity FROM inventory_sizes WHERE inventory_id = $1`,
          [item_id]
        );
        itemQuantity = softItemSizes.rows[0]?.total_quantity || 0;
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

router.get(
  "/inventory/bundles/:bundle_id",
  authenticateToken,
  async (req, res) => {
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
  }
);
export default router;
