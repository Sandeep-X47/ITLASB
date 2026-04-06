/**
 * Haversine formula — returns distance in km between two lat/lng points
 */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Interpolate position along a route given progress 0–1
 */
function interpolatePosition(fromLat, fromLng, toLat, toLng, progress) {
  return {
    lat: fromLat + (toLat - fromLat) * progress,
    lng: fromLng + (toLng - fromLng) * progress,
  };
}

module.exports = { haversine, interpolatePosition };
