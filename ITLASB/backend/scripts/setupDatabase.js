const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  console.log('✅ Connected to MySQL');

  // ─── AUTH DB ───────────────────────────────────────────
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_AUTH};`);
  await conn.query(`USE ${process.env.DB_AUTH};`);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','customer') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin + demo customers
  const adminHash = await bcrypt.hash('admin123', 10);
  const custHash  = await bcrypt.hash('customer123', 10);
  await conn.query(`
    INSERT IGNORE INTO users (username, password, role) VALUES
    ('admin', '${adminHash}', 'admin'),
    ('alice', '${custHash}', 'customer'),
    ('bob',   '${custHash}', 'customer');
  `);
  console.log('✅ Auth DB ready');

  // ─── LOGISTICS DB ──────────────────────────────────────
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_LOGISTICS};`);
  await conn.query(`USE ${process.env.DB_LOGISTICS};`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS trucks (
      truck_id VARCHAR(10) PRIMARY KEY,
      status ENUM('available','assigned') DEFAULT 'available',
      current_lat DOUBLE DEFAULT 13.0827,
      current_lng DOUBLE DEFAULT 80.2707
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS drivers (
      driver_id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      current_lat DOUBLE NOT NULL,
      current_lng DOUBLE NOT NULL,
      status ENUM('idle','traveling','delivering') DEFAULT 'idle',
      assigned_truck_id VARCHAR(10) DEFAULT NULL,
      FOREIGN KEY (assigned_truck_id) REFERENCES trucks(truck_id) ON DELETE SET NULL
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS work (
      work_id VARCHAR(10) PRIMARY KEY,
      user_id INT NOT NULL,
      source_lat DOUBLE NOT NULL,
      source_lng DOUBLE NOT NULL,
      source_name VARCHAR(100) DEFAULT 'Source',
      destination_lat DOUBLE NOT NULL,
      destination_lng DOUBLE NOT NULL,
      destination_name VARCHAR(100) DEFAULT 'Destination',
      status ENUM('pending','assigned','in-progress','completed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      assignment_id INT AUTO_INCREMENT PRIMARY KEY,
      driver_id VARCHAR(10) NOT NULL,
      truck_id VARCHAR(10) NOT NULL,
      work_id VARCHAR(10) NOT NULL,
      total_cost_km DOUBLE DEFAULT 0,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP NULL,
      status ENUM('active','completed') DEFAULT 'active',
      FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
      FOREIGN KEY (truck_id) REFERENCES trucks(truck_id),
      FOREIGN KEY (work_id) REFERENCES work(work_id)
    );
  `);

  // ─── SEED TRUCKS ──────────────────────────────────────
  const truckPositions = [
    ['T-01', 13.0524, 80.2507], ['T-02', 13.1127, 80.2800], ['T-03', 13.0350, 80.2650],
    ['T-04', 13.0900, 80.1900], ['T-05', 13.0600, 80.2200], ['T-06', 13.1400, 80.2300],
    ['T-07', 12.9800, 80.1600], ['T-08', 13.0200, 80.3100], ['T-09', 13.1600, 80.2600],
    ['T-10', 13.0700, 80.2800], ['T-11', 12.9500, 80.2400], ['T-12', 13.1000, 80.3000],
    ['T-13', 13.0100, 80.2100], ['T-14', 13.1300, 80.1700], ['T-15', 13.0450, 80.2900],
  ];
  for (const [id, lat, lng] of truckPositions) {
    await conn.query(`INSERT IGNORE INTO trucks (truck_id, status, current_lat, current_lng) VALUES (?, 'available', ?, ?)`, [id, lat, lng]);
  }

  // ─── SEED DRIVERS ─────────────────────────────────────
  const driverData = [
    ['D-01', 'Arjun Sharma',   13.0827, 80.2707],
    ['D-02', 'Priya Nair',     13.0600, 80.2500],
    ['D-03', 'Karthik V',      13.1200, 80.2300],
    ['D-04', 'Divya Reddy',    13.0400, 80.2100],
    ['D-05', 'Sanjay Kumar',   13.0900, 80.2900],
    ['D-06', 'Meena Iyer',     13.1500, 80.2800],
    ['D-07', 'Rahul Das',      12.9800, 80.2600],
    ['D-08', 'Ananya Pillai',  13.0300, 80.2400],
    ['D-09', 'Vijay T',        13.1100, 80.2000],
    ['D-10', 'Lakshmi R',      13.0700, 80.2300],
  ];
  for (const [id, name, lat, lng] of driverData) {
    await conn.query(`INSERT IGNORE INTO drivers (driver_id, name, current_lat, current_lng, status) VALUES (?, ?, ?, ?, 'idle')`, [id, name, lat, lng]);
  }

  console.log('✅ Logistics DB ready — 10 drivers, 15 trucks seeded');
  await conn.end();
  console.log('\n🚀 Database setup complete! Run: npm run dev');
}

setupDatabase().catch(err => {
  console.error('❌ Setup failed:', err.message);
  console.error('Make sure MySQL is running and credentials in backend/.env are correct');
  process.exit(1);
});
