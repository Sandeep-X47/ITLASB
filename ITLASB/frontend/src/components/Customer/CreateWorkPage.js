import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'), iconUrl: require('leaflet/dist/images/marker-icon.png'), shadowUrl: require('leaflet/dist/images/marker-shadow.png') });

const srcIcon = L.divIcon({ className:'', html:'<div style="font-size:24px">📦</div>', iconSize:[28,28], iconAnchor:[14,14] });
const dstIcon = L.divIcon({ className:'', html:'<div style="font-size:24px">🏁</div>', iconSize:[28,28], iconAnchor:[14,14] });

function ClickCapture({ step, onSrc, onDst }) {
  useMapEvents({
    click(e) {
      if (step === 'source') onSrc(e.latlng);
      else if (step === 'dest') onDst(e.latlng);
    },
  });
  return null;
}

const CHENNAI_AREAS = [
  { name: 'T. Nagar',     lat: 13.0418, lng: 80.2341 },
  { name: 'Adyar',        lat: 13.0012, lng: 80.2565 },
  { name: 'Anna Nagar',   lat: 13.0850, lng: 80.2101 },
  { name: 'Velachery',    lat: 12.9815, lng: 80.2180 },
  { name: 'Tambaram',     lat: 12.9249, lng: 80.1000 },
  { name: 'Porur',        lat: 13.0342, lng: 80.1567 },
  { name: 'Guindy',       lat: 13.0067, lng: 80.2206 },
  { name: 'Sholinganallur',lat:12.9010, lng: 80.2279 },
  { name: 'Avadi',        lat: 13.1067, lng: 80.0975 },
  { name: 'Perambur',     lat: 13.1167, lng: 80.2325 },
  { name: 'Chromepet',    lat: 12.9516, lng: 80.1462 },
  { name: 'Mylapore',     lat: 13.0336, lng: 80.2694 },
];

export default function CreateWorkPage({ addToast }) {
  const [step,    setStep]   = useState('source'); // 'source' | 'dest' | 'review'
  const [src,     setSrc]    = useState(null);
  const [dst,     setDst]    = useState(null);
  const [srcName, setSrcName] = useState('');
  const [dstName, setDstName] = useState('');
  const [result,  setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSrc = latlng => { setSrc(latlng); setStep('dest'); };
  const handleDst = latlng => { setDst(latlng); setStep('review'); };

  const reset = () => { setSrc(null); setDst(null); setSrcName(''); setDstName(''); setStep('source'); setResult(null); };

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/work', {
        source_lat: src.lat, source_lng: src.lng, source_name: srcName || 'Source',
        destination_lat: dst.lat, destination_lng: dst.lng, destination_name: dstName || 'Destination',
      });
      setResult(data);
      addToast(`Work ${data.work_id} created! ${data.assignment ? 'Driver assigned.' : 'Queued.'}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create work', 'error');
    }
    setLoading(false);
  };

  const stepLabels = { source: 'Click the map to set pickup location', dest: 'Now click to set delivery destination', review: 'Review and submit your work order' };

  return (
    <div style={{ height:'calc(100vh - 56px)', display:'grid', gridTemplateColumns:'340px 1fr' }}>

      {/* LEFT PANEL */}
      <div style={{ background:'var(--bg2)', borderRight:'1px solid var(--border)', overflowY:'auto', padding:20 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:800, color:'var(--amber2)', marginBottom:4 }}>New Delivery</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>Select pickup and drop-off on the map, or choose quick locations below.</div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:0, marginBottom:20 }}>
          {['source','dest','review'].map((s,i) => (
            <div key={s} style={{ flex:1, textAlign:'center' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background: step===s?'var(--amber2)':src&&i===0||dst&&i===1||step==='review'&&i<2?'var(--green)':'var(--bg4)', border:`2px solid ${step===s?'var(--amber2)':'var(--border2)'}`, color: step===s?'#000':'var(--text2)', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 4px' }}>{i+1}</div>
              <div style={{ fontSize:10, color:'var(--text2)', textTransform:'capitalize' }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:8, borderLeft:'2px solid var(--amber2)', marginBottom:20, fontSize:13, color:'var(--text2)' }}>
          {stepLabels[step]}
        </div>

        {/* Source info */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:5 }}>📦 Pickup Location</label>
          <input value={srcName} onChange={e => setSrcName(e.target.value)} placeholder="Label (optional)" style={{ width:'100%', padding:'8px 12px', background:'var(--bg3)', border:`1px solid ${src?'var(--green)':'var(--border2)'}`, borderRadius:7, color:'var(--text)', fontSize:13, outline:'none', marginBottom:4 }} />
          {src ? <div style={{ fontSize:11, color:'var(--green)' }}>✓ {src.lat.toFixed(4)}°N, {src.lng.toFixed(4)}°E</div> : <div style={{ fontSize:11, color:'var(--text3)' }}>Not set</div>}
        </div>

        {/* Dest info */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:5 }}>🏁 Drop-off Location</label>
          <input value={dstName} onChange={e => setDstName(e.target.value)} placeholder="Label (optional)" style={{ width:'100%', padding:'8px 12px', background:'var(--bg3)', border:`1px solid ${dst?'var(--green)':'var(--border2)'}`, borderRadius:7, color:'var(--text)', fontSize:13, outline:'none', marginBottom:4 }} />
          {dst ? <div style={{ fontSize:11, color:'var(--green)' }}>✓ {dst.lat.toFixed(4)}°N, {dst.lng.toFixed(4)}°E</div> : <div style={{ fontSize:11, color:'var(--text3)' }}>Not set</div>}
        </div>

        {/* Quick select */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Quick Select — Chennai Areas</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {CHENNAI_AREAS.map(a => (
              <button key={a.name} onClick={() => {
                if (step==='source') { setSrc({ lat:a.lat, lng:a.lng }); setSrcName(a.name); setStep('dest'); }
                else if (step==='dest') { setDst({ lat:a.lat, lng:a.lng }); setDstName(a.name); setStep('review'); }
              }} style={{ padding:'4px 9px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text2)', fontSize:11, cursor:'pointer', transition:'all .15s' }}
                onMouseOver={e => { e.target.style.borderColor='var(--amber)'; e.target.style.color='var(--amber2)'; }}
                onMouseOut={e => { e.target.style.borderColor='var(--border2)'; e.target.style.color='var(--text2)'; }}>
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {src && dst && !result && (
          <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'11px 0', background: loading?'var(--bg4)':'linear-gradient(135deg,#451a03,#92400e)', border:'1px solid var(--amber)', borderRadius:8, color:'var(--amber2)', fontSize:14, fontWeight:700, fontFamily:'var(--font-head)', marginBottom:8, transition:'all .2s' }}>
            {loading ? '⏳ Assigning...' : '🚛 Create Work Order'}
          </button>
        )}
        <button onClick={reset} style={{ width:'100%', padding:'9px 0', background:'transparent', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text2)', fontSize:13, transition:'all .15s' }}>Reset</button>

        {/* Result */}
        {result && (
          <div style={{ marginTop:16, background:'var(--bg3)', border:'1px solid var(--green)', borderRadius:10, padding:14 }}>
            <div style={{ color:'var(--green)', fontFamily:'var(--font-head)', fontWeight:700, fontSize:14, marginBottom:8 }}>✅ Work Created</div>
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8 }}>
              <div>ID: <strong style={{ color:'var(--text)' }}>{result.work_id}</strong></div>
              <div>Status: <strong style={{ color:'var(--amber2)' }}>{result.status}</strong></div>
              {result.assignment && <>
                <div>Driver: <strong style={{ color:'var(--green)' }}>{result.assignment.driver_name} ({result.assignment.driver_id})</strong></div>
                <div>Truck: <strong style={{ color:'var(--teal)' }}>{result.assignment.truck_id}</strong></div>
                <div>Cost: <strong style={{ color:'var(--amber2)' }}>{result.assignment.cost_km} km</strong></div>
              </>}
              <div style={{ marginTop:8, borderTop:'1px solid var(--border)', paddingTop:8, fontSize:11, color:'var(--text3)' }}>
                Backtracking: {result.backtracking.iterations} iterations, {result.backtracking.pruned} pruned
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAP */}
      <div>
        <MapContainer center={[13.0827, 80.2707]} zoom={11} style={{ height:'100%', width:'100%' }} zoomControl>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <ClickCapture step={step} onSrc={handleSrc} onDst={handleDst} />
          {src && <Marker position={src} icon={srcIcon} />}
          {dst && <Marker position={dst} icon={dstIcon} />}
          {src && dst && <Polyline positions={[src, dst]} color="#f59e0b" weight={2} dashArray="6 4" />}
        </MapContainer>
        {step !== 'review' && (
          <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', background:'rgba(10,12,16,.9)', border:'1px solid var(--amber)', borderRadius:8, padding:'8px 18px', fontSize:13, color:'var(--amber2)', pointerEvents:'none', zIndex:400 }}>
            {step === 'source' ? '📦 Click map to set pickup' : '🏁 Click map to set drop-off'}
          </div>
        )}
      </div>
    </div>
  );
}
