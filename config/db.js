const mongoose = require("mongoose");

const url = process.env.MONGO_URI;

function maskUri(uri) {
  try {
    // mask the password portion: mongodb+srv://user:pass@... -> mongodb+srv://user:***@...
    return uri.replace(/(\/\/.*?:)(.*?)(@)/, (m, p1, p2, p3) => `${p1}***${p3}`);
  } catch (e) {
    return uri;
  }
}

const connectDB = async () => {
  if (!url) {
    console.error("MongoDB Connection Error: MONGO_URI is not set in environment");
    process.exit(1);
  }

  try {
    // Let the connection string (SRV) control TLS and other options from Atlas.
    await mongoose.connect(url, {
      retryWrites: true,
      w: "majority",
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.error(error.stack);
    console.error("Tried URI:", maskUri(url));
    process.exit(1);
  }
};

module.exports = connectDB;
