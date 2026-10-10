// MongoDB First-time Initialization Script
db = db.getSiblingDB("admin");

// Ensure root user has full permissions if not already created by entrypoint
try {
  db.createUser({
    user: process.env.MONGO_INITDB_ROOT_USERNAME || "admin",
    pwd: process.env.MONGO_INITDB_ROOT_PASSWORD || "password123",
    roles: [
      { role: "root", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" },
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "dbAdminAnyDatabase", db: "admin" }
    ]
  });
} catch (e) {
  print("ℹ️ Note: root user creation skipped or already exists: " + e.message);
}

// Create application database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "poolPay-db");
print("✅ MongoDB PoolPay database and initial roles initialized successfully!");
