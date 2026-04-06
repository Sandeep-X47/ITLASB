const { logisticsPool } = require('../config/database');

async function getAllDrivers(req, res) {
  try {
    const [rows] = await logisticsPool.query(`
      SELECT d.*, t.truck_id AS truck, a.work_id,
             w.source_name, w.destination_name, w.source_lat, w.source_lng, w.destination_lat, w.destination_lng
      FROM drivers d
      LEFT JOIN trucks t ON t.truck_id = d.assigned_truck_id
      LEFT JOIN assignments a ON a.driver_id = d.driver_id AND a.status='active'
      LEFT JOIN work w ON w.work_id = a.work_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addDriver(req, res) {
  const { driver_id, name, current_lat, current_lng } = req.body;
  if (!driver_id || !name) return res.status(400).json({ error: 'driver_id and name required' });
  try {
    await logisticsPool.query(
      `INSERT INTO drivers (driver_id, name, current_lat, current_lng) VALUES (?, ?, ?, ?)`,
      [driver_id, name, current_lat || 13.0827, current_lng || 80.2707]
    );
    res.json({ message: 'Driver added', driver_id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Driver ID already exists' });
    res.status(500).json({ error: err.message });
  }
}

async function deleteDriver(req, res) {
  try {
    await logisticsPool.query(`DELETE FROM drivers WHERE driver_id=?`, [req.params.id]);
    res.json({ message: 'Driver removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllDrivers, addDriver, deleteDriver };
