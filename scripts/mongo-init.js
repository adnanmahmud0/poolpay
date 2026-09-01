// MongoDB First-time Initialization Script
db = db.getSiblingDB('admin');

// Ensure root user has full permissions
db.createUser({
  user: process.env.MONGO_INITDB_ROOT_USERNAME || 'admin',
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD || 'PoolPaySecurePass2026!',
  roles: [
    { role: 'root', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' }
  ]
});

// Create application database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'poolPay-db');
print("✅ MongoDB PoolPay database and initial roles initialized successfully!");
