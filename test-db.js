const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const Project = require("./models/Project");

async function testDB() {
  try {
    console.log("Connecting to MongoDB...");
    console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Not set");

    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ Connected to MongoDB successfully");

    // Test find
    const count = await Project.countDocuments();
    console.log(`✅ Total projects in database: ${count}`);

    // List all projects
    const projects = await Project.find().limit(3);
    console.log("Sample projects:", JSON.stringify(projects, null, 2));

    // Test create
    console.log("\nTesting create...");
    const testProject = await Project.create({
      name: "Test Project",
      location: "Test Location",
    });
    console.log("✅ Test project created:", testProject._id);

    // Clean up
    await Project.findByIdAndDelete(testProject._id);
    console.log("✅ Test project deleted");

    console.log("\n✅ All database tests passed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
    process.exit(1);
  }
}

testDB();
