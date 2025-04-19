const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://your-frontend-domain.com"] // Replace with your frontend domain
    : "*",
  methods: ["GET", "POST"],
}));
app.use(bodyParser.json());

// Rate limiting for login and register routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use("/api/login", loginLimiter);
app.use("/api/register", loginLimiter);

// Initialize SQLite database
const db = new Database("polls.db");

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`);

// Create polls table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL
  )
`);

// Create options table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    option TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    voter_id TEXT, -- Added voter_id column for tracking votes
    FOREIGN KEY (poll_id) REFERENCES polls (id)
  )
`);

// Environment variables
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

// Helper function to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? ["https://your-frontend-domain.com"] // Replace with your frontend domain
      : "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  // Ensure only authenticated users can emit events
  socket.on("newPoll", (poll) => {
    if (!socket.user) {
      return socket.emit("error", "Unauthorized");
    }
    io.emit("pollCreated", poll);
  });

  socket.on("updatePoll", (updatedPoll) => {
    if (!socket.user) {
      return socket.emit("error", "Unauthorized");
    }
    io.emit("pollUpdated", updatedPoll);
  });

  socket.on("deletePoll", (pollId) => {
    if (!socket.user) {
      return socket.emit("error", "Unauthorized");
    }
    io.emit("pollDeleted", pollId);
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected:", socket.id);
  });
});

// Routes
// Health check endpoint
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Register a new user
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUser = db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    );
    insertUser.run(username, hashedPassword);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Log in a user
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = generateToken(user);
  res.json({ token });
});

// Get all polls
app.get("/api/polls", (req, res) => {
  try {
    const polls = db.prepare("SELECT * FROM polls").all();
    const fullPolls = polls.map((poll) => {
      const options = db
        .prepare("SELECT * FROM options WHERE poll_id = ?")
        .all(poll.id);
      return { ...poll, options };
    });
    res.json(fullPolls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new poll (protected route)
app.post("/api/polls", authenticateToken, (req, res) => {
  const { question, options } = req.body;
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "Invalid poll data" });
  }

  const insertPoll = db.prepare("INSERT INTO polls (question) VALUES (?)");
  const pollInfo = insertPoll.run(question);

  options.forEach((option) => {
    const insertOption = db.prepare(
      "INSERT INTO options (poll_id, option) VALUES (?, ?)"
    );
    insertOption.run(pollInfo.lastInsertRowid, option);
  });

  const newPoll = {
    id: pollInfo.lastInsertRowid,
    question,
    options: options.map((option) => ({ option, votes: 0 })),
  };

  res.status(201).json(newPoll);
  io.emit("pollCreated", newPoll);
});

// Vote on a poll
app.post("/api/polls/:id/vote", (req, res) => {
  const { id } = req.params;
  const { optionIndex, voterId } = req.body;

  try {
    const poll = db.prepare("SELECT * FROM polls WHERE id = ?").get(id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Check if the voter has already voted
    const existingVote = db
      .prepare("SELECT * FROM options WHERE poll_id = ? AND voter_id = ?")
      .get(id, voterId);

    if (existingVote) {
      return res.status(400).json({ error: "You have already voted in this poll" });
    }

    const options = db
      .prepare("SELECT * FROM options WHERE poll_id = ?")
      .all(id);

    if (
      typeof optionIndex !== "number" ||
      optionIndex < 0 ||
      optionIndex >= options.length
    ) {
      return res.status(400).json({ error: "Invalid option index" });
    }

    // Update the vote count and store the voter's ID
    const updateVotes = db.prepare(
      "UPDATE options SET votes = votes + 1, voter_id = ? WHERE id = ?"
    );
    updateVotes.run(voterId, options[optionIndex].id);

    const updatedOptions = db
      .prepare("SELECT * FROM options WHERE poll_id = ?")
      .all(id);

    const updatedPoll = {
      ...poll,
      options: updatedOptions,
    };

    res.json(updatedPoll);
    io.emit("pollUpdated", updatedPoll);
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a poll (protected route)
app.delete("/api/polls/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  try {
    const deleteOptions = db.prepare("DELETE FROM options WHERE poll_id = ?");
    deleteOptions.run(id);

    const deletePoll = db.prepare("DELETE FROM polls WHERE id = ?");
    const info = deletePoll.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Poll not found" });
    }

    res.json({ message: "Poll deleted successfully" });
    io.emit("pollDeleted", parseInt(id));
  } catch (error) {
    console.error("Error deleting poll:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Analytics endpoint
app.get("/api/analytics", (req, res) => {
  try {
    const polls = db.prepare("SELECT * FROM polls").all();
    const fullPolls = polls.map((poll) => {
      const options = db
        .prepare("SELECT * FROM options WHERE poll_id = ?")
        .all(poll.id);
      return { ...poll, options };
    });

    const totalVotes = fullPolls.reduce(
      (sum, poll) =>
        sum + poll.options.reduce((optionSum, option) => optionSum + option.votes, 0),
      0
    );

    const mostPopularPoll = fullPolls.length
      ? fullPolls.reduce((maxPoll, currentPoll) => {
          const currentTotalVotes = currentPoll.options.reduce(
            (sum, option) => sum + option.votes,
            0
          );
          const maxTotalVotes = maxPoll.options.reduce(
            (sum, option) => sum + option.votes,
            0
          );
          return currentTotalVotes > maxTotalVotes ? currentPoll : maxPoll;
        }, fullPolls[0])
      : null;

    const voteTrends = fullPolls.map((poll) => ({
      question: poll.question,
      options: poll.options.map((option) => ({
        option: option.option,
        votes: option.votes,
      })),
    }));

    res.json({
      totalVotes,
      mostPopularPoll: mostPopularPoll
        ? {
            question: mostPopularPoll.question,
            votes: mostPopularPoll.options.reduce(
              (sum, option) => sum + option.votes,
              0
            ),
          }
        : null,
      voteTrends,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});