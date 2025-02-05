import express from "express";
import pool from "../utils/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { authenticateToken } from "../middleware/authenticateToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

//Users Routes
router.get("/users/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
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

    // Generate JWT token
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

router.put("/users", authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;

  try {
    let hashedPassword = null;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           password = COALESCE($3, password) 
       WHERE id = $4 RETURNING id, name, email`,
      [name, email, hashedPassword, userId]
    );

    res
      .status(200)
      .json({ message: "User updated successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

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

  if (!tour_id || isNaN(Number(tour_id))) {
    return res
      .status(400)
      .json({ error: "Invalid or missing tour_id query parameter" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM shows WHERE tour_id = $1 ORDER BY date ASC",
      [Number(tour_id)]
    );

    if (result.rows.length === 0) {
      return res.status(200).json();
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
  const userId = req.user.id; // Get user ID from token

  try {
    // Check if the show exists and belongs to a tour owned by this user
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

    // Delete the show
    await pool.query("DELETE FROM shows WHERE id = $1", [showId]);

    res.status(200).json({ message: "Show deleted successfully." });
  } catch (error) {
    console.error("Error deleting show:", error);
    res.status(500).json({ error: "Failed to delete show." });
  }
});

//Inventory routes
router.post("/inventory", authenticateToken, async (req, res) => {
  const { tour_id, name, type, sizes, quantity, price, image_url } = req.body;

  if (!tour_id || !name || !type || !price || (type === "hard" && !quantity)) {
    return res.status(400).json({
      error:
        "Missing required fields: tour_id, name, type, quantity (if hard item), price",
    });
  }

  try {
    // Check for existing items with the same name and type
    let existingItem;
    if (type === "soft") {
      existingItem = await pool.query(
        "SELECT * FROM inventory WHERE tour_id = $1 AND name = $2 AND type = $3",
        [tour_id, name, type]
      );
    } else {
      existingItem = await pool.query(
        "SELECT * FROM inventory WHERE tour_id = $1 AND name = $2 AND type = $3 AND size IS NULL",
        [tour_id, name, type]
      );
    }

    if (existingItem.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Item with this name already exists in inventory" });
    }

    // Handle Soft Items
    if (type === "soft" && sizes && Object.keys(sizes).length > 0) {
      const inventoryItems = [];

      for (const [size, qty] of Object.entries(sizes)) {
        const result = await pool.query(
          `INSERT INTO inventory (tour_id, name, type, size, quantity, price, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [tour_id, name, type, size, qty, price, image_url || null]
        );
        inventoryItems.push(result.rows[0]);
      }

      return res
        .status(201)
        .json({ message: "Soft inventory items added", items: inventoryItems });
    }

    // Handle Hard Items
    const result = await pool.query(
      `INSERT INTO inventory (tour_id, name, type, size, quantity, price, image_url) 
       VALUES ($1, $2, $3, NULL, $4, $5, $6) RETURNING *`,
      [tour_id, name, type, quantity, price, image_url || null]
    );

    res
      .status(201)
      .json({ message: "Hard inventory item added", item: result.rows[0] });
  } catch (error) {
    console.error("Error adding inventory", error);
    res.status(500).json({ error: "Failed to add inventory item" });
  }
});

router.get("/inventory", authenticateToken, async (req, res) => {
  const { tour_id } = req.query;

  if (!tour_id || isNaN(Number(tour_id))) {
    return res
      .status(400)
      .json({ error: "Invalid or missing tour_id query parameter" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM inventory WHERE tour_id = $1 ORDER BY name ASC",
      [Number(tour_id)]
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(result.rows);
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
  const { price, new_quantity } = req.body;

  if (!id || (price === undefined && new_quantity === undefined)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `UPDATE inventory 
       SET price = COALESCE($1, price), 
           quantity = COALESCE(quantity, 0) + COALESCE($2, 0) 
       WHERE id = $3 
       RETURNING *`,
      [price, new_quantity, id]
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

router.delete("/inventory/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM inventory WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory:", error);
    res.status(500).json({ message: "Failed to delete inventory item" });
  }
});

//Sales routes
router.post("/sales", authenticateToken, async (req, res) => {
  const { inventory_id, show_id, quantity_sold, total_amount, payment_method } =
    req.body;

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

    // Decrease inventory quantity
    const inventoryResult = await pool.query(
      `UPDATE inventory
       SET quantity = quantity - $1
       WHERE id = $2 AND quantity >= $1
       RETURNING *`,
      [quantity_sold, inventory_id]
    );

    if (inventoryResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Insufficient inventory or invalid inventory ID" });
    }

    // Insert sale into the database, including `show_id`
    const salesResult = await pool.query(
      `INSERT INTO sales (inventory_id, show_id, quantity_sold, total_amount, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [inventory_id, show_id, quantity_sold, adjustedPrice, payment_method]
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
      `SELECT sales.id, sales.quantity_sold, sales.total_amount, sales.payment_method, sales.created_at,
              inventory.name AS item_name, inventory.type, inventory.size, inventory.price
       FROM sales
       JOIN inventory ON sales.inventory_id = inventory.id
       WHERE sales.show_id = $1
       ORDER BY sales.created_at DESC`,
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
export default router;
