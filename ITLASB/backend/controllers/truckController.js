const { logisticsPool } = require('../config/database');

async function getAllTrucks(req, res) {
  try {
    const [rows] = await logisticsPool.query(`SELECT * FROM trucks ORDER BY truck_id`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addTruck(req, res) {
  const { truck_id, current_lat, current_lng } = req.body;
  if (!truck_id) return res.status(400).json({ error: 'truck_id required' });
  try {
    await logisticsPool.query(
      `INSERT INTO trucks (truck_id, status, current_lat, current_lng) VALUES (?, 'available', ?, ?)`,
      [truck_id, current_lat || 13.0827, current_lng || 80.2707]
    );
    res.json({ message: 'Truck added', truck_id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Truck ID already exists' });
    res.status(500).json({ error: err.message });
  }
}

async function deleteTruck(req, res) {
  try {
    await logisticsPool.query(`DELETE FROM trucks WHERE truck_id=?`, [req.params.id]);
    res.json({ message: 'Truck removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllTrucks, addTruck, deleteTruck };
