const { haversine } = require('./distance');

/**
 * BACKTRACKING OPTIMIZER
 * Finds optimal Driver → Truck → Work mapping minimizing total travel cost.
 *
 * Cost(driver, truck, work) =
 *   dist(driver → truck)
 *   + dist(truck → work.source)
 *   + dist(work.source → work.destination)
 *
 * Pruning: if partial cost already exceeds best known cost, backtrack immediately.
 */

class BacktrackingOptimizer {
  constructor() {
    this.bestCost = Infinity;
    this.bestAssignment = null;
    this.log = [];
    this.iterations = 0;
    this.pruned = 0;
  }

  /**
   * Main entry: find best (driver, truck) pair for a work order
   * @param {Array} drivers  - [{driver_id, current_lat, current_lng, status}]
   * @param {Array} trucks   - [{truck_id, current_lat, current_lng, status}]
   * @param {Object} work    - {work_id, source_lat, source_lng, destination_lat, destination_lng}
   * @param {number} topK    - consider only top-K nearest drivers/trucks (pruning optimization)
   * @returns {Object}       - {driver, truck, cost, log, iterations, pruned}
   */
  solve(drivers, trucks, work, topK = 5) {
    this.bestCost = Infinity;
    this.bestAssignment = null;
    this.log = [];
    this.iterations = 0;
    this.pruned = 0;

    // Only use idle/available candidates
    const availableDrivers = drivers.filter(d => d.status === 'idle');
    const availableTrucks  = trucks.filter(t => t.status === 'available');

    if (availableDrivers.length === 0 || availableTrucks.length === 0) {
      this.log.push({ type: 'info', msg: 'No available drivers or trucks — work queued.' });
      return { driver: null, truck: null, cost: null, log: this.log, iterations: 0, pruned: 0 };
    }

    // Sort drivers by distance to work source (nearest first) — limit to topK
    const sortedDrivers = availableDrivers
      .map(d => ({
        ...d,
        distToWork: haversine(d.current_lat, d.current_lng, work.source_lat, work.source_lng),
      }))
      .sort((a, b) => a.distToWork - b.distToWork)
      .slice(0, topK);

    // Sort trucks by distance to work source (nearest first) — limit to topK
    const sortedTrucks = availableTrucks
      .map(t => ({
        ...t,
        distToWork: haversine(t.current_lat, t.current_lng, work.source_lat, work.source_lng),
      }))
      .sort((a, b) => a.distToWork - b.distToWork)
      .slice(0, topK);

    const srcToDestDist = haversine(
      work.source_lat, work.source_lng,
      work.destination_lat, work.destination_lng
    );

    this.log.push({
      type: 'init',
      msg: `Backtracking started: ${sortedDrivers.length} drivers × ${sortedTrucks.length} trucks`,
      srcToDestDist: srcToDestDist.toFixed(2),
    });

    // ─── BACKTRACK ─────────────────────────────────────────
    this._backtrack(sortedDrivers, sortedTrucks, work, srcToDestDist, 0);

    this.log.push({
      type: 'result',
      msg: this.bestAssignment
        ? `✅ Optimal: ${this.bestAssignment.driver.driver_id} + ${this.bestAssignment.truck.truck_id}, cost=${this.bestCost.toFixed(2)}km`
        : '⚠️ No valid assignment found',
      best: this.bestAssignment ? this.bestCost.toFixed(2) : null,
    });

    return {
      driver: this.bestAssignment?.driver || null,
      truck:  this.bestAssignment?.truck  || null,
      cost:   this.bestAssignment ? this.bestCost : null,
      log: this.log,
      iterations: this.iterations,
      pruned: this.pruned,
    };
  }

  _backtrack(drivers, trucks, work, srcToDestDist, driverIndex) {
    if (driverIndex >= drivers.length) return;

    const driver = drivers[driverIndex];

    for (let ti = 0; ti < trucks.length; ti++) {
      const truck = trucks[ti];
      this.iterations++;

      // Cost component 1: driver travel to truck
      const driverToTruck = haversine(
        driver.current_lat, driver.current_lng,
        truck.current_lat, truck.current_lng
      );

      // ── PRUNE: even before adding truck→source, if driver→truck alone exceeds best
      if (driverToTruck >= this.bestCost) {
        this.pruned++;
        this.log.push({
          type: 'prune',
          msg: `PRUNE: ${driver.driver_id}→${truck.truck_id}: driver→truck (${driverToTruck.toFixed(1)}km) ≥ best (${this.bestCost.toFixed(1)}km)`,
        });
        continue;
      }

      // Cost component 2: truck travel to work source
      const truckToSource = haversine(
        truck.current_lat, truck.current_lng,
        work.source_lat, work.source_lng
      );

      const partialCost = driverToTruck + truckToSource;

      // ── PRUNE: partial cost already exceeds best
      if (partialCost >= this.bestCost) {
        this.pruned++;
        this.log.push({
          type: 'prune',
          msg: `PRUNE: ${driver.driver_id}→${truck.truck_id}: partial (${partialCost.toFixed(1)}km) ≥ best (${this.bestCost.toFixed(1)}km)`,
        });
        continue;
      }

      // Total cost
      const totalCost = partialCost + srcToDestDist;

      this.log.push({
        type: totalCost < this.bestCost ? 'best' : 'try',
        msg: `Try: ${driver.driver_id}→${truck.truck_id}: ${driverToTruck.toFixed(1)}+${truckToSource.toFixed(1)}+${srcToDestDist.toFixed(1)}=${totalCost.toFixed(1)}km`,
        cost: totalCost.toFixed(2),
        driverToTruck: driverToTruck.toFixed(2),
        truckToSource: truckToSource.toFixed(2),
        srcToDest: srcToDestDist.toFixed(2),
      });

      if (totalCost < this.bestCost) {
        this.bestCost = totalCost;
        this.bestAssignment = { driver, truck };
        this.log.push({
          type: 'newbest',
          msg: `  ↑ New best: ${totalCost.toFixed(2)}km`,
        });
      }
    }

    // Recurse to next driver
    this._backtrack(drivers, trucks, work, srcToDestDist, driverIndex + 1);
  }
}

module.exports = BacktrackingOptimizer;
