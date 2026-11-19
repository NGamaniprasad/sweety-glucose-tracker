
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");

// Generate JWT token after successful authentication
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length > 100 || cleanEmail.length > 255) {
      return res.status(400).json({
        message: "Name or email is too long.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (
      Buffer.byteLength(password, "utf8") > 72 ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
      });
    }

    // Hash password before inserting into the database
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [cleanName, cleanEmail, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: "Registration successful.",
      user,
      token: generateToken(user.id),
    });

  } catch (error) {
    // PostgreSQL unique-constraint violation
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    console.error("Register error:", error.message);

    return res.status(500).json({
      message: "Unable to register. Please try again.",
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: generateToken(user.id),
    });

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
};

// GET /api/auth/me
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      message: "Unable to load profile.",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
