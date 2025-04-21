const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");

// Load environment variables
dotenv.config();

// Initialize Express app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Initialize SQLite database
const db = new Database(process.env.DATABASE_PATH || "polls.db");
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Initialize DB tables
const initializeDatabase = () => {
  try {
    // Create users table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `).run();

    // Create polls table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        created_by TEXT NOT NULL
      );
    `).run();

    // Create options table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id TEXT,
        option TEXT,
        votes INTEGER DEFAULT 0
      );
    `).run();

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
};

initializeDatabase();

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied." });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
}

// Helper Functions
const getPollsWithOptions = () => {
  const polls = db.prepare("SELECT * FROM polls").all();
  const options = db.prepare("SELECT * FROM options").all();
  return polls.map(poll => ({
    ...poll,
    options: options.filter(opt => opt.poll_id === poll.id),
  }));
};

// Routes

// User Registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = require("crypto").randomUUID();
    db.prepare("INSERT INTO users (id, username, password) VALUES (?, ?, ?)").run(
      userId,
      username,
      hashedPassword
    );
    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to register user." });
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login." });
  }
});

// Fetch All Polls
app.get("/api/polls", (req, res) => {
  try {
    const polls = getPollsWithOptions();
    res.json(polls);
  } catch (err) {
    console.error("Error fetching polls:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a New Poll
app.post("/api/polls", authenticateToken, (req, res) => {
  try {
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "Invalid input. A poll must have a question and at least two options." });
    }
    const pollId = require("crypto").randomUUID();
    db.prepare("INSERT INTO polls (id, question, created_by) VALUES (?, ?, ?)").run(
      pollId,
      question,
      req.user.userId
    );
    const insertOption = db.prepare("INSERT INTO options (poll_id, option) VALUES (?, ?)");
    options.forEach(opt => insertOption.run(pollId, opt));
    const newPoll = {
      id: pollId,
      question,
      options: options.map(opt => ({ option: opt, votes: 0 })),
    };
    io.emit("pollUpdated", newPoll);
    res.status(201).json(newPoll);
  } catch (err) {
    console.error("Error creating poll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Vote on a Poll
app.post("/api/polls/:id/vote", (req, res) => {
  try {
    const { optionIndex, voterId } = req.body;
    const pollId = req.params.id;
    const options = db.prepare("SELECT * FROM options WHERE poll_id = ?").all(pollId);
    if (!options[optionIndex]) return res.status(400).json({ error: "Invalid option index" });
    db.prepare("UPDATE options SET votes = votes + 1 WHERE id = ?").run(options[optionIndex].id);
    const poll = db.prepare("SELECT * FROM polls WHERE id = ?").get(pollId);
    const updatedOptions = db.prepare("SELECT * FROM options WHERE poll_id = ?").all(pollId);
    const updatedPoll = {
      ...poll,
      options: updatedOptions,
    };
    io.emit("pollUpdated", updatedPoll);
    res.json(updatedPoll);
  } catch (err) {
    console.error("Error voting on poll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a Poll
app.delete("/api/polls/:id", authenticateToken, (req, res) => {
  try {
    const pollId = req.params.id;
    db.prepare("DELETE FROM options WHERE poll_id = ?").run(pollId);
    db.prepare("DELETE FROM polls WHERE id = ?").run(pollId);
    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting poll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Analytics Route
app.get("/api/analytics", (req, res) => {
  try {
    const polls = db.prepare("SELECT * FROM polls").all();
    const options = db.prepare("SELECT * FROM options").all();
    const enriched = polls.map(poll => {
      const pollOptions = options.filter(opt => opt.poll_id === poll.id);
      return {
        question: poll.question,
        options: pollOptions.map(opt => ({
          option: opt.option,
          votes: opt.votes,
        })),
      };
    });
    const totalVotes = options.reduce((acc, opt) => acc + opt.votes, 0);
    const mostPopularPoll = enriched.reduce((max, poll) => {
      const sum = poll.options.reduce((a, o) => a + o.votes, 0);
      return sum > (max?.votes || 0) ? { question: poll.question, votes: sum } : max;
    }, null);
    res.json({ totalVotes, mostPopularPoll, voteTrends: enriched });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});