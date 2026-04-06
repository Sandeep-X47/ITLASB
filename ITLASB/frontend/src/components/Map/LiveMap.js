import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'), iconUrl: require('leaflet/dist/images/marker-icon.png'), shadowUrl: require('leaflet/dist/images/marker-shadow.png') });

const statusColor = { delivering: '#22c55e', traveling: '#f59e0b', idle: '#a78bfa' };

function makeDriverIcon(status, id) {
  const c = statusColor[status] || '#888';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:32px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${c};opacity:.2;animation:pulse 2s infinite"></div>
      <div style="position:absolute;inset:6px;border-radius:50%;background:${c};border:2px solid #0a0c10"></div>
      <div style="position:absolute;top:32px;left:50%;transform:translateX(-50%);font-size:10px;color:${c};white-space:nowrap;font-family:'DM Sans',sans-serif;font-weight:600">${id}</div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function makeWorkIcon(type) {
  const c = type === 'source' ? '#f59e0b' : '#22c55e';
  const symbol = type === 'source' ? '📦' : '🏁';
  return L.divIcon({
    className: '',
    html: `<div style="font-size:20px;line-height:1">${symbol}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Click handler component
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick && onMapClick(e.latlng) });
  return null;
}

export default function LiveMap({ height = '100%', onMapClick, clickMode, selectedWork, works = [] }) {
  const { drivers } = useSocket();
  const CHENNAI = [13.0827, 80.2707];

  return (
    <div style={{ height, position: 'relative' }}>
      <MapContainer center={CHENNAI} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        <ClickHandler onMapClick={onMapClick} />

        {/* Driver markers */}
        {drivers.map(d => (
          <Marker key={d.driver_id} position={[d.lat, d.lng]} icon={makeDriverIcon(d.status, d.driver_id)}>
            <Popup>
              <div style={{ fontFamily:'var(--font-body)', minWidth:180 }}>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:14, marginBottom:8, color:'#0a0c10' }}>{d.name}</div>
                <table style={{ width:'100%', fontSize:12 }}>
                  <tbody>
                    <tr><td style={{ color:'#666', paddingBottom:4 }}>ID</td><td style={{ fontWeight:600 }}>{d.driver_id}</td></tr>
                    <tr><td style={{ color:'#666', paddingBottom:4 }}>Status</td><td style={{ fontWeight:600, color: statusColor[d.status] }}>{d.status}</td></tr>
                    <tr><td style={{ color:'#666', paddingBottom:4 }}>Truck</td><td style={{ fontWeight:600 }}>{d.truck_id || '—'}</td></tr>
                    <tr><td style={{ color:'#666', paddingBottom:4 }}>Work</td><td style={{ fontWeight:600 }}>{d.work_id || 'Idle'}</td></tr>
                    {d.work_id && <tr><td style={{ color:'#666' }}>Phase</td><td style={{ fontWeight:600 }}>{d.phase}</td></tr>}
                  </tbody>
                </table>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route lines for active deliveries */}
        {drivers.filter(d => d.status !== 'idle' && d.source_lat).map(d => (
          <React.Fragment key={`route-${d.driver_id}`}>
            <Polyline positions={[[d.lat, d.lng], [d.source_lat, d.source_lng]]} color="#f59e0b" weight={2} dashArray="6 4" opacity={0.6} />
            <Polyline positions={[[d.source_lat, d.source_lng], [d.destination_lat, d.destination_lng]]} color="#22c55e" weight={2} dashArray="6 4" opacity={0.4} />
            <Marker position={[d.source_lat, d.source_lng]} icon={makeWorkIcon('source')} />
            <Marker position={[d.destination_lat, d.destination_lng]} icon={makeWorkIcon('dest')} />
          </React.Fragment>
        ))}

        {/* Pending work markers */}
        {works.filter(w => w.status === 'pending').map(w => (
          <React.Fragment key={`work-${w.work_id}`}>
            <Marker position={[w.source_lat, w.source_lng]} icon={makeWorkIcon('source')}>
              <Popup><div style={{ fontFamily:'var(--font-body)', fontSize:12 }}><strong>{w.work_id}</strong><br/>{w.source_name} → {w.destination_name}<br/><span style={{ color:'#666' }}>Pending assignment</span></div></Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Click-mode pins (for creating work) */}
        {clickMode?.source && <Marker position={[clickMode.source.lat, clickMode.source.lng]} icon={makeWorkIcon('source')} />}
        {clickMode?.dest   && <Marker position={[clickMode.dest.lat,   clickMode.dest.lng]}   icon={makeWorkIcon('dest')} />}
        {clickMode?.source && clickMode?.dest && (
          <Polyline positions={[[clickMode.source.lat, clickMode.source.lng], [clickMode.dest.lat, clickMode.dest.lng]]} color="#f59e0b" weight={2} dashArray="5 5" />
        )}
      </MapContainer>

      {/* Map legend */}
      <div style={{ position:'absolute', bottom:16, left:16, background:'rgba(10,12,16,.85)', border:'1px solid var(--border2)', borderRadius:8, padding:'8px 12px', fontSize:11, backdropFilter:'blur(8px)', zIndex:400 }}>
        {Object.entries(statusColor).map(([s,c]) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:c }} />
            <span style={{ color:'var(--text2)', textTransform:'capitalize' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
