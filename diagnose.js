#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

console.log("=== APPLICATION DIAGNOSTIC ===\n");

// 1. Check .env file
console.log("1️⃣  Checking .env file...");
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log("✅ .env file exists");
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasMongoUri = envContent.includes('MONGO_URI');
  const hasAdminUser = envContent.includes('ADMIN_USERNAME');
  console.log(`   - MONGO_URI: ${hasMongoUri ? '✅' : '❌'}`);
  console.log(`   - ADMIN_USERNAME: ${hasAdminUser ? '✅' : '❌'}`);
} else {
  console.log("❌ .env file NOT found");
}

// 2. Load environment
console.log("\n2️⃣  Loading environment...");
dotenv.config();
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   - MONGO_URI: ${process.env.MONGO_URI ? 'Set' : 'NOT SET'}`);
console.log(`   - ADMIN_USERNAME: ${process.env.ADMIN_USERNAME || 'Not set'}`);

// 3. Check required files
console.log("\n3️⃣  Checking required files...");
const requiredFiles = [
  'server.js',
  'config/db.js',
  'models/Project.js',
  'routes/adminRoutes.js',
  'routes/projectRoutes.js',
  'middleware/adminAuth.js',
  'package.json',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`   - ${file}: ${exists ? '✅' : '❌'}`);
});

// 4. Check dependencies
console.log("\n4️⃣  Checking dependencies...");
const packageJson = require('./package.json');
const requiredDeps = ['express', 'mongoose', 'dotenv', 'ejs', 'express-session'];
requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep] ? '✅' : '❌';
  console.log(`   - ${dep}: ${exists}`);
});

// 5. Check if node_modules exists
console.log("\n5️⃣  Checking node_modules...");
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log("✅ node_modules directory exists");
} else {
  console.log("❌ node_modules NOT found - run 'npm install'");
}

console.log("\n✅ Diagnostic complete!\n");
