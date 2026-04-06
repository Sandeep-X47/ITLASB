import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import LiveMap from '../Map/LiveMap';

const card = { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', marginBottom:8 };
const sectionTitle = { fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, letterSpacing:'.8px', textTransform:'uppercase', color:'var(--text3)', marginBottom:10 };
const pill = (c) => ({ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700, letterSpacing:'.3px', background: c==='delivering'?'#1a2e1a':c==='traveling'?'var(--amber3)':c==='idle'?'#1c1a2e':'#1e2330', color: c==='delivering'?'var(--green)':c==='traveling'?'var(--amber2)':c==='idle'?'var(--purple)':'var(--text2)' });

export default function AdminDashboard({ addToast }) {
  const { drivers: liveDrivers, connected } = useSocket();
  const [dbDrivers, setDbDrivers] = useState([]);
  const [trucks,    setTrucks]    = useState([]);
  const [works,     setWorks]     = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [addMode,   setAddMode]   = useState(null); // 'driver' | 'truck'
  const [form,      setForm]      = useState({});
  const [loading,   setLoading]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, t, w] = await Promise.all([api.get('/drivers'), api.get('/trucks'), api.get('/work')]);
      setDbDrivers(d.data); setTrucks(t.data); setWorks(w.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, [load]);

  // Merge live socket positions into db drivers
  const mergedDrivers = dbDrivers.map(d => {
    const live = liveDrivers.find(l => l.driver_id === d.driver_id);
    return live ? { ...d, current_lat: live.lat, current_lng: live.lng, status: live.status, work_id: live.work_id, truck_id: live.truck_id } : d;
  });

  const stats = {
    delivering: mergedDrivers.filter(d => d.status === 'delivering').length,
    idle:       mergedDrivers.filter(d => d.status === 'idle').length,
    pending:    works.filter(w => w.status === 'pending').length,
    completed:  works.filter(w => w.status === 'completed').length,
    available:  trucks.filter(t => t.status === 'available').length,
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      if (addMode === 'driver') await api.post('/drivers', form);
      else await api.post('/trucks', form);
      addToast(`${addMode} added!`, 'success');
      setAddMode(null); setForm({});
      load();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
    setLoading(false);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete ${id}?`)) return;
    try {
      await api.delete(`/${type}/${id}`);
      addToast(`${id} removed`, 'success'); load();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const sel = selected ? mergedDrivers.find(d => d.driver_id === selected) : null;
  const selWork = sel?.work_id ? works.find(w => w.work_id === sel.work_id) : null;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr 280px', height:'calc(100vh - 56px)', overflow:'hidden' }}>

      {/* LEFT: Drivers */}
      <div style={{ background:'var(--bg2)', borderRight:'1px solid var(--border)', overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 16px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--bg2)', borderBottom:'1px solid var(--border)', zIndex:1 }}>
          <span style={{ ...sectionTitle, marginBottom:0 }}>Drivers ({mergedDrivers.length})</span>
          <button onClick={() => setAddMode('driver')} style={{ width:26, height:26, borderRadius:6, background:'var(--amber3)', border:'1px solid var(--amber)', color:'var(--amber2)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>+</button>
        </div>

        {addMode === 'driver' && (
          <div style={{ padding:12, borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
            {['driver_id','name'].map(f => (
              <input key={f} placeholder={f} value={form[f]||''} onChange={e => setForm(p=>({...p,[f]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontSize:12, marginBottom:6, outline:'none' }} />
            ))}
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={handleAdd} disabled={loading} style={{ flex:1, padding:'6px 0', background:'var(--amber3)', border:'1px solid var(--amber)', borderRadius:6, color:'var(--amber2)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Add</button>
              <button onClick={() => setAddMode(null)} style={{ padding:'6px 12px', background:'transparent', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:12, cursor:'pointer' }}>✕</button>
            </div>
          </div>
        )}

        {mergedDrivers.map(d => (
          <div key={d.driver_id} onClick={() => setSelected(selected === d.driver_id ? null : d.driver_id)} style={{ padding:'10px 14px', display:'flex', gap:10, alignItems:'center', cursor:'pointer', borderLeft:`2px solid ${selected===d.driver_id?'var(--amber2)':'transparent'}`, background: selected===d.driver_id?'var(--bg4)':'transparent', transition:'all .15s' }}
            onMouseOver={e => e.currentTarget.style.background='var(--bg3)'}
            onMouseOut={e => e.currentTarget.style.background=selected===d.driver_id?'var(--bg4)':'transparent'}>
            <div style={{ width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0, background: d.status==='delivering'?'#1c2e1a':d.status==='traveling'?'#2e2a1a':'#1c1a2e', color: d.status==='delivering'?'var(--green)':d.status==='traveling'?'var(--amber2)':'var(--purple)' }}>
              {d.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{d.driver_id} · {d.name}</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{d.work_id ? `→ ${d.work_id}` : 'Idle'}</div>
            </div>
            <span style={pill(d.status)}>{d.status}</span>
            <button onClick={e => { e.stopPropagation(); handleDelete('drivers', d.driver_id); }} style={{ background:'transparent', border:'none', color:'var(--text3)', fontSize:14, cursor:'pointer', padding:'2px 4px' }} title="Remove">✕</button>
          </div>
        ))}

        {/* Trucks section */}
        <div style={{ padding:'14px 16px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--bg2)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', zIndex:1, marginTop:8 }}>
          <span style={{ ...sectionTitle, marginBottom:0 }}>Trucks ({trucks.length})</span>
          <button onClick={() => setAddMode('truck')} style={{ width:26, height:26, borderRadius:6, background:'var(--amber3)', border:'1px solid var(--amber)', color:'var(--amber2)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>+</button>
        </div>

        {addMode === 'truck' && (
          <div style={{ padding:12, borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
            <input placeholder="truck_id (e.g. T-16)" value={form.truck_id||''} onChange={e => setForm(p=>({...p,truck_id:e.target.value}))} style={{ width:'100%', padding:'7px 10px', background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text)', fontSize:12, marginBottom:6, outline:'none' }} />
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={handleAdd} disabled={loading} style={{ flex:1, padding:'6px 0', background:'var(--amber3)', border:'1px solid var(--amber)', borderRadius:6, color:'var(--amber2)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Add</button>
              <button onClick={() => setAddMode(null)} style={{ padding:'6px 12px', background:'transparent', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:12, cursor:'pointer' }}>✕</button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'10px 14px' }}>
          {trucks.map(t => (
            <div key={t.truck_id} style={{ padding:'4px 10px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', fontSize:11, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background: t.status==='available'?'var(--green)':'var(--amber2)' }} />
              <span style={{ color: t.status==='available'?'var(--green)':'var(--amber2)' }}>{t.truck_id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Map */}
      <div style={{ position:'relative' }}>
        {/* Stats overlay */}
        <div style={{ position:'absolute', top:12, left:12, zIndex:400, display:'flex', gap:8, flexWrap:'wrap' }}>
          {[['Delivering', stats.delivering,'var(--green)'],['Idle',stats.idle,'var(--purple)'],['Pending',stats.pending,'var(--amber2)'],['Completed',stats.completed,'var(--teal)']].map(([l,v,c]) => (
            <div key={l} style={{ padding:'6px 12px', background:'rgba(10,12,16,.85)', border:'1px solid var(--border2)', borderRadius:8, backdropFilter:'blur(8px)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, color:c }}>{v}</span>
              <span style={{ fontSize:11, color:'var(--text2)' }}>{l}</span>
            </div>
          ))}
        </div>
        <LiveMap height="100%" works={works} />
      </div>

      {/* RIGHT: Work orders + driver detail */}
      <div style={{ background:'var(--bg2)', borderLeft:'1px solid var(--border)', overflowY:'auto' }}>
        {/* Driver detail */}
        {sel && (
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
            <div style={{ ...sectionTitle, marginBottom:8 }}>Driver Detail</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:8 }}>{sel.name}</div>
            {[['ID', sel.driver_id],['Status', sel.status],['Truck', sel.assigned_truck_id||'—'],['Work', sel.work_id||'Idle'],['Route', selWork ? `${selWork.source_name} → ${selWork.destination_name}` : '—']].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                <span style={{ color:'var(--text2)' }}>{l}</span>
                <span style={{ fontWeight:500, color: l==='Status'?(pill(sel.status).color):'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Metrics */}
        <div style={{ padding:'14px 16px' }}>
          <div style={sectionTitle}>Metrics</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {[['Fleet Eff.', `${Math.round((stats.delivering / Math.max(mergedDrivers.length,1))*100)}%','var(--green)'],['Available', stats.available+' trucks','var(--teal)']].map(([l,v,c]) => (
              <div key={l} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:10, color:'var(--text2)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Work list */}
        <div style={{ padding:'0 16px 16px' }}>
          <div style={sectionTitle}>Work Orders ({works.length})</div>
          {works.slice(0,20).map(w => {
            const statusColors = { pending:'var(--text3)', assigned:'var(--blue)', 'in-progress':'var(--amber2)', completed:'var(--green)' };
            const statusBg = { pending:'#1f2a1f', assigned:'#1a1e2e', 'in-progress':'var(--amber3)', completed:'#14532d' };
            return (
              <div key={w.work_id} style={{ ...card, borderLeft:`2px solid ${statusColors[w.status]||'var(--border)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, color:'var(--text2)' }}>{w.work_id}</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, background:statusBg[w.status], color:statusColors[w.status] }}>{w.status}</span>
                </div>
                <div style={{ fontSize:12, color:'var(--text)' }}>{w.source_name} <span style={{ color:'var(--amber2)', fontSize:10 }}>→</span> {w.destination_name}</div>
                <div style={{ fontSize:10, color:'var(--text2)', marginTop:3 }}>{w.driver_id ? `Driver: ${w.driver_id}` : 'Unassigned'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
