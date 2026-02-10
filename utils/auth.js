const bcrypt = require("bcrypt");

// Hash password (use during setup or password change)
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}

// Compare password with hash
async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("Error comparing password:", error);
    return false;
  }
}

// Get hashed admin password for environment
// Usage: In terminal, run: node -e "const {hashPassword} = require('./utils/auth'); hashPassword('your-password').then(h => console.log(h));"
async function getHashedAdminPassword() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  return await hashPassword(adminPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
  getHashedAdminPassword,
};
