const { logisticsPool } = require('../config/database');
const { haversine, interpolatePosition } = require('./distance');

const SPEED_KMH = parseFloat(process.env.SIMULATION_SPEED_KMH) || 50;
const TICK_MS   = parseInt(process.env.TICK_INTERVAL_MS) || 2000;

// In-memory simulation state (synced with DB periodically)
let simDrivers = {};  // driver_id → { ...driver, targetLat, targetLng, phase, workId, truckId }
let io = null;

function attachIO(socketIO) {
  io = socketIO;
}

async function loadState() {
  const [drivers] = await logisticsPool.query(`
    SELECT d.*, a.work_id, a.truck_id, a.assignment_id,
           w.source_lat, w.source_lng, w.destination_lat, w.destination_lng,
           t.current_lat AS truck_lat, t.current_lng AS truck_lng
    FROM drivers d
    LEFT JOIN assignments a ON a.driver_id = d.driver_id AND a.status = 'active'
    LEFT JOIN work w ON w.work_id = a.work_id
    LEFT JOIN trucks t ON t.truck_id = a.truck_id
  `);

  for (const d of drivers) {
    if (!simDrivers[d.driver_id]) {
      simDrivers[d.driver_id] = {
        ...d,
        progress: 0,
        phase: d.status === 'traveling' ? 'to_truck' : d.status === 'delivering' ? 'delivering' : 'idle',
      };
    }
  }
}

async function tick() {
  const tickDistKm = (SPEED_KMH * (TICK_MS / 1000)) / 3600;

  for (const id in simDrivers) {
    const d = simDrivers[id];
    if (d.phase === 'idle' || !d.work_id) continue;

    let targetLat, targetLng;

    if (d.phase === 'to_truck') {
      targetLat = d.truck_lat;
      targetLng = d.truck_lng;
    } else if (d.phase === 'to_source') {
      targetLat = d.source_lat;
      targetLng = d.source_lng;
    } else if (d.phase === 'delivering') {
      targetLat = d.destination_lat;
      targetLng = d.destination_lng;
    } else continue;

    if (targetLat == null) continue;

    const distToTarget = haversine(d.current_lat, d.current_lng, targetLat, targetLng);

    if (distToTarget <= tickDistKm) {
      // Reached target
      d.current_lat = targetLat;
      d.current_lng = targetLng;

      if (d.phase === 'to_truck') {
        d.phase = 'to_source';
        d.status = 'traveling';
      } else if (d.phase === 'to_source') {
        d.phase = 'delivering';
        d.status = 'delivering';
        await logisticsPool.query(`UPDATE work SET status='in-progress' WHERE work_id=?`, [d.work_id]);
      } else if (d.phase === 'delivering') {
        // Delivery complete
        d.phase = 'idle';
        d.status = 'idle';
        await logisticsPool.query(`UPDATE work SET status='completed' WHERE work_id=?`, [d.work_id]);
        await logisticsPool.query(`UPDATE assignments SET status='completed', end_time=NOW() WHERE assignment_id=?`, [d.assignment_id]);
        await logisticsPool.query(`UPDATE trucks SET status='available' WHERE truck_id=?`, [d.truck_id]);
        await logisticsPool.query(`UPDATE drivers SET status='idle', assigned_truck_id=NULL WHERE driver_id=?`, [id]);
        d.work_id = null; d.truck_id = null; d.assignment_id = null;
        if (io) io.emit('work_completed', { driver_id: id, work_id: d.work_id });
      }
    } else {
      // Move toward target
      const ratio = tickDistKm / distToTarget;
      d.current_lat = d.current_lat + (targetLat - d.current_lat) * ratio;
      d.current_lng = d.current_lng + (targetLng - d.current_lng) * ratio;
    }

    // Update DB
    await logisticsPool.query(
      `UPDATE drivers SET current_lat=?, current_lng=?, status=? WHERE driver_id=?`,
      [d.current_lat, d.current_lng, d.status, id]
    );
  }

  // Broadcast state
  if (io) {
    const snapshot = Object.values(simDrivers).map(d => ({
      driver_id: d.driver_id,
      name: d.name,
      lat: d.current_lat,
      lng: d.current_lng,
      status: d.status,
      phase: d.phase,
      work_id: d.work_id,
      truck_id: d.truck_id,
      source_lat: d.source_lat,
      source_lng: d.source_lng,
      destination_lat: d.destination_lat,
      destination_lng: d.destination_lng,
    }));
    io.emit('driver_update', snapshot);
  }
}

function addDriverToSim(assignment) {
  simDrivers[assignment.driver.driver_id] = {
    driver_id: assignment.driver.driver_id,
    name: assignment.driver.name,
    current_lat: assignment.driver.current_lat,
    current_lng: assignment.driver.current_lng,
    status: 'traveling',
    phase: 'to_truck',
    work_id: assignment.work.work_id,
    truck_id: assignment.truck.truck_id,
    assignment_id: assignment.assignment_id,
    truck_lat: assignment.truck.current_lat,
    truck_lng: assignment.truck.current_lng,
    source_lat: assignment.work.source_lat,
    source_lng: assignment.work.source_lng,
    destination_lat: assignment.work.destination_lat,
    destination_lng: assignment.work.destination_lng,
  };
}

async function startSimulation() {
  await loadState();
  setInterval(tick, TICK_MS);
  console.log(`✅ Simulation running (speed: ${SPEED_KMH}km/h, tick: ${TICK_MS}ms)`);
}

module.exports = { startSimulation, addDriverToSim, attachIO };
