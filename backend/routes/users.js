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


router.get("/:id", authenticateToken, async (req, res) => {
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

router.post("/", async (req, res) => {
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
  "/",
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
  "/",
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

router.delete("/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  if (userId !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized: You can only delete your own account" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get all tours for this user
    const tours = await client.query("SELECT id FROM tours WHERE user_id = $1", [userId]);
    const tourIds = tours.rows.map((row) => row.id);

    if (tourIds.length > 0) {
      // Get all shows linked to the user's tours
      const shows = await client.query("SELECT id FROM shows WHERE tour_id = ANY($1)", [tourIds]);
      const showIds = shows.rows.map((row) => row.id);

      if (showIds.length > 0) {
        // Delete all related sales
        await client.query("DELETE FROM sales WHERE show_id = ANY($1)", [showIds]);

        // Delete all show summaries
        await client.query("DELETE FROM show_summaries WHERE show_id = ANY($1)", [showIds]);

        // Delete all shows
        await client.query("DELETE FROM shows WHERE id = ANY($1)", [showIds]);
      }

      // Delete all inventory related to user's tours
      await client.query("DELETE FROM inventory WHERE tour_id = ANY($1)", [tourIds]);

      // Delete all tours
      await client.query("DELETE FROM tours WHERE id = ANY($1)", [tourIds]);
    }

    // Finally, delete the user
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    await client.query("COMMIT");
    res.status(200).json({ message: "User and all related data deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
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

export default router;
