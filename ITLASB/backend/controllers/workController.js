const { logisticsPool } = require('../config/database');
const BacktrackingOptimizer = require('../services/backtracking');
const { addDriverToSim } = require('../services/simulation');

let workCounter = 100;

async function createWork(req, res) {
  const { source_lat, source_lng, source_name, destination_lat, destination_lng, destination_name } = req.body;
  const user_id = req.user.user_id;

  if (!source_lat || !source_lng || !destination_lat || !destination_lng)
    return res.status(400).json({ error: 'Source and destination coordinates required' });

  try {
    workCounter++;
    const work_id = `W-${workCounter}`;

    await logisticsPool.query(`
      INSERT INTO work (work_id, user_id, source_lat, source_lng, source_name, destination_lat, destination_lng, destination_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [work_id, user_id, source_lat, source_lng, source_name || 'Source', destination_lat, destination_lng, destination_name || 'Destination']);

    // Run backtracking to assign
    const [drivers] = await logisticsPool.query(`SELECT * FROM drivers WHERE status='idle'`);
    const [trucks]  = await logisticsPool.query(`SELECT * FROM trucks WHERE status='available'`);
    const work = { work_id, source_lat, source_lng, destination_lat, destination_lng };

    const optimizer = new BacktrackingOptimizer();
    const result = optimizer.solve(drivers, trucks, work, 5);

    let assignment = null;

    if (result.driver && result.truck) {
      // Update DB
      await logisticsPool.query(`UPDATE work SET status='assigned' WHERE work_id=?`, [work_id]);
      await logisticsPool.query(`UPDATE drivers SET status='traveling', assigned_truck_id=? WHERE driver_id=?`, [result.truck.truck_id, result.driver.driver_id]);
      await logisticsPool.query(`UPDATE trucks SET status='assigned' WHERE truck_id=?`, [result.truck.truck_id]);
      const [ins] = await logisticsPool.query(`
        INSERT INTO assignments (driver_id, truck_id, work_id, total_cost_km)
        VALUES (?, ?, ?, ?)
      `, [result.driver.driver_id, result.truck.truck_id, work_id, result.cost]);

      // Add to simulation
      const simEntry = {
        driver: result.driver,
        truck:  result.truck,
        work:   { work_id, source_lat, source_lng, destination_lat, destination_lng },
        assignment_id: ins.insertId,
      };
      addDriverToSim(simEntry);

      assignment = {
        driver_id: result.driver.driver_id,
        driver_name: result.driver.name,
        truck_id:  result.truck.truck_id,
        cost_km:   result.cost.toFixed(2),
      };
    }

    res.json({
      work_id,
      status: result.driver ? 'assigned' : 'pending',
      assignment,
      backtracking: {
        iterations: result.iterations,
        pruned: result.pruned,
        log: result.log,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMyWork(req, res) {
  try {
    const [rows] = await logisticsPool.query(`
      SELECT w.*, a.driver_id, a.truck_id, a.total_cost_km, a.status AS assignment_status
      FROM work w
      LEFT JOIN assignments a ON a.work_id = w.work_id AND a.status='active'
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllWork(req, res) {
  try {
    const [rows] = await logisticsPool.query(`
      SELECT w.*, a.driver_id, a.truck_id, a.total_cost_km
      FROM work w
      LEFT JOIN assignments a ON a.work_id = w.work_id
      ORDER BY w.created_at DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getWorkById(req, res) {
  try {
    const [rows] = await logisticsPool.query(`
      SELECT w.*, a.driver_id, a.truck_id, a.total_cost_km, a.start_time, a.end_time,
             d.name AS driver_name, d.current_lat, d.current_lng
      FROM work w
      LEFT JOIN assignments a ON a.work_id = w.work_id
      LEFT JOIN drivers d ON d.driver_id = a.driver_id
      WHERE w.work_id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Work not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createWork, getMyWork, getAllWork, getWorkById };
