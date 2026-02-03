const dns = require('node:dns');
dns.setServers(['1.1.1.1' , '8.8.8.8']);
const express = require("express");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const cors = require("cors");
const session = require("express-session");

// Load .env BEFORE requiring connectDB, so process.env.MONGO_URI is available
const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.warn("dotenv: failed to load .env file:", dotenvResult.error.message || dotenvResult.error);
} else {
  console.log("dotenv: .env file loaded");
}

console.log("Working directory:", process.cwd());
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
];
envPaths.forEach(p => console.log(`.env exists at ${p}:`, fs.existsSync(p)));

function maskUri(uri) {
  try {
    return uri.replace(/(\/\/.*?:)(.*?)(@)/, (m, p1, p2, p3) => `${p1}***${p3}`);
  } catch (e) {
    return uri;
  }
}

if (process.env.MONGO_URI) {
  console.log('MONGO_URI present:', maskUri(process.env.MONGO_URI));
} else {
  console.warn('MONGO_URI is NOT set in environment');
}

// NOW require connectDB after dotenv is configured
const connectDB = require("./config/db");
connectDB();

const app = express();

// Built-in rate limiting map (simple implementation)
const loginAttempts = new Map();

function checkLoginLimit(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  
  // Remove attempts older than 15 minutes
  const recentAttempts = attempts.filter(t => now - t < 15 * 60 * 1000);
  
  if (recentAttempts.length >= 5) {
    return false; // Too many attempts
  }
  
  recentAttempts.push(now);
  loginAttempts.set(ip, recentAttempts);
  return true;
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dwarka-admin-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent XSS - don't allow JS access
      sameSite: 'strict', // CSRF protection
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
    },
  }),
);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com");
  next();
});

// Attach rate limit checker to app
app.checkLoginLimit = checkLoginLimit;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.use("/admin", require("./routes/adminRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));

// Catch-all 404 handler
app.use((req, res) => {
  console.log("404 - Route not found:", req.method, req.path);
  res.status(404).send("Page not found");
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).send("Server error: " + err.message);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
