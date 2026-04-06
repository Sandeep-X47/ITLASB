import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import LiveMap from '../Map/LiveMap';

const statusColor = { pending:'var(--text3)', assigned:'var(--blue)', 'in-progress':'var(--amber2)', completed:'var(--green)' };
const statusBg    = { pending:'#1f2a1f', assigned:'#1a1e2e', 'in-progress':'var(--amber3)', completed:'#14532d' };

export default function CustomerDashboard({ addToast }) {
  const [works,   setWorks]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [selected,setSelected] = useState(null);
  const { drivers } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try { const { data } = await api.get('/work/my'); setWorks(data); }
      catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const sel = selected ? works.find(w => w.work_id === selected) : null;
  const selDriver = sel?.driver_id ? drivers.find(d => d.driver_id === sel.driver_id) : null;

  const progress = selDriver && sel ? (() => {
    if (sel.status === 'completed') return 100;
    if (sel.status === 'pending') return 0;
    if (!selDriver.destination_lat) return 10;
    const totalDist = Math.hypot(sel.destination_lat - sel.source_lat, sel.destination_lng - sel.source_lng);
    const remaining = Math.hypot(sel.destination_lat - selDriver.lat, sel.destination_lng - selDriver.lng);
    return Math.min(99, Math.max(5, Math.round((1 - remaining / totalDist) * 100)));
  })() : 0;

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 56px)', color:'var(--text2)', fontSize:14 }}>Loading your orders…</div>;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', height:'calc(100vh - 56px)' }}>

      {/* LEFT */}
      <div style={{ background:'var(--bg2)', borderRight:'1px solid var(--border)', overflowY:'auto' }}>
        <div style={{ padding:'16px 16px 10px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--bg2)', borderBottom:'1px solid var(--border)', zIndex:1 }}>
          <span style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:'var(--text3)' }}>My Orders ({works.length})</span>
          <button onClick={() => navigate('/create-work')} style={{ padding:'5px 12px', background:'var(--amber3)', border:'1px solid var(--amber)', borderRadius:6, color:'var(--amber2)', fontSize:12, fontWeight:700, fontFamily:'var(--font-head)', cursor:'pointer' }}>+ New</button>
        </div>

        {works.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:'var(--text2)', fontSize:13 }}>
            No orders yet.<br />
            <button onClick={() => navigate('/create-work')} style={{ marginTop:12, padding:'8px 18px', background:'var(--amber3)', border:'1px solid var(--amber)', borderRadius:8, color:'var(--amber2)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Create First Order</button>
          </div>
        ) : works.map(w => (
          <div key={w.work_id} onClick={() => setSelected(selected===w.work_id?null:w.work_id)}
            style={{ padding:'12px 16px', cursor:'pointer', borderLeft:`2px solid ${selected===w.work_id?'var(--amber2)':'transparent'}`, background:selected===w.work_id?'var(--bg4)':'transparent', borderBottom:'1px solid var(--border)', transition:'all .15s' }}
            onMouseOver={e => e.currentTarget.style.background='var(--bg3)'}
            onMouseOut={e => e.currentTarget.style.background=selected===w.work_id?'var(--bg4)':'transparent'}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font-head)', fontSize:12, fontWeight:700, color:'var(--text2)' }}>{w.work_id}</span>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:statusBg[w.status], color:statusColor[w.status] }}>{w.status}</span>
            </div>
            <div style={{ fontSize:13, color:'var(--text)' }}>{w.source_name} <span style={{ color:'var(--amber2)', fontSize:11 }}>→</span> {w.destination_name}</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>{w.driver_id ? `Driver: ${w.driver_id}` : 'Awaiting assignment'}</div>
            {w.status === 'in-progress' && (
              <div style={{ marginTop:6, height:3, background:'var(--border2)', borderRadius:2 }}>
                <div style={{ height:'100%', background:'var(--amber2)', borderRadius:2, width:`${progress}%`, transition:'width .8s' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RIGHT: Map + detail */}
      <div style={{ display:'grid', gridTemplateRows: sel ? '1fr 180px' : '1fr', transition:'all .3s' }}>
        <LiveMap height="100%" works={works} />

        {/* Detail panel */}
        {sel && (
          <div style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)', padding:'14px 20px', overflowY:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>Work ID</div>
                <div style={{ fontSize:14, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text)' }}>{sel.work_id}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>Status</div>
                <div style={{ fontSize:13, fontWeight:600, color:statusColor[sel.status] }}>{sel.status}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>Driver</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{sel.driver_id || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>Truck</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{sel.truck_id || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>Cost</div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--amber2)' }}>{sel.total_cost_km ? `${Number(sel.total_cost_km).toFixed(1)} km` : '—'}</div>
              </div>
            </div>
            {sel.status === 'in-progress' && (
              <div style={{ marginTop:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text2)', marginBottom:4 }}>
                  <span>Delivery progress</span><span>{progress}%</span>
                </div>
                <div style={{ height:5, background:'var(--border2)', borderRadius:3 }}>
                  <div style={{ height:'100%', background:'linear-gradient(90deg, var(--amber3), var(--amber2))', borderRadius:3, width:`${progress}%`, transition:'width .8s' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
